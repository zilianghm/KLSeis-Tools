import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
    },
    renderer: {
        resolve: {
            alias: {
                '@renderer': resolve('src/renderer/src'),
            },
        },
        plugins: [
            react(),
            svgr({
                esbuildOptions: {
                    loader: 'jsx', // 确保以 JSX 格式处理 SVG
                },
            }),
        ],
        optimizeDeps: {
            exclude: ['@electric-sql/pglite', '@electric-sql/pglite-react'],
        },
    },
})
