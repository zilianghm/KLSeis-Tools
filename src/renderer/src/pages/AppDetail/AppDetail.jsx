import { useContextConsumer } from '../../ContextProvider'
import { Image, Button, Tabs, Breadcrumb, Message } from '@arco-design/web-react'
import { BsPlayFill } from 'react-icons/bs'
import { TbArrowBadgeDownFilled } from 'react-icons/tb'
import './AppDetail.scss'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import HomeIcon from '../../assets/img/homeIcon.svg?react'
import { handleStartApp } from '../../tools'
import { RequirementSuggestion } from '../../components/RequirementSuggestion/RequirementSuggestion'
// import appDeatilPdf from '../../assets/pdf/appDeatilPdf.pdf?url'
// import { pdfjs, Document, Page } from 'react-pdf'
// import { useState } from 'react'

// pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

const BreadcrumbItem = Breadcrumb.Item

const imageBaseSrc = await window.electron.ipcRenderer.invoke('get-image-path')

export const AppDetail = () => {
    const { t } = useTranslation()
    // const [numPages, setNumPages] = useState()
    const { language, appList, activated_nav, navList } = useContextConsumer()
    const params = useParams()
    const navigate = useNavigate()
    const currentAppDetail = appList.find(item => String(item.app_id) === params.app_id)
    const currentAppName = currentAppDetail?.[language === 'zh' ? 'app_name' : 'app_name_en']
    const currentNavName = navList.find(item => String(item.code) === activated_nav)?.[
        language === 'zh' ? 'category_name' : 'category_name_en'
    ]
    const app_start_path = currentAppDetail?.app_start_path
    const screenshotData = JSON.parse(currentAppDetail?.charts ?? '[]')

    if (!currentAppDetail) return <></>
    return (
        <div className='appDetail'>
            <div className='breadcrumb'>
                <Breadcrumb>
                    <BreadcrumbItem onClick={() => navigate('/' + activated_nav)}>
                        <HomeIcon className='homeIcon' fill='currentColor' />
                        <span>{currentNavName}</span>
                    </BreadcrumbItem>
                    <BreadcrumbItem>{currentAppName}</BreadcrumbItem>
                </Breadcrumb>
            </div>
            <div className='top'>
                <div className='top-left'>
                    <Image
                        src={
                            currentAppDetail?.logo
                                ? `data:image/png;base64, ${currentAppDetail?.logo}`
                                : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJgAAACZCAYAAADTnvOEAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAGcSURBVHhe7dKhAQAgDMCw/X/vPHg0dREx1Z3dPVCZN8BPBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiNlMFIGI2UwUgYjZTBSBiN1AYGWU0s6I68dAAAAAElFTkSuQmCC'
                        }
                        preview={false}
                        className='top-left-image'
                        alt=''
                    />
                    <div className='top-left-right'>
                        <div className='top-left-title'>
                            {language === 'zh' ? currentAppDetail?.app_name : currentAppDetail?.app_name_en}
                        </div>
                        <div className='top-left-descri'>{currentAppDetail?.detail}</div>
                    </div>
                </div>
                <div className='top-right'>
                    <Button
                        type='primary'
                        className='top-left-btn'
                        icon={
                            currentAppDetail?.version[0]?.zipPath === '' ? <TbArrowBadgeDownFilled /> : <BsPlayFill />
                        }
                        onClick={async e => {
                            e.stopPropagation() // 拦截事件冒泡
                            if (/http/i.test(currentAppDetail.app_start_item || '')) {
                                return window.open(currentAppDetail.app_start_item)
                            } else {
                                const result = await handleStartApp(app_start_path, language === 'zh' ? 'zh_CN' : 'en')
                                if (result) Message.warning(result)
                            }
                        }}
                    ></Button>
                </div>
            </div>
            <div className='screenshot'>
                <Image.PreviewGroup infinite>
                    {screenshotData.map((src, index) => (
                        <Image
                            key={index}
                            src={imageBaseSrc + src}
                            width={200}
                            alt={`lamp${index + 1}`}
                            className='screenshot-item'
                        />
                    ))}
                </Image.PreviewGroup>
            </div>
            <div className='appDetail-content'>
                <Tabs defaultActiveTab='1'>
                    <Tabs.TabPane key='1' title={<span>{t('details')}</span>}>
                        <div
                            dangerouslySetInnerHTML={{
                                __html:
                                    language === 'zh'
                                        ? currentAppDetail?.rich_text_detail
                                        : currentAppDetail?.rich_text_detail_en,
                            }}
                            className='details-content'
                        ></div>
                    </Tabs.TabPane>
                    <Tabs.TabPane key='2' title={<span>{t('updateLogs')}</span>}>
                        {t('lookingForwardFullest')}
                    </Tabs.TabPane>
                    <Tabs.TabPane key='3' title={<span>{t('requirementSuggestion')}</span>}>
                        <RequirementSuggestion appId={currentAppDetail.app_id} />
                    </Tabs.TabPane>
                </Tabs>
            </div>
        </div>
    )
}
