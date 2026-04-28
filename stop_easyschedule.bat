@echo off
setlocal

set "profile=%~1"
if "%profile%"=="" set "profile=dev"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0manage_easyschedule.ps1" -Action stop -Profile "%profile%"
set "exit_code=%errorlevel%"

if not "%exit_code%"=="0" (
    echo.
    echo Stop failed.
)

exit /b %exit_code%