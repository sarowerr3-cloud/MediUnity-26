import os
import sys
import shutil

# Try importing docx first
try:
    import docx
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

if HAS_DOCX:
    print("Executing python-docx builder...")
    import generate_docx_report
    generate_docx_report.create_report()
else:
    print("python-docx is not pre-installed on system python.")
    print("Please install python-docx using: pip install python-docx pillow")
    print("Or double-click BUILD_DOCX_REPORT.bat to auto-install and build MediUnity_Project_Report.docx!")
