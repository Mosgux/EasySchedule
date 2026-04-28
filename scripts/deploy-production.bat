@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: EasySchedule 生产环境部署脚本
:: 适用于 Windows Server 2012 R2

echo ===========================================
echo EasySchedule 生产环境部署器
echo ===========================================
echo.

:: 设置变量
set PROJECT_ROOT=%~dp0..
set APP_DIR=C:\apps\EasySchedule
set BUILD_DIR=%PROJECT_ROOT%\build
set BACKUP_DIR=C:\apps\EasySchedule\backups
set LOG_FILE=C:\apps\EasySchedule\logs\deploy.log

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 需要管理员权限进行生产环境部署
    echo 请右键点击此脚本并选择"以管理员身份运行"
    pause
    exit /b 1
)

:: 创建必要的目录
if not exist "%APP_DIR%" mkdir "%APP_DIR%"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "C:\apps\EasySchedule\logs" mkdir "C:\apps\EasySchedule\logs"
if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"

:: 记录部署开始时间
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YYYY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%"
set "Min=%dt:~10,2%"
set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"

echo [信息] 部署开始时间: %timestamp%
echo [信息] 项目根目录: %PROJECT_ROOT%
echo [信息] 应用目录: %APP_DIR%
echo [信息] 日志文件: %LOG_FILE%
echo.

:: 检查 Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Node.js 未安装或不在 PATH 中
    echo 请安装 Node.js >= 18.19.0
    pause
    exit /b 1
)

:: 检查 npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] npm 未安装或不在 PATH 中
    pause
    exit /b 1
)

:: 停止现有服务
echo [信息] 停止现有服务...
net stop EasyScheduleNGINX 2>nul
taskkill /f /im node.exe 2>nul
timeout /t 3 /nobreak >nul

:: 备份现有部署
echo [信息] 备份现有部署...
if exist "%APP_DIR%\backend" (
    set backup_file=%BACKUP_DIR%\easyschedule_backup_%timestamp%.zip
    powershell -Command "Compress-Archive -Path '%APP_DIR%\*' -DestinationPath '%backup_file%' -Force"
    echo [成功] 备份创建: %backup_file%
) else (
    echo [信息] 没有现有部署需要备份
)

:: 清理构建目录
echo [信息] 清理构建目录...
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
mkdir "%BUILD_DIR%"

:: 构建共享模块
echo [信息] 构建共享模块...
cd /d "%PROJECT_ROOT%\shared"
npm ci
if %errorlevel% neq 0 (
    echo [错误] 共享模块依赖安装失败
    goto :error
)
npm run build
if %errorlevel% neq 0 (
    echo [错误] 共享模块构建失败
    goto :error
)

:: 构建后端
echo [信息] 构建后端...
cd /d "%PROJECT_ROOT%\backend"
npm ci --production=false
if %errorlevel% neq 0 (
    echo [错误] 后端依赖安装失败
    goto :error
)
npm run build
if %errorlevel% neq 0 (
    echo [错误] 后端构建失败
    goto :error
)

:: 构建前端
echo [信息] 构建前端...
cd /d "%PROJECT_ROOT%\frontend"
npm ci
if %errorlevel% neq 0 (
    echo [错误] 前端依赖安装失败
    goto :error
)
npm run build
if %errorlevel% neq 0 (
    echo [错误] 前端构建失败
    goto :error
)

:: 复制文件到生产目录
echo [信息] 复制文件到生产目录...

:: 复制后端
xcopy "%PROJECT_ROOT%\backend\dist" "%APP_DIR%\backend\" /E /I /H /Y
xcopy "%PROJECT_ROOT%\backend\node_modules" "%APP_DIR%\backend\node_modules\" /E /I /H /Y
xcopy "%PROJECT_ROOT%\backend\prisma" "%APP_DIR%\backend\prisma\" /E /I /H /Y
copy "%PROJECT_ROOT%\backend\package.json" "%APP_DIR%\backend\"
copy "%PROJECT_ROOT%\backend\package-lock.json" "%APP_DIR%\backend\"

:: 复制前端
xcopy "%PROJECT_ROOT%\frontend\dist" "%APP_DIR%\frontend\" /E /I /H /Y

:: 复制共享模块
xcopy "%PROJECT_ROOT%\shared\dist" "%APP_DIR%\shared\" /E /I /H /Y

