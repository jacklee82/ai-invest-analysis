@echo off
echo Starting FastAPI server...
call .venv\Scripts\activate.bat
python -m uvicorn main:app --reload --port 8000

