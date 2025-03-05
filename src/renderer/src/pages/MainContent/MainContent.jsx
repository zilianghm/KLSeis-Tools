import './MainContent.scss'
import { Carousel, Image, Button, Message } from '@arco-design/web-react'
import { useContextConsumer } from '../../ContextProvider'
import { useTranslation } from 'react-i18next'
import { BsPlayFill } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'
import { handleStartApp } from '../../tools'
import { PackageManagement } from '../PackageManagement/PackageManagement'
import { OtherSoftware } from '../OtherSoftware/OtherSoftware'
import { AiAssistant } from '../AiAssistant/AiAssistant'
import { IconMore } from '@arco-design/web-react/icon'

const imageBaseSrc = await window.electron.ipcRenderer.invoke('get-image-path')

const imageSrc = [
    '//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/cd7a1aaea8e1c5e3d26fe2591e561798.png~tplv-uwbnlip3yd-webp.webp',
    '//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/6480dbc69be1b5de95010289787d64f1.png~tplv-uwbnlip3yd-webp.webp',
    '//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/0265a04fddbd77a19602a15d9d55d797.png~tplv-uwbnlip3yd-webp.webp',
    '//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/24e0dd27418d2291b65db1b21aa62254.png~tplv-uwbnlip3yd-webp.webp',
]

export const MainContent = ({ type, data, mockRecommendData, describe }) => {
    const { language } = useContextConsumer()
    const { t } = useTranslation()
    const navigate = useNavigate()

    return (
        <div className={`mainContent ${type}`}>
            {type === 'recentlyOpened' ? (
                <div className='mainContent-top'>
                    <Carousel style={{ width: '100%', height: 100 }} className='carousel' autoPlay={true}>
                        {imageSrc.map((src, index) => (
                            <div key={index}>
                                <img src={src} style={{ width: '100%' }} />
                            </div>
                        ))}
                    </Carousel>
                </div>
            ) : (
                <></>
            )}
            {data?.length === 0 ? (
                <></>
            ) : (
                <div className='one'>
                    <div className='nav-describe'>
                        <Carousel style={{ width: '100%', height: 100 }} className='carousel' autoPlay={true}>
                            {JSON.parse(describe.charts).map((src, index) => (
                                <div key={index}>
                                    <img src={imageBaseSrc + src} style={{ width: '100%' }} />
                                </div>
                            ))}
                        </Carousel>
                        <div className='nav-describe-text'>
                            {language === 'zh' ? describe.context : describe.context_en}
                        </div>
                    </div>
                    <div className='content-data'>
                        {data?.map(item => (
                            <div
                                className={`content-item ${item.app_start_path.runnable === 0 ? 'content-item-disabled' : ''}`}
                                key={item.app_id}
                                onClick={async () => {
                                    if (/http/i.test(item.app_start_item || '')) {
                                        return window.open(item.app_start_item)
                                    } else {
                                        const result = await handleStartApp(
                                            item.app_start_path,
                                            language === 'zh' ? 'zh_CN' : 'en'
                                        )
                                        if (result) Message.warning(result)
                                    }
                                }}
                            >
                                <div className='content-item-top'>
                                    <Image
                                        src={
                                            item?.app_start_path?.localApp
                                                ? `${item.logo}`
                                                : `data:image/png;base64, ${item.logo}`
                                        }
                                        preview={false}
                                        className={`content-item-image ${item.app_start_path.runnable === 0 ? 'grayscale' : ''}`}
                                        alt=''
                                    />
                                    <div className='content-item-title'>
                                        {language === 'zh' ? item.app_name : item.app_name_en}
                                    </div>
                                    {item?.app_start_path?.localApp ? (
                                        <></>
                                    ) : (
                                        <Button
                                            type='secondary'
                                            className='content-item-btn'
                                            icon={<IconMore />}
                                            onClick={e => {
                                                e.stopPropagation() // 阻止进入详情，拦截事件冒泡
                                                navigate(`/app/detail/${item.app_id}`)
                                            }}
                                        ></Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {type === 'recentlyOpened' ? (
                <div className='two'>
                    <div className='title'>{t('recommend')}</div>
                    <div className='content-data'>
                        {mockRecommendData?.map(item => (
                            <div
                                className='content-item'
                                key={item.app_id}
                                onClick={() => navigate(`/app/detail/${item.app_id}`)}
                            >
                                <Image src={item.logo} preview={false} className='content-item-image' alt='' />
                                <div className='content-item-right'>
                                    <div className='content-item-title'>
                                        {language === 'zh' ? item.app_name : item.app_name_en}
                                    </div>
                                    <div className='content-item-descri'>{item.description}</div>
                                </div>
                                <Button type='secondary' className='content-item-btn' icon={<BsPlayFill />}></Button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <></>
            )}
            {type === 'packageManagement' ? <PackageManagement type='packageManagement' /> : <></>}
            {type === 'otherSoftware' ? <OtherSoftware /> : <></>}
            {type === 'aiAssistant' ? <AiAssistant /> : <></>}
        </div>
    )
}
