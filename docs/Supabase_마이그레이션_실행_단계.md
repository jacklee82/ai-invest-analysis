# Supabase 마이그레이션 실행 단계

## 현재 상태
- ✅ GitHub 저장소 생성 및 푸시 완료
- ✅ 로컬 PostgreSQL 데이터베이스 준비 완료
- ✅ 스키마 정의 완료
- ✅ 시드 데이터 스크립트 준비 완료

## Step 1: Supabase 프로젝트 생성

### 1.1 Supabase 계정 및 프로젝트 생성

1. [Supabase](https://supabase.com) 접속 및 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: `ai-invest-analysis`
   - **Database Password**: 강력한 비밀번호 생성 및 **반드시 저장**
   - **Region**: Northeast Asia (Seoul) 또는 가장 가까운 리전
4. "Create new project" 클릭
5. 프로젝트 생성 완료 대기 (약 2분)

### 1.2 연결 정보 확인

Supabase Dashboard → Settings → Database:

#### Direct Connection (로컬 개발용)
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

#### Connection Pooler (Vercel 배포용)
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**중요 사항:**
- `[PROJECT_REF]`: 프로젝트 참조 ID (예: `abcdefghijklmnop`)
- `[PASSWORD]`: 생성 시 설정한 데이터베이스 비밀번호
- `[REGION]`: 리전 코드 (예: `ap-northeast-2`)

## Step 2: 로컬 환경변수 설정

`apps/web/.env.local` 파일에 다음 추가:

```bash
# Supabase Direct Connection (개발용)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# FastAPI (로컬)
FASTAPI_URL=http://localhost:8000
```

**참고**: 환경변수 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.

## Step 3: 스키마 마이그레이션

환경변수 설정 후 스키마를 Supabase에 푸시:

```bash
cd packages/db
bun run db:push
```

**예상 출력:**
- 테이블 생성 확인 메시지
- `project`, `cashflow_monthly`, `risk_flag`, `upload_job`, `chart_entry` 테이블 생성

**확인 방법:**
- Supabase Dashboard → Table Editor에서 테이블 확인

## Step 4: 데이터 마이그레이션

### 옵션 A: 시드 스크립트 재실행 (권장, 빠른 테스트)

```bash
cd packages/db

# 대량 샘플 데이터 생성
DATABASE_URL=[SUPABASE_DIRECT_URL] bun run db:seed-large

# 차트 데이터 생성
DATABASE_URL=[SUPABASE_DIRECT_URL] bun run db:seed-chart
```

**참고**: `[SUPABASE_DIRECT_URL]`은 Step 2에서 설정한 `DATABASE_URL`과 동일합니다.

### 옵션 B: pg_dump/pg_restore (로컬 데이터가 있는 경우)

```bash
# 1. 로컬 DB 덤프
pg_dump -h localhost -U postgres -d my_db -F c -f backup.dump

# 2. Supabase로 복원
pg_restore \
  -h db.[PROJECT_REF].supabase.co \
  -U postgres \
  -d postgres \
  --no-owner \
  --no-acl \
  backup.dump
```

## Step 5: 연결 테스트

```bash
# 프로젝트 루트에서
bun run dev

# 브라우저에서 http://localhost:3001 접속
# 대시보드 데이터 확인
```

**확인 사항:**
- ✅ 대시보드 KPI 카드에 데이터 표시
- ✅ 차트에 데이터 표시
- ✅ 리스크 관리 페이지 데이터 로딩
- ✅ 분석 페이지 데이터 로딩

## Step 6: Supabase Dashboard에서 데이터 확인

Supabase Dashboard → Table Editor:
- `project` 테이블: 프로젝트 데이터 확인
- `cashflow_monthly` 테이블: 월별 현금흐름 데이터 확인
- `chart_entry` 테이블: 차트 진입 데이터 확인

## 다음 단계

Supabase 마이그레이션 완료 후:
- ✅ Vercel 배포 준비 (`docs/Vercel_배포_가이드.md` 참고)
- ✅ Vercel 환경변수 설정 (Connection Pooler URL 사용)

---

## 트러블슈팅

### "password authentication failed"
- Supabase 비밀번호 확인
- DATABASE_URL 형식 확인 (특수문자 이스케이프 필요할 수 있음)
- Supabase Dashboard → Settings → Database → Connection string에서 복사

### "too many connections"
- Supabase 무료 티어: 최대 2개 동시 연결
- `packages/db/src/index.ts`에서 `max: 1` 설정 확인
- Connection Pooler URL 사용 (Vercel 배포 시)

### "relation does not exist"
- `bun run db:push` 재실행
- Supabase Dashboard → Table Editor에서 테이블 확인
- 스키마 파일 확인

### 데이터가 표시되지 않음
- 시드 스크립트 실행 확인
- Supabase Dashboard → Table Editor에서 데이터 확인
- 브라우저 콘솔에서 에러 확인



