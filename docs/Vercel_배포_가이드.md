# Vercel 배포 실행 가이드

## 빠른 시작 가이드

### 1. GitHub 저장소 준비

#### 1.1 저장소 생성 및 푸시

```bash
# 현재 디렉토리에서
cd "d:\AI_Work\29. distribution\my-better-t-app"

# Git 상태 확인
git status

# GitHub 저장소 생성 (GitHub에서 직접 생성하거나)
# 또는 기존 저장소에 연결:
git remote add origin https://github.com/[USERNAME]/[REPO_NAME].git
git branch -M main
git push -u origin main
```

#### 1.2 .gitignore 확인
- `.env`, `.env.local` 파일이 제외되어 있는지 확인
- 민감한 정보가 커밋되지 않았는지 확인

### 2. Vercel 프로젝트 생성

#### 2.1 Vercel 계정 및 프로젝트 생성

1. [Vercel](https://vercel.com) 접속 및 로그인
2. "Add New..." → "Project" 클릭
3. GitHub 저장소 선택
4. 프로젝트 설정:
   - **Framework Preset**: Next.js (자동 감지)
   - **Root Directory**: `apps/web` 또는 프로젝트 루트
   - **Build Command**: `cd ../.. && bun run build` (Turborepo)
   - **Output Directory**: `.next` (Next.js 기본)
   - **Install Command**: `bun install`

#### 2.2 빌드 설정 확인

Vercel은 `vercel.json` 파일을 자동으로 인식합니다.

현재 설정 (`vercel.json`):
```json
{
  "buildCommand": "cd ../.. && bun run build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "bun install",
  "framework": "nextjs",
  "regions": ["icn1"]
}
```

**주의**: Root Directory가 `apps/web`인 경우, `vercel.json`의 경로 조정 필요할 수 있습니다.

### 3. 환경변수 설정

Vercel 프로젝트 → Settings → Environment Variables:

#### 필수 환경변수
```
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
FASTAPI_URL=https://[FASTAPI_BACKEND_URL]
NODE_ENV=production
```

#### 환경별 설정
- **Production**: 프로덕션 Supabase URL
- **Preview**: 프리뷰용 Supabase 또는 별도 DB
- **Development**: 개발용 (로컬 Supabase 또는 로컬 PostgreSQL)

### 4. 첫 배포

#### 4.1 자동 배포
- GitHub에 푸시하면 자동으로 배포 시작
- Vercel Dashboard에서 배포 진행 상황 확인

#### 4.2 수동 배포
- Vercel Dashboard → Deployments → "Redeploy"

### 5. 배포 검증

#### 5.1 배포 URL 확인
- Vercel Dashboard → 배포 완료 후 URL 확인
- 예: `https://my-better-t-app.vercel.app`

#### 5.2 기능 테스트
- [ ] 대시보드 접속 확인
- [ ] 데이터 로딩 확인
- [ ] 모든 페이지 테스트
- [ ] API 엔드포인트 테스트
- [ ] 파일 업로드 테스트

### 6. 커스텀 도메인 설정 (선택)

Vercel 프로젝트 → Settings → Domains:
- 도메인 추가
- DNS 설정 안내 따르기

---

## 트러블슈팅

### "Build failed"
- 빌드 로그 확인 (Vercel Dashboard)
- 로컬에서 빌드 테스트: `bun run build`
- Turborepo 설정 확인

### "Module not found"
- `package.json` 의존성 확인
- 모노레포 패키지 경로 확인
- 빌드 순서 확인

### "Environment variable not found"
- Vercel 환경변수 설정 확인
- 환경별 변수 설정 확인 (Production/Preview/Development)
- 변수 이름 확인 (대소문자 구분)

### "Database connection failed"
- Vercel 환경변수 DATABASE_URL 확인
- Supabase 연결 상태 확인
- Connection Pooler URL 사용 확인 (포트 6543)

---

## 배포 후 확인사항

- [ ] 배포 URL 접속 확인
- [ ] 모든 페이지 정상 작동 확인
- [ ] 데이터베이스 연결 확인
- [ ] API 엔드포인트 테스트
- [ ] 성능 확인 (Vercel Analytics)
- [ ] 에러 로그 확인 (Vercel Dashboard)

---

**참고**: FastAPI 백엔드는 별도로 배포 필요 (Railway, Render, Fly.io 등)

