@echo off
REM 获取批处理文件所在目录
set SCRIPT_DIR=%~dp0

REM 定义目标目录
set TARGET_DIR=%LOCALAPPDATA%\electron\Cache

REM 定义 electron-builder 目标目录
set BUILDER_TARGET_DIR=%LOCALAPPDATA%\electron-builder

REM 切换到批处理文件所在目录
cd /d %SCRIPT_DIR%

REM 创建目标目录及其父目录（如果不存在）
if not exist "%TARGET_DIR%" (
    mkdir "%TARGET_DIR%"
)

REM 将指定的压缩包复制到目标目录
copy "%SCRIPT_DIR%\build\electron-v31.7.5-win32-x64.zip" "%TARGET_DIR%"

REM 检查复制是否成功
if errorlevel 1 (
    echo 复制失败，请检查文件路径和目标目录。
    pause
    exit /b
)

REM 创建 electron-builder 目标目录及其父目录（如果不存在）
if not exist "%BUILDER_TARGET_DIR%" (
    mkdir "%BUILDER_TARGET_DIR%"
)

REM 将 electron-builder 文件夹复制到目标目录
xcopy "%SCRIPT_DIR%\build\electron-builder" "%BUILDER_TARGET_DIR%" /E /I /Y

REM 检查复制是否成功
if errorlevel 1 (
    echo 复制 electron-builder 失败，请检查文件路径和目标目录。
    pause
    exit /b
)

REM 执行 build:win 命令
REM 假设使用 npm 或 yarn 作为包管理工具，根据实际情况调整命令
npm run build:win
REM 或者使用 yarn，如果项目使用 yarn
REM yarn build:win

REM 输出成功提示
echo 构建成功！按任意键退出。

REM 暂停命令窗口以查看输出结果
pause
