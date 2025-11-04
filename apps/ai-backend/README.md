# AI 백엔드 (FastAPI)

시계열 예측 모델을 제공하는 Python FastAPI 서비스입니다.

## 설치

### uv 사용 (권장)

```bash
# uv 설치 (아직 설치되지 않은 경우)
pip install uv

# 프로젝트 디렉토리로 이동
cd apps/ai-backend

# 가상환경 생성 및 패키지 설치
uv venv
uv pip install -r requirements.txt
```

### pip 사용

```bash
cd apps/ai-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 실행

### Windows PowerShell

```powershell
# 방법 1: 스크립트 사용
.\start.ps1

# 방법 2: 직접 실행
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --port 8000

# 방법 3: 가상환경의 Python 직접 사용
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

### Windows CMD

```cmd
# 방법 1: 배치 파일 사용
start.bat

# 방법 2: 직접 실행
.venv\Scripts\activate.bat
python -m uvicorn main:app --reload --port 8000
```

### Linux/macOS

```bash
# 가상환경 활성화
source .venv/bin/activate

# 서버 실행
uvicorn main:app --reload --port 8000

# 또는 Python으로 직접 실행
python main.py
```

서비스가 실행되면 다음 URL에서 접근할 수 있습니다:
- API: http://localhost:8000
- 문서: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 엔드포인트

### POST /forecast

시계열 예측을 수행합니다.

**요청:**
```json
{
  "series": [1000, 950, 900, 850, 800, 750, 700, 650, 600, 550, 500, 450],
  "months": 12,
  "model": "auto"
}
```

**응답:**
```json
{
  "moderate": [450, 440, 430, ...],
  "meta": {
    "model": "arima",
    "rmse": 15.5,
    "mape": 8.0
  }
}
```

## 모델

- **auto**: 데이터 특성에 따라 자동으로 최적 모델 선택
- **arima**: ARIMA 시계열 모델
- **prophet**: Facebook Prophet 모델
- **naive**: 평균 기반 단순 모델

## 환경 변수

현재는 환경 변수가 필요하지 않습니다. 향후 확장 시 추가될 수 있습니다.

