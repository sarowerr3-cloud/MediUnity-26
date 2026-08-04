@echo off
cd /d "%~dp0"
set "PATH=%~dp0node-portable;%PATH%"

echo ======================================== > diagnostic_run.log
echo   DIAGNOSTIC TEST RUN LOG >> diagnostic_run.log
echo ======================================== >> diagnostic_run.log
echo. >> diagnostic_run.log

echo [*] Checking Node version... >> diagnostic_run.log
node -v >> diagnostic_run.log 2>&1

echo [*] Checking NPM version... >> diagnostic_run.log
call npm -v >> diagnostic_run.log 2>&1

echo. >> diagnostic_run.log
echo ======================================== >> diagnostic_run.log
echo   TESTING BACKEND >> diagnostic_run.log
echo ======================================== >> diagnostic_run.log
cd backend
echo [*] Testing backend startup... >> ..\diagnostic_run.log
call npm install --legacy-peer-deps >> ..\diagnostic_run.log 2>&1
:: Run dev in the foreground but direct it to a log. Since we want to capture immediate crashes, we can run it.
:: If it starts successfully, the user can press Ctrl+C after 5 seconds to stop it, or it will exit on error.
echo [!] STARTING BACKEND. IF IT DOES NOT CRASH IN 5 SECONDS, PRESS CTRL+C TO CONTINUE.
call npm run dev > ..\backend_test_output.txt 2>&1
cd ..

echo. >> diagnostic_run.log
echo ======================================== >> diagnostic_run.log
echo   TESTING FRONTEND >> diagnostic_run.log
echo ======================================== >> diagnostic_run.log
cd frontend
echo [*] Testing frontend startup... >> ..\diagnostic_run.log
call npm install --legacy-peer-deps >> ..\diagnostic_run.log 2>&1
echo [!] STARTING FRONTEND. IF IT DOES NOT CRASH IN 5 SECONDS, PRESS CTRL+C TO CONTINUE.
call npm run dev > ..\frontend_test_output.txt 2>&1
cd ..

echo. >> diagnostic_run.log
echo ======================================== >> diagnostic_run.log
echo   TESTING ADMIN >> diagnostic_run.log
echo ======================================== >> diagnostic_run.log
cd admin
echo [*] Testing admin startup... >> ..\diagnostic_run.log
call npm install --legacy-peer-deps >> ..\diagnostic_run.log 2>&1
echo [!] STARTING ADMIN. IF IT DOES NOT CRASH IN 5 SECONDS, PRESS CTRL+C TO CONTINUE.
call npm run dev > ..\admin_test_output.txt 2>&1
cd ..

echo. >> diagnostic_run.log
echo ======================================== >> diagnostic_run.log
echo   DIAGNOSTIC TEST RUN COMPLETED >> diagnostic_run.log
echo ======================================== >> diagnostic_run.log
echo.
echo All diagnostics written to diagnostic_run.log, backend_test_output.txt, frontend_test_output.txt, and admin_test_output.txt.
pause
