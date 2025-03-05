import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 缓存 app.isPackaged 的值
let isPackaged = false

// 获取 app.isPackaged 的值并缓存（同步化处理）
;(async () => {
    isPackaged = await ipcRenderer.invoke('get-is-packaged')
})()

// 预加载 API 到渲染进程
const api = {
    getVersion: async () => {
        // 使用 ipcRenderer 请求应用版本号
        return await ipcRenderer.invoke('get-app-version')
    },
    getServerUrl: () => {
        if (isPackaged) {
            // 生产环境
            return 'http://10.88.247.18:38900'
        } else {
            // 开发环境
            return 'http://10.88.51.112:8900'
        }
    },
}

// 将 Electron API 赋予给渲染器进程使用，开启上下文隔离时，需要 contextBridge。
// 关闭隔离，直接操作 DOM 全局 window
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    window.electron = electronAPI
    window.api = api
}
