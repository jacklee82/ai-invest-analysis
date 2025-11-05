# FastAPI 서버 시작 스크립트
Write-Host "Starting FastAPI server..." -ForegroundColor Green

# 가상환경 활성화
& .\.venv\Scripts\Activate.ps1

# uvicorn 실행
python -m uvicorn main:app --reload --port 8000



