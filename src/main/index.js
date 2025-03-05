import { app, shell, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage, session } from 'electron'
import { join, dirname, basename, extname } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../build/icons/icon.ico?asset'
import icns from '../../build/icons/icon.icns?asset'
import iconping from '../../build/icons/icon.png?asset'
import creatDataSQLPath from '../../build/creatDataSQL.sql?asset' // 打包后，在 .asar 文件中，可以在线更新
import putDataSQLPath from '../../build/putDataSQL.sql?asset' // 打包后，在 .asar 文件中，可以在线更新
import sevenZipPath from '../../build/7za.exe?asset' // 打包后，在 .asar 文件中，可以在线更新
import { initUpdater } from './updater' // 引入更新逻辑
import { promises as fsPromises, writeFileSync } from 'fs'
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import tinyGlob from 'tiny-glob'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const { execFile, spawn, execSync, exec } = require('child_process')
const log = require('electron-log')
const iconv = require('iconv-lite')
const os = require('os')

// 获取程序日志文件夹路径
let logFolderPath

if (!app.isPackaged) {
    // 在开发环境，使用当前项目目录
    logFolderPath = join(app.getAppPath(), 'logs')
} else {
    // 在生产环境，使用系统推荐日志路径
    logFolderPath = app.getPath('logs')
}
// 确保文件传输器未被禁用
log.transports.file.level = 'info'
// 设置日志文件路径
log.transports.file.file = () => join(logFolderPath, 'app.log')

// 记录普通日志
log.info('开始运行程序了')

// 将来可以配置安全相关内容，目前先关闭 CSP 警告
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// 配置应用程序 - 任务栏图标
const getPlatformIcon = () => {
    switch (process.platform) {
        case 'win32':
            return icon // Windows 图标路径
        case 'win64':
            return icon // Windows 图标路径
        case 'darwin':
            return icns // macOS 图标路径
        case 'linux':
            return iconping // Linux 图标路径
        default:
            return null
    }
}

// 主窗口
let mainWindow

// 创建浏览器窗口
const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 910,
        height: 760,
        minWidth: 910,
        minHeight: 760,
        maxHeight: 760,
        maxWidth: 910,
        show: false,
        frame: false, // 窗口无边框
        titleBarStyle: 'hidden', // 隐藏原生标题栏
        autoHideMenuBar: true,
        icon: getPlatformIcon(), // 使用不同平台的图标
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'), // 预脚本路径
            sandbox: false, // 关闭沙盒
            webSecurity: false, // 允许加载本地文件
        },
    })
    // 监听窗口获取焦点的事件，通知渲染进程刷新数据
    mainWindow.on('focus', () => {
        mainWindow.webContents.send('window-focus')
    })
    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })
    mainWindow.webContents.setWindowOpenHandler(details => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
    // 设置窗口是否可以由用户手动最大化。
    mainWindow.setMaximizable(false)
    // 设置用户是否可以调节窗口尺寸
    mainWindow.setResizable(false)
    // 初始化在线更新
    initUpdater(mainWindow)
}

// 如果已经有实例在运行，退出当前实例
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', () => {
        // 当第二个实例启动时，聚焦到现有的窗口
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.show()
            mainWindow.focus()
        }
    })
}

// MacOS，单击 Deck 上图标时，创建激活窗口
const createActivateWindow = () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
}

// 处理 setTitle 消息，改变窗口名称
const handleSetTitle = (e, title) => {
    const webContents = e.sender
    const win = BrowserWindow.fromWebContents(webContents)
    win.setTitle(title)
}

// 读取 installinfo.ini 文件并查找 SoftVersion 的值
const getSoftVersion = async filePath => {
    try {
        const content = await fsPromises.readFile(filePath, 'utf-8')
        const matchVersion = content.match(/SoftVersion\s*=\s*(.*)/i)
        const matchName = content.match(/SoftName\s*=\s*(.*)/i)
        return {
            softVersion: matchVersion ? matchVersion[1].trim() : null,
            softName: matchName ? matchName[1].trim() : null,
        }
    } catch (err) {
        console.error('Error reading installinfo.ini:', err)
        return null
    }
}

