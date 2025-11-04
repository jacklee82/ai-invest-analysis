# Supabase 마이그레이션 및 Vercel 배포 계획

## 1. 개요

### 1.1 목표
- 현재 로컬 PostgreSQL → **Supabase**로 마이그레이션
- Next.js 웹 애플리케이션 → **Vercel**로 배포
- FastAPI 백엔드는 별도 호스팅 (초기 단계)

### 1.2 현재 상태
- **데이터베이스**: 로컬 PostgreSQL (my_db)
- **웹 앱**: Next.js (tRPC, Drizzle ORM)
- **AI 백엔드**: FastAPI (로컬)
- **모노레포**: Turborepo 구조

## 2. Supabase 마이그레이션 계획

### 2.1 Supabase 프로젝트 생성

#### 2.1.1 Supabase 계정 및 프로젝트 생성
1. [Supabase](https://supabase.com) 계정 생성
2. 새 프로젝트 생성
   - 프로젝트 이름: `ai-invest-analysis` (또는 원하는 이름)
   - 데이터베이스 비밀번호: 강력한 비밀번호 생성
   - 리전: 선택 (가장 가까운 리전)
3. 프로젝트 생성 후 정보 확인
   - Project URL
   - API Key (anon, service_role)
   - Database URL (Connection string)

#### 2.1.2 연결 정보 확인
- **Database URL 형식**: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
- **Connection Pooling URL**: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

### 2.2 데이터베이스 마이그레이션

#### 2.2.1 스키마 마이그레이션
```bash
# 1. 환경변수 설정 (로컬 개발용)
# .env.local에 Supabase Database URL 추가
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# 2. 스키마 푸시
cd packages/db
bun run db:push
```

#### 2.2.2 데이터 마이그레이션 옵션

**옵션 A: pg_dump/pg_restore (권장)**
```bash
# 로컬 DB 덤프
pg_dump -h localhost -U postgres -d my_db -F c -f backup.dump

# Supabase로 복원
pg_restore -h db.[PROJECT_REF].supabase.co -U postgres -d postgres --no-owner --no-acl backup.dump
```

**옵션 B: Drizzle 마이그레이션 스크립트**
```bash
# 기존 데이터를 JSON으로 export
# Supabase로 import하는 스크립트 작성
```

**옵션 C: 시드 스크립트 재실행**
```bash
# Supabase에서 시드 스크립트 재실행
cd packages/db
DATABASE_URL=[SUPABASE_URL] bun run db:seed-large
DATABASE_URL=[SUPABASE_URL] bun run db:seed-chart
```

### 2.3 환경변수 설정

#### 2.3.1 Vercel 환경변수 설정
Vercel 프로젝트 설정에서 다음 환경변수 추가:
```
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
FASTAPI_URL=https://[FASTAPI_BACKEND_URL]
```

#### 2.3.2 로컬 개발 환경변수
`apps/web/.env.local`:
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
FASTAPI_URL=http://localhost:8000
```

### 2.4 Drizzle 설정 업데이트

#### 2.4.1 `drizzle.config.ts` 수정
```typescript
// packages/db/drizzle.config.ts
export default {
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://...",
  },
};
```

### 2.5 연결 풀링 설정

#### 2.5.1 Supabase Connection Pooler 사용
- **Direct Connection**: 개발/마이그레이션용
- **Connection Pooler**: 프로덕션용 (Vercel에서 사용)
  - Port: `6543` (pooler)
  - URL에 `postgres.[PROJECT_REF]` 사용

#### 2.5.2 `packages/db/src/index.ts` 수정
```typescript
// Connection Pooler URL 감지
function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    // Supabase Pooler URL인 경우 추가 설정
    const url = process.env.DATABASE_URL;
    if (url.includes('pooler.supabase.com')) {
      // Pooler 설정
    }
    return url;
  }
  // ...
}
```

## 3. Vercel 배포 계획

### 3.1 Vercel 프로젝트 생성

#### 3.1.1 프로젝트 초기 설정
1. [Vercel](https://vercel.com) 계정 생성/로그인
2. GitHub 저장소 연결
   - 저장소를 GitHub에 푸시
   - Vercel에서 "Import Project" 클릭
   - 저장소 선택

#### 3.1.2 빌드 설정
- **Framework Preset**: Next.js
- **Root Directory**: `apps/web` (또는 프로젝트 루트)
- **Build Command**: `cd ../.. && bun run build` (Turborepo)
- **Output Directory**: `.next` (Next.js 기본)
- **Install Command**: `bun install`

### 3.2 Turborepo 설정

#### 3.2.1 `vercel.json` 생성
```json
{
  "buildCommand": "cd ../.. && bun run build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "bun install",
  "framework": "nextjs",
  "regions": ["icn1"]
}
```

#### 3.2.2 Turborepo 빌드 설정 확인
`turbo.json`에서 빌드 파이프라인 확인:
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    }
  }
}
```

