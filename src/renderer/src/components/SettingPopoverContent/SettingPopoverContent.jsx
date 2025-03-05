import './SettingPopoverContent.scss'
import { IconSync } from '@arco-design/web-react/icon'
import { useState } from 'react'
import { checkForUpdates, waitTime } from '../../tools'
import { useContextConsumer } from '../../ContextProvider'
import { getResourceData } from '../../api'
import md5 from 'md5'
import { Message } from '@arco-design/web-react'
import { useTranslation } from 'react-i18next'

export const SettingPopoverContent = () => {
    const { detectionPanelUpdateSync, setDetectionPanelUpdateSync, db, setHavActivateService, havActivateService } =
        useContextConsumer()
    const [detectingDatabaseUpdatesSync, setDetectingDatabaseUpdatesSync] = useState(false)
    const [installKLActivationServiceSync, setInstallKLActivationServiceSync] = useState(false)
    const { t } = useTranslation()
    return (
        <div className='settingPopoverContent'>
            <div
                className='settingPopoverContent-item detectionPanelUpdate'
                onClick={() => {
                    checkForUpdates()
                    setDetectionPanelUpdateSync(true)
                }}
            >
                <div className='settingPopoverContent-item-title detectionPanelUpdate-title'>
                    {t('detectionPanelUpdate')}
                </div>
                <IconSync
                    className={`settingPopoverContent-item-sync detectionPanelUpdateSync ${detectionPanelUpdateSync ? 'detectionPanelUpdateSync-sync' : ''}`}
                    onClick={() => {}}
                />
            </div>
            <div
                className='settingPopoverContent-item detectingDatabaseUpdates'
                onClick={async () => {
                    setDetectingDatabaseUpdatesSync(true)
                    const oldSqlContentObj = await window.electron.ipcRenderer.invoke('read-put-sql-file')
                    getResourceData()
                        .then(response => {
                            // 创建一个 FileReader 对象
                            const reader = new FileReader()
                            // 将 Blob 对象读取为文本
                            reader.readAsText(new Blob([response.data]))
                            // 定义读取完成后的回调函数
                            reader.onload = async () => {
                                const newSqlContent = reader.result
                                const oldSqlContent = oldSqlContentObj.content
                                console.log('旧 SQL 内容:', oldSqlContent)
                                console.log('新 SQL 内容:', newSqlContent)

                                // 计算 MD5 值并比较
                                const oldSqlHash = md5(oldSqlContent)
                                const newSqlHash = md5(newSqlContent)
                                if (oldSqlHash !== newSqlHash) {
                                    // 发送 newSqlContent 到主进程
                                    const result = await window.electron.ipcRenderer.invoke(
                                        'write-new-sql-content',
                                        newSqlContent
                                    )
                                    if (result.success) {
                                        await db.exec(newSqlContent) // 刷新数据库数据
                                        Message.success(t('resourceUpdateSuccess'))
                                        await waitTime(1000)
                                        setDetectingDatabaseUpdatesSync(false)
                                        window.electron.ipcRenderer.send('restart-panel') // 重启面板刷新渲染器数据
                                    } else {
                                        Message.error(t('writeSqlFileError'))
                                    }
                                } else {
                                    Message.info(t('currentResourceIsLatestVersion'))
                                }
                                setDetectingDatabaseUpdatesSync(false)
                            }
                        })
                        .catch(() => {
                            Message.error(t('resourceUpdateFailed'))
                            setDetectingDatabaseUpdatesSync(false)
                        })
                }}
            >
                <div className='settingPopoverContent-item-title detectingDatabaseUpdates-title'>
                    {t('detectingDatabaseUpdates')}
                </div>
                <IconSync
                    className={`settingPopoverContent-item-sync detectingDatabaseUpdatesSync ${detectingDatabaseUpdatesSync ? 'detectingDatabaseUpdatesSync-sync' : ''}`}
                    onClick={() => {}}
                />
            </div>
            <div
                className='settingPopoverContent-item installKLActivationService'
                onClick={async () => {
                    if (havActivateService) {
                        Message.info(t('activateServiceInstalled'))
                        return
                    }
                    setInstallKLActivationServiceSync(true)
                    try {
                        const result = await window.electron.ipcRenderer.invoke('run-exe')
                        if (result.success) {
                            Message.success(t('activateServiceInstalled'))
                            setHavActivateService(true)
                            setInstallKLActivationServiceSync(false)
                        }
                    } catch (error) {
                        Message.error(t('installKLActivationServiceError'))
                        setInstallKLActivationServiceSync(false)
                    }
                }}
            >
                <div className='settingPopoverContent-item-title installKLActivationService-title'>
                    {t('installKLActivationService')}
                </div>
                <IconSync
                    className={`settingPopoverContent-item-sync installKLActivationServiceSync ${installKLActivationServiceSync ? 'installKLActivationServiceSync-sync' : ''}`}
                    onClick={() => {}}
                />
            </div>
        </div>
    )
}