// 监听渲染进程的扫描文件夹请求
const hanleScanFolder = async (e, folderPath) => {
    try {
        const iniFiles = await tinyGlob(`${folderPath}/**/installinfo.ini`, { absolute: true })
        if (iniFiles.length > 0) {
            const results = await Promise.all(
                iniFiles.map(async filePath => {
                    const { softVersion, softName } = await getSoftVersion(filePath)
                    return {
                        directoryPath: dirname(filePath),
                        base_package_version: softVersion || 'SoftVersion not found',
                        base_package_name: softName || 'SoftName not found',
                    }
                })
            )
            return results
        } else {
            return []
        }
    } catch (error) {
        console.error('扫描文件夹时出错：权限被拒绝，请重新选择有权限的目录', error)
        return null
    }
}

// 选择 KlSeis 安装路径
const handleSelectFolder = async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'], // 文件夹模式
    })
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0]
    }
    return null
}

// 查找 KLSeisApp 文件夹路径
function getValidDrives() {
    const validDrives = []

    try {
        // 获取所有磁盘
        const output = execSync('wmic logicaldisk get caption,drivetype', { encoding: 'utf8' })
        const lines = output.split('\n').filter(line => line.trim()) // 按行分割并过滤空行

        // 解析每行数据
        lines.forEach(line => {
            const [drive, type] = line.trim().split(/\s+/)

            if (drive && type) {
                const driveType = parseInt(type, 10)

                // 过滤有效磁盘：驱动类型 3 = 本地磁盘
                if (driveType === 3) {
                    validDrives.push(drive)
                }
            }
        })
    } catch (error) {
        console.error('无法获取磁盘信息:', error)
    }

    return validDrives
}
function createKLSeisAppFolder() {
    const drives = getValidDrives()

    if (drives.length === 0) {
        console.error('未找到可用的本地磁盘！')
        return
    }

    // 优先选择非 C 盘
    let selectedDrive = drives.find(drive => !drive.startsWith('C:')) || 'C:'
    console.log(`选择磁盘: ${selectedDrive}`)

    // 创建 KLSeisApp 文件夹
    const targetPath = join(selectedDrive, 'KLSeisApp')

    try {
        if (!existsSync(targetPath)) {
            mkdirSync(targetPath)
            console.log(`文件夹已创建: ${targetPath}`)
            return targetPath
        } else {
            console.log(`文件夹已存在: ${targetPath}`)
            return targetPath
        }
    } catch (error) {
        console.error(`无法创建文件夹: ${targetPath}`, error)
    }
}