### 3.3 환경변수 설정

#### 3.3.1 Vercel 환경변수 추가
Vercel 프로젝트 설정 → Environment Variables:
```
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
FASTAPI_URL=https://[FASTAPI_BACKEND_URL]
NODE_ENV=production
```

#### 3.3.2 환경별 변수 설정
- **Production**: Supabase Production URL
- **Preview**: Supabase 또는 별도 Preview DB
- **Development**: 로컬 Supabase 또는 로컬 PostgreSQL

### 3.4 API 라우트 설정

#### 3.4.1 tRPC API 라우트
- 자동으로 `/api/trpc/[trpc]` 경로로 배포됨
- 추가 설정 불필요

#### 3.4.2 파일 업로드 API
- `/api/upload` 라우트
- Vercel 파일 크기 제한 확인 (기본 4.5MB)
- 필요 시 Vercel Blob Storage 사용 검토

### 3.5 FastAPI 백엔드 배포 옵션

#### 3.5.1 옵션 A: Vercel Serverless Functions (비추천)
- FastAPI는 서버리스 함수에 최적화되지 않음
- Cold start 문제
- 제한적

#### 3.5.2 옵션 B: Railway (추천)
- Python/FastAPI에 최적화
- 간단한 배포
- 무료 티어 제공

#### 3.5.3 옵션 C: Render
- Python 지원
- 무료 티어 제공
- 자동 배포

#### 3.5.4 옵션 D: Fly.io
- 글로벌 배포
- Docker 지원
- 무료 티어 제공

## 4. 단계별 실행 계획

### Phase 1: Supabase 설정 및 마이그레이션

#### Step 1.1: Supabase 프로젝트 생성
- [ ] Supabase 계정 생성
- [ ] 새 프로젝트 생성
- [ ] 연결 정보 확인 및 저장

#### Step 1.2: 로컬 환경변수 설정
- [ ] `apps/web/.env.local`에 Supabase DATABASE_URL 추가
- [ ] 연결 테스트

#### Step 1.3: 스키마 마이그레이션
- [ ] `bun run db:push` 실행
- [ ] 스키마 확인 (Supabase Dashboard)

#### Step 1.4: 데이터 마이그레이션
- [ ] 옵션 선택 (A/B/C)
- [ ] 데이터 마이그레이션 실행
- [ ] 데이터 검증

#### Step 1.5: 로컬에서 Supabase 연결 테스트
- [ ] 개발 서버 실행
- [ ] 대시보드 데이터 확인
- [ ] 모든 기능 테스트

### Phase 2: Vercel 배포 준비

#### Step 2.1: GitHub 저장소 설정
- [ ] GitHub 저장소 생성
- [ ] 코드 푸시
- [ ] `.gitignore` 확인 (`.env` 파일 제외)

#### Step 2.2: Vercel 프로젝트 생성
- [ ] Vercel 계정 생성/로그인
- [ ] GitHub 저장소 연결
- [ ] 프로젝트 설정 (Root Directory, Build Command)

#### Step 2.3: Vercel 환경변수 설정
- [ ] DATABASE_URL 추가 (Supabase Pooler URL)
- [ ] FASTAPI_URL 추가 (백엔드 URL)
- [ ] NODE_ENV 설정

#### Step 2.4: 빌드 설정 확인
- [ ] `vercel.json` 생성 (필요 시)
- [ ] Turborepo 빌드 설정 확인
- [ ] 첫 배포 실행

