import './RequirementSuggestion.scss'
import { Image } from '@arco-design/web-react'
// import Thumbs3 from '../../assets/img/thumbs3.svg?react'
// import ReplyIcon from '../../assets/img/replyIcon.svg?react'
import { useState, useEffect } from 'react'
import { postfeedBackList } from '../../api/index'
import dayjs from 'dayjs'
import userPng from '../../assets/img/user.png'

import { useTranslation } from 'react-i18next'
// import { useState } from 'react'
import { InputContent } from '../InputContent/InputContent'

export const RequirementSuggestion = ({ appId }) => {
    const { t } = useTranslation()
    const [feedBackList, setFeedBackList] = useState([])

    useEffect(() => {
        if (!appId) return
        postfeedBackList({ appId })
            .then(res => {
                console.log('获取评论列表成功', res)
                setFeedBackList(res?.data?.data?.list)
            })
            .catch(err => {
                console.log('获取评论列表失败', err)
            })
    }, [appId])

    return (
        <div className='requirementSuggestion'>
            <div className='requirementSuggestion-content'>
                <InputContent appId={appId} setFeedBackList={setFeedBackList} />
                {feedBackList?.map((item, index) => (
                    <div className='requirementSuggestion-content-item' key={index}>
                        <div
                            className={`requirementSuggestion-content-left ${!item.username && 'requirementSuggestion-content-left-anonymous'}`}
                        >
                            {item.username ? <span>{item.icon}</span> : <img src={userPng} alt={item.icon} />}
                        </div>
                        <div className='requirementSuggestion-content-right'>
                            <div className='content-item-useInfo'>
                                <span className={`useInfo-name ${!item.username && 'useInfo-name-anonymous'}`}>
                                    {item.username ? item.username : t('anonymousUser')}
                                </span>
                                <span className='useInfo-time'>
                                    {dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss')}
                                </span>
                            </div>
                            <div className='content-item-text'>{item.content}</div>
                            {JSON.parse(item.images)?.length > 0 ? (
                                <div className='content-item-screenshot'>
                                    <Image.PreviewGroup infinite>
                                        {JSON.parse(item.images).map((src, index) => (
                                            <Image
                                                key={index}
                                                src={src}
                                                alt={`lamp${index + 1}`}
                                                className='screenshot-item'
                                            />
                                        ))}
                                    </Image.PreviewGroup>
                                </div>
                            ) : (
                                <></>
                            )}
                            {/* <div className='content-item-btn'>
                                <div className='content-item-left'>
                                    <div className='thumbs-up'>
                                        <Thumbs3 className='thumbs3' />
                                        <div className='thumbs-up-number' onClick={() => {}}>
                                            {item.thumbUpNum}
                                        </div>
                                    </div>
                                    <div className='reply'>
                                        <ReplyIcon className='reply-icon' />
                                        <div className='reply-text'>{t('replyText')}</div>
                                    </div>
                                </div>
                                <div className='content-item-right'></div>
                            </div> */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
