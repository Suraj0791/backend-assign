@echo off
echo Starting Redis Server...

:: Check if Redis is already running
tasklist /FI "IMAGENAME eq redis-server.exe" 2>NUL | find /I /N "redis-server.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Redis is already running.
    pause
    exit
)

:: Try to start Redis
cd "C:\Program Files\Redis"
start "" redis-server.exe redis.windows.conf
echo Redis server started with configuration file.
echo You can now use redis-cli.bat to interact with Redis.
timeout /t 2 >nul

:: Test connection
redis-cli ping
if "%ERRORLEVEL%"=="0" (
    echo Redis is running and responding to commands.
) else (
    echo Failed to connect to Redis. Please check if it's installed correctly.
)

pause 