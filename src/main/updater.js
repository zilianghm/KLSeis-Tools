import { autoUpdater } from 'electron-updater'
import { ipcMain, app } from 'electron'
const log = require('electron-log')

let mainWindow

// 初始化更新逻辑
export const initUpdater = window => {
    mainWindow = window

    // 强制在开发环境中检查更新
    autoUpdater.forceDevUpdateConfig = true

    // 如果需要，也可以允许预发布版本
    autoUpdater.allowPrerelease = true

    // 关闭自动下载，手动触发下载
    autoUpdater.autoDownload = false

    // 监听来自渲染进程的更新检测请求
    ipcMain.on('checking-for-update', () => {
        console.log('111')
        // 调用 autoUpdater.checkForUpdates() 来检查更新
        autoUpdater.checkForUpdates()
    })

    // 有可用更新时
    autoUpdater.on('update-available', info => {
        console.log('222')
        const currentAppVersion = app.getVersion()
        mainWindow.webContents.send('update-available', { ...info, currentAppVersion })
    })

    // 没有可用更新时
    autoUpdater.on('update-not-available', () => {
        console.log('333')
        mainWindow.webContents.send('update-not-available')
    })

    // 更新下载进度
    autoUpdater.on('download-progress', progress => {
        mainWindow.webContents.send('download-progress', progress)
    })

    // 更新下载完成
    autoUpdater.on('update-downloaded', () => {
        mainWindow.webContents.send('update-downloaded')
    })

    // 监听渲染进程的 IPC 消息来触发下载
    ipcMain.on('start-download', () => {
        autoUpdater.downloadUpdate()
    })

    // 监听渲染进程的 IPC 消息来触发安装更新
    ipcMain.on('install-update', () => {
        autoUpdater.quitAndInstall()
    })

    autoUpdater.on('error', error => {
        log.error('自动更新失败:', error)
    })
}
