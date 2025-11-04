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







## Project Structure

```
my-better-t-app/
├── apps/
│   └── web/         # Fullstack application (Next.js)
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
