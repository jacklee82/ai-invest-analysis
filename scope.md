# AI 기반 콘텐츠 투자 분석 시스템 – Scope v0.4

## 1. 배경 요약
투자/유통 데이터가 SODA, JEMSTONE, KMS 등에 분산되어 수작업으로 처리되고 있음. 월별 데이터 정리와 매칭 작업 자동화 및 투자 성과·리스크·차트 인사이트를 한 곳에서 확인할 수 있는 경영 지원 시스템 구축.

## 2. 시스템 목표
1. 데이터 통합/정합성: 분산 데이터를 월 단위 마스터로 적재, A2A 검증 자동화
2. 경영진 의사결정 지원: 대시보드에서 투자 현황, 회수율, 리스크 건수 실시간 제공
3. 투자심사 지원: FastAPI 예측 모델과 DCF/BEP 계산으로 구보 투자 의사결정 정량화
4. 리스크 조기 경보: 계약 기간/회수율 규칙 기반 경고 프로젝트 탐지 및 시각화
5. 심층 분석: 차트 성과, 기획사 ROI, 코호트·분포 분석으로 전략 방향성 도출

## 3. 사용자 및 우선순위
1. **경영진(P1)**: 요약 KPI, 리스크 현황, 사업별 성과 비교
2. **사업관리/운영(P2)**: 리스크 모니터링, 업로드/검증, 심층 분석
3. **투자심사역(P3)**: 구보 시뮬레이션, 투자 대비 회수율 분석, 계약 만기 관리

## 4. 데이터 자산
- 원천 데이터: `db/` 디렉터리 (플랫폼 차트분석, 유통 데이터, 가온차트 등)
- **A파일**: 프로젝트 요약(투자금, 계약 기간, 회수금, BM 구분) → `project` 테이블
- **B파일**: 일/곡 단위 로우 데이터 → 월별 집계(`cashflow_monthly` 테이블)
- 업로드 방식: 월 1회 마스터 덮어쓰기 (TRUNCATE 후 전체 재적재)

## 5. 데이터베이스 스키마

### 테이블 구조
- **`project`**: 프로젝트 마스터 (A파일)
  - PK: `project_id`, `project_name` (UNIQUE)
  - 주요 필드: `company_name`, `contract_start_date`, `base_contract_months`, `extended_months`
  - 투자금: `initial_investment`, `additional_investment`
  - 회수금: `total_recouped`
  - BM 구분: `business_type` (선급투자, 일반투자, OST, 음반)

- **`cashflow_monthly`**: 월별 현금흐름 (B파일 집계)
  - PK: `id`, FK: `project_id`
  - 필드: `yyyymm`, `revenue_amount`, `cost_amount`, `recoup_amount`
  - 인덱스: `(project_id, yyyyymm)` 복합 인덱스

- **`risk_flag`**: 리스크 평가 스냅샷
  - PK: `evaluated_id`, FK: `project_id`
  - 필드: `is_warning`, `reason`, `recoup_ratio`, `elapsed_ratio`
  - 경고 조건: `elapsed_ratio > 0.5` AND `recoup_ratio < 0.5`

- **`chart_entry`**: 차트 진입 정보 (주 단위)
  - PK: `chart_entry_id`, FK: `project_id`
  - 필드: `chart_rank` (1~100), `week_date`, `chart_type`

- **`upload_job`**: 업로드 이력 (감사 로그)
  - PK: `job_id`
  - 필드: `source` (A/B), `file_name`, `file_hash`, `status`, `rows_parsed`, `rows_loaded`

### 테이블 관계
```
project (1) ────< (N) cashflow_monthly
  ├───< (N) risk_flag
  └───< (N) chart_entry
```

### 머티리얼라이즈 뷰
- `mv_business_kpis`: 사업별 KPI 집계 (월별, 사업타입별 매출/이익/이익률)
- `mv_risk_counts`: 월별 리스크 건수
- `mv_company_agg`: 기획사별 집계 (투자금, 회수금, ROI)