// 创建基本表结构，数据库初始化
const handleReadMockSqlFile = async sqlPath => {
    try {
        const sqlContent = await fsPromises.readFile(sqlPath, 'utf-8')
        return { success: true, content: sqlContent }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// 扫描文件是否存在
const handleScanFile = async (folderPath, appName, fileExtension) => {
    try {
        // 拼接文件名和扩展名
        const fileName = `${appName}.${fileExtension}`

        // 使用拼接后的 fileName 进行 glob 搜索
        const files = await tinyGlob(`${folderPath}/**/${fileName}`, { absolute: true })

        console.log(`扫描${fileExtension}结果`, files)

        return files.length > 0
    } catch (error) {
        if (error.code === 'EACCES') {
            console.error('扫描文件夹时出错：权限被拒绝，请重新选择有权限的目录', error)
        } else {
            console.error('扫描文件夹时出错：', error)
        }
        return false
    }
}

// 非管理员权限运行 App
const hanleRunAppAdmin = async (e, app_start_path, language) => {
    // 运行 app
    const hanleRunningApp = appFullPath => {
        // 构造环境变量
        const env = {
            ...process.env, // 保留当前系统的环境变量
            KLSEIS_LANGUAGE: language, // 注入自定义环境变量
        }

        // 启动外部应用程序
        const child = spawn(appFullPath, [], { detached: true, stdio: 'ignore', env })

        // 监听启动错误
        child.on('error', error => {
            console.error('启动应用时出错:', error)
            log.error('启动应用时出错:', error)
        })

        // 如果没有错误，表示启动成功，立即最小化 Electron 窗口
        child.on('spawn', () => {
            console.log('外部应用启动成功')
            if (mainWindow) {
                mainWindow.minimize()
            }
        })

        // 分离子进程，使其不会阻塞 Electron 应用
        child.unref()
    }

    if (app_start_path.localApp) {
        hanleRunningApp(app_start_path.currentLocalPath)
    } else {
        // 去掉 appeExeName 中的扩展名（如 .exe）
        const appBaseName = basename(app_start_path.appeExeName, extname(app_start_path.appeExeName))

        // 拼接可执行文件的完整路径
        const appFullPath = join(app_start_path.currentLocalPath, app_start_path.appeExeName)

        // 扫描 app 的 exe 文件是否存在
        const handleScanAppEXE = async (folderPath, appName) => {
            return await handleScanFile(folderPath, appName, 'exe')
        }

        // 扫描 app 的 kcfg 文件是否存在
        const handleScanFKCFG = async (folderPath, appName) => {
            return await handleScanFile(folderPath, appName, 'kcfg')
        }

        // 识别是否可执行
        const [isHavEXE, isHavKCFG] = await Promise.all([
            handleScanAppEXE(app_start_path.currentLocalPath, appBaseName),
            handleScanFKCFG(app_start_path.currentLocalPath, appBaseName),
        ])

        if (isHavEXE && isHavKCFG) {
            hanleRunningApp(appFullPath)
        } else {
            return `模块未安装`
        }
    }
}

// 预先扫描所有AppList是否可运行
const hanleScanAppListRunable = async (e, scanAppList) => {
    const results = await Promise.all(
        scanAppList.map(async item => {
            const app_start_path = item.app_start_path

            // url webapp 链接
            if (/http/i.test(app_start_path.appeExeName || '')) {
                return { ...item, app_start_path: { ...item.app_start_path, runnable: 1 } }
            }

            // 本地导入的单独 APP
            if (app_start_path?.localApp) {
                return { ...item, app_start_path: { ...item.app_start_path, runnable: 1 } }
            }

            // 去掉 appeExeName 中的扩展名（如 .exe）
            const appBaseName = basename(app_start_path.appeExeName, extname(app_start_path.appeExeName))
            // 扫描 app 的 exe 文件是否存在
            const handleScanAppEXE = async (folderPath, appName) => {
                return await handleScanFile(folderPath, appName, 'exe')
            }

            // 扫描 app 的 kcfg 文件是否存在
            const handleScanFKCFG = async (folderPath, appName) => {
                return await handleScanFile(folderPath, appName, 'kcfg')
            }
            // 识别是否可执行
            const [isHavEXE, isHavKCFG] = await Promise.all([
                handleScanAppEXE(app_start_path.currentLocalPath, appBaseName),
                handleScanFKCFG(app_start_path.currentLocalPath, appBaseName),
            ])
            if (isHavEXE && isHavKCFG) {
                return { ...item, app_start_path: { ...item.app_start_path, runnable: 1 } } // 能运行
            } else {
                return { ...item, app_start_path: { ...item.app_start_path, runnable: 0 } } // 不能运行
            }
        })
    )
    return results
}
// 打开安装文件夹
const handleOpenInstallFolder = (e, installationFolderPath) => {
    shell.openPath(installationFolderPath).then(result => {
        if (result) {
            console.error(`Error opening folder: ${result}`)
        } else {
            console.log('Folder opened successfully')
        }
    })
}

// 监听应用退出事件，确保所有窗口关闭，子进程关闭
app.on('before-quit', async () => {
    if (mainWindow) {
        mainWindow.removeAllListeners('close') // 移除所有关闭事件监听器
        mainWindow.close() // 强制关闭窗口
    }

    console.log('应用正在退出，清理会话数据...')
    const defaultSession = session.defaultSession

    try {
        // 清理 IndexedDB 数据
        await defaultSession.clearStorageData({
            storages: ['indexeddb'],
        })
        console.log('IndexedDB 数据已清理')
    } catch (err) {
        console.error('清理 IndexedDB 数据时出错:', err)
    }
})

// 执行解压操作
const handleDecompression = async (e, offlineZipPath, installationFolderPath) => {
    try {
        // const isDev = !app.isPackaged
        // let appPath = app.getAppPath()

        // // 如果是生产环境，并且路径包含 app.asar，则替换为 app.asar.unpacked
        // if (!isDev && appPath.includes('app.asar')) {
        //     appPath = appPath.replace('app.asar', 'app.asar.unpacked')
        // }

        console.log('7za.exe 路径:', sevenZipPath)
        console.log('ZIP 文件路径:', offlineZipPath)
        console.log('解压目标路径:', installationFolderPath)

        // 调用 7za.exe 进行解压
        await new Promise((resolve, reject) => {
            execFile(
                sevenZipPath,
                ['x', offlineZipPath, `-o${installationFolderPath}`, '-y'],
                (error, stdout, stderr) => {
                    if (error) {
                        console.error('解压失败:', stderr)
                        reject(error)
                    } else {
                        console.log('解压成功:', stdout)
                        resolve(stdout)
                    }
                }
            )
        })

        // 返回成功结果
        return { success: true, message: '解压成功' }
    } catch (error) {
        // 返回错误信息
        console.error('解压过程中发生错误:', error)
        return { success: false, message: error.message }
    }
}

/* ************************************************************* windows 菜单栏托盘图标 ****************************************************************************** */
let tray = null

app.on('window-all-closed', () => {
    // 在 macOS 上，通常应用不会在窗口关闭时退出
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // 在 macOS 上，点击 Dock 图标时重新打开窗口
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// 创建托盘图标和菜单
const createTray = () => {
    const iconPath = icon // 图标路径
    const trayIcon = nativeImage.createFromPath(iconPath)

    tray = new Tray(trayIcon) // 创建托盘图标
    tray.setToolTip('KLSeis2025') // 设置鼠标悬停时的提示

    // 创建右键菜单
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '打开应用',
            click: () => {
                mainWindow.show() // 显示窗口
                mainWindow.focus() // 聚焦窗口
            },
        },
        {
            label: '开机自启',
            type: 'checkbox',
            checked: app.getLoginItemSettings().openAtLogin, // 获取当前开机自启设置的状态
            click: menuItem => {
                const openAtLogin = menuItem.checked
                app.setLoginItemSettings({
                    openAtLogin: openAtLogin, // 设置开机自启状态
                })
            },
        },
        {
            label: '退出应用',
            click: () => {
                app.isQuiting = true // 设置退出标志
                app.quit() // 退出应用
            },
        },
    ])

    tray.setContextMenu(contextMenu) // 设置托盘图标的右键菜单

    // 点击托盘图标时，显示窗口
    tray.on('click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide()
        } else {
            mainWindow.show()
            mainWindow.focus()
        }
    })
}

