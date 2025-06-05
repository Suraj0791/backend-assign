@echo off
setlocal enabledelayedexpansion

:: Create a temp file for output
set "temp_file=%TEMP%\redis_output.txt"

:check_redis
cls
echo Checking Redis server status...
redis-cli ping > nul 2>&1
if !ERRORLEVEL! NEQ 0 (
    echo [91mRedis server is not running![0m
    echo Starting Redis server...
    start "" "C:\Program Files\Redis\redis-server.exe"
    timeout /t 3 >nul
    redis-cli ping > nul 2>&1
    if !ERRORLEVEL! NEQ 0 (
        echo [91mFailed to start Redis server![0m
        echo Please make sure Redis is installed correctly.
        echo Press any key to exit...
        pause >nul
        exit
    ) else (
        echo [92mRedis server started successfully![0m
        timeout /t 2 >nul
    )
)

:menu
cls
echo [93mRedis CLI Helper[0m
echo [92mRedis Status: Connected[0m
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
set /p choice=Enter command number (1-9): 

if "%choice%"=="1" (
    cls
    echo Testing connection...
    echo.
    redis-cli ping > "%temp_file%" 2>&1
    type "%temp_file%"
    if !ERRORLEVEL! NEQ 0 (
        echo [91mFailed to connect to Redis.[0m
    ) else (
        echo [92mSuccessfully connected to Redis![0m
    )
    echo.
    pause
    goto menu
)

if "%choice%"=="2" (
    cls
    echo Checking for keys in Redis...
    echo.
    redis-cli keys * > "%temp_file%" 2>&1
    
    :: Check if there are any keys
    for %%I in ("%temp_file%") do if %%~zI == 0 (
        echo [93mNo keys found in Redis database.[0m
        echo This means either:
        echo 1. The database is empty
        echo 2. No data has been cached yet
        echo.
        echo Try these steps:
        echo 1. Make some API requests to cache data
        echo 2. Use option 4 to manually add a test key
        echo 3. Check if Redis is working with option 1
    ) else (
        echo [92mFound keys:[0m
        type "%temp_file%"
    )
    echo.
    echo Press any key to return to menu...
    pause >nul
    goto menu
)

if "%choice%"=="3" (
    cls
    set /p key=Enter key name: 
    echo.
    echo Getting value for key: !key!
    echo.
    redis-cli get "!key!" > "%temp_file%" 2>&1
    
    :: Check if value exists
    for %%I in ("%temp_file%") do if %%~zI == 0 (
        echo [93mNo value found for key: !key![0m
    ) else (
        echo [92mValue found:[0m
        type "%temp_file%"
    )
    echo.
    pause
    goto menu
)

if "%choice%"=="4" (
    cls
    set /p key=Enter key name: 
    set /p value=Enter value: 
    echo.
    redis-cli set "!key!" "!value!" > "%temp_file%" 2>&1
    if !ERRORLEVEL! == 0 (
        echo [92mSuccessfully set key: !key![0m
    ) else (
        echo [91mFailed to set key![0m
        type "%temp_file%"
    )
    echo.
    pause
    goto menu
)

if "%choice%"=="5" (
    cls
    set /p key=Enter key name: 
    echo.
    echo Deleting key: !key!
    redis-cli del "!key!" > "%temp_file%" 2>&1
    if !ERRORLEVEL! == 0 (
        echo [92mSuccessfully deleted key: !key![0m
    ) else (
        echo [91mFailed to delete key![0m
        type "%temp_file%"
    )
    echo.
    pause
    goto menu
)

if "%choice%"=="6" (
    cls
    echo [91mWARNING: This will clear all data in Redis![0m
    echo Are you sure you want to continue?
    set /p confirm=Type 'yes' to confirm: 
    if "!confirm!"=="yes" (
        echo.
        redis-cli flushall > "%temp_file%" 2>&1
        if !ERRORLEVEL! == 0 (
            echo [92mSuccessfully cleared all data![0m
        ) else (
            echo [91mFailed to clear data![0m
            type "%temp_file%"
        )
    ) else (
        echo Operation cancelled.
    )
    echo.
    pause
    goto menu
)

if "%choice%"=="7" (
    cls
    echo [93mRedis Monitor Mode[0m
    echo Press Ctrl+C to stop monitoring
    echo.
    redis-cli monitor
    echo.
    pause
    goto menu
)

if "%choice%"=="8" (
    cls
    echo [93mRedis Memory Information:[0m
    echo.
    redis-cli info memory > "%temp_file%" 2>&1
    type "%temp_file%"
    echo.
    pause
    goto menu
)

if "%choice%"=="9" (
    del "%temp_file%" 2>nul
    exit
)

goto menu