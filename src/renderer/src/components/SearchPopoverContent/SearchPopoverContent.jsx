import './SearchPopoverContent.scss'
import { useMemo } from 'react'
import { useContextConsumer } from '../../ContextProvider'
import { IconCaretRight } from '@arco-design/web-react/icon'
import { handleStartApp } from '../../tools'
import { Message } from '@arco-design/web-react'
import { useTranslation } from 'react-i18next'

export const SearchPopoverContent = ({ searchValue, onMouseDown }) => {
    const { t } = useTranslation()
    const { appList, isAppListReady, softwareList, language } = useContextConsumer()

    const filteredList = useMemo(() => {
        if (!isAppListReady || !searchValue) return []
        const lowerCaseSearchValue = searchValue.toLowerCase()

        const appMatches = appList.filter(app => app.app_name.toLowerCase().includes(lowerCaseSearchValue))

        const softwareMatches = softwareList.filter(software =>
            software.app_name.toLowerCase().includes(lowerCaseSearchValue)
        )

        const combinedList = [...appMatches, ...softwareMatches]

        // 去重
        const uniqueList = Array.from(new Set(combinedList.map(item => item.app_id))).map(app_id =>
            combinedList.find(item => item.app_id === app_id)
        )

        return uniqueList
    }, [appList, isAppListReady, searchValue, softwareList])

    return (
        <div className='searchPopoverContent' onMouseDown={onMouseDown} onClick={e => e.stopPropagation()}>
            <div className='searchPopoverContent-title'>
                <div className='searchPopoverContent-title-text'>
                    {t('searchResult', { count: filteredList.length })}
                </div>
            </div>
            <div className='searchPopoverContent-list'>
                {filteredList.map((app, index) => (
                    <div
                        key={index}
                        className='searchPopoverContent-list-item'
                        onClick={async e => {
                            e.stopPropagation() // 阻止进入详情，拦截事件冒泡
                            console.log(50, app.app_start_path)
                            const result = await handleStartApp(app.app_start_path, language === 'zh' ? 'zh_CN' : 'en')
                            if (result) Message.warning(result)
                        }}
                    >
                        <div className='left'>
                            <img
                                className='searchPopoverContent-list-item-icon'
                                src={
                                    app?.app_start_path?.localApp ? `${app.logo}` : `data:image/png;base64, ${app.logo}`
                                }
                                alt={app.app_name}
                            />
                            <div className='searchPopoverContent-list-item-text'>{app.app_name}</div>
                        </div>
                        <div className='right'>
                            <IconCaretRight className='searchPopoverContent-list-item-start-icon' />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
