import './App.scss'

// 初始化国际化
import './i18n/i18n.config'
import updaterIcon from './assets/img/updaterIcon.png'
import updaterLogsIcon from './assets/img/updaterLogsIcon.png'

// 基础样式、Arco 样式表
import '@arco-design/web-react/dist/css/arco.css'

// Arco Design 国际化
import { ConfigProvider as ArcoDesignI18nProvider } from '@arco-design/web-react'
import enUS from '@arco-design/web-react/es/locale/en-US'
import zhCN from '@arco-design/web-react/es/locale/zh-CN'

// 路由
import { RouterProvider } from 'react-router-dom'
import { createHashRouterFunc } from './router'

import { useContextConsumer } from './ContextProvider'
import { useEffect, useState, useCallback } from 'react'
import i18n from 'i18next'

import { Spin, Modal, Message } from '@arco-design/web-react'
import { ConfigResources } from './pages/ConfigResources/ConfigResources'
import { useTranslation } from 'react-i18next'
import { checkForUpdates, waitTime } from './tools'
import dayjs from 'dayjs'

import { getResourceData } from '../src/api'
import md5 from 'md5'

// 渲染更新日志
const updaterLogsRenderer = releaseNote => {
    const { t } = useTranslation()
    if (releaseNote === '') {
        return (
            <ul>
                <li>{t('noUpdateLogs')}</li>
            </ul>
        )
    }

    // 检查 releaseNote 是否为数组
    const listItems = Array.isArray(releaseNote)
        ? releaseNote
        : releaseNote
              .split('\n') // 按换行符分割字符串
              .filter(item => item.trim() !== '') // 过滤空行
              .map(item => item.replace(/^- \d+\.\s*/, '')) // 去掉 "- 1." 之类的前缀

    return (
        <ul>
            {listItems.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
        </ul>
    )
}

export const App = () => {
    const { language, theme, navList, appList, currentLocalPath, loading, setDetectionPanelUpdateSync, db } =
        useContextConsumer()
    const { t } = useTranslation()
    const [updateAvailable, setUpdateAvailable] = useState(false)
    const [updateLogsInfo, setUpdateLogsInfo] = useState()
    const [updaterProgress, setUpdaterProgress] = useState(0)
    const [downloadOK, setDownloadOK] = useState(false)

    // 初始化主题配置
    useEffect(() => {
        if (!theme) return
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.type = 'text/css'
        if (theme === 'light') {
            link.href = import('./assets/theme/light.css')
        } else {
            link.href = import('./assets/theme/dark.css')
        }
        document.head.appendChild(link)
        return () => {
            document.head.removeChild(link)
        }
    }, [theme])

    // 初始化语言
    useEffect(() => {
        if (!language) return
        i18n.changeLanguage(language)
    }, [language])

    // 使用 useCallback 确保函数引用不变
    const handleUpdaterAvailable = useCallback((_, info) => {
        setUpdateAvailable(true)
        setUpdateLogsInfo(info)
    }, [])
    const handleDownloadProgress = useCallback((_, progress) => {
        setUpdaterProgress(progress.percent)
        if (progress.percent >= 100) {
            setDownloadOK(true)
            setUpdateAvailable(true)
        }
    }, [])
    const handleUpdateNotAvailable = useCallback(async () => {
        setUpdateAvailable(false)
        setDownloadOK(false)
        await waitTime(1000)
        Message.info(t('currentPanelIsLatestVersion'))
        setDetectionPanelUpdateSync(false)
    }, [])
    const handleUpdateError = useCallback((_, error) => {
        console.error('更新失败:', error)
        Message.error(t('updateError'))
        setDetectionPanelUpdateSync(false)
    }, [])

    // 更新面板检测钩子
    useEffect(() => {
        window.electron.ipcRenderer.on('update-available', handleUpdaterAvailable)
        window.electron.ipcRenderer.on('download-progress', handleDownloadProgress)
        window.electron.ipcRenderer.on('update-not-available', handleUpdateNotAvailable)
        window.electron.ipcRenderer.on('error', handleUpdateError)
        return () => {
            window.electron.ipcRenderer.removeListener('update-available', handleUpdaterAvailable)
            window.electron.ipcRenderer.removeListener('download-progress', handleDownloadProgress)
            window.electron.ipcRenderer.removeListener('update-not-available', handleUpdateNotAvailable)
            window.electron.ipcRenderer.removeListener('error', handleUpdateError)
        }
    }, [])

    // 初始化检测更新
    useEffect(async () => {
        if (!db) return
        const oldSqlContentObj = await window.electron.ipcRenderer.invoke('read-put-sql-file')
        getResourceData()
            .then(response => {
                // 创建一个 FileReader 对象
                const reader = new FileReader()
                // 将 Blob 对象读取为文本
                reader.readAsText(new Blob([response.data]))
                // 定义读取完成后的回调函数
                reader.onload = async () => {
                    if (!reader.result) return
                    const newSqlContent = reader.result
                    const oldSqlContent = oldSqlContentObj.content
                    // 计算 MD5 值并比较
                    const oldSqlHash = md5(oldSqlContent)
                    const newSqlHash = md5(newSqlContent)
                    if (oldSqlHash !== newSqlHash) {
                        console.log(' SQL 内容新旧不一样，即将开始更新')
                        // 发送 newSqlContent 到主进程
                        const result = await window.electron.ipcRenderer.invoke('write-new-sql-content', newSqlContent)
                        if (result.success) {
                            await db.exec(newSqlContent) // 刷新数据库数据
                            Message.success(t('resourceUpdateSuccess'))
                            await waitTime(1000)
                            // setDetectingDatabaseUpdatesSync(false)
                            window.electron.ipcRenderer.send('restart-panel') // 重启面板刷新渲染器数据
                        } else {
                            Message.error(t('writeSqlFileError'))
                        }
                    } else {
                        console.log(' SQL 内容新旧一样')
                        Message.info(t('currentResourceIsLatestVersion'))
                    }
                    // setDetectingDatabaseUpdatesSync(false)
                }
            })
            .catch(() => {
                Message.error(t('resourceUpdateFailed'))
                // setDetectingDatabaseUpdatesSync(false)
            })

        checkForUpdates()
    }, [db])

    if (!loading) return <Spin dot block />
    if (!currentLocalPath) return <ConfigResources />
    if (!navList || !appList) return <Spin dot block />

    return (
        <ArcoDesignI18nProvider locale={language === 'zh' ? zhCN : enUS}>
            <RouterProvider router={createHashRouterFunc(language, navList, appList)} />
            <Modal
                title=''
                visible={updateAvailable}
                onOk={() => {
                    if (downloadOK) {
                        window.electron.ipcRenderer.send('install-update')
                    } else {
                        setUpdateAvailable(false)
                        window.electron.ipcRenderer.send('start-download')
                    }
                }}
                onCancel={() => setUpdateAvailable(false)}
                okText={downloadOK ? t('installUpdaterBtn') : t('updaterBtn')}
                cancelText={t('updaterCancelBtn')}
                autoFocus={false}
                focusLock={true}
                maskClosable={false}
                className={`updaterModal ${downloadOK ? 'downloadOKModal' : ''}`}
            >
                {downloadOK ? (
                    <>
                        <p className='updater-title'>
                            <img src={updaterIcon} alt='' />
                            <span className='updater-title-text'>{t('updaterTitle')}</span>
                        </p>
                        <p className='updater-top-dic-one'>{t('updaterDownloadOK')}</p>
                    </>
                ) : updateAvailable ? (
                    <>
                        <p className='updater-title'>
                            <img src={updaterIcon} alt='' />
                            <span className='updater-title-text'>{t('updaterTitle')}</span>
                        </p>
                        <p className='updater-top-dic-one'>{t('updaterNewVersion')}</p>
                        <p className='updater-top-dic-two'>
                            <span>{t('currentVersion')}</span>
                            <span className='currentVersion'>{'v' + (updateLogsInfo?.currentAppVersion ?? '')}</span>
                            <span>{t('updaterLastNewVersion')}</span>
                            <span className='newVersion'>{'v' + (updateLogsInfo?.version ?? '')}</span>
                        </p>
                        <div className='updater-logs-top'>
                            <img src={updaterLogsIcon} alt='' />
                            <span className='updater-logs-top-text'>{t('updaterLogs')}</span>
                            <span className='updater-logs-top-date'>
                                {' (' + dayjs(updateLogsInfo?.releaseDate ?? '').format('YYYY-MM-DD') + ')'}
                            </span>
                        </div>
                        <div className='updater-logs'>{updaterLogsRenderer(updateLogsInfo?.releaseNote ?? '')}</div>
                    </>
                ) : (
                    <></>
                )}
            </Modal>
            {updaterProgress ? (
                <div className='compact-progress'>
                    <svg viewBox='0 0 40 40' className='progress-svg'>
                        {/* 背景环 */}
                        <circle
                            className='progress-bg'
                            cx='20'
                            cy='20'
                            r='17' // 精确计算的半径
                            strokeWidth='4'
                        />
                        {/* 进度环 */}
                        <circle
                            className='progress-ring'
                            cx='20'
                            cy='20'
                            r='17'
                            strokeWidth='4'
                            strokeDasharray={`${2 * Math.PI * 17}`}
                            strokeDashoffset={`${2 * Math.PI * 17 * (1 - updaterProgress / 100)}`}
                        />
                    </svg>
                    {/* 进度文字 */}
                    <div className='progress-text'>{updaterProgress.toFixed(0)}%</div>
                </div>
            ) : null}
        </ArcoDesignI18nProvider>
    )
}
