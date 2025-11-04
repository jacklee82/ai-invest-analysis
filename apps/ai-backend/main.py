"""
FastAPI 예측 서비스
시계열 예측 모델 (ARIMA, Prophet, Naive)을 제공하는 AI 백엔드
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

from models.forecast import ForecastModel

app = FastAPI(
	title="AI 투자 분석 예측 서비스",
	description="시계열 예측 모델을 제공하는 FastAPI 서비스",
	version="0.1.0",
)

# CORS 설정
app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:3001", "http://localhost:3000"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


class ForecastRequest(BaseModel):
	"""예측 요청 모델"""
	series: List[float] = Field(..., min_length=12, max_length=12, description="최근 12개월 월별 수익 데이터")
	months: int = Field(..., ge=1, le=36, description="예측할 개월 수 (1~36)")
	model: Literal["auto", "arima", "prophet", "naive"] = Field(default="auto", description="예측 모델 선택")


class ForecastMeta(BaseModel):
	"""예측 메타 정보"""
	model: str = Field(..., description="사용된 모델명")
	rmse: float = Field(..., description="RMSE (Root Mean Squared Error)")
	mape: float = Field(..., description="MAPE (Mean Absolute Percentage Error)")


class ForecastResponse(BaseModel):
	"""예측 응답 모델"""
	moderate: List[float] = Field(..., description="Moderate 시나리오 예측값")
	meta: ForecastMeta = Field(..., description="예측 메타 정보")


@app.get("/")
async def root():
	"""헬스 체크"""
	return {"message": "AI 투자 분석 예측 서비스", "status": "ok"}


@app.get("/health")
async def health():
	"""헬스 체크 엔드포인트"""
	return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/forecast", response_model=ForecastResponse)
async def forecast(request: ForecastRequest):
	"""
	시계열 예측 엔드포인트
	
	입력:
	- series: 최근 12개월 월별 수익 데이터
	- months: 예측할 개월 수 (1~36)
	- model: 예측 모델 (auto/arima/prophet/naive)
	
	출력:
	- moderate: 예측된 월별 현금흐름
	- meta: 모델 정보 및 성능 지표
	"""
	try:
		# 입력 검증
		if len(request.series) != 12:
			raise HTTPException(
				status_code=400,
				detail="series는 정확히 12개의 값이 필요합니다.",
			)
		
		if any(x < 0 for x in request.series):
			raise HTTPException(
				status_code=400,
				detail="series의 모든 값은 0 이상이어야 합니다.",
			)
		
		# 예측 모델 인스턴스 생성
		forecast_model = ForecastModel()
		
		# 예측 실행
		result = forecast_model.predict(
			series=request.series,
			months=request.months,
			model_type=request.model,
		)
		
		return ForecastResponse(
			moderate=result["forecast"],
			meta=ForecastMeta(
				model=result["model"],
				rmse=result["rmse"],
				mape=result["mape"],
			),
		)
	except ValueError as e:
		raise HTTPException(status_code=400, detail=str(e))
	except Exception as e:
		raise HTTPException(
			status_code=500,
			detail=f"예측 중 오류가 발생했습니다: {str(e)}",
		)


if __name__ == "__main__":
	import uvicorn
	uvicorn.run(app, host="0.0.0.0", port=8000)

