@echo off
cd /d "%~dp0"
set "PATH=%~dp0node-portable;%PATH%"

echo ========================================
echo   DIAGNOSTIC SCRIPT
echo ========================================
echo.
echo Checking Node version...
node -v > diagnostic_log.txt 2>&1

echo Checking NPM version...
call npm -v >> diagnostic_log.txt 2>&1

echo.
echo Going to backend folder and testing npm install...
cd backend
call npm install >> ..\diagnostic_log.txt 2>&1

echo.
echo Testing backend startup (waiting 5 seconds)...
start /b cmd /c "npm run dev >> ..\diagnostic_log.txt 2>&1"
timeout /t 5

echo.
echo DIAGNOSTIC COMPLETE.
echo Please do NOT close this window. Check the diagnostic_log.txt file in the main folder.
pause
