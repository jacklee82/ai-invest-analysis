# AI 기반 콘텐츠 투자 분석 시스템 – Scope v0.3

## 1. 배경 요약
- `ddd.md` 회의록에 따르면 투자/유통 데이터는 SODA, JEMSTONE, KMS 등 복수 시스템에 분산되어 있으며, 월별 데이터 정리와 매칭이 수작업으로 진행되고 있음.
- 운영팀은 투자 유형(투자응원 vs 일반응원), 권리사, 장르 분류 등 도메인 라벨을 직접 생성해 왔고, 대량 엑셀 가공(수백만 행)과 검증에 높은 비용이 소요됨.
- 목표는 수기 작업을 줄이고, 투자 성과·리스크·차트 인사이트를 한 곳에서 확인할 수 있는 경영 지원 시스템을 구축하는 것.

## 2. 시스템 목표
1. **데이터 통합/정합성 확보**: 분산된 원천 데이터를 월 단위 마스터로 적재하고, 도메인 검증(A2A)과 히스토리 추적을 자동화한다.
2. **경영진 의사결정 지원**: 대시보드에서 투자 누적 현황, 회수율, 리스크 건수 등을 실시간에 가깝게 제공한다.
3. **투자심사 지원**: FastAPI 기반 예측 모델과 DCF/BEP 계산으로 구보 투자 의사결정을 정량화한다.
4. **리스크 조기 경보**: 계약 기간/회수율 규칙에 따라 경고 프로젝트를 탐지하고 추세를 시각화한다.
5. **심층 분석 고도화**: 차트 성과, 기획사 ROI, 코호트·분포 분석 등을 통해 전략 방향성과 영업 타깃을 도출한다.

## 3. 사용자 및 우선순위
1. **경영진(P1)**: 요약 KPI, 리스크 현황, 사업별 성과 비교.
2. **사업관리/운영(P2)**: 리스크 모니터링, 업로드/검증, 심층 분석.
3. **투자심사역(P3)**: 구보 시뮬레이션, 투자 대비 회수율 분석, 계약 만기 관리.

## 4. 데이터 자산 및 현실 DB

### 4.1 원천 데이터 파일
실제 데이터는 `db/` 디렉터리에 텍스트 형태로 존재하며, 주요 파일은 다음과 같다:
- `플랫폼 차트분석_21~24년.txt`: 연도별 플랫폼 차트 성과 (16MB×4)
- `주요 요통사별 권리사 현황_연매출 1억 이상.txt`: 권리사별 매출 요약 (31KB, 304 lines)
- `유통 목록.txt`: 유통 채널 목록 (69KB, 525 lines)
- `유통 로데이터 (22.1-25.7).txt`: 유통 채널별 세부 실적 (51MB)
- `가온차트_월별 음반 판매 리스트.txt`: 월별 음반 판매 데이터 (403KB, 4004 lines)
- `가온차트 top 200 월간차트 현황.txt`: 월간 차트 Top 200 (110KB, 761 lines)

### 4.2 A/B 업로드 파일 정책
- **A파일**: 프로젝트 요약(투자금, 계약 기간, 회수금, BM 구분 등) → `project` 테이블
- **B파일**: 일/곡 단위 로우 데이터 → 월별 집계(`cashflow_monthly` 테이블)
- **업로드 방식**: 월 1회 **마스터 덮어쓰기** 방식 (TRUNCATE 후 전체 재적재)
- **감사 추적**: 업로드 전 트랜잭션 스냅샷 및 파일 해시 기록 (`upload_job` 테이블)

## 5. 데이터베이스 스키마 설계

### 5.1 테이블 구조 (PostgreSQL)