## 6. 아키텍처
- **모노레포**: Turborepo / Bun
  - `apps/web`: Next.js 16, tRPC v11, Tailwind, React Query
  - `packages/api`: tRPC 라우터 (dashboard, risk, analysis, simulation, upload, project)
  - `packages/db`: Drizzle ORM (PostgreSQL)
  - `apps/ai-backend`: FastAPI 예측 서비스 (ARIMA/Prophet/Naive)
- **통신**: Web ↔ FastAPI는 REST (`POST /forecast`)
- **클라이언트**: tRPC `createTRPCOptionsProxy` + `queryOptions()` → TanStack React Query

## 7. 기능 스코프

### Module 1 – 통합 대시보드 (경영진)
- KPI 3종(누적 투자금, 누적 회수율, 리스크 건수) + YoY
- 사업타입별 매출/이익/이익률 비교
- 월별 추세, 투자→회수 워터폴, Top 기획사 스캐터

### Module 2 – 선급투자 시뮬레이터 (투자심사)
- 최근 12개월 CF 입력 → FastAPI 예측 → worst/best 시나리오 (±10%)
- WACC 적용 DCF, BEP 산출
- 출력: DCF 3종, BEP, 모델 메타(RMSE/MAPE)

### Module 3 – 리스크 관리 (사업관리)
- 경고 분류: 경과개월 > 계약기간 50% & 회수율 < 50%
- 리스크 목록 테이블, 최근 3개월 회수액 스파크라인
- 상세 팝업, 만기 히트맵

### Module 4 – 심층 분석 (사업관리)
- 차트인 가치 분석(회귀 + Top10 파레토)
- 기획사 ROI 비교, 코호트 히트맵
- ROI/회수기간 분포 상자그림

### Module 5 – 업로드 & 검증 (운영)
- Drag & Drop 업로드 → 검증(A2A) → 적재
- 실패 시 롤백, `upload_job` 이력 저장
- A/B 교차 매칭 리포트

## 8. 데이터 파이프라인
- **로드 순서**: 업로드 → 임시 테이블 → 검증 → 본 테이블 교체 → 머티리얼라이즈 뷰 재생성
- **검증**: 필수 컬럼, 값 제약(금액 ≥ 0, 날짜 ISO8601, ENUM 일치), A/B 교차 매칭
- **대용량 처리**: 스트리밍 파서, 청크 검증

## 9. 기술 스택
- TypeScript strict, Drizzle ORM + PostgreSQL
- FastAPI + uv, Prophet/ARIMA/Naive 모델
- 테스트: 단위/통합/예측 API 성능
- 문서화: JSDoc, tRPC 스키마, ADR

## 10. 마일스톤 (6 스프린트)
1. M1: 스캐폴딩 & 인프라
2. M2: 대시보드 MVP
3. M3: 리스크 MVP
4. M4: 업로드 & 검증
5. M5: 시뮬레이터 연동
6. M6: 심층 분석 & 배포 준비

## 11. 품질·성능 기준
- 대시보드 p95 < 500ms (캐시 기준)
- 예측 API p95 < 2s, 실패율 < 0.5%
- 업로드 10만 행 ≤ 5분, 실패 시 롤백
- PostgreSQL 최소권한, 환경 변수 시크릿 관리

## 12. 주요 리스크 및 대응
- 데이터 표준화 미흡 → 교차 매칭 리포트
- 예측 정확도 편차 → 모델 폴백(Prophet → ARIMA → Naive)
- 조직 채택 저조 → 기존 양식과 동일한 리포트, 교육/챔피언 지정
- 대용량 업로드 병목 → 스트리밍 파서, 청크 검증
- 시스템 의존성 → FastAPI 다운 시 폴백 모드

---
**문서 버전**: v0.4  
**연관 문서**: `summary.md`, `.cursorrules`, `단계별세부계획.md`, `ddd.md`
