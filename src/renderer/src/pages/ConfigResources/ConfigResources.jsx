import './ConfigResources.scss'
import logoUrl from '../../assets/img/logo.png'
import { useTranslation } from 'react-i18next'
import { Spin } from '@arco-design/web-react'
import { useContextConsumer } from '../../ContextProvider'
import { IconSwap } from '@arco-design/web-react/icon'
import { useEffect, useState } from 'react'
import { Message } from '@arco-design/web-react'
import { Select } from '@arco-design/web-react'
const Option = Select.Option

export const ConfigResources = () => {
    const { t } = useTranslation()
    const { installationFolderPath, db, setInstallingComplete } = useContextConsumer()
    const [zipFiles, setZipFiles] = useState(null) // 扫描出的所有离线包 list
    const [offlineZipPath, setOfflineZipPath] = useState(null) // 选中离线包路径
    const [noHavZipPath, setNoHavZipPath] = useState(false) // 没有离线包
    const [isInstallOfflinePackage, setIsInstallOfflinePackage] = useState(false) // 是否安装离线包

    console.log('zipFiles', zipFiles)

    // 初次化，创建安装文件夹
    const handleGetFolderPath = async () => {
        let folderPath = await window.electron.ipcRenderer.invoke('creat-klseis-app')
        console.log('KLSeisApp 文件夹路径', folderPath)
        if (!folderPath) return
        db.exec(`UPDATE setting
            SET installation_folder_path = '${folderPath}'
            WHERE id = 1;`)
    }

    // 初始化，检测是否有离线包
    const handleHasZip = async () => {
        const result = await window.electron.ipcRenderer.invoke('has-zip')
        if (result) {
            setZipFiles(result)
            setOfflineZipPath(result[0]?.path)
        } else {
            setNoHavZipPath(true)
        }
    }

    // 安装离线包
    const handleInstallOfflinePackage = async (offlineZipPath, installationFolderPath) => {
        const result = await window.electron.ipcRenderer.invoke('decompression', offlineZipPath, installationFolderPath)
        console.log('初次解压离线包', result)
        if (!result.success) {
            Message.error(result.message) // 解压报错
            setIsInstallOfflinePackage(false)
        } else {
            setInstallingComplete(result.success) // 解压成功
        }
    }

    // 初始化
    useEffect(() => {
        handleHasZip()
        handleGetFolderPath()
    }, [])

    // 点击安装离线包
    useEffect(() => {
        if (!isInstallOfflinePackage) return
        if (!installationFolderPath) return
        if (!offlineZipPath) return
        handleInstallOfflinePackage(offlineZipPath, installationFolderPath)
    }, [isInstallOfflinePackage, offlineZipPath, installationFolderPath])

    return (
        <div className='configResources'>
            <div className='top-bar'>
                <div className='top-bar-left'></div>
                <div className='top-bar-right'></div>
            </div>
            <div className={`bottom-content`}>
                <div className='bottom-content-left'>
                    <div className='logo'>
                        <img src={logoUrl} alt='' className='logoImg' />
                        <div className='logoName'>{t('logoName')}</div>
                    </div>
                    <div className='InstallationPath'>
                        <div>
                            <span className='one'>{t('installationPath')}</span>
                            <span className='two'>{installationFolderPath}</span>
                        </div>
                        {isInstallOfflinePackage ? (
                            <></>
                        ) : (
                            <span
                                className='three'
                                onClick={async () => {
                                    const result = await window.electron.ipcRenderer.invoke('select-folder')
                                    console.log('重新选择的释放路径', result)
                                    if (result) {
                                        db.exec(`UPDATE setting
                                            SET installation_folder_path = '${result}'
                                            WHERE id = 1;`)
                                    }
                                }}
                            >
                                <IconSwap />
                            </span>
                        )}
                    </div>
                    {isInstallOfflinePackage ? (
                        <div className='btnTips'>
                            <span>{t('releasingResources')}</span>
                            <Spin />
                        </div>
                    ) : noHavZipPath ? (
                        <div className='btnTips noHavZipPath' onClick={() => setInstallingComplete(true)}>
                            {t('noHavZipPath')}
                        </div>
                    ) : (
                        <div className='firstInstall'>
                            <div className='content-zip'>
                                <Select className='select-zipfile' onChange={setOfflineZipPath} value={offlineZipPath}>
                                    {zipFiles?.map((option, index) => (
                                        <Option key={index} value={option.path}>
                                            {option.name}
                                        </Option>
                                    ))}
                                </Select>
                                <div className='decompressionBtn' onClick={() => setIsInstallOfflinePackage(true)}>
                                    {t('installOfflinePackage')}
                                </div>
                            </div>

                            <div className='closeBtn' onClick={() => setInstallingComplete(true)}>
                                {t('skip')}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
