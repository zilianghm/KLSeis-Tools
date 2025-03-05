module.exports = {
    extends: [
        'eslint:recommended', // 使用 ESLint 推荐的基础规则
        'plugin:react/recommended', // 使用 React 推荐的 ESLint 规则
        'plugin:react/jsx-runtime', // 针对 React 17+ JSX 转换的配置（不需要显式导入 React）
        '@electron-toolkit', // 使用 @electron-toolkit 提供的 ESLint 配置
        '@electron-toolkit/eslint-config-prettier', // 集成 Prettier，禁用可能与 Prettier 冲突的 ESLint 规则
    ],
    plugins: ['html'], // 使用 html 插件来支持 HTML 文件中的内联脚本 linting
    overrides: [
        {
            files: ['**/*.jsx'], // 针对所有 .jsx 文件的特定规则
        },
    ],
    rules: {
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
        'react/prop-types': 'off',
    },
    env: {
        browser: true, // 支持浏览器环境
        node: true, // 支持 Node.js 环境
        worker: true, // 支持 Web Worker 环境
    },
}