#### 5.1.1 `project` (프로젝트/투자 마스터)
**용도**: A파일의 프로젝트별 투자 마스터 정보 저장

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| `project_id` | VARCHAR(255) | PK | 프로젝트 ID (UUID) |
| `project_name` | VARCHAR(255) | NOT NULL, UNIQUE | 프로젝트명 (데이터 키, 고유) |
| `company_name` | VARCHAR(255) | NOT NULL | 기획사명 |
| `contract_start_date` | VARCHAR(10) | NOT NULL | 계약 시작일 (YYYY-MM-DD) |
| `base_contract_months` | INTEGER | NOT NULL | 기본 계약 기간 (개월) |
| `extended_months` | INTEGER | NOT NULL, DEFAULT 0 | 연장 기간 (개월) |
| `initial_investment` | INTEGER | NOT NULL | 최초 투자금 (원 단위) |
| `additional_investment` | INTEGER | NOT NULL, DEFAULT 0 | 추가 투자금 (원 단위) |
| `total_recouped` | INTEGER | NOT NULL, DEFAULT 0 | 총 회수금 (원 단위) |
| `md_purchase_cost` | INTEGER | NULL | 음반 매입원가 (음반 사업만) |
| `ost_investment` | INTEGER | NULL | OST 투자금 (OST 사업만) |
| `business_type` | VARCHAR(50) | NOT NULL | BM 구분 (ENUM: 선급투자, 일반투자, OST, 음반) |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 최종 업데이트 일시 |

**계산 필드 (가상)**:
- `총_계약_기간` = `base_contract_months` + `extended_months`
- `총_투자금` = `initial_investment` + `additional_investment`
- `회수율` = `total_recouped` / `총_투자금`

#### 5.1.2 `cashflow_monthly` (월별 현금흐름/정산 집계)
**용도**: B파일의 일별 데이터를 월별로 집계하여 저장

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| `id` | VARCHAR(255) | PK | 레코드 ID (UUID) |
| `project_id` | VARCHAR(255) | NOT NULL, FK → `project.project_id` | 프로젝트 ID (CASCADE DELETE) |
| `yyyymm` | VARCHAR(7) | NOT NULL | 년월 (YYYY-MM) |
| `revenue_amount` | INTEGER | NOT NULL, DEFAULT 0 | 매출액 (원 단위) |
| `cost_amount` | INTEGER | NOT NULL, DEFAULT 0 | 원가(지급금) (원 단위) |
| `recoup_amount` | INTEGER | NOT NULL, DEFAULT 0 | 회수금 (원 단위) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 생성 일시 |

**인덱스 권장**:
- 복합 인덱스: `(project_id, yyyyymm)` - 월별 조회 최적화
- 유니크 제약: `(project_id, yyyyymm)` - 중복 방지

**집계 로직**:
- B파일의 일별 데이터를 `yyyymm = substr(일자, 1, 7)` 기준으로 집계
- `revenue_amount` = SUM(일별 매출), `cost_amount` = SUM(일별 원가), `recoup_amount` = SUM(일별 회수금)

