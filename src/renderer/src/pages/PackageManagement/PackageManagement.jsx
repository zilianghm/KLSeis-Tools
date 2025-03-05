import './PackageManagement.scss'
import { useContextConsumer } from '../../ContextProvider'
import { IconPlus, IconSync, IconSwap } from '@arco-design/web-react/icon'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import CheckMarkIcon from '../../assets/img/checkMarkIcon.svg?react'
import { Message, Popconfirm, Tooltip } from '@arco-design/web-react'
import { waitTime } from '../../tools'

export const PackageManagement = ({ type }) => {
    const [selectItem, setSelectItem] = useState()
    const [installing, setInstalling] = useState(false)
    const [clickSync, setClickSync] = useState(false)
    const { installationFolderPath, currentLocalPath, db, localVersionList, setAppList } = useContextConsumer()
    const { t } = useTranslation()

    // 同步 KLSeisApp 文件夹内版本数量
    const handleSyncLocalVersionList = async newInstallationFolderPath => {
        setClickSync(true)
        setInstalling(false)
        const results = await window.electron.ipcRenderer.invoke(
            'scan-folder',
            newInstallationFolderPath ?? installationFolderPath
        ) // 扫描文件夹，查找所有 installinfo.ini 文件及其 SoftVersion
        console.log(`扫描 ${installationFolderPath} 文件夹结果`, results)
        if (Array.isArray(results)) {
            if (results.length === 0) {
                db.exec(`UPDATE setting
                    SET current_local_path = 'noPickVersion'
                    WHERE id = 1;`) // 没有选中版本，持久化记录
                db.exec(`UPDATE setting
                    SET local_version_list = '${JSON.stringify([])}'
                    WHERE id = 1;`) // 本地没有软件，持久化
                await waitTime(1500)
                setClickSync(false)
            } else {
                const defaultVersion = results.find(item => item.directoryPath === currentLocalPath)?.directoryPath // 找到默认版本号
                if (!defaultVersion) {
                    db.exec(`UPDATE setting
                        SET current_local_path = '${results[0].directoryPath}'
                        WHERE id = 1;`) // 默认选中版本，持久化记录
                }
                db.exec(`UPDATE setting
                    SET local_version_list = '${JSON.stringify(results)}'
                    WHERE id = 1;`) // 本地有软件，持久化本地版本号信息
                await waitTime(1500)
                setClickSync(false)
                Message.success(t('scanComplete'))
            }
        } else {
            Message.error(results) // 扫描报错
        }
    }

    // 安装进度动画
    useEffect(() => {
        if (!installing) return
        // 安装动画
        const progressBar = document.querySelector('.install-icon-bar')
        let progressInterval
        let isEventEnded = false
        let maxProgressBeforeEnd = 90 // 事件结束之前的最大进度
        progressBar.style.width = '0' // 确保从 0 开始
        let currentWidth = 0

        // 模拟进度缓慢增加
        progressInterval = setInterval(() => {
            if (currentWidth < maxProgressBeforeEnd && !isEventEnded) {
                currentWidth += 1 // 每次增加 1%
                progressBar.style.width = currentWidth + '%'
            }
        }, 150) // 每 150ms 增加一次
        // 清理函数：当组件卸载或安装结束时，清除定时器
        return () => {
            clearInterval(progressInterval)
        }
    }, [installing])

    // 本地按钮
    const locationVersionBtn = item => {
        if (currentLocalPath === item.directoryPath) {
            // 切换完的版本号，当前使用
            return (
                <div className='current-icon'>
                    <CheckMarkIcon className='CheckMarkIcon' />
                    {t('currentVersion')}
                </div>
            )
        } else if (selectItem === item.directoryPath) {
            // 还没有切换使用，鼠标单击效果
            return (
                <div className='locationVersionBtn'>
                    <div
                        className='start-icon'
                        onClick={() => {
                            if (!item.directoryPath) return
                            setAppList(null) // 清空数据，loading 等待
                            const hasVersion = localVersionList.find(p => p.directoryPath === item.directoryPath)
                            if (hasVersion) {
                                db.exec(`UPDATE setting
                                SET current_local_path = '${item.directoryPath}'
                                WHERE id = 1;`) // 选中版本，持久化记录
                            } else {
                                Message.error(t('refreshButtonToUpdateVersionList'))
                            }
                        }}
                    >
                        {type === 'packageManagement' ? t('changeVersion') : t('start')}
                    </div>
                    <Popconfirm
                        focusLock
                        className='deleteIcon-popconfirm'
                        content={t('deleteConfirm')}
                        onOk={async () => {
                            const result = await window.electron.ipcRenderer.invoke('folder:delete', item.directoryPath)
                            if (result.success) {
                                Message.success(t('deleteSuccess') + item.base_package_version + t('success'))
                                handleSyncLocalVersionList()
                            } else {
                                Message.error(t('deleteError'))
                            }
                        }}
                    >
                        <div className='deleteIcon'>{t('delete')}</div>
                    </Popconfirm>
                </div>
            )
        } else {
            return <></>
        }
    }

    return (
        <div className={`packageManagement ${type === 'packageManagement' && 'packageManagementRouterPage'}`}>
            <div className='packageMangement-bgc'>
                <div className='packageManagement-top'>
                    <div className='path-text'>{installationFolderPath}</div>
                    <div className='packageManagement-top-cancal-path'>
                        <Tooltip content={t('switchSoftwareInstallationDirectory')}>
                            <IconSwap
                                className='IconSwap'
                                onClick={async () => {
                                    if (clickSync || installing) return
                                    const result = await window.electron.ipcRenderer.invoke('select-folder')
                                    console.log('重新选择的释放路径', result)
                                    if (result) {
                                        db.exec(`UPDATE setting
                                            SET installation_folder_path = '${result}'
                                            WHERE id = 1;`)
                                        handleSyncLocalVersionList(result)
                                    }
                                }}
                            />
                        </Tooltip>
                        <div className='packageManagement-top-cancal-path-fgx'></div>
                        <Tooltip content={t('refreshScan')}>
                            <IconSync
                                className={`IconSync ${clickSync ? 'IconSync-sync' : ''}`}
                                onClick={() => handleSyncLocalVersionList()}
                            />
                        </Tooltip>

                        <div className='packageManagement-top-cancal-path-fgx'></div>
                        <Tooltip content={t('installNewOfflinePackage')}>
                            <IconPlus
                                className={`IconPlus ${installing ? 'IconPlus-installing' : ''}`}
                                onClick={async () => {
                                    if (installing) {
                                        return Message.warning(t('pleaseWaitForTheExistingInstallationToComplete'))
                                    }
                                    const offlineZipPath = await window.electron.ipcRenderer.invoke('dialog:openZip')
                                    console.log('选中的克浪zip包路径', offlineZipPath)
                                    if (offlineZipPath) {
                                        setInstalling(true)
                                        const result = await window.electron.ipcRenderer.invoke(
                                            'decompression',
                                            offlineZipPath,
                                            installationFolderPath
                                        )
                                        if (!result.success) {
                                            Message.error(result.message) // 解压报错
                                            setInstalling(false)
                                        } else {
                                            handleSyncLocalVersionList() // 解压成功, 重新扫描版本号列表
                                        }
                                    }
                                }}
                            />
                        </Tooltip>
                    </div>
                </div>
                {installing ? (
                    <div className='importZipProgress'>
                        <div className='install-icon-bar'></div>
                    </div>
                ) : (
                    <></>
                )}
            </div>
            <div className='packageManagement-content'>
                <div className='localVersionList'>
                    {localVersionList?.length === 0 ? (
                        <div className='localVersionList-empty'>{t('noSoftwarePackage2')}</div>
                    ) : (
                        <></>
                    )}
                    {localVersionList?.map((item, index) => (
                        <div
                            key={index}
                            className={`packageManagement-content-item ${(selectItem || currentLocalPath) === item.directoryPath ? 'packageManagement-content-item-activation' : ''}`}
                            onClick={() => setSelectItem(item.directoryPath)}
                        >
                            <div className='version-text'>
                                <span className='version-text-version'>{item.base_package_version}</span>
                                <span className='version-text-name'>{item.base_package_name}</span>
                            </div>
                            {locationVersionBtn(item)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
