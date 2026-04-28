@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: EasySchedule NGINX 管理脚本
:: 适用于 Windows Server 2012 R2

echo ===========================================
echo EasySchedule NGINX 管理器
echo ===========================================
echo.

:: 设置路径变量
set NGINX_DIR=C:\nginx
set NGINX_CONF=%~dp0neemo-easyschedule.conf
set APP_DIR=C:\apps\EasySchedule
set LOG_DIR=%APP_DIR%\logs

:: 检查 NGINX 是否安装
if not exist "%NGINX_DIR%\nginx.exe" (
    echo [错误] NGINX 未安装在 %NGINX_DIR%
    echo 请先安装 NGINX for Windows
    echo 下载地址: http://nginx.org/en/download.html
    pause
    exit /b 1
)

:: 创建必要的目录
if not exist "%APP_DIR%" (
    echo [信息] 创建应用目录: %APP_DIR%
    mkdir "%APP_DIR%"
)

if not exist "%LOG_DIR%" (
    echo [信息] 创建日志目录: %LOG_DIR%
    mkdir "%LOG_DIR%"
)

:: 检查配置文件
if not exist "%NGINX_CONF%" (
    echo [错误] 找不到配置文件: %NGINX_CONF%
    pause
    exit /b 1
)

:: 显示操作菜单
:menu
echo.
echo 请选择操作:
echo 1. 启动 NGINX
echo 2. 停止 NGINX
echo 3. 重启 NGINX
echo 4. 重新加载配置
echo 5. 测试配置文件
echo 6. 查看状态
echo 7. 查看日志
echo 0. 退出
echo.
set /p choice="请输入选项 (0-7): "

if "%choice%"=="1" goto start_nginx
if "%choice%"=="2" goto stop_nginx
if "%choice%"=="3" goto restart_nginx
if "%choice%"=="4" goto reload_nginx
if "%choice%"=="5" goto test_config
if "%choice%"=="6" goto check_status
if "%choice%"=="7" goto view_logs
if "%choice%"=="0" goto exit
echo [错误] 无效选项，请重新选择
goto menu

:start_nginx
echo.
echo [信息] 启动 NGINX...
cd /d "%NGINX_DIR%"
nginx.exe -c "%NGINX_CONF%"
if !errorlevel! equ 0 (
    echo [成功] NGINX 启动成功
    echo [信息] 访问地址: http://localhost
) else (
    echo [错误] NGINX 启动失败，请检查配置文件
)
pause
goto menu

:stop_nginx
echo.
echo [信息] 停止 NGINX...
cd /d "%NGINX_DIR%"
nginx.exe -s quit
if !errorlevel! equ 0 (
    echo [成功] NGINX 停止成功
) else (
    echo [警告] NGINX 停止命令执行失败，尝试强制终止...
    taskkill /f /im nginx.exe > nul 2>&1
    if !errorlevel! equ 0 (
        echo [成功] 强制终止 NGINX 成功
    ) else (
        echo [错误] 无法终止 NGINX 进程
    )
)
pause
goto menu

:restart_nginx
echo.
echo [信息] 重启 NGINX...
call :stop_nginx
timeout /t 2 /nobreak > nul
call :start_nginx
pause
goto menu

:reload_nginx
echo.
echo [信息] 重新加载 NGINX 配置...
cd /d "%NGINX_DIR%"
nginx.exe -s reload -c "%NGINX_CONF%"
if !errorlevel! equ 0 (
    echo [成功] 配置重新加载成功
) else (
    echo [错误] 配置重新加载失败
)
pause
goto menu

:test_config
echo.
echo [信息] 测试 NGINX 配置文件...
cd /d "%NGINX_DIR%"
nginx.exe -t -c "%NGINX_CONF%"
if !errorlevel! equ 0 (
    echo [成功] 配置文件测试通过
) else (
    echo [错误] 配置文件测试失败
)
pause
goto menu

:check_status
echo.
echo [信息] 检查 NGINX 状态...
tasklist /fi "imagename eq nginx.exe" | find /i "nginx.exe" > nul
if !errorlevel! equ 0 (
    echo [运行中] NGINX 正在运行
    echo.
    echo NGINX 进程信息:
    tasklist /fi "imagename eq nginx.exe" /fo table
) else (
    echo [已停止] NGINX 未运行
)
echo.
echo 端口监听状态:
netstat -an | findstr ":80 "
pause
goto menu

:view_logs
echo.
echo [信息] 可用日志文件:
echo 1. NGINX 访问日志
echo 2. NGINX 错误日志
echo 3. 返回主菜单
echo.
set /p log_choice="请选择 (1-3): "

if "%log_choice%"=="1" (
    echo.
    echo NGINX 访问日志 (%LOG_DIR%\nginx_access.log):
    if exist "%LOG_DIR%\nginx_access.log" (
        type "%LOG_DIR%\nginx_access.log"
    ) else (
        echo [信息] 访问日志文件不存在
    )
    pause
    goto view_logs
)

if "%log_choice%"=="2" (
    echo.
    echo NGINX 错误日志 (%LOG_DIR%\nginx_error.log):
    if exist "%LOG_DIR%\nginx_error.log" (
        type "%LOG_DIR%\nginx_error.log"
    ) else (
        echo [信息] 错误日志文件不存在
    )
    pause
    goto view_logs
)

if "%log_choice%"=="3" goto menu
echo [错误] 无效选项
goto view_logs

:exit
echo.
echo [信息] 感谢使用 EasySchedule NGINX 管理器
exit /b 0