:: 复制配置文件
xcopy "%PROJECT_ROOT%\nginx" "%APP_DIR%\nginx\" /E /I /H /Y

:: 创建生产环境配置
echo [信息] 创建生产环境配置...

:: 后端环境变量
(
echo NODE_ENV=production
echo PORT=4000
echo DATABASE_URL="file:./data/easy.db"
echo JWT_SECRET=easyschedule-production-jwt-secret-%timestamp%
echo CORS_ORIGIN=http://localhost
echo LOG_LEVEL=info
echo DATA_EXPIRY_DAYS=7
echo CLEANUP_INTERVAL_HOURS=6
) > "%APP_DIR%\backend\.env"

:: 前端环境变量
(
echo VITE_API_BASE_URL=http://localhost/api
echo VITE_SHARE_BASE_URL=http://localhost
) > "%APP_DIR%\frontend\.env"

:: 创建生产环境启动脚本
echo [信息] 创建生产环境启动脚本...

:: 后端启动脚本
(
echo @echo off
echo echo 启动 EasySchedule 后端服务...
echo cd /d "%APP_DIR%\backend"
echo npm start
) > "%APP_DIR%\start-backend.bat"

:: 全局启动脚本
(
echo @echo off
echo echo ==========================================
echo echo EasySchedule 启动器 ^(生产环境^)
echo echo ==========================================
echo echo.
echo echo 启动 NGINX...
echo call "%APP_DIR%\nginx\nginx-manager.bat" 1
echo echo.
echo echo 启动后端服务...
echo start "EasySchedule Backend" /D "%APP_DIR%\backend" npm start
echo echo.
echo echo 服务启动完成！
echo echo 前端地址: http://localhost
echo echo 后端API: http://localhost/api
echo echo.
echo pause
) > "%APP_DIR%\start-all.bat"

:: 创建数据库迁移脚本
(
echo @echo off
echo echo 执行数据库迁移...
echo cd /d "%APP_DIR%\backend"
echo npx prisma migrate deploy
echo npx prisma generate
echo echo 迁移完成！
echo pause
) > "%APP_DIR%\migrate-database.bat"

:: 设置数据库权限
echo [信息] 初始化数据库...
cd /d "%APP_DIR%\backend"
if not exist "data" mkdir data
npx prisma generate
npx prisma db push

:: 设置文件权限
echo [信息] 设置文件权限...
icacls "%APP_DIR%" /grant "IUSR:(OI)(CI)F" /T 2>nul
icacls "%APP_DIR%\backend\data" /grant "IUSR:(OI)(CI)F" /T 2>nul

:: 重启服务
echo [信息] 重启服务...
net start EasyScheduleNGINX 2>nul
start "EasySchedule Backend" /D "%APP_DIR%\backend" npm start

:: 验证部署
echo [信息] 验证部署...
timeout /t 10 /nobreak >nul

:: 检查服务状态
sc query EasyScheduleNGINX | findstr "RUNNING" >nul
if %errorlevel% equ 0 (
    echo [成功] NGINX 服务运行正常
) else (
    echo [警告] NGINX 服务未运行，请手动启动
)

:: 健康检查
echo [信息] 执行健康检查...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost/health' -TimeoutSec 30; Write-Host '[成功] 后端服务响应正常' } catch { Write-Host '[警告] 后端服务可能未完全启动' }"

:: 完成部署
echo.
echo ==========================================
echo 部署完成！
echo ==========================================
echo.
echo 部署信息:
echo 时间戳: %timestamp%
echo 应用目录: %APP_DIR%
echo 备份位置: %backup_file%
echo.
echo 访问地址:
echo 前端: http://localhost
echo 后端API: http://localhost/api
echo 健康检查: http://localhost/health
echo.
echo 管理命令:
echo 启动所有服务: %APP_DIR%\start-all.bat
echo 启动后端: %APP_DIR%\start-backend.bat
echo NGINX管理: %APP_DIR%\nginx\nginx-manager.bat
echo 数据库迁移: %APP_DIR%\migrate-database.bat
echo.
echo 日志位置:
echo 应用日志: C:\apps\EasySchedule\logs\
echo NGINX日志: C:\apps\EasySchedule\logs\nginx_*.log
echo.
goto :end

:error
echo.
echo [错误] 部署失败！
echo 请检查错误信息并重试
echo 部署日志已保存到: %LOG_FILE%
pause
exit /b 1

:end
echo [成功] 部署成功完成！
pause
exit /b 0