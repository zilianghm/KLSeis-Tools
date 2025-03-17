import './PackageManagement.scss'
import { useContextConsumer } from '../../ContextProvider'
import { IconPlus, IconSync, IconSwap } from '@arco-design/web-react/icon'
import { useTranslation } from 'react-i18next'
import { useState, useEffect, useCallback } from 'react'
import CheckMarkIcon from '../../assets/img/checkMarkIcon.svg?react'
import { Message, Popconfirm, Tooltip, Tabs, Collapse, Progress, Spin } from '@arco-design/web-react'
import { waitTime } from '../../tools'
const CollapseItem = Collapse.Item
let close = null

export const PackageManagement = ({ type }) => {
    const [selectItem, setSelectItem] = useState()
    const [installing, setInstalling] = useState(false)
    const [clickSync, setClickSync] = useState(false)
    const [downloadingFiles, setDownloadingFiles] = useState({})
    const { installationFolderPath, currentLocalPath, db, localVersionList, setAppList, listKlSeisPackage } =
        useContextConsumer()
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

    const progressListener = useCallback((event, data) => {
        setDownloadingFiles(prev => ({
            ...prev,
            [data.url]: {
                ...prev[data.url],
                progress: data.progress,
                downloading: true,
            },
        }))
    }, [])

    // 下载完成
    const completedListener = useCallback(async (event, data) => {
        if (data.success) {
            Message.success(t('downloadSuccess'))
            setDownloadingFiles(prev => {
                const updated = { ...prev }
                delete updated[data.url]
                return updated
            })
        }
        console.log('下载成功，压缩包地址', data?.filePath)
        if (data?.filePath) {
            setInstalling(true)
            const result = await window.electron.ipcRenderer.invoke(
                'decompression',
                data?.filePath,
                installationFolderPath
            )
            if (!result.success) {
                Message.error(result.message) // 解压报错
                setInstalling(false)
            } else {
                handleSyncLocalVersionList() // 解压成功, 重新扫描版本号列表
                setInstalling(false)
            }
        }
    }, [])

    const errorListener = useCallback((event, data) => {
        Message.error(`${t('downloadError')}: ${data.error}`)
        setDownloadingFiles(prev => {
            const updated = { ...prev }
            if (updated[data.url]) {
                updated[data.url].downloading = false
                updated[data.url].error = data.error
            }
            return updated
        })
    }, [])

    // 监听下载进度更新
    useEffect(() => {
        window.electron.ipcRenderer.on('download-progress', progressListener)
        window.electron.ipcRenderer.on('download-completed', completedListener)
        window.electron.ipcRenderer.on('download-error', errorListener)

        return () => {
            window.electron.ipcRenderer.removeListener('download-progress', progressListener)
            window.electron.ipcRenderer.removeListener('download-completed', completedListener)
            window.electron.ipcRenderer.removeListener('download-error', errorListener)
        }
    }, [])

    // 开始下载文件
    const handleDownload = async (fileUrl, fileName, fileSize) => {
        try {
            if (downloadingFiles[fileUrl]?.downloading) {
                return Message.warning(t('downloadAlreadyInProgress'))
            }

            // 创建带有临时后缀的下载文件路径
            const tempFilePath = `${fileName}.downloading`

            // 更新当前文件的下载状态
            setDownloadingFiles(prev => ({
                ...prev,
                [fileUrl]: {
                    fileName,
                    progress: 0,
                    downloading: true,
                    tempFilePath,
                },
            }))

            // 调用主进程的下载函数
            await window.electron.ipcRenderer.invoke('file:download', fileUrl, tempFilePath, fileSize)
        } catch (error) {
            console.error('下载时出错:', error)
            Message.error(`${t('downloadError')}: ${error.message}`)
            setDownloadingFiles(prev => {
                const updated = { ...prev }
                if (updated[fileUrl]) {
                    updated[fileUrl].downloading = false
                    updated[fileUrl].error = error.message
                }
                return updated
            })
        }
    }

    // 取消下载
    const handleCancelDownload = fileUrl => {
        window.electron.ipcRenderer.send('cancel-download', fileUrl)
        setDownloadingFiles(prev => {
            const updated = { ...prev }
            delete updated[fileUrl]
            return updated
        })
        Message.info(t('downloadCancelled'))
    }

    // 安装中
    useEffect(() => {
        if (installing) {
            close = Message.info({
                content: t('installing'),
                duration: 0,
                icon: <Spin block={false} style={{ height: 'auto' }} className='installing-spin' />,
            })
        } else {
            close?.()
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

    // 判断是否已经安装
    const isInstalled = child => {
        const result = localVersionList.find(
            p => p.base_package_version === child.packageVersion && p.base_package_name === child.packageName
        )
        if (result) {
            return true
        } else {
            return false
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
                                            setInstalling(false)
                                        }
                                    }
                                }}
                            />
                        </Tooltip>
                    </div>
                </div>
            </div>
            <Tabs defaultActiveTab='1' className='packageManagement-tabs'>
                <Tabs.TabPane key='1' title={t('localSoftwarePackage')}>
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
                </Tabs.TabPane>
                <Tabs.TabPane key='2' title={t('remoteSoftwarePackage')}>
                    <div className='remoteSoftwarePackage-content packageManagement-content'>
                        <Collapse defaultActiveKey={['0', '1', '2']}>
                            {listKlSeisPackage?.map((item, index) => (
                                <CollapseItem
                                    header={item.tag}
                                    name={String(index + 1)}
                                    key={String(index + 1)}
                                    className='remoteSoftwarePackage-content-group'
                                >
                                    {item.children?.map((child, childIndex) => (
                                        <div key={childIndex} className={`remoteSoftwarePackage-content-item`}>
                                            <div className='version-text'>
                                                <span className='version-text-version'>{child.packageVersion}</span>
                                                <span className='version-text-name'>{child.packageName}</span>
                                            </div>
                                            {downloadingFiles[child.path] ? (
                                                <div className='download-progress'>
                                                    <Progress
                                                        percent={downloadingFiles[child.path].progress}
                                                        showText
                                                        size='small'
                                                        width={120}
                                                    />
                                                    <div
                                                        className='cancel-download'
                                                        onClick={() => handleCancelDownload(child.path)}
                                                    >
                                                        {t('cancel')}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className='download-text'
                                                    onClick={() => {
                                                        if (isInstalled(child)) return
                                                        handleDownload(
                                                            child.path,
                                                            `${installationFolderPath}/${child.packageVersion}-${child.packageName}`,
                                                            child.size
                                                        )
                                                    }}
                                                >
                                                    {isInstalled(child) ? t('installed') : t('download')}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </CollapseItem>
                            ))}
                        </Collapse>
                    </div>
                </Tabs.TabPane>
            </Tabs>
        </div>
    )
}
