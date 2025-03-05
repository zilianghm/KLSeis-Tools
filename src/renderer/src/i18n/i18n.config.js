import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import zh from './zh.json'

i18n.use(initReactI18next).init({
    resources: {
        // 配置语言文件
        en: {
            translation: en,
        },
        zh: {
            translation: zh,
        },
    },
    lng: 'zh', // 默认使用的语言
    interpolation: {
        escapeValue: false, // 关闭防止 xss 攻击
    },
})

export default i18n