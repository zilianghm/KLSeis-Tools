// 空白等待
export const waitTime = ms => {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

// 非管理员权限运行 app
export const handleStartApp = async (app_start_path, language) => {
    const result = window.electron.ipcRenderer.invoke('run-app-admin', app_start_path, language)
    return result
}

// 发送更新检测请求给主进程
export const checkForUpdates = () => {
    window.electron.ipcRenderer.send('checking-for-update')
}

// 存储 localStroage
export const setStroage = (key, type) => window.localStorage.setItem(key, type)

// 读取 localStroage
export const getStroage = key => window.localStorage.getItem(key)

// 节流
export const throttle = (func, delay) => {
    let lastCall = 0
    return (...args) => {
        const now = Date.now()
        if (now - lastCall >= delay) {
            lastCall = now
            func(...args)
        }
    }
}
