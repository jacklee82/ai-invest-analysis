# Vercel 배포 설정 가이드

## Vercel 프로젝트 설정

### Root Directory 설정
**중요**: Vercel 프로젝트 설정에서 **Root Directory를 비워두거나 `./`로 설정**해야 합니다.

Vercel Dashboard → Settings → General → Root Directory:
- **설정하지 않음** 또는 **`./`** (프로젝트 루트)

**❌ 잘못된 설정**: `apps/web` (이렇게 설정하면 Next.js를 찾지 못함)

### Framework Preset
- **Next.js** (자동 감지)

### Build Settings
- **Build Command**: `bun run build` (Turborepo가 자동으로 처리)
- **Output Directory**: `apps/web/.next`
- **Install Command**: `bun install`

### vercel.json 설정
프로젝트 루트의 `vercel.json`:
```json
{
	"buildCommand": "bun run build",
	"outputDirectory": "apps/web/.next",
	"installCommand": "bun install",
	"framework": "nextjs",
	"regions": ["icn1"]
}
```

## 문제 해결

### "No Next.js version detected" 오류

**원인:**
- Vercel의 Root Directory가 `apps/web`으로 설정되어 있음
- 또는 `vercel.json`의 경로가 잘못됨

**해결 방법:**
1. Vercel Dashboard → Settings → General → Root Directory
2. Root Directory를 **비워두거나 `./`로 설정**
3. 재배포

### "Module not found" 오류

**원인:**
- 모노레포 패키지 경로 문제

**해결 방법:**
- `bun install`이 프로젝트 루트에서 실행되는지 확인
- Vercel은 자동으로 workspace를 인식함

### 빌드 타임아웃

**원인:**
- Turborepo 빌드 시간이 길어짐

**해결 방법:**
- 빌드 캐시 활용
- 필요 시 Vercel Pro 플랜 고려