### Phase 3: 배포 및 검증

#### Step 3.1: 초기 배포
- [ ] Vercel에서 첫 배포 실행
- [ ] 빌드 로그 확인
- [ ] 배포 URL 확인

#### Step 3.2: 기능 테스트
- [ ] 대시보드 접속 확인
- [ ] 데이터 로딩 확인
- [ ] API 엔드포인트 테스트
- [ ] 파일 업로드 테스트

#### Step 3.3: 성능 최적화
- [ ] Vercel Analytics 확인
- [ ] 페이지 로딩 속도 확인
- [ ] 데이터베이스 쿼리 최적화 (필요 시)

### Phase 4: FastAPI 백엔드 배포 (선택)

#### Step 4.1: 백엔드 호스팅 선택
- [ ] 호스팅 서비스 선택 (Railway/Render/Fly.io)
- [ ] 프로젝트 생성

#### Step 4.2: 환경변수 설정
- [ ] DATABASE_URL 설정 (Supabase)
- [ ] CORS 설정 확인

#### Step 4.3: 배포 및 연동
- [ ] 백엔드 배포
- [ ] Vercel FASTAPI_URL 업데이트
- [ ] 시뮬레이션 기능 테스트

## 5. 주의사항 및 체크리스트

### 5.1 데이터베이스 마이그레이션 주의사항

#### 5.1.1 데이터 백업
- [ ] 로컬 DB 전체 백업 (`pg_dump`)
- [ ] 백업 파일 안전한 위치에 저장

#### 5.1.2 스키마 호환성
- [ ] PostgreSQL 버전 확인 (Supabase: PostgreSQL 15)
- [ ] Drizzle 스키마가 Supabase와 호환되는지 확인
- [ ] 특수 함수/타입 사용 여부 확인

#### 5.1.3 연결 제한
- [ ] Supabase 무료 티어: 최대 2개 동시 연결
- [ ] Connection Pooler 사용 필수 (프로덕션)
- [ ] 연결 풀 크기 조정 (`max: 1` → `max: 2`)

### 5.2 Vercel 배포 주의사항

#### 5.2.1 빌드 시간
- [ ] Turborepo 빌드 시간 확인
- [ ] Vercel 빌드 타임아웃 (무료: 45분)
- [ ] 필요 시 빌드 최적화

#### 5.2.2 함수 실행 시간
- [ ] API 라우트 실행 시간 (최대 10초)
- [ ] 타임아웃 설정 확인
- [ ] 대용량 쿼리 최적화

#### 5.2.3 파일 크기 제한
- [ ] 업로드 파일 크기 (기본 4.5MB)
- [ ] 필요 시 Vercel Blob Storage 사용
- [ ] 또는 별도 스토리지 서비스 (S3, Cloudflare R2)

#### 5.2.4 환경변수 보안
- [ ] 민감한 정보는 환경변수로 관리
- [ ] `.env` 파일은 Git에 커밋하지 않음
- [ ] Vercel 환경변수 암호화 확인

### 5.3 Supabase 제한사항

#### 5.3.1 무료 티어 제한
- **데이터베이스 크기**: 500MB
- **동시 연결**: 2개 (Direct), 무제한 (Pooler)
- **API 요청**: 50,000/월
- **Storage**: 1GB

#### 5.3.2 대응 방안
- 프로덕션 데이터 정기 정리
- Connection Pooler 필수 사용
- 필요 시 Pro 플랜 업그레이드 검토

### 5.4 Vercel 제한사항

#### 5.4.1 무료 티어 제한
- **빌드 시간**: 월 6,000분
- **함수 실행 시간**: 10초 (Hobby), 60초 (Pro)
- **대역폭**: 100GB/월
- **파일 크기**: 4.5MB (업로드)

#### 5.4.2 대응 방안
- 빌드 최적화 (캐싱 활용)
- 대용량 파일은 별도 스토리지 사용
- 필요 시 Pro 플랜 업그레이드

## 6. 마이그레이션 체크리스트

### 6.1 사전 준비
- [ ] Supabase 계정 생성
- [ ] Vercel 계정 생성
- [ ] GitHub 저장소 생성 및 푸시
- [ ] 로컬 DB 백업

