@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: EasySchedule 维护脚本
:: 包含备份、清理、更新等维护任务

echo ===========================================
echo EasySchedule 维护工具
echo ===========================================
echo.

:: 设置变量
set APP_DIR=C:\apps\EasySchedule
set BACKUP_DIR=C:\apps\EasySchedule\backups
set LOG_DIR=C:\apps\EasySchedule\logs

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [错误] 需要管理员权限执行维护任务
    echo 请右键点击此脚本并选择"以管理员身份运行"
    pause
    exit /b 1
)

:: 创建必要的目录
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

:menu
cls
echo ===========================================
echo EasySchedule 维护工具
echo ===========================================
echo.
echo 请选择维护任务:
echo 1. 备份数据库和配置
echo 2. 清理日志文件
echo 3. 清理过期数据
echo 4. 更新应用程序
echo 5. 检查系统状态
echo 6. 重启所有服务
echo 7. 查看日志
echo 8. 数据库维护
echo 9. 计划任务设置
echo 0. 退出
echo.
set /p choice="请输入选项 (0-9): "

if "%choice%"=="1" goto backup_data
if "%choice%"=="2" goto cleanup_logs
if "%choice%"=="3" goto cleanup_data
if "%choice%"=="4" goto update_app
if "%choice%"=="5" goto check_status
if "%choice%"=="6" goto restart_services
if "%choice%"=="7" goto view_logs
if "%choice%"=="8" goto db_maintenance
if "%choice%"=="9" goto schedule_tasks
if "%choice%"=="0" goto exit

echo [错误] 无效选项，请重新选择
pause
goto menu

:backup_data
echo.
echo [信息] 开始数据备份...
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,4%%dt:~4,2%%dt:~6,2%_%dt:~8,2%%dt:~10,2%%dt:~12,2%"

:: 备份数据库
echo [信息] 备份数据库...
if exist "%APP_DIR%\backend\data\easy.db" (
    copy "%APP_DIR%\backend\data\easy.db" "%BACKUP_DIR%\easy_db_%timestamp%.db"
    echo [成功] 数据库备份完成
) else (
    echo [警告] 数据库文件不存在
)

:: 备份配置文件
echo [信息] 备份配置文件...
set config_backup=%BACKUP_DIR%\config_%timestamp%.zip
powershell -Command "Compress-Archive -Path '%APP_DIR%\nginx\*.conf','%APP_DIR%\backend\.env','%APP_DIR%\frontend\.env' -DestinationPath '%config_backup%' -Force"
echo [成功] 配置文件备份完成

:: 备份日志
echo [信息] 备份最近日志...
if exist "%LOG_DIR%\*.log" (
    set log_backup=%BACKUP_DIR%\logs_%timestamp%.zip
    powershell -Command "Get-ChildItem '%LOG_DIR%\*.log' | Where-Object {$_.LastWriteTime -gt (Get-Date).AddDays(-7)} | Compress-Archive -DestinationPath '%log_backup%' -Force"
    echo [成功] 最近日志备份完成
)

echo [完成] 备份任务完成
pause
goto menu

:cleanup_logs
echo.
echo [信息] 清理日志文件...

:: 设置保留天数
set /p retain_days="请输入日志保留天数 (默认30): "
if "%retain_days%"=="" set retain_days=30

echo [信息] 清理 %retain_days% 天前的日志文件...

:: 清理应用日志
forfiles /p "%LOG_DIR%" /m *.log /d -%retain_days% /c "cmd /c echo 删除 @path... & del @path" 2>nul

:: 清理 NGINX 日志
forfiles /p "%LOG_DIR%" /m nginx_*.log /d -%retain_days% /c "cmd /c echo 删除 @path... & del @path" 2>nul

:: 压缩大日志文件
echo [信息] 压缩大日志文件...
powershell -Command "Get-ChildItem '%LOG_DIR%\*.log' | Where-Object {$_.Length -gt 10MB} | ForEach-Object { $archive = $_.FullName -replace '\.log$', '_archive.zip'; Compress-Archive -Path $_.FullName -DestinationPath $archive -Force; Remove-Item $_.FullName }"

echo [完成] 日志清理完成
pause
goto menu

:cleanup_data
echo.
echo [信息] 清理过期数据...