#### 5.1.3 `risk_flag` (리스크 평가 스냅샷)
**용도**: 프로젝트별 리스크 상태를 시점별로 기록 (경고 탐지 결과)

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| `evaluated_id` | VARCHAR(255) | PK | 평가 ID (UUID) |
| `project_id` | VARCHAR(255) | NOT NULL, FK → `project.project_id` | 프로젝트 ID (CASCADE DELETE) |
| `evaluated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 평가 일시 |
| `is_warning` | BOOLEAN | NOT NULL, DEFAULT false | 경고 상태 여부 |
| `reason` | VARCHAR(500) | NULL | 경고 사유 |
| `recoup_ratio` | DOUBLE PRECISION | NOT NULL, DEFAULT 0 | 회수율 (총회수금 / 총투자금) |
| `elapsed_ratio` | DOUBLE PRECISION | NOT NULL, DEFAULT 0 | 경과 비율 (경과 기간 / 총 계약 기간) |

**경고 분류 로직**:
- `is_warning = true` 조건: `elapsed_ratio > 0.5` AND `recoup_ratio < 0.5`
- 즉, 계약 기간의 50% 이상 경과했으면서 회수율이 50% 미만인 경우

#### 5.1.4 `chart_entry` (차트 진입 정보)
**용도**: 차트 100위권 내 진입 기록을 주 단위로 저장

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| `chart_entry_id` | VARCHAR(255) | PK | 차트 진입 ID (UUID) |
| `project_id` | VARCHAR(255) | NOT NULL, FK → `project.project_id` | 프로젝트 ID (CASCADE DELETE) |
| `chart_rank` | INTEGER | NOT NULL | 차트 순위 (1~100) |
| `week_date` | DATE | NOT NULL | 해당 주의 시작일 (월요일, YYYY-MM-DD) |
| `chart_type` | VARCHAR(50) | NOT NULL, DEFAULT '가요' | 차트 타입 (가요, OST, 인디 등) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 생성 일시 |

**차트인 수익 계산**:
- 차트 100위권 내 체류 기간 동안 발생한 모든 수익을 합산
- `chart_rank <= 100` AND `week_date` 범위 내의 `cashflow_monthly.revenue_amount` 합계

#### 5.1.5 `upload_job` (업로드/ETL 이력)
**용도**: 파일 업로드 및 처리 과정을 추적 (감사 로그)

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| `job_id` | VARCHAR(255) | PK | 작업 ID (UUID) |
| `source` | VARCHAR(1) | NOT NULL | 업로드 소스 (A/B) |
| `file_name` | VARCHAR(255) | NOT NULL | 파일명 |
| `file_hash` | VARCHAR(64) | NOT NULL | 파일 해시 (SHA-256) |
| `rows_parsed` | INTEGER | NOT NULL, DEFAULT 0 | 파싱된 행 수 |
| `rows_loaded` | INTEGER | NOT NULL, DEFAULT 0 | 적재된 행 수 |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | 작업 상태 (pending, processing, success, failed) |
| `started_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | 시작 일시 |
| `ended_at` | TIMESTAMP | NULL | 종료 일시 |
| `error_message` | VARCHAR(1000) | NULL | 에러 메시지 |

**상태 전이**:
- `pending` → `processing` → `success` 또는 `failed`
- 실패 시 `error_message`에 상세 오류 기록

### 5.2 테이블 관계도 (ERD)

```
project (1) ────< (N) cashflow_monthly
  │
  ├───< (N) risk_flag
  │
  └───< (N) chart_entry

upload_job (독립 테이블, 관계 없음)
```

### 5.3 머티리얼라이즈 뷰 (성능 최적화)

대시보드 조회 성능 향상을 위해 다음 뷰를 업로드 완료 후 자동 재생성:

#### `mv_business_kpis` (사업별 KPI 집계)
```sql
CREATE MATERIALIZED VIEW mv_business_kpis AS
SELECT 
  yyyyymm,
  business_type,
  SUM(revenue_amount) AS revenue,
  SUM(cost_amount) AS cost,
  SUM(revenue_amount - cost_amount) AS profit,
  AVG(CASE WHEN revenue_amount > 0 
    THEN (revenue_amount - cost_amount)::FLOAT / revenue_amount 
    ELSE 0 END) AS profit_margin
FROM project p
JOIN cashflow_monthly cf ON p.project_id = cf.project_id
GROUP BY yyyyymm, business_type;
```

#### `mv_risk_counts` (월별 리스크 건수)
```sql
CREATE MATERIALIZED VIEW mv_risk_counts AS
SELECT 
  DATE_TRUNC('month', evaluated_at) AS yyyyymm,
  COUNT(*) FILTER (WHERE is_warning = true) AS warning_count,
  COUNT(*) AS total_evaluations
FROM risk_flag
GROUP BY DATE_TRUNC('month', evaluated_at);
```

#### `mv_company_agg` (기획사별 집계)
```sql
CREATE MATERIALIZED VIEW mv_company_agg AS
SELECT 
  company_name,
  business_type,
  SUM(initial_investment + additional_investment) AS total_investment,
  SUM(total_recouped) AS total_recouped,
  SUM(total_recouped)::FLOAT / NULLIF(SUM(initial_investment + additional_investment), 0) AS roi
FROM project
GROUP BY company_name, business_type;
```

**리프레시 정책**: 업로드 완료 후 트랜잭션 내에서 `REFRESH MATERIALIZED VIEW` 실행

