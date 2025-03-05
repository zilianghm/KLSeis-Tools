import ImageIcon from '../../assets/img/imageIcon.svg?react'
import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Image as ArcoImage, Message, Spin } from '@arco-design/web-react'
import { IconClose } from '@arco-design/web-react/icon'
import './InputContent.scss'
import { postCommentPublish, postfeedBackList } from '../../api/index'
import { useContextConsumer } from '../../ContextProvider'
import { throttle } from '../../tools'

export const InputContent = ({ appId, setFeedBackList }) => {
    const { t } = useTranslation()
    const [inputFocus, setInputFocus] = useState(false)
    const { macAddress, userInfo } = useContextConsumer()
    const [content, setContent] = useState('')
    const [images, setImages] = useState([])
    const [subLoading, setSubLoading] = useState(false)
    const inputRef = useRef(null) // 创建一个 ref 用于访问 DOM
    const maxChars = 300
    const maxImages = 5

    console.log('userInfo', userInfo)

    // 原始 focus 处理逻辑
    const originalHandleFocus = () => {
        setInputFocus(true)
        const richInput = document.getElementById('rich-input')
        if (richInput.innerText === t('inputComment')) {
            richInput.innerText = ''
        }
    }

    // 原始 blur 处理逻辑
    const originalHandleBlur = () => {
        setInputFocus(false)
        const richInput = document.getElementById('rich-input')
        if (richInput.innerText.trim() === '') {
            richInput.innerText = t('inputComment')
        }
    }
    // 包装成节流函数（1秒内只响应一次）
    const throttledHandleFocus = useCallback(throttle(originalHandleFocus, 1000), [])
    const throttledHandleBlur = useCallback(throttle(originalHandleBlur, 1000), [])

    // 处理输入内容变化
    const handleInput = e => {
        const text = e.target.innerText
        if (text.length <= maxChars) {
            setContent(text)
        } else {
            e.target.innerText = content // 如果超过字符限制，回退到之前的内容
        }
    }

    // 图片添加处理
    const handleImageUpload = async event => {
        const files = Array.from(event.target.files)

        if (images.length + files.length > maxImages) {
            Message.warning(`${t('maxUploadImages')} ${maxImages} ${t('images')}`)
            return
        }

        const compressedImages = await Promise.all(files.map(file => compressImage(file)))

        setImages(prevImages => [...prevImages, ...compressedImages])
    }

    // 图片压缩逻辑
    const compressImage = file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = event => {
                const img = new Image()
                img.src = event.target.result
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')

                    const maxWidth = 800
                    const maxHeight = 800
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width)
                            width = maxWidth
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height)
                            height = maxHeight
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    ctx.drawImage(img, 0, 0, width, height)

                    canvas.toBlob(
                        blob => {
                            resolve(blob)
                        },
                        'image/jpeg',
                        0.8
                    ) // 压缩为 JPEG 格式，质量为 80%
                }
                img.onerror = err => reject(err)
            }
            reader.onerror = err => reject(err)
        })
    }

    // 删除图片
    const handleRemoveImage = index => {
        setImages(prevImages => prevImages.filter((_, i) => i !== index))
    }

    // 提交评论接口
    const handleSubmit = () => {
        if (subLoading) return
        setSubLoading(true)
        postCommentPublish({
            content,
            images,
            mac: macAddress,
            appId,
            userInfo,
        })
            .then(res => {
                console.log('提交成功', res)
                setSubLoading(false)
                setImages([])
                // 清空内容
                if (inputRef.current) {
                    inputRef.current.innerHTML = '' // 清空 contentEditable 的内容
                    setContent('')
                }
                postfeedBackList({ appId })
                    .then(res => {
                        console.log('获取评论列表成功', res)
                        setFeedBackList(res?.data?.data?.list)
                        Message.success(t('commentSuccess'))
                    })
                    .catch(err => {
                        console.log('获取评论列表失败', err)
                    })
            })
            .catch(err => {
                console.log('提交失败', err)
                Message.warning(t('commentError'))
                setSubLoading(false)
            })
    }

    return (
        <div className='requirementSuggestion-top'>
            <div
                id='input-box'
                className={`input-box ${inputFocus ? 'input-box-focus' : ''}`}
                onClick={() => setInputFocus(true)}
                onFocus={throttledHandleFocus} // 使用 React 的 onFocus
                onBlur={throttledHandleBlur} // 使用 React 的 onBlur
            >
                <div
                    id='rich-input'
                    className='rich-input'
                    contentEditable='true'
                    onInput={handleInput}
                    ref={inputRef}
                ></div>
                {/* 图片预览 */}
                {images.length > 0 ? (
                    <div className='image-preview'>
                        <ArcoImage.PreviewGroup infinite>
                            {images.map((src, index) => (
                                <div key={index} className='uploaded-image-container'>
                                    <ArcoImage
                                        key={index}
                                        src={URL.createObjectURL(src)}
                                        alt={`lamp${index + 1}`}
                                        className='uploaded-image'
                                    />
                                    <IconClose className='remove-image-btn' onClick={() => handleRemoveImage(index)} />
                                </div>
                            ))}
                        </ArcoImage.PreviewGroup>
                    </div>
                ) : (
                    <></>
                )}
                <div className='action-box'>
                    <div className='action-box-left'>
                        <label htmlFor='image-upload'>
                            <ImageIcon className='image-btn' />
                        </label>
                        <input
                            id='image-upload'
                            type='file'
                            multiple
                            accept='image/*'
                            style={{ display: 'none' }}
                            onChange={handleImageUpload}
                        />
                    </div>
                    <div className='action-box-right'>
                        <div className='text-count'>
                            {content.length} / {maxChars}
                        </div>
                        <div
                            className={`submit-btn ${content || images.length > 0 ? 'submit-btn-actived' : ''}`}
                            onClick={() => {
                                if (content || images.length > 0) {
                                    handleSubmit()
                                }
                            }}
                        >
                            {subLoading ? <Spin /> : t('submitBtn')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
