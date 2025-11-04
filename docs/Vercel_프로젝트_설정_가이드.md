# Vercel 프로젝트 설정 가이드

## 중요: Root Directory 설정

### 올바른 설정

Vercel 프로젝트 생성 시:

1. **Root Directory**: `apps/web` ✅
   - Next.js 앱이 위치한 디렉토리
   - **❌ `apps/ai-backend` (FastAPI 백엔드)가 아님**

2. **Framework Preset**: `Next.js` ✅
   - 자동 감지되거나 수동으로 선택
   - **❌ `FastAPI`가 아님**

3. **Project Name**: `ai-invest-analysis` (또는 원하는 이름)

### 설정 단계

1. **Root Directory 필드 옆의 "Edit" 버튼 클릭**
2. **`apps/ai-backend`를 `apps/web`으로 변경**
3. **Framework Preset이 자동으로 `Next.js`로 변경되는지 확인**
   - 변경되지 않으면 수동으로 `Next.js` 선택

### 현재 설정 (잘못됨)

```
Root Directory: apps/ai-backend ❌
Framework Preset: FastAPI ❌
```

### 올바른 설정

```
Root Directory: apps/web ✅
Framework Preset: Next.js ✅
```

## Build Settings

Root Directory를 `apps/web`으로 설정하면:

- **Build Command**: `bun run build` (프로젝트 루트에서 실행)
- **Output Directory**: `.next` (Next.js 기본)
- **Install Command**: `bun install`

## 주의사항

### FastAPI 백엔드는 별도 배포 필요

- `apps/ai-backend`는 Python FastAPI 백엔드
- Vercel은 Next.js만 배포
- FastAPI는 Railway, Render, Fly.io 등에서 별도 배포 필요

### 모노레포 구조

```
my-better-t-app/
├── apps/
│   ├── web/          ← Vercel이 배포할 Next.js 앱
│   └── ai-backend/   ← 별도 배포 필요 (Railway 등)
├── packages/
│   ├── api/
│   └── db/
```

## 다음 단계

1. Root Directory를 `apps/web`으로 변경
2. Framework Preset이 `Next.js`인지 확인
3. "Deploy" 클릭
4. 환경변수 설정 확인:
   - `DATABASE_URL` (Supabase Connection Pooler URL)
   - `FASTAPI_URL` (선택, 나중에 FastAPI 배포 후 설정)