/* ************************************************************* 管理员权限启动 ****************************************************************************** */
/* ******************************************************* 需要在 app 的 ready 事件之后处理的一些事件 ***************************************************************** */
app.whenReady().then(() => {
    createWindow() // 创建窗口
    createTray() // 创建托盘图标
    app.commandLine.appendArgument('--in-process-gpu') // 添加 --in-process-gpu 参数，让GPU在主进程中运行，以兼容超低性能设备
    // 开发中默认按F12打开或关闭DevTools，在生产中忽略 https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })
    electronApp.setAppUserModelId('com.electron') // 设置应用程序的用户模型 ID

    app.on('activate', createActivateWindow) // macOS 上 deck 点击处理
    ipcMain.on('set-title', handleSetTitle) // 设置应用标题

    ipcMain.on('window-minimize', e => {
        e.preventDefault()
        mainWindow.hide() // 隐藏窗口
    }) // 最小化

    ipcMain.on('window-close', () => mainWindow.close()) // 关闭应用程序
    mainWindow.on('close', e => {
        if (!app.isQuiting) {
            e.preventDefault()
            mainWindow.hide()
        }
        return false
    }) // 监听窗口关闭事件，隐藏窗口而不是关闭应用

    ipcMain.on('window-alwaysOnTop', (e, alwaysOnTop) => {
        mainWindow.setAlwaysOnTop(alwaysOnTop, 'floating')
        if (alwaysOnTop) {
            mainWindow.focus() // 确保窗口获得焦点
        }
    }) // 置顶应用程序

    ipcMain.handle('read-creat-sql-file', () => handleReadMockSqlFile(creatDataSQLPath)) // 发送 建表 SQL 文件内容
    ipcMain.handle('read-put-sql-file', () => handleReadMockSqlFile(putDataSQLPath)) // 发送 添加基础数据 SQL 文件内容
    ipcMain.handle('select-folder', handleSelectFolder) // 选择文件夹弹窗
    ipcMain.handle('scan-folder', hanleScanFolder) // 扫描当前文件夹
    ipcMain.handle('scan-app-list-runable', hanleScanAppListRunable) // 预先扫描所有AppList是否可运行
    ipcMain.handle('creat-klseis-app', createKLSeisAppFolder) // 查找 KLSeisApp 文件夹路径
    ipcMain.handle('run-app-admin', hanleRunAppAdmin) // 管理员权限运行 App
    ipcMain.on('open-install-folder', handleOpenInstallFolder) // 打开安装文件夹
    ipcMain.handle('decompression', handleDecompression) // 解压Zip
    // 监听渲染进程请求应用版本号
    ipcMain.handle('get-app-version', () => {
        return app.getVersion()
    })
    ipcMain.handle('get-image-path', () => {
        const isDev = !app.isPackaged
        if (isDev) return ''
        const resourcesPath = process.resourcesPath
        const imagePath = join(resourcesPath, 'app', 'out', 'renderer')
        return `file://${imagePath}`
    }) // 外链 render/public 文件夹下的图片资源，并且需要上面打开 webSecurity: false, 以允许加载本地文件
    ipcMain.handle('other-software', () => {
        const isDev = !app.isPackaged
        if (isDev) return ''
        const resourcesPath = process.resourcesPath
        const imagePath = join(resourcesPath, 'app', 'out', 'renderer')
        return `file://${imagePath}`
    }) // 扫描 win 系统内所有程序
    // 监听渲染进程请求：打开文件选择对话框
    ipcMain.handle('dialog:openZip', async () => {
        const result = await dialog.showOpenDialog({
            title: '选择需要导入的克浪软件压缩包',
            buttonLabel: '导入',
            properties: ['openFile'],
            filters: [{ name: '压缩文件', extensions: ['zip', 'rar', '7z'] }], // 支持 ZIP、RAR 和 7Z 格式
        })

        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0] // 返回选中的压缩包路径
        } else {
            return null
        }
    }) // 导入 zip、rar 和 7z
    ipcMain.handle('get-mac-address', async () => {
        const networkInterfaces = os.networkInterfaces() // 获取网络接口信息
        const macAddresses = []

        // 遍历所有网络接口
        for (const interfaceName in networkInterfaces) {
            const interfaces = networkInterfaces[interfaceName]

            interfaces.forEach(iface => {
                // 排除无效或本地回环地址（如 127.0.0.1 或 "::1"）
                if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
                    macAddresses.push(iface.mac)
                }
            })
        }

        return macAddresses[0] // 返回所有有效的 MAC 地址
    }) // 查询本机 mac 地址
    ipcMain.handle('folder:delete', async (_, folderPath) => {
        try {
            // 检查路径是否存在
            if (existsSync(folderPath)) {
                // 删除文件夹及所有内容
                await fsPromises.rm(folderPath, { recursive: true, force: true })
                return { success: true, message: '删除成功' }
            } else {
                return { success: false, message: 'Folder does not exist.' }
            }
        } catch (error) {
            console.error('Error deleting folder:', error)
            return { success: false, message: `Error: ${error.message}` }
        }
    }) // 删除版本
    ipcMain.handle('has-zip', async () => {
        const isDev = !app.isPackaged
        let exeDir

        function getRegistryValue(hive, path, key) {
            return new Promise((resolve, reject) => {
                const command = `reg query "${hive}\\${path}" /v ${key}`
                exec(command, { encoding: 'buffer' }, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Error executing reg command:', stderr)
                        reject(error)
                        return
                    }

                    // 将输出从 GBK 转换为 UTF-8
                    const output = iconv.decode(stdout, 'gbk')

                    // 解析输出
                    const lines = output.split('\n')
                    for (const line of lines) {
                        const match = line.match(/\s+(\w+)\s+REG_\w+\s+(.+)/)
                        if (match && match[1] === key) {
                            resolve(match[2].trim())
                            return
                        }
                    }

                    reject(new Error('Key not found'))
                })
            })
        }

        try {
            const value = await getRegistryValue('HKEY_CURRENT_USER', 'Software\\KLSeis2025', 'InstallerPath')

            if (isDev) {
                // 开发环境下直接返回本地路径
                exeDir = 'C:\\Users\\zilianghm\\Desktop\\KLSPack'
            } else {
                if (value) {
                    exeDir = value
                } else {
                    console.error('读取注册表或检测文件路径时出错:')
                    return null // 如果发生错误，返回 null
                }
            }

            // 检查目录是否存在
            if (!existsSync(exeDir)) {
                console.error('目录不存在:', exeDir)
                return null // 如果目录不存在，返回 null
            }

            // 获取目录中的所有文件
            const files = readdirSync(exeDir)

            console.log(632, files)

            // 定义正则表达式，匹配文件名中包含 "kl"（不区分大小写）
            const klRegex = /kl/i

            // 过滤出 .zip、.rar 和 .7z 文件，并且文件名中包含 "kl"
            const zipFiles = files
                .filter(file => {
                    const ext = extname(file).toLowerCase()
                    return (ext === '.zip' || ext === '.rar' || ext === '.7z') && klRegex.test(file)
                })
                .map(file => {
                    const filePath = join(exeDir, file)
                    const stats = statSync(filePath)
                    return {
                        name: file,
                        path: filePath,
                        mtime: stats.mtime, // 文件的修改时间
                    }
                })

            // 按修改时间从最新到最旧排序
            zipFiles.sort((a, b) => b.mtime - a.mtime)

            if (zipFiles.length > 0) {
                // 返回包含所有 ZIP 文件信息的数组
                console.log('找到的 ZIP 文件数组:', zipFiles)
                return zipFiles
            } else {
                // 如果没有找到 .zip 文件，返回 null
                console.error('未找到 ZIP 文件')
                return null
            }
        } catch (error) {
            console.error('读取注册表时发生错误:', error)
            return null
        }
    }) // 初次安装，是否有离线包
    // 传递 app.isPackaged 的值到 preload.js
    ipcMain.handle('get-is-packaged', () => {
        return app.isPackaged // 返回是否是打包环境
    })
    ipcMain.handle('dialog:openExeFile', async (_, options) => {
        return await dialog.showOpenDialog(options)
    }) // 选择 exe 文件

    ipcMain.handle('file:getIcon', async (_, exePath) => {
        try {
            const icon = await app.getFileIcon(exePath, {
                size: 'large', // 可选值: small / normal / large
            })

            // 返回 base64 格式的图标数据
            return icon.toDataURL()
        } catch (error) {
            console.error('获取图标失败:', error)
            // 返回默认错误图标
            return nativeImage.createFromPath('default-icon.png').toDataURL()
        }
    }) // 获取文件图标
    ipcMain.handle('write-new-sql-content', async (event, newSqlContent) => {
        try {
            // 清空并写入新的 SQL 内容
            writeFileSync(putDataSQLPath, newSqlContent, 'utf-8')
            return { success: true }
        } catch (error) {
            console.error('写入 SQL 文件失败:', error)
            return { success: false, error: error.message }
        }
    }) // 写入 SQL 文件

    ipcMain.on('restart-panel', () => {
        // 在退出之前调用 relaunch
        app.relaunch()
        // 退出当前实例
        app.quit()
    }) // 监听渲染进程的重启请求
    ipcMain.handle('run-exe', async () => {
        try {
            const exePath = join(app.getAppPath(), 'resources', 'license', 'Win64', 'installanchorservice.exe')
            console.log('', exePath)
            return new Promise(resolve => {
                execFile(exePath, { windowsHide: true, runAsAdmin: true }, (error, stdout, stderr) => {
                    if (error) {
                        console.error('one:', error)
                        resolve({ success: false, message: '执行失败' })
                    } else {
                        console.log('stdout:', stdout)
                        console.log('stderr:', stderr)
                        resolve({ success: true, message: '执行成功' })
                    }
                })
            })
        } catch (error) {
            console.error('two:', error)
            return { success: false, message: '运行时出错' }
        }
    }) // 安装激活服务
    ipcMain.handle('check-service', async (event, serviceName) => {
        const checkServiceExistence = () => {
            return new Promise((resolve, reject) => {
                exec(`sc query "${serviceName}"`, (err, stdout, stderr) => {
                    if (err || stderr) {
                        reject(`Error checking service: ${stderr || err}`)
                        return
                    }

                    // 如果输出中包含 "SERVICE_NAME"，表示服务存在
                    if (stdout.includes('SERVICE_NAME')) {
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                })
            })
        }
        try {
            const exists = await checkServiceExistence()
            return exists
        } catch (error) {
            console.error(error)
            return false
        }
    }) // 检查激活服务是否存在
})
