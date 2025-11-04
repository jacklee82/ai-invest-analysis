# Supabase 데이터 마이그레이션 가이드

## 현재 상황
- ✅ 스키마 마이그레이션 완료 (5개 테이블 생성됨)
- ⏳ 데이터 마이그레이션 필요

## 방법 1: 환경변수를 명시적으로 전달하여 시드 스크립트 실행

### PowerShell에서 실행

```powershell
cd "d:\AI_Work\29. distribution\my-better-t-app\packages\db"

# Supabase Direct Connection URL 사용
$env:DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
bun run db:seed-large

# 차트 데이터 생성
bun run db:seed-chart
```

### CMD에서 실행

```cmd
cd "d:\AI_Work\29. distribution\my-better-t-app\packages\db"

set DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
bun run db:seed-large

set DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
bun run db:seed-chart
```

**주의**: `[PASSWORD]`와 `[PROJECT_REF]`를 실제 값으로 교체하세요.

## 방법 2: .env.local 파일 확인 및 수정

`apps/web/.env.local` 파일을 확인하고 다음과 같이 설정:

```bash
# Supabase Direct Connection (개발용)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# FastAPI (로컬)
FASTAPI_URL=http://localhost:8000
```

설정 후:
```bash
cd packages/db
bun run db:seed-large
bun run db:seed-chart
```

## 방법 3: pg_dump/pg_restore 사용 (로컬 데이터가 있는 경우)

로컬 PostgreSQL에 데이터가 있는 경우:

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

## 데이터 확인

### Supabase MCP 사용
```typescript
// 프로젝트 수 확인
SELECT COUNT(*) FROM project;

// 현금흐름 수 확인
SELECT COUNT(*) FROM cashflow_monthly;

// 차트 진입 수 확인
SELECT COUNT(*) FROM chart_entry;
```

### Supabase Dashboard
- Supabase Dashboard → Table Editor에서 각 테이블 확인
- 예상 데이터:
  - `project`: 약 55개
  - `cashflow_monthly`: 약 584-635개
  - `chart_entry`: 약 100-200개 (차트 시드 실행 후)

## 다음 단계

데이터 마이그레이션 완료 후:
1. 로컬 개발 서버 실행: `bun run dev`
2. 대시보드에서 데이터 확인
3. Vercel 배포 준비

