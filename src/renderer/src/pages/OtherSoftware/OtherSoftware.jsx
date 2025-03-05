import { useState } from 'react'
import { Popover, Cascader, Message } from '@arco-design/web-react'
import './OtherSoftware.scss'
import { useContextConsumer } from '../../ContextProvider'
import { v4 as uuidv4 } from 'uuid'
import { IconSwap, IconMoreVertical } from '@arco-design/web-react/icon'
import { handleStartApp } from '../../tools'
import { useTranslation } from 'react-i18next'

export const OtherSoftware = () => {
    const { t } = useTranslation()
    const { navList, softwareList, db, language } = useContextConsumer()
    const [groupBtn, setGroupBtn] = useState(false)

    const handleAddSoftware = async () => {
        try {
            // 通过 Electron API 调用文件对话框
            const result = await window.electron.ipcRenderer.invoke('dialog:openExeFile', {
                properties: ['openFile'],
                filters: [{ name: 'Executables', extensions: ['exe'] }],
            })

            if (result.canceled) return

            const exePath = result.filePaths[0]
            const exeName = exePath.split('\\').pop().replace('.exe', '')

            // 获取 EXE 文件图标
            const iconData = await window.electron.ipcRenderer.invoke('file:getIcon', exePath)

            console.log('EXE 文件图标:', iconData)

            await db.exec(`UPDATE setting
                SET software_list = '${JSON.stringify([
                    ...softwareList,
                    {
                        app_name: exeName,
                        path: exePath,
                        logo: iconData,
                        category_id: '',
                        app_id: uuidv4(),
                        app_start_path: {
                            currentLocalPath: exePath,
                            appeExeName: exeName,
                            localApp: true,
                        },
                    },
                ])}'
                WHERE id = 1;`)
        } catch (error) {
            console.error('Error selecting file:', error)
        }
    }

    return (
        <div className='software-container'>
            <div className='klseis-app-title'>
                <div className='klseis-app-import' onClick={handleAddSoftware}>
                    {t('importSoftware')}
                </div>
                <div
                    className={groupBtn ? 'klseis-app-activation' : 'klseis-app-activation-false'}
                    onClick={() => setGroupBtn(!groupBtn)}
                >
                    <IconSwap className='klseis-app-activation-icon' />
                    {groupBtn ? t('closeSetting') : t('setGroup')}
                </div>
            </div>
            <div className={groupBtn ? 'software-list' : 'software-list-start'}>
                {softwareList.map((software, index) => {
                    return (
                        <div key={index} className='software-item'>
                            <div
                                className='software-item-left'
                                onClick={async e => {
                                    e.stopPropagation() // 阻止进入详情，拦截事件冒泡
                                    if (groupBtn) return
                                    const result = await handleStartApp(
                                        software.app_start_path,
                                        language === 'zh' ? 'zh_CN' : 'en'
                                    )
                                    if (result) Message.warning(result)
                                }}
                            >
                                <div className='exe-icon-bd'>
                                    <img
                                        src={software?.logo}
                                        alt='软件图标'
                                        className='exe-icon'
                                        onError={e => (e.target.style.display = 'none')}
                                    />
                                </div>
                                <div className='software-info'>
                                    <div className='exe-name'>{software?.app_name}</div>
                                </div>
                            </div>
                            <div className='software-item-right'>
                                {groupBtn ? (
                                    <Cascader
                                        addBefore={t('setGroup')}
                                        placeholder=''
                                        style={{ width: 220 }}
                                        options={navList?.map(item => ({
                                            label: language === 'zh' ? item.category_name : item.category_name_en,
                                            value: item.category_id,
                                        }))}
                                        value={software?.category_id}
                                        onChange={async value => {
                                            const newSoftwareList = softwareList.map(item => {
                                                if (item?.app_id === software?.app_id) {
                                                    return { ...item, category_id: value[0] }
                                                }
                                                return item
                                            })
                                            await db.exec(`UPDATE setting
                                            SET software_list = '${JSON.stringify(newSoftwareList)}'
                                            WHERE id = 1;`)
                                        }}
                                    />
                                ) : (
                                    <Popover
                                        content={
                                            <div className='software-item-popover' onClick={e => e.stopPropagation()}>
                                                <div className='software-item-popover-item'>
                                                    <div>{software?.path}</div>
                                                </div>
                                                <div className='software-item-popover-item'>
                                                    <div
                                                        className='software-item-popover-delete-btn'
                                                        onClick={() => {
                                                            const newSoftwareList = softwareList.filter(
                                                                item => item?.app_id !== software?.app_id
                                                            )
                                                            db.exec(`UPDATE setting
                                                                    SET software_list = '${JSON.stringify(newSoftwareList)}'
                                                                    WHERE id = 1;`)
                                                        }}
                                                    >
                                                        {t('delete')}
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                        position='bottom'
                                        trigger='click'
                                    >
                                        <IconMoreVertical className='software-item-drag-icon' />
                                    </Popover>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
