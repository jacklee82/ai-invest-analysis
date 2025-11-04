# Supabase 마이그레이션 실행 가이드

## 빠른 시작 가이드

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속 및 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: `ai-invest-analysis` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 생성 및 저장
   - **Region**: 가장 가까운 리전 선택 (예: Northeast Asia - Seoul)
4. 프로젝트 생성 완료 대기 (약 2분)

### 2. 연결 정보 확인

Supabase Dashboard → Settings → Database:

- **Connection string** (Direct connection):
  ```
  postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
  ```
  
- **Connection string** (Session mode):
  ```
  postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
  ```

**중요**: Vercel에서는 **Connection Pooler** (포트 6543) 사용 필수!

### 3. 환경변수 설정

#### 로컬 개발용 (`apps/web/.env.local`)
```bash
# Supabase Direct Connection (개발용)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# FastAPI (로컬)
FASTAPI_URL=http://localhost:8000
```

#### Vercel 환경변수 (나중에 설정)
- **Production**:
  ```
  DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
  FASTAPI_URL=https://[FASTAPI_BACKEND_URL]
  NODE_ENV=production
  ```

### 4. 스키마 마이그레이션

```bash
# 1. 환경변수 설정 확인 (apps/web/.env.local에 Supabase URL 추가)
# 2. 스키마 푸시
cd packages/db
bun run db:push
```

### 5. 데이터 마이그레이션

#### 옵션 A: pg_dump/pg_restore (로컬 PostgreSQL이 있는 경우)

```bash
# 1. 로컬 DB 덤프
pg_dump -h localhost -U postgres -d my_db -F c -f backup.dump

# 2. Supabase로 복원
# Supabase Dashboard → SQL Editor에서 다음 명령어 실행:
# 또는 psql로 직접 연결:
pg_restore \
  -h db.[PROJECT_REF].supabase.co \
  -U postgres \
  -d postgres \
  --no-owner \
  --no-acl \
  backup.dump
```

#### 옵션 B: 시드 스크립트 재실행 (빠른 테스트)

```bash
cd packages/db
DATABASE_URL=[SUPABASE_URL] bun run db:seed-large
DATABASE_URL=[SUPABASE_URL] bun run db:seed-chart
```

### 6. 연결 테스트

```bash
# 개발 서버 실행
bun run dev

# 브라우저에서 http://localhost:3001 접속
# 대시보드 데이터 확인
```

---

## 트러블슈팅

### "password authentication failed"
- Supabase 비밀번호 확인
- DATABASE_URL 형식 확인
- Supabase Dashboard → Settings → Database → Connection string 복사

### "too many connections"
- Connection Pooler URL 사용 (포트 6543)
- `packages/db/src/index.ts`에서 `max: 1` 설정 확인

### "relation does not exist"
- `bun run db:push` 재실행
- Supabase Dashboard → Table Editor에서 테이블 확인

---

**다음 단계**: Vercel 배포 준비

