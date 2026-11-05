@echo off
echo ========================================================
echo   Way Mithra (Way ಮಿತ್ರ) - Bengaluru Transit System
echo   Identity-Safe Interior Camera ^& Multilingual Companion
echo ========================================================
echo.
echo Starting FastAPI Backend + Frontend at http://localhost:8000 ...
echo.
cd /d "%~dp0"
set PYTHONPATH=.
start "" "http://localhost:8000"
backend\venv\Scripts\uvicorn.exe backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause
