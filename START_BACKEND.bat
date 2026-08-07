@echo off
cd /d "%~dp0"
set "PATH=%~dp0node-portable;%PATH%"
echo ========================================
echo   Starting MediUnity Backend API Server
echo ========================================
echo.
cd backend
echo Starting backend server on http://localhost:4000 ...
npm run dev
pause
