@echo off
setlocal enabledelayedexpansion

:: Redis Cloud connection details
set REDIS_HOST=redis-13592.c98.us-east-1-4.ec2.redns.redis-cloud.com
set REDIS_PORT=13592

echo [93mRedis CLI Helper[0m
echo.
echo 1. Test Connection
echo 2. List All Keys
echo 3. Get Value
echo 4. Set Value
echo 5. Delete Key
echo 6. Clear All Data
echo 7. Monitor Keys
echo 8. Check Memory Usage
echo 9. Exit
echo.

:menu
set /p choice=Enter command number (1-9): 

if "%choice%"=="1" (
    for /f "delims=" %%a in ('redis-cli -h %REDIS_HOST% -p %REDIS_PORT% PING') do (
        echo %%a
    )
    pause
    goto menu
)

if "%choice%"=="2" (
    redis-cli -h %REDIS_HOST% -p %REDIS_PORT% KEYS "*"
    goto menu
)

if "%choice%"=="3" (
    set /p key=Enter key: 
    redis-cli -h %REDIS_HOST% -p %REDIS_PORT% GET "%key%"
    goto menu
)

if "%choice%"=="4" (
    set /p key=Enter key: 
    set /p value=Enter value: 
    redis-cli -h %REDIS_HOST% -p %REDIS_PORT% SET "%key%" "%value%"
    goto menu
)

if "%choice%"=="5" (
    set /p key=Enter key to delete: 
    redis-cli -h %REDIS_HOST% -p %REDIS_PORT% DEL "%key%"
    goto menu
)

if "%choice%"=="6" (
    redis-cli -h %REDIS_HOST% -p %REDIS_PORT% FLUSHALL
    echo All data cleared
    goto menu
)

if "%choice%"=="7" (
    redis-cli -h %REDIS_HOST% -p %REDIS_PORT% MONITOR
    goto menu
)

if "%choice%"=="8" (
    redis-cli -h %REDIS_HOST% -p %REDIS_PORT% INFO memory
    goto menu
)

if "%choice%"=="9" (
    exit /b 0
)

echo Invalid choice
goto menu