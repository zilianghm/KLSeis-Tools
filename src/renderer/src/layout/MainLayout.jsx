import './MainLayout.scss'
import logoUrl from '../assets/img/logo.png'
import { useTranslation } from 'react-i18next'
import { FiSearch, FiMinus, FiX, FiHardDrive } from 'react-icons/fi'
import { IconEmail, IconPhone, IconTrophy, IconUser, IconSettings } from '@arco-design/web-react/icon'
import { LiaUserSolid } from 'react-icons/lia'
import { useContextConsumer } from '../ContextProvider'
import { Select, Message, Tooltip } from '@arco-design/web-react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ModalContent } from '../pages/ModalContent/ModalContent'
import ZhIcon from '../assets/img/zhIcon.svg?react'
import EnIcon from '../assets/img/enIcon.svg?react'
import { Popover } from '@arco-design/web-react'
import { setStroage } from '../tools'
import { SearchPopoverContent } from '../components/SearchPopoverContent/SearchPopoverContent'
import { SettingPopoverContent } from '../components/SettingPopoverContent/SettingPopoverContent'

export const MainLayout = ({ nav }) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const {
        activated_nav,
        db,
        modalType,
        setModalType,
        language,
        currentLocalPath,
        localVersionList,
        setAppList,
        userInfo,
        setToken,
        appVersion,
        havActivateService,
    } = useContextConsumer()
    const [searchValue, setSearchValue] = useState('')
    const [searchBlur, setSearchBlur] = useState(false)

    // 导航交互与跳转
    const handleNavClick = e => {
        let currentElement = null
        const classListName = e.target.classList[0]
        switch (classListName) {
            case 'nav-item-icon':
                currentElement = e.target.parentElement
                break
            case 'nav-item-text':
                currentElement = e.target.parentElement
                break
            case 'nav-item':
                currentElement = e.target
                break
            case 'nav-group':
                return
            default:
                return
        }
        // 原地点击，详情返回等
        if (currentElement.classList[2] === 'nav-item-activated') return navigate('/' + currentElement.classList[1])
        if (currentElement.classList[1] === 'recentlyOpened') return Message.warning('【最近打开】正在开发中，敬请期待')
        if (currentElement.classList[1] === 'aboutUs') return Message.warning('【关于我们】正在开发中，敬请期待')
        // 持久化存储导航
        db.exec(`update setting set activated_nav = '${currentElement.classList[1]}' where id = 1;`)
    }

    // 导航路由
    useEffect(() => {
        if (!activated_nav) return
        if (activated_nav === 'recentlyOpened') return
        if (activated_nav === 'aboutUs') return
        const currentElement = document.getElementsByClassName(activated_nav)[0] // 获取当前 nav
        const siblings = document.getElementsByClassName('nav-item') // 获取所有兄弟元素
        for (let sibling of siblings) sibling?.classList?.remove('nav-item-activated') // 清除所有
        currentElement?.classList?.add('nav-item-activated') // 设置当前 nav 激活状态
        navigate('/' + activated_nav)
    }, [activated_nav, currentLocalPath])

    // 没有离线包，导航到软件包管理页面
    useEffect(() => {
        if (currentLocalPath === 'noPickVersion') {
            db.exec(`update setting set activated_nav = 'packageManagement' where id = 1;`)
        }
    }, [currentLocalPath])

    if (!currentLocalPath) return <></>
    return (
        <div className='main'>
            {/* 顶部标题栏 */}
            <div className='top-title-bar'>
                <div className='left'>
                    <img src={logoUrl} alt='' className='logoImg' />
                    <div className='logo'>
                        <div className='logoName'>{t('logoName')}</div>
                        <div className='logoSlogan'>{t('logoSlogan')}</div>
                    </div>
                </div>
                <div className='right'>
                    <div className='top-left'>
                        <Popover
                            position='bottom'
                            popupVisible={searchValue ? (searchBlur ? false : true) : false}
                            content={
                                <SearchPopoverContent searchValue={searchValue} onMouseDown={e => e.preventDefault()} />
                            }
                            className='searchPopover'
                            onClick={e => e.stopPropagation()} // 阻止事件冒泡
                        >
                            <div className='search'>
                                <FiSearch className={`searchIcon ${searchValue ? 'searchIcon-active' : ''}`} />
                                <input
                                    type='text'
                                    className='searchInput'
                                    placeholder={t('searchPlaceholder')}
                                    onChange={e => {
                                        setSearchBlur(false)
                                        setSearchValue(e.target.value)
                                    }}
                                    onBlur={() => setSearchBlur(true)}
                                    onFocus={() => setSearchBlur(false)}
                                />
                            </div>
                        </Popover>
                    </div>
                    <div className='top-right'>
                        {userInfo ? (
                            <Popover
                                content={
                                    <div className='userPopover'>
                                        <div className='username'>
                                            <span>
                                                <IconUser className='userIcon' />
                                                {userInfo.username ? userInfo.username : 'null'}
                                            </span>
                                        </div>
                                        <div className='username'>
                                            <span>
                                                <IconTrophy className='userTrophy' />
                                                {userInfo.deptName ? userInfo.deptName : 'null'}
                                            </span>
                                        </div>
                                        <div className='username'>
                                            <span>
                                                <IconPhone className='userPhone' />
                                                {userInfo.phoneNumber ? userInfo.phoneNumber : 'null'}
                                            </span>
                                        </div>
                                        <div className='username'>
                                            <span>
                                                <IconEmail className='userEmail' />
                                                {userInfo.email ? userInfo.email : 'null'}
                                            </span>
                                        </div>
                                        <div
                                            className='logout'
                                            onClick={() => {
                                                setStroage('token', '') // 清除 token
                                                setToken('') // 触发清空用户信息
                                                Message.success(t('logoutSuccess'))
                                            }}
                                        >
                                            {t('logout')}
                                        </div>
                                    </div>
                                }
                                position='top'
                                trigger='click'
                            >
                                <div className='userIcon userIcon-login'>{userInfo.icon}</div>
                            </Popover>
                        ) : (
                            <div className='userIcon' onClick={() => setModalType('user-login')}>
                                <LiaUserSolid />
                            </div>
                        )}

                        {language === 'zh' ? (
                            <ZhIcon
                                className='languageIcon'
                                fill='currentColor'
                                onClick={() => {
                                    db.exec(`UPDATE setting
                                SET language = 'en'
                                WHERE id = 1;`)
                                }}
                            />
                        ) : (
                            <EnIcon
                                className='languageIcon'
                                fill='currentColor'
                                onClick={() => {
                                    db.exec(`UPDATE setting
                                SET language = 'zh'
                                WHERE id = 1;`)
                                }}
                            />
                        )}
                        <FiMinus
                            className='minimizeIcon'
                            onClick={() => window.electron.ipcRenderer.send('window-minimize')}
                        />
                        <FiX
                            className='closeIcon'
                            onClick={() => window.electron.ipcRenderer.send('window-minimize')}
                        />
                    </div>
                </div>
            </div>
            {/* 内容区 */}
            <div className='content'>
                <div className='left'>
                    <Select
                        value={currentLocalPath === 'noPickVersion' ? t('noSoftwarePackage') : currentLocalPath}
                        className='selectVersion'
                        id='selectVersion'
                        dropdownMenuClassName='selectVersionModal'
                        addBefore={<FiHardDrive className='selectIcon' />}
                        options={localVersionList?.map(item => ({
                            label: (
                                <Tooltip content={item.base_package_version + ' ' + item.base_package_name}>
                                    {item.base_package_version}
                                </Tooltip>
                            ),
                            value: item.directoryPath,
                        }))}
                        getPopupContainer={() => document.getElementById('selectVersion')}
                        onChange={value => {
                            setAppList(null) // 清空数据，loading 等待
                            db.exec(`UPDATE setting
                                SET current_local_path = '${value}'
                                WHERE id = 1;`) // 选中版本，持久化记录
                        }}
                    />
                    <div className='nav' onClick={handleNavClick}>
                        {nav}
                    </div>
                    <div className='nav-bottom-setting'>
                        <Popover
                            content={<SettingPopoverContent />}
                            className='settingPopover'
                            position='top'
                            trigger='click'
                        >
                            <IconSettings className='settingIcon' />
                        </Popover>
                        <div className='appVersion'>{`${appVersion}`}</div>
                        <Tooltip
                            content={
                                havActivateService ? t('activateServiceInstalled') : t('activateServiceNotInstalled')
                            }
                        >
                            <div
                                className={`activateService ${havActivateService ? 'activateService-active' : ''}`}
                            ></div>
                        </Tooltip>
                    </div>
                </div>
                <div className='right'>{<Outlet setModalType={setModalType} />}</div>
            </div>
            {/* 弹窗详情 */}
            <ModalContent modalType={modalType} setModalType={setModalType} />
        </div>
    )
}