:: 停止后端服务
echo [信息] 停止后端服务...
taskkill /f /im node.exe 2>nul
timeout /t 3 /nobreak >nul

:: 运行数据清理
cd /d "%APP_DIR%\backend"
echo [信息] 执行数据清理脚本...
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  try {
    // 删除过期的时间表 (超过7天)
    const oldSchedules = await prisma.schedule.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    console.log('删除过期时间表:', oldSchedules.count);
    
    // 删除没有参与者的时间表 (超过24小时)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const emptySchedules = await prisma.schedule.deleteMany({
      where: {
        createdAt: {
          lt: oneDayAgo
        },
        participants: {
          none: {}
        }
      }
    });
    console.log('删除空时间表:', emptySchedules.count);
    
    console.log('数据清理完成');
  } catch (error) {
    console.error('数据清理失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
"

:: 重启后端服务
echo [信息] 重启后端服务...
start "EasySchedule Backend" /D "%APP_DIR%\backend" npm start

echo [完成] 过期数据清理完成
pause
goto menu

:update_app
echo.
echo [信息] 更新应用程序...

:: 检查当前版本
echo [信息] 检查当前版本...
cd /d "%APP_DIR%\backend"
if exist "package.json" (
    for /f "tokens=2 delims=:," %%a in ('findstr /C:"version" package.json') do set current_version=%%a
    set current_version=%current_version:"=%
    set current_version=%current_version: =%
    echo 当前版本: %current_version%
) else (
    echo [错误] 找不到 package.json
    pause
    goto menu
)

:: 备份当前版本
echo [信息] 备份当前版本...
call :backup_data

:: 询问更新方式
echo.
echo 请选择更新方式:
echo 1. 从 Git 拉取最新代码
echo 2. 上传更新包
echo 3. 手动指定路径
echo 0. 返回主菜单
echo.
set /p update_choice="请输入选项 (0-3): "

if "%update_choice%"=="1" goto update_from_git
if "%update_choice%"=="2" goto update_from_package
if "%update_choice%"=="3" goto update_from_path
if "%update_choice%"=="0" goto menu

echo [错误] 无效选项
pause
goto update_app

:update_from_git
echo [信息] 从 Git 更新...
echo 此功能需要在 Git 仓库中执行
echo 请手动运行: git pull && npm run build && scripts\deploy-production.bat
pause
goto menu

:update_from_package
echo [信息] 请上传更新包到 %BACKUP_DIR% 并手动解压
echo 然后重新运行部署脚本
pause
goto menu

:update_from_path
set /p update_path="请输入更新包路径: "
if exist "%update_path%" (
    echo [信息] 解压更新包...
    powershell -Command "Expand-Archive -Path '%update_path%' -DestinationPath '%APP_DIR%' -Force"
    echo [信息] 重新部署...
    call "%APP_DIR%\start-all.bat"
) else (
    echo [错误] 更新包不存在
)
pause
goto menu

:check_status
echo.
echo [信息] 检查系统状态...

:: 检查服务状态
echo 检查服务状态:
echo ----------------------------------------
sc query EasyScheduleNGINX 2>nul | findstr "STATE"
tasklist /fi "imagename eq node.exe" /fo table 2>nul

:: 检查端口
echo.
echo 检查端口状态:
echo ----------------------------------------
netstat -an | findstr ":80 "
netstat -an | findstr ":4000 "

:: 检查磁盘空间
echo.
echo 检查磁盘空间:
echo ----------------------------------------
for /f "tokens=2" %%a in ('wmic logicaldisk where "DeviceID='C:'" get FreeSpace /value') do set free_space=%%a
set /a free_gb=%free_space:~0,-9%
echo C盘可用空间: %free_gb% GB

:: 检查内存使用
echo.
echo 检查内存使用:
echo ----------------------------------------
for /f "skip=1" %%a in ('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory') do (
    set total_mem=%%a
    set free_mem=%%b
    goto mem_done
)
:mem_done
set /a total_mb=%total_mem%/1024
set /a free_mb=%free_mem%/1024
set /a used_mb=%total_mb%-%free_mb%
echo 总内存: %total_mb% MB
echo 已用: %used_mb% MB
echo 可用: %free_mb% MB

:: 检查数据库
echo.
echo 检查数据库:
echo ----------------------------------------
if exist "%APP_DIR%\backend\data\easy.db" (
    for %%A in ("%APP_DIR%\backend\data\easy.db") do set db_size=%%~zA
    set /a db_size_mb=%db_size%/1024/1024
    echo 数据库文件存在
    echo 大小: %db_size_mb% MB
) else (
    echo [警告] 数据库文件不存在
)

echo.
echo [完成] 系统状态检查完成
pause
goto menu

:restart_services
echo.
echo [信息] 重启所有服务...

:: 停止服务
echo [信息] 停止 NGINX...
net stop EasyScheduleNGINX 2>nul

echo [信息] 停止后端服务...
taskkill /f /im node.exe 2>nul
timeout /t 3 /nobreak >nul

:: 启动服务
echo [信息] 启动 NGINX...
net start EasyScheduleNGINX 2>nul

echo [信息] 启动后端服务...
start "EasySchedule Backend" /D "%APP_DIR%\backend" npm start

:: 等待服务启动
echo [信息] 等待服务启动...
timeout /t 10 /nobreak >nul

:: 验证服务
echo [信息] 验证服务状态...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost/health' -TimeoutSec 30; Write-Host '[成功] 服务重启成功' } catch { Write-Host '[错误] 服务重启失败，请检查日志' }"

echo [完成] 服务重启完成
pause
goto menu

:view_logs
echo.
echo [信息] 可用日志文件:
echo 1. 应用日志
echo 2. NGINX 访问日志
echo 3. NGINX 错误日志
echo 4. 部署日志
echo 5. 返回主菜单
echo.
set /p log_choice="请选择 (1-5): "

if "%log_choice%"=="1" (
    echo.
    echo 应用日志 (%LOG_DIR%\*.log):
    if exist "%LOG_DIR%\*.log" (
        type "%LOG_DIR%\*.log" | more
    ) else (
        echo [信息] 应用日志文件不存在
    )
    pause
    goto view_logs
)

if "%log_choice%"=="2" (
    echo.
    echo NGINX 访问日志:
    if exist "%LOG_DIR%\nginx_access.log" (
        type "%LOG_DIR%\nginx_access.log" | more
    ) else (
        echo [信息] NGINX 访问日志文件不存在
    )
    pause
    goto view_logs
)

if "%log_choice%"=="3" (
    echo.
    echo NGINX 错误日志:
    if exist "%LOG_DIR%\nginx_error.log" (
        type "%LOG_DIR%\nginx_error.log" | more
    ) else (
        echo [信息] NGINX 错误日志文件不存在
    )
    pause
    goto view_logs
)

if "%log_choice%"=="4" (
    echo.
    echo 部署日志:
    if exist "%LOG_DIR%\deploy.log" (
        type "%LOG_DIR%\deploy.log" | more
    ) else (
        echo [信息] 部署日志文件不存在
    )
    pause
    goto view_logs
)

if "%log_choice%"=="5" goto menu
echo [错误] 无效选项
goto view_logs

:db_maintenance
echo.
echo [信息] 数据库维护...
echo 请选择数据库维护任务:
echo 1. 数据库完整性检查
echo 2. 数据库优化
echo 3. 重建索引
echo 4. 数据库统计信息
echo 0. 返回主菜单
echo.
set /p db_choice="请输入选项 (0-4): "

if "%db_choice%"=="1" goto db_check
if "%db_choice%"=="2" goto db_optimize
if "%db_choice%"=="3" goto db_reindex
if "%db_choice%"=="4" goto db_stats
if "%db_choice%"=="0" goto menu

echo [错误] 无效选项
goto db_maintenance

:db_check
echo [信息] 执行数据库完整性检查...
cd /d "%APP_DIR%\backend"
npx prisma db pull 2>nul
if %errorlevel% equ 0 (
    echo [成功] 数据库结构完整
) else (
    echo [警告] 数据库可能有问题
)
pause
goto db_maintenance

:db_optimize
echo [信息] 执行数据库优化...
cd /d "%APP_DIR%\backend"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function optimize() {
  try {
    await prisma.$executeRaw'VACUUM';
    console.log('数据库优化完成');
  } catch (error) {
    console.error('优化失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

optimize();
"
pause
goto db_maintenance

:db_reindex
echo [信息] 重建数据库索引...
cd /d "%APP_DIR%\backend"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reindex() {
  try {
    await prisma.$executeRaw'REINDEX';
    console.log('索引重建完成');
  } catch (error) {
    console.error('索引重建失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reindex();
"
pause
goto db_maintenance

:db_stats
echo [信息] 生成数据库统计信息...
cd /d "%APP_DIR%\backend"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function stats() {
  try {
    const scheduleCount = await prisma.schedule.count();
    const participantCount = await prisma.participant.count();
    const timeSlotCount = await prisma.timeSlot.count();
    
    console.log('数据库统计:');
    console.log('时间表数量:', scheduleCount);
    console.log('参与者数量:', participantCount);
    console.log('时间段数量:', timeSlotCount);
  } catch (error) {
    console.error('统计失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

stats();
"
pause
goto db_maintenance

:schedule_tasks
echo.
echo [信息] 计划任务设置...
echo 可用的计划任务:
echo 1. 设置自动备份
echo 2. 设置日志清理
echo 3. 设置数据清理
echo 4. 查看现有任务
echo 0. 返回主菜单
echo.
set /p schedule_choice="请输入选项 (0-4): "

if "%schedule_choice%"=="1" goto schedule_backup
if "%schedule_choice%"=="2" goto schedule_cleanup
if "%schedule_choice%"=="3" goto schedule_data_cleanup
if "%schedule_choice%"=="4" goto view_schedules
if "%schedule_choice%"=="0" goto menu

echo [错误] 无效选项
goto schedule_tasks

:schedule_backup
echo [信息] 设置自动备份任务...
set /p backup_time="请输入备份时间 (格式: HH:MM, 默认02:00): "
if "%backup_time%"=="" set backup_time=02:00

:: 创建备份任务脚本
echo @echo off > "%APP_DIR%\scripts\daily-backup.bat"
echo call "%~dp0maintenance.bat" 1 >> "%APP_DIR%\scripts\daily-backup.bat"

:: 使用 Windows 计划任务
schtasks /create /tn "EasySchedule-Backup" /tr "%APP_DIR%\scripts\daily-backup.bat" /sc daily /st %backup_time% /ru "SYSTEM"
if %errorlevel% equ 0 (
    echo [成功] 自动备份任务已设置，时间: %backup_time%
) else (
    echo [错误] 任务创建失败
)
pause
goto schedule_tasks

:schedule_cleanup
echo [信息] 设置日志清理任务...
set /p cleanup_time="请输入清理时间 (格式: HH:MM, 默认03:00): "
if "%cleanup_time%"=="" set cleanup_time=03:00

:: 创建清理任务脚本
echo @echo off > "%APP_DIR%\scripts\daily-cleanup.bat"
echo call "%~dp0maintenance.bat" 2 >> "%APP_DIR%\scripts\daily-cleanup.bat"

schtasks /create /tn "EasySchedule-Cleanup" /tr "%APP_DIR%\scripts\daily-cleanup.bat" /sc daily /st %cleanup_time% /ru "SYSTEM"
if %errorlevel% equ 0 (
    echo [成功] 日志清理任务已设置，时间: %cleanup_time%
) else (
    echo [错误] 任务创建失败
)
pause
goto schedule_tasks

:schedule_data_cleanup
echo [信息] 设置数据清理任务...
set /p data_cleanup_time="请输入清理时间 (格式: HH:MM, 默认04:00): "
if "%data_cleanup_time%"=="" set data_cleanup_time=04:00

:: 创建数据清理任务脚本
echo @echo off > "%APP_DIR%\scripts\daily-data-cleanup.bat"
echo call "%~dp0maintenance.bat" 3 >> "%APP_DIR%\scripts\daily-data-cleanup.bat"

schtasks /create /tn "EasySchedule-DataCleanup" /tr "%APP_DIR%\scripts\daily-data-cleanup.bat" /sc daily /st %data_cleanup_time% /ru "SYSTEM"
if %errorlevel% equ 0 (
    echo [成功] 数据清理任务已设置，时间: %data_cleanup_time%
) else (
    echo [错误] 任务创建失败
)
pause
goto schedule_tasks

:view_schedules
echo.
echo [信息] 查看现有计划任务:
schtasks /query /fo LIST | findstr "EasySchedule"
pause
goto schedule_tasks

:exit
echo.
echo [信息] 感谢使用 EasySchedule 维护工具
exit /b 0