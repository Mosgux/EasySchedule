@echo off
setlocal

set "profile=%~1"
if "%profile%"=="" set "profile=dev"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0manage_easyschedule.ps1" -Action start -Profile "%profile%"
set "exit_code=%errorlevel%"

if not "%exit_code%"=="0" (
    echo.
    echo Start failed.
)

pause
exit /b %exit_code%