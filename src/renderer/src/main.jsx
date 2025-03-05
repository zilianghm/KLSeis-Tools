// react 根组件
import ReactDOM from 'react-dom/client'
import { App } from './App'

// PGLite 数据库
import { PGliteProvider } from '@electric-sql/pglite-react'
import { pgliteInit } from './db/pglite.init'

// 全局状态
import { ContextProvider } from './ContextProvider'

// 创建持久化 PGLite 本地数据库，转 IndanceDB 加密存储
const db = await pgliteInit()

ReactDOM.createRoot(document.getElementById('root')).render(
    <PGliteProvider db={db}>
        <ContextProvider db={db}>
            <App />
        </ContextProvider>
    </PGliteProvider>
)