### 6.2 Supabase 마이그레이션
- [ ] Supabase 프로젝트 생성
- [ ] DATABASE_URL 확인
- [ ] 로컬 환경변수 설정
- [ ] 스키마 푸시 (`db:push`)
- [ ] 데이터 마이그레이션
- [ ] 로컬에서 Supabase 연결 테스트

### 6.3 Vercel 배포
- [ ] Vercel 프로젝트 생성
- [ ] GitHub 저장소 연결
- [ ] 빌드 설정 확인
- [ ] 환경변수 설정
- [ ] 첫 배포 실행
- [ ] 배포 URL 확인

### 6.4 검증 및 테스트
- [ ] 대시보드 접속 확인
- [ ] 데이터 로딩 확인
- [ ] 모든 페이지 테스트
- [ ] API 엔드포인트 테스트
- [ ] 파일 업로드 테스트
- [ ] 성능 확인

### 6.5 문서화
- [ ] README 업데이트 (배포 방법)
- [ ] 환경변수 목록 문서화
- [ ] 배포 URL 기록
- [ ] 트러블슈팅 가이드 작성

## 7. 트러블슈팅 가이드

### 7.1 Supabase 연결 오류

#### 문제: "password authentication failed"
**해결**:
- DATABASE_URL의 비밀번호 확인
- Supabase Dashboard에서 비밀번호 재설정
- Connection Pooler URL 사용 확인

#### 문제: "too many connections"
**해결**:
- Connection Pooler URL 사용 (포트 6543)
- Drizzle 연결 풀 크기 조정 (`max: 1`)

#### 문제: "relation does not exist"
**해결**:
- 스키마가 제대로 푸시되었는지 확인
- `bun run db:push` 재실행
- Supabase Dashboard에서 테이블 확인

### 7.2 Vercel 배포 오류

#### 문제: "Build failed"
**해결**:
- 빌드 로그 확인
- 로컬에서 빌드 테스트 (`bun run build`)
- Turborepo 설정 확인

#### 문제: "Module not found"
**해결**:
- `package.json`의 의존성 확인
- 모노레포 패키지 경로 확인
- 빌드 순서 확인

#### 문제: "Environment variable not found"
**해결**:
- Vercel 환경변수 설정 확인
- 환경별 변수 설정 확인 (Production/Preview/Development)
- 변수 이름 확인 (대소문자 구분)

### 7.3 런타임 오류

#### 문제: "Database connection failed"
**해결**:
- Vercel 환경변수 DATABASE_URL 확인
- Supabase 연결 상태 확인
- Connection Pooler URL 사용 확인

#### 문제: "CORS error" (FastAPI)
**해결**:
- FastAPI CORS 설정 확인
- Vercel 도메인을 허용 목록에 추가
- `FASTAPI_URL` 환경변수 확인

## 8. 비용 추정

### 8.1 Supabase
- **무료 티어**: 개인 프로젝트에 충분
- **Pro 플랜**: $25/월 (필요 시)
  - 더 큰 데이터베이스
  - 더 많은 API 요청
  - 백업 보관 기간 증가

### 8.2 Vercel
- **Hobby (무료)**: 개인 프로젝트에 충분
- **Pro 플랜**: $20/월 (필요 시)
  - 더 긴 함수 실행 시간
  - 더 많은 빌드 시간
  - 팀 협업 기능

### 8.3 FastAPI 백엔드
- **Railway**: 무료 티어 (제한적) → $5/월
- **Render**: 무료 티어 (제한적) → $7/월
- **Fly.io**: 무료 티어 (제한적) → $5-10/월

**총 예상 비용** (초기): **$0/월** (무료 티어)
**총 예상 비용** (확장 시): **$30-50/월**

## 9. 참고 자료

- [Supabase 문서](https://supabase.com/docs)
- [Vercel 문서](https://vercel.com/docs)
- [Drizzle ORM - PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)
- [Turborepo 배포 가이드](https://turbo.build/repo/docs/deploy)

---

**작성일**: 2024-01-XX
**버전**: v1.0
**작성자**: AI Assistant

