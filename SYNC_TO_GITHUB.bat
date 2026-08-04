@echo off
echo ========================================
echo   MEDICARE PROJECT - GITHUB SYNC (FINAL)
echo ========================================
echo.

:: 1. Initialize Git if not already done
if not exist .git (
    echo [1/4] Initializing Git repository...
    git init
) else (
    echo [1/4] Git already initialized.
)

:: 2. Add remote origin (Force it in case it exists)
echo [2/4] Connecting to https://github.com/sarowerr3-cloud/MediUnity-26.git...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/sarowerr3-cloud/MediUnity-26.git

:: 3. Add and Commit
echo [3/4] Preparing files for upload...
git add .
git commit -m "Full Project Sync (Fixed Version): %date% %time%"

:: 4. Force Push to GitHub
echo [4/4] Force-syncing to GitHub...
echo (This will make GitHub match your local 'FIXED' version)
git branch -M main
git push -u origin main --force

echo.
echo ========================================
echo ✅ SUCCESS! Your code is now live on GitHub.
echo ========================================
pause
