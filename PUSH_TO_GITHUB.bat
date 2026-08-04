@echo off
title Push MediUnity Code to GitHub
color 0A

echo ===================================================
echo       MEDIUNITY - PUSHING ALL CODE TO GITHUB        
echo ===================================================
echo.

echo [1/3] Adding all files to git...
git add -A

echo.
echo [2/3] Committing changes...
git commit -m "Update MediUnity codebase: multi-portal routing, gateway fixes, and Bangla i18n support setup"

echo.
echo [3/3] Pushing to GitHub (main branch)...
git push -u origin main

echo.
echo ===================================================
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Code successfully pushed to GitHub!
) else (
    echo [NOTE] If authentication or upstream error occurred, please verify your GitHub credentials.
)
echo ===================================================
echo.
pause