## 6. 아키텍처 개요
- **모노레포**: Turborepo / Bun.
  - `apps/web` (Next.js 16, tRPC v11, Tailwind, React Query) – UI·대시보드.
  - `packages/api` – tRPC 서버 라우터(`dashboard`, `risk`, `analysis`, `simulation`, `upload`, `project`).
  - `packages/db` – Drizzle ORM(PostgreSQL) 스키마, 시드 스크립트.
  - `apps/ai-backend` – FastAPI 예측 서비스(ARIMA/Prophet/Naive 자동 선택).
- **통신 경계**: Web ↔ FastAPI는 REST (`POST /forecast` with superjson on web side).
- **데이터베이스**: PostgreSQL (`packages/db/src/schema` 기준). Drizzle 마이그레이션 관리, 인덱스 전략 명시.
- **클라이언트 패턴**: tRPC `createTRPCOptionsProxy` + `queryOptions()` → TanStack React Query.

## 7. 기능 스코프
### Module 1 – 통합 대시보드 (경영진)
- KPI 3종(누적 투자금, 누적 회수율, 현재 리스크 건수) + YoY.
- 사업타입(선급·일반·OST·음반)별 매출/이익/이익률 비교.
- 월별 추세(매출 면적 + 이익률 선), 투자→회수 워터폴.
- Top 기획사 스캐터(투자금 vs 회수율), 리스크 도넛 + 추세.
### Module 2 – 선급투자 시뮬레이터 (투자심사)
- 최근 12개월 CF 입력 → FastAPI 예측(`moderate`) → `worst/best` 시나리오 (±10%).
- 고정 WACC 적용 DCF, 누적 할인 CF로 BEP 산출.
- 출력: DCF 3종, BEP, 모델/성능 메타(RMSE/MAPE), 리포트 추출.
### Module 3 – 리스크 관리 (사업관리)
- 경고 분류 로직: 경과개월 > 계약기간 50% & 회수율 < 50%.
- 리스크 목록 테이블(검색/정렬/필터), 최근 3개월 회수액 스파크라인.
- 상세 팝업: 투자금/회수율 추이, 계약 정보, 권리사/장르 태그.
- 만기 히트맵, 경고 유형 분해 막대.
### Module 4 – 심층 분석 (사업관리)
- 차트인 가치 분석(회귀 + Top10 파레토).
- 기획사 ROI 비교(투자 규모, 계약 만기 기준 정렬 가능).
- 코호트 히트맵(계약 시작 월 vs t+개월 회수율).
- ROI/회수기간 분포 상자그림, 이상치 탐지 지표.
### Module 5 – 업로드 & 검증 (운영)
- Drag & Drop 업로드 → 미리보기 → 스키마/도메인 검증(A2A) → 적재.
- 실패 시 전체 롤백, `upload_job` 이력(파일명/해시/행수/소요/오류) 저장.
- A/B 교차 매칭 리포트(프로젝트명, 권리사, 장르). 경고 레벨 로깅.
### Module 6 – 데이터 서비스 & 배포 지원
- Drizzle 기반 시드/마이그레이션(`bun run db:*`).
- Supabase/Vercel 배포 가이드 연동, 환경 변수(`DATABASE_URL`, `FASTAPI_URL`) 관리.
- 구조화 JSON 로깅, OpenTelemetry 도입 검토.

## 8. 데이터 파이프라인 세부 설계
- **로드 순서**: 업로드 → 임시 테이블 → 검증 → 본 테이블 교체 → 머티리얼라이즈 뷰 재생성.
- **검증 항목**
  - 필수 컬럼: 프로젝트명, 기획사, 계약 시작일, 투자금, 회수금, BM 구분 등.
  - 값 제약: 금액 ≥ 0, 날짜 ISO8601, BM 구분 ENUM 일치, 장르/권리사 코드 존재.
  - A/B 교차: 프로젝트명 매칭 비율 보고 (이상치 알림, 차단 아님).
- **머티리얼라이즈 뷰**: `mv_business_kpis`, `mv_risk_counts`, `mv_company_agg` 등 업로드 후 재생성.
- **대용량 데이터** (`유통 로데이터 50MB+` 등): 배치 파서(스트리밍, 청크 검증)와 파티션 전략 적용.

