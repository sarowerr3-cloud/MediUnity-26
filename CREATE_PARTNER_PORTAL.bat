@echo off
echo ========================================
echo   Creating Partner Portal Workspace
echo ========================================
echo.
echo Duplicating 'frontend-patient' to 'frontend-partner' (skipping node_modules)...
powershell -Command "New-Item -ItemType Directory -Path 'frontend-partner' -Force; Get-ChildItem -Path 'frontend-patient' | Where-Object { $_.Name -ne 'node_modules' -and $_.Name -ne 'dist' -and $_.Name -ne '.git' } | Copy-Item -Destination 'frontend-partner' -Recurse -Force"
echo.
echo Installing dependencies for frontend-partner (this may take a minute)...
cd frontend-partner
call npm install --legacy-peer-deps
cd ..
echo.
echo ========================================
echo ✅ Done! The 'frontend-partner' workspace is ready.
echo ========================================
pause
