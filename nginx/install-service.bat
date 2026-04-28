@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: EasySchedule NGINX Windows 服务安装脚本
:: 使用 NSSM (Non-Sucking Service Manager) 安装 NGINX 为 Windows 服务

echo ===========================================
echo EasySchedule NGINX 服务安装器
echo ===========================================
echo.

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 需要管理员权限来安装 Windows 服务
    echo 请右键点击此脚本并选择"以管理员身份运行"
    pause
    exit /b 1
)

:: 设置路径变量
set NGINX_DIR=C:\nginx
set NGINX_CONF=%~dp0easyschedule.conf
set SERVICE_NAME=EasyScheduleNGINX
set NSSM_URL=https://nssm.cc/download
set NSSM_FILE=nssm.exe

:: 检查 NGINX 是否安装
if not exist "%NGINX_DIR%\nginx.exe" (
    echo [错误] NGINX 未安装在 %NGINX_DIR%
    pause
    exit /b 1
)

:: 检查 NSSM 是否已安装
where nssm >nul 2>&1
if %errorlevel% neq 0 (
    echo [信息] NSSM 未找到，尝试下载安装...
    echo 请从以下网站下载 NSSM:
    echo %NSSM_URL%
    echo.
    echo 下载后请将 nssm.exe 放到系统 PATH 中或与此脚本同目录
    echo.
    set /p continue="是否继续手动安装? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
)

:: 创建服务安装目录
set SERVICE_DIR=C:\apps\EasySchedule\service
if not exist "%SERVICE_DIR%" (
    echo [信息] 创建服务目录: %SERVICE_DIR%
    mkdir "%SERVICE_DIR%"
)

:: 复制配置文件
copy "%NGINX_CONF%" "%SERVICE_DIR%\easyschedule.conf" >nul
if %errorlevel% neq 0 (
    echo [错误] 无法复制配置文件
    pause
    exit /b 1
)

:: 创建 NGINX 启动脚本
echo @echo off > "%SERVICE_DIR%\start-nginx.bat"
echo cd /d "%NGINX_DIR%" >> "%SERVICE_DIR%\start-nginx.bat"
echo nginx.exe -c "%SERVICE_DIR%\easyschedule.conf" >> "%SERVICE_DIR%\start-nginx.bat"

:: 创建 NGINX 停止脚本
echo @echo off > "%SERVICE_DIR%\stop-nginx.bat"
echo cd /d "%NGINX_DIR%" >> "%SERVICE_DIR%\stop-nginx.bat"
echo nginx.exe -s quit >> "%SERVICE_DIR%\stop-nginx.bat"

:: 检查服务是否已存在
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorlevel% equ 0 (
    echo [警告] 服务 %SERVICE_NAME% 已存在
    set /p choice="是否重新安装服务? (y/n): "
    if /i not "%choice%"=="y" (
        echo [信息] 服务安装已取消
        pause
        exit /b 0
    )
    
    echo [信息] 停止并删除现有服务...
    sc stop "%SERVICE_NAME%" >nul 2>&1
    timeout /t 3 /nobreak >nul
    sc delete "%SERVICE_NAME%" >nul 2>&1
    timeout /t 2 /nobreak >nul
)

:: 安装服务
echo.
echo [信息] 安装 NGINX 服务...
where nssm >nul 2>&1
if %errorlevel% equ 0 (
    nssm install "%SERVICE_NAME%" "%SERVICE_DIR%\start-nginx.bat"
    nssm set "%SERVICE_NAME%" Description "EasySchedule NGINX Web Server"
    nssm set "%SERVICE_NAME%" Start SERVICE_AUTO_START
    nssm set "%SERVICE_NAME%" AppStopMethodSkip 1
    nssm set "%SERVICE_NAME%" AppStopMethodConsole 3000
    nssm set "%SERVICE_NAME%" AppStopMethodWindow 3000
    nssm set "%SERVICE_NAME%" AppStopMethodThreads 3000
    nssm set "%SERVICE_NAME%" AppExit Default Restart
    nssm set "%SERVICE_NAME%" AppRestartDelay 5000
    
    if !errorlevel! equ 0 (
        echo [成功] 服务安装成功
    ) else (
        echo [错误] 服务安装失败
        pause
        exit /b 1
    )
) else (
    echo [错误] NSSM 不可用，无法安装服务
    echo 请手动下载并安装 NSSM: %NSSM_URL%
    pause
    exit /b 1
)

:: 配置服务依赖和恢复选项
echo [信息] 配置服务恢复选项...
sc failure "%SERVICE_NAME%" reset= 86400 actions= restart/5000/restart/10000/restart/20000

:: 启动服务
echo.
echo [信息] 启动服务...
sc start "%SERVICE_NAME%"
timeout /t 5 /nobreak >nul

:: 检查服务状态
sc query "%SERVICE_NAME%" | findstr "RUNNING" >nul
if %errorlevel% equ 0 (
    echo [成功] 服务启动成功
    echo.
    echo 服务信息:
    echo 名称: %SERVICE_NAME%
    echo 描述: EasySchedule NGINX Web Server
    echo 启动类型: 自动
    echo 状态: 运行中
    echo.
    echo 服务管理命令:
    echo 启动服务: net start %SERVICE_NAME%
    echo 停止服务: net stop %SERVICE_NAME%
    echo 查看状态: sc query %SERVICE_NAME%
    echo 删除服务: sc delete %SERVICE_NAME%
) else (
    echo [错误] 服务启动失败
    echo 请检查事件查看器获取详细错误信息
)

echo.
echo ===========================================
echo 安装完成！
echo ===========================================
echo.
echo NGINX 现在已作为 Windows 服务运行
echo 应用可通过以下地址访问:
echo http://localhost
echo.
echo 日志文件位置:
echo C:\apps\EasySchedule\logs\
echo.
pause