## 9. 기술 스택 & 개발 원칙
- TypeScript strict 모드, 명시적 타입, 함수형 컴포넌트.
- Result 패턴 기반 에러 처리, 구조화 로그.
- Drizzle ORM + PostgreSQL, SQL 인젝션 방지.
- FastAPI + uv, Prophet/ARIMA/Naive 모델, 폴백 로직.
- 테스트: 단위(계산/검증), 통합(업로드→DB→대시보드), 예측 API 성능.
- 문서화: JSDoc, tRPC 스키마 문서(요청/응답 예시), ADR 유지.

## 10. 마일스톤 & 일정 (6 스프린트 기준)
1. **M1 – 스캐폴딩 & 인프라**: Turborepo 세팅, Drizzle 스키마, 환경 변수/CI.
2. **M2 – 대시보드 MVP**: KPI/막대/추세/워터폴/스캐터, 집계 뷰 초안.
3. **M3 – 리스크 MVP**: 경고 로직 구현, 테이블/스파크라인/히트맵.
4. **M4 – 업로드 & 검증**: A/B 파서, 검증 모듈, 업로드 UI, `upload_job`.
5. **M5 – 시뮬레이터 연동**: FastAPI 예측, DCF/BEP 계산, UI/리포트.
6. **M6 – 심층 분석 & 배포 준비**: 차트인 가치, ROI/코호트, 배포 문서 업데이트.

## 11. 품질·성능·보안 기준
- 대시보드 첫 화면 p95 < 500ms (뷰 캐싱 + React Query 캐시 5분).
- 예측 API p95 < 2s, 실패율 < 0.5%.
- 업로드 10만 행 ≤ 5분, 실패 시 롤백.
- PostgreSQL 최소권한, 환경 변수 시크릿 관리, .db/.sqlite Git 제외.
- 구조화 JSON 로그 + 요청 ID, 업로드/모델 오류 Slack/메일 알림.
- 브라우저: 최신 Chromium 기반 2개 버전, 한국어 고정.

## 12. 운영 및 거버넌스
- 업로드 전/후 지표 비교(±1% 이내) 자동 리포트.
- ADR 기록, `summary.md` & `scope.md` 변경 동기화.
- 모듈별 데이터 소유권 명확화 (예측 서비스 독립 스케일, 장애 격리).
- 백업: 업로드 직전 DB 스냅샷, 일 1회 자동 백업, 로그 90일 보존.

## 13. 성공 지표
- 경영진 KPI 화면 p95 충족, 리스크 건수→상세 전환률 증가.
- 시뮬레이터 BEP 오차 중앙값 ≤ 2개월, 활용 리포트 월 5건 이상.
- 업로드 자동화로 수기 처리 시간 50% 이상 절감.
- 차트인/ROI 리포트 월간 조회수 증가, 영업 타깃 발굴 건수 측정.

## 14. 주요 리스크 및 대응
- **데이터 표준화 미흡**: 프로젝트명/권리사 코드 관리 정책 수립, 교차 매칭 리포트.
- **예측 정확도 편차**: 모델 폴백(Prophet → ARIMA → Naive), 성능 지표 노출.
- **조직 채택 저조**: 기존 결재 양식과 동일한 리포트 템플릿, 교육/챔피언 사용자 지정.
- **대용량 업로드 병목**: 스트리밍 파서, 청크 검증, 인덱스/파티션 최적화.
- **시스템 의존성**: FastAPI 다운 시 시뮬레이터 폴백 모드 유지(최근 예측 캐시).

---
## 15. 문서 관리

**문서 버전**: v0.4  
**최종 업데이트**: 2025년 (DB 스키마 상세 반영)  
**연관 문서**: `summary.md`, `.cursorrules`, `단계별세부계획.md`, `ddd.md`

### 변경 이력
- **v0.4**: 실제 DB 스키마 구조 상세 반영 (5개 테이블 + 머티리얼라이즈 뷰), ERD 추가
- **v0.3**: 초기 범위 정의서 작성 (회의록 및 계획 문서 통합)

### 동기화 규칙
- 스키마 변경 시 `packages/db/src/schema/*.ts`와 본 문서 동기화 필수
- 기능 추가/변경 시 `summary.md`와 함께 업데이트
- 주요 아키텍처 결정은 ADR 기록

