@echo off
echo Starting WayMithra in Dev Mode (Vite on :5173 + FastAPI on :8000)...
start cmd /k "set PYTHONPATH=. && backend\venv\Scripts\uvicorn.exe backend.app.main:app --port 8000 --reload"
timeout /t 2 /nobreak >nul
start cmd /k "cd frontend && npm.cmd run dev"
start "" "http://localhost:5173"
