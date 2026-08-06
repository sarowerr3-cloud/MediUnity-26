@echo off
echo ===================================================
echo   Building MediUnity Full Project Report (.docx)
echo ===================================================
echo.
python generate_docx_report.py
if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS: MediUnity_Project_Report.docx created successfully!
    echo Location: %cd%\MediUnity_Project_Report.docx
) else (
    echo.
    echo ERROR: Failed to run python generate_docx_report.py.
    echo Please make sure python and python-docx are installed.
)
echo.
pause
