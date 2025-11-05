# Vercel 환경변수 설정 가이드

## 필수 환경변수

### 1. DATABASE_URL (필수) ✅
**이미 설정 완료**

```
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**중요 사항:**
- **Connection Pooler URL 사용 필수** (포트 6543)
- Direct Connection URL (포트 5432) 사용 시 "too many connections" 오류 발생 가능
- Supabase Dashboard → Settings → Database → Connection Pooling → Session mode URL 사용

**확인 위치:**
- Supabase Dashboard → Settings → Database → Connection Pooling
- **Session mode** 또는 **Transaction mode** URL 사용

---

## 선택 환경변수

### 2. FASTAPI_URL (선택)

```
FASTAPI_URL=https://[FASTAPI_BACKEND_URL]
```

**필요한 경우:**
- 시뮬레이션 기능에서 AI 예측 모델을 사용하려는 경우
- FastAPI 백엔드를 별도로 배포한 경우 (Railway, Render, Fly.io 등)

**설정하지 않는 경우:**
- 시뮬레이션 기능은 기본값(`http://localhost:8000`)을 사용하지만, 프로덕션에서는 작동하지 않음
- 시뮬레이션 기능을 사용하지 않거나, 더미 데이터로만 테스트하는 경우 설정 불필요

**FastAPI 백엔드 배포 후:**
- 배포된 FastAPI URL을 설정
- 예: `https://ai-backend-xxx.railway.app` 또는 `https://ai-backend-xxx.render.com`

---

## Vercel 환경변수 설정 방법

### 1. Vercel Dashboard 접속
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. Settings → Environment Variables 클릭

### 2. 환경변수 추가
1. **Key**: `DATABASE_URL`
2. **Value**: Supabase Connection Pooler URL (위에서 복사)
3. **Environment**: 
   - ✅ Production
   - ✅ Preview
   - ✅ Development (선택)
4. "Add" 클릭

### 3. FASTAPI_URL 추가 (선택)
FastAPI 백엔드를 배포한 경우:
1. **Key**: `FASTAPI_URL`
2. **Value**: 배포된 FastAPI URL
3. **Environment**: 
   - ✅ Production
   - ✅ Preview (선택)
   - ❌ Development (로컬 개발용이므로 불필요)

---

## 환경변수 확인 체크리스트

### 필수
- [x] `DATABASE_URL` - Supabase Connection Pooler URL (포트 6543)
- [ ] `FASTAPI_URL` - FastAPI 백엔드 URL (선택)

### 선택 (Vercel이 자동 설정)
- `NODE_ENV` - Vercel이 자동으로 `production` 설정 (수동 설정 불필요)

---

## 환경별 설정 권장사항

### Production (프로덕션)
```
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
FASTAPI_URL=https://[FASTAPI_BACKEND_URL]  (선택)
```

### Preview (프리뷰 브랜치)
```
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
FASTAPI_URL=https://[FASTAPI_BACKEND_URL]  (선택)
```

### Development (로컬 개발)
- Vercel에서 설정 불필요
- 로컬 `.env.local` 파일에 설정

---

## 주의사항

### DATABASE_URL
- ❌ Direct Connection URL (포트 5432) 사용 금지
- ✅ Connection Pooler URL (포트 6543) 사용 필수
- Supabase 무료 티어는 최대 2개 동시 연결 제한
- Connection Pooler는 무제한 연결 지원

### FASTAPI_URL
- 설정하지 않아도 앱은 정상 작동 (시뮬레이션 기능 제외)
- 시뮬레이션 페이지에서 API 호출 시 오류 발생 가능
- FastAPI 백엔드 배포 전까지는 설정 불필요

---

## 다음 단계

환경변수 설정 완료 후:
1. Vercel Dashboard → Deployments에서 배포 실행
2. 배포 URL 접속하여 기능 테스트
3. (선택) FastAPI 백엔드 배포 후 `FASTAPI_URL` 추가

---

**요약:**
- ✅ **DATABASE_URL**: 필수 (이미 설정 완료)
- ⚠️ **FASTAPI_URL**: 선택 (FastAPI 백엔드 배포 후 설정)



