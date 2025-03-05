import { createContext, useContext, useState, useEffect } from 'react'
import { Message } from '@arco-design/web-react'
import { getStroage } from './tools.js'
import { postUserInfo, getDepartmentTree } from './api/index'

const Context = createContext()

export const ContextProvider = ({ db, children }) => {
    const [language, setLanguage] = useState() // 语言
    const [theme, setTheme] = useState() // 主题
    const [activated_nav, setActivatedNav] = useState() // 当前激活菜单
    const [alwaysOnTop, setAlwaysOnTop] = useState(false) // 窗口置顶
    const [navList, setNavList] = useState() // 导航菜单列表
    const [appList, setAppList] = useState() // 当前版本所有 App List 数据，携带子程序路径信息
    const [isAppListReady, setIsAppListReady] = useState(false) // 准备好了 App List 数据，可以合成其他软件列表
    const [modalType, setModalType] = useState() // 模态框类型
    const [loading, setLoading] = useState(false) // loading，数据准备好再渲染页面

    const [localVersionList, setLocalVersionList] = useState([]) // 本地扫描版本号列表
    // const [onLineSQLData, setOnLineSQLData] = useState([]) // 在线版本列表 - 原始查询

    const [currentLocalPath, setCurrentLocalPath] = useState() // 当前选定的版本路径
    const [installationFolderPath, setInstallationFolderPath] = useState(null) // 克浪安装路径
    const [installingComplete, setInstallingComplete] = useState(false) // 是否安装完成

    const [macAddress, setMacAddress] = useState() // 本机 mac 地址
    const [userInfo, setUserInfo] = useState() // 已登录的用户名和密码
    const [token, setToken] = useState(() => getStroage('token')) // token
    const [appVersion, setAppVersion] = useState() // 当前面板版本号

    const [softwareList, setSoftwareList] = useState([]) // 其他软件列表
    const [departmentTree, setDepartmentTree] = useState([]) // 部门树
    const [aiSessionList, setAiSessionList] = useState([]) // ai 会话列表

    const [detectionPanelUpdateSync, setDetectionPanelUpdateSync] = useState(false) // 手动检测面板更新
    const [havActivateService, setHavActivateService] = useState(false) // 是否安装激活服务

    console.log('一些重要渲染数据汇总', {
        installationFolderPath,
        currentLocalPath,
        appList,
        navList,
        token,
        userInfo,
        softwareList,
        departmentTree,
        macAddress,
        localVersionList,
        activated_nav,
        theme,
        language,
        modalType,
        isAppListReady,
        installingComplete,
        havActivateService,
    })

    useEffect(() => getDepartmentTree().then(res => setDepartmentTree(res?.data?.data?.trees)), []) // 部门树

    useEffect(() => {
        window.electron.ipcRenderer
            .invoke('check-service', 'FlexNet Licensing Service 64')
            .then(exists => {
                if (exists) {
                    setHavActivateService(true)
                } else {
                    setHavActivateService(false)
                }
            })
            .catch(() => {
                Message.error('检查激活服务失败')
            })
    }, [])

    const handleCurrentVersionPath = async installationFolderPath => {
        const results = await window.electron.ipcRenderer.invoke('scan-folder', installationFolderPath) // 扫描文件夹，查找所有 installinfo.ini 文件及其 SoftVersion
        console.log('扫描 KLSeisApp 文件夹结果', results)
        if (Array.isArray(results)) {
            if (results.length === 0) {
                db.exec(`UPDATE setting
                    SET current_local_path = 'noPickVersion'
                    WHERE id = 1;`) // 没有选中版本，持久化记录
                db.exec(`UPDATE setting
                    SET local_version_list = '${JSON.stringify([])}'
                    WHERE id = 1;`) // 本地没有软件，持久化
            } else {
                const defaultVersion = results.find(item => item.directoryPath === currentLocalPath)?.directoryPath // 找到默认版本号
                db.exec(`UPDATE setting
                    SET current_local_path = '${defaultVersion ?? results[0].directoryPath}'
                    WHERE id = 1;`) // 选中版本，持久化记录
                db.exec(`UPDATE setting
                    SET local_version_list = '${JSON.stringify(results)}'
                    WHERE id = 1;`) // 本地有软件，持久化本地版本号信息
            }
            setInstallingComplete(false)
        } else {
            Message.error(results) // 扫描报错
        }
    }

    // 已登录，获取用户信息
    useEffect(() => {
        if (token) {
            postUserInfo(token).then(res => {
                setUserInfo(res?.data?.data) // 登录后，获取用户信息
            })
        } else {
            setUserInfo(null) // 退出登录时，清除用户信息
        }
    }, [token])

    // 初次安装，扫描 克浪安装路径下所有版本
    useEffect(() => {
        if (!installationFolderPath) return
        if (installingComplete) handleCurrentVersionPath(installationFolderPath)
    }, [installingComplete, installationFolderPath])

    // 读取本地数据库-取出静态数据
    useEffect(() => {
        db.live.query(`SELECT * FROM setting;`, [], async res => {
            const ret = res?.rows?.[0] ?? {}
            setLanguage(ret?.language ?? 'zh')
            setTheme(ret?.theme ?? 'light')
            setActivatedNav(ret?.activated_nav ?? 'recentlyOpened')
            setLocalVersionList(ret?.local_version_list ? JSON.parse(ret?.local_version_list) : []) // 本地版本号列表
            setInstallationFolderPath(ret?.installation_folder_path)
            setSoftwareList(ret?.software_list ? JSON.parse(ret?.software_list) : []) // 其他软件列表
            setAiSessionList(ret?.ai_session_list ? JSON.parse(ret?.ai_session_list) : []) // ai 历史会话列表

            // 查询本机 mac 地址
            const macAddress = await window.electron.ipcRenderer.invoke('get-mac-address')
            setMacAddress(macAddress)
            setAppVersion(ret?.data_version) // 当前面板版本号
        })

        db.live.query(`SELECT current_local_path FROM setting;`, [], async res => {
            const ret = res?.rows?.[0] ?? {}
            setCurrentLocalPath(ret?.current_local_path)
            setLoading(true)
        }) // 当前选中版本查询

        db.live.query(
            `select ac.category_id,ac.category_name,ac.description,ac.logo,ac.code,ac.context,ac.charts,ac.sort,ac.image_url,acn.category_name category_name_en,acn.description description_en,acn.context context_en from kl_app_category ac left join kl_app_category_i18n acn on ac.category_id = acn.source_id order by ac.sort;`,
            [],
            res => setNavList(res?.rows)
        ) // 导航菜单列表查询
    }, [])

    // 数据库app列表查询，基础数据固定在 v1.0.0，提前预检测是否可运行
    useEffect(() => {
        if (!currentLocalPath) return
        db.live.query(
            `select a.app_id,a.app_name,a.category_id,a.version,a.description,a.logo,a.app_start_item,a.charts,a.rich_text_detail,a.sort,a.runnable,a.image_url,an.app_name app_name_en,an.description description_en,an.rich_text_detail rich_text_detail_en from kl_app a left join kl_app_i18n an on a.app_id = an.source_id 	where a.type = 1;`,
            [],
            async res => {
                const data = res?.rows ?? []
                const scanAppList = data.map(item => ({
                    ...item,
                    app_start_path: {
                        currentLocalPath,
                        appeExeName: item.app_start_item,
                        runnable: item?.runnable ?? 0,
                    },
                }))
                const results = await window.electron.ipcRenderer.invoke('scan-app-list-runable', scanAppList)
                setIsAppListReady(true)
                setAppList(results)
            }
        )
    }, [currentLocalPath])

    // 其他软件列表查询
    useEffect(() => {
        if (!isAppListReady) return
        const result = []
        softwareList.forEach(item => {
            if (item.category_id) {
                result.push(item)
            }
        })
        // 使用 Set 去重
        setAppList(old => {
            if (!old) return result
            // 过滤掉 old 中与 result 中 app_id 匹配的项
            const filteredOld = old.filter(oldItem => !result.some(resultItem => resultItem.app_id === oldItem.app_id))
            // 合并 filteredOld 和 result
            return [...filteredOld, ...result]
        })
    }, [softwareList, isAppListReady])

    const value = {
        db, // 本地数据库实例
        language,
        setLanguage,
        theme,
        setTheme,
        activated_nav,
        setActivatedNav,
        alwaysOnTop,
        setAlwaysOnTop,
        navList,
        appList,
        setAppList,
        modalType,
        setModalType,
        currentLocalPath,
        installationFolderPath,
        localVersionList,
        loading,
        setLoading,
        setInstallingComplete,
        macAddress,
        userInfo,
        setUserInfo,
        setToken,
        softwareList,
        departmentTree,
        isAppListReady,
        appVersion,
        detectionPanelUpdateSync,
        setDetectionPanelUpdateSync,
        havActivateService,
        setHavActivateService,
        aiSessionList,
        setAiSessionList,
    }
    return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useContextConsumer = () => useContext(Context)
