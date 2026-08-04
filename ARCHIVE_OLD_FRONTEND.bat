@echo off
echo ========================================
echo   Archiving and Cleaning Legacy Frontend
echo ========================================
echo.
echo Zipping the old 'frontend' folder to 'frontend_backup.zip'...
powershell -Command "Compress-Archive -Path 'frontend' -DestinationPath 'frontend_backup.zip' -Force"
echo.
echo Deleting the old 'frontend' folder...
rmdir /s /q "frontend"
echo.
echo ========================================
echo ✅ Done! The legacy folder has been safely backed up and removed.
echo ========================================
pause
