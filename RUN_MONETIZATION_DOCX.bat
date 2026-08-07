@echo off
echo =========================================================================
echo   Generating MediUnity Monetization Strategy and Revenue Model (.docx)
echo =========================================================================
echo.
python make_monetization_docx.py
echo.
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: MediUnity_Monetization_and_Revenue_Model.docx has been created!
    echo Location: %USERPROFILE%\Downloads\MediUnity_Monetization_and_Revenue_Model.docx
) else (
    echo ERROR: Python execution failed. Please ensure python and python-docx are installed.
)
echo.
pause
