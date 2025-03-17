import './SettingPopoverContent.scss'
import { IconSync } from '@arco-design/web-react/icon'
import { useState } from 'react'
import { checkForUpdates } from '../../tools'
import { useContextConsumer } from '../../ContextProvider'
import { Message } from '@arco-design/web-react'
import { useTranslation } from 'react-i18next'

export const SettingPopoverContent = () => {
    const { detectionPanelUpdateSync, setDetectionPanelUpdateSync, setHavActivateService, havActivateService } =
        useContextConsumer()
    // const [detectingDatabaseUpdatesSync, setDetectingDatabaseUpdatesSync] = useState(false)
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
            {/* <div
                className='settingPopoverContent-item detectingDatabaseUpdates'
                onClick={async () => {
                    setDetectingDatabaseUpdatesSync(true)
                    checkForDatabaseUpdates()
                }}
            >
                <div className='settingPopoverContent-item-title detectingDatabaseUpdates-title'>
                    {t('detectingDatabaseUpdates')}
                </div>
                <IconSync
                    className={`settingPopoverContent-item-sync detectingDatabaseUpdatesSync ${detectingDatabaseUpdatesSync ? 'detectingDatabaseUpdatesSync-sync' : ''}`}
                    onClick={() => {}}
                />
            </div> */}
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
