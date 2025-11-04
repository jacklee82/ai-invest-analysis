# my-better-t-app

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Self, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **tRPC** - End-to-end type-safe APIs
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```
## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. **Install PostgreSQL** (if not already installed):
   - Windows: Download from [PostgreSQL official site](https://www.postgresql.org/download/windows/)
   - macOS: `brew install postgresql@15`
   - Linux: `sudo apt-get install postgresql`

2. **Create the database**:
```bash
createdb ai_invest
# 또는 psql에서 실행:
# CREATE DATABASE ai_invest;
```

3. **Set up environment variables**:
   Create a `.env.local` file in `apps/web/` directory:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_invest
```
   Replace `postgres:postgres` with your PostgreSQL username and password.

4. **Apply the schema to your database**:
```bash
cd packages/db
bun run db:push
```

5. **Generate seed data** (optional):
```bash
cd packages/db
bun run db:seed
```


Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see your fullstack application.

## AI Backend (FastAPI) Setup

시뮬레이터 모듈에서 사용하는 예측 서비스를 실행하려면:

1. **Python 환경 설정** (uv 사용 권장):
```bash
cd apps/ai-backend
uv venv
uv pip install -r requirements.txt
```

2. **FastAPI 서버 실행**:
```bash
uvicorn main:app --reload --port 8000
```

3. **환경 변수 설정** (선택사항):
   `apps/web/.env.local`에 다음을 추가:
```bash
FASTAPI_URL=http://localhost:8000
```

FastAPI 서버가 실행되지 않으면 시뮬레이터는 폴백 모드로 동작합니다.







## Project Structure

```
my-better-t-app/
├── apps/
│   ├── web/         # Fullstack application (Next.js)
│   └── ai-backend/  # Python FastAPI 예측 서비스
├── packages/
│   ├── api/         # API layer / business logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:studio`: Open database studio UI
- `cd packages/db && bun run db:push`: Push schema changes to PostgreSQL
- `cd packages/db && bun run db:seed`: Generate seed data
- `cd packages/db && bun run db:seed-large`: Generate large sample data
- `cd packages/db && bun run db:seed-chart`: Generate chart entry sample data

## Deployment

### Supabase + Vercel 배포

이 프로젝트는 Supabase (PostgreSQL)와 Vercel (Next.js)로 배포됩니다.

#### 빠른 가이드
1. **Supabase 마이그레이션**: `docs/Supabase_마이그레이션_가이드.md` 참고
2. **Vercel 배포**: `docs/Vercel_배포_가이드.md` 참고
3. **상세 계획**: `docs/Supabase_Vercel_배포_계획.md` 참고

#### 환경변수 설정
- **로컬**: `apps/web/.env.local`에 `DATABASE_URL` 설정
- **Vercel**: 프로젝트 설정 → Environment Variables에서 설정
  - `DATABASE_URL`: Supabase Connection Pooler URL (포트 6543)
  - `FASTAPI_URL`: FastAPI 백엔드 URL (선택)
  - `NODE_ENV`: production
