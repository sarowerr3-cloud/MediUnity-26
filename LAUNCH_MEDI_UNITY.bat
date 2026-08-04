@echo off
cd /d "%~dp0"
set "PATH=%~dp0node-portable;%PATH%"
echo ========================================
echo   Medi-Unity PROJECT - SMART LAUNCHER
echo ========================================
echo.

:: --- BACKEND ---
echo [*] Starting Backend...
start "Medi-Unity BACKEND" cmd /k "cd backend && echo Installing backend packages (legacy-peer-deps)... && npm install --legacy-peer-deps && echo. && echo Starting backend server... && npm run dev"

:: --- FRONTEND (PATIENT) ---
echo [*] Starting Patient Frontend...
start "Medi-Unity PATIENT FRONTEND" cmd /k "cd frontend-patient && echo Installing patient packages (legacy-peer-deps)... && npm install --legacy-peer-deps && echo. && echo Starting patient server... && npm run dev"

:: --- FRONTEND (DOCTOR) ---
echo [*] Starting Doctor Frontend...
start "Medi-Unity DOCTOR FRONTEND" cmd /k "cd frontend-doctor && echo Installing doctor packages (legacy-peer-deps)... && npm install --legacy-peer-deps && echo. && echo Starting doctor server... && npm run dev"

:: --- FRONTEND (PARTNER) ---
echo [*] Starting Partner Frontend...
start "Medi-Unity PARTNER FRONTEND" cmd /k "cd frontend-partner && echo Installing partner packages (legacy-peer-deps)... && npm install --legacy-peer-deps && echo. && echo Starting partner server... && npm run dev"

:: --- ADMIN ---
echo [*] Starting Admin Panel...
start "Medi-Unity ADMIN" cmd /k "cd admin && echo Installing admin packages (legacy-peer-deps)... && npm install --legacy-peer-deps && echo. && echo Starting admin server... && npm run dev"

echo.
echo ========================================
echo ✅ Launching initiated!
echo.
echo Four separate Command Prompt windows have been opened.
echo Watch the windows directly to see the progress.
echo.
echo Patient Portal: http://localhost:5175
echo Doctor Portal:  http://localhost:5176
echo Partner Portal: http://localhost:5177
echo Backend:        http://localhost:4000
echo Admin:          http://localhost:5174 (or 5175 if 5174 is in use)
echo ========================================
pause
