# GitHub 저장소 생성 및 연결 가이드

## 방법 1: GitHub 웹사이트에서 생성 (권장)

### 1. 저장소 생성

1. [GitHub](https://github.com) 접속 및 로그인
2. 우측 상단 "+" → "New repository" 클릭
3. 저장소 정보 입력:
   - **Repository name**: `ai-invest-analysis`
   - **Description**: "AI 기반 콘텐츠 투자 분석 시스템 - Next.js, tRPC, Drizzle ORM, Supabase"
   - **Visibility**: Public 또는 Private 선택
   - **Initialize this repository with**: 모두 체크 해제 (기존 코드가 있으므로)
4. "Create repository" 클릭

### 2. 로컬 저장소와 연결

생성 후 GitHub에서 표시되는 명령어를 사용하거나, 아래 명령어 실행:

```bash
cd "d:\AI_Work\29. distribution\my-better-t-app"

# 원격 저장소 추가 (YOUR_USERNAME을 실제 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/ai-invest-analysis.git

# 브랜치 이름 확인 (현재 master)
git branch -M main  # 또는 master 유지

# 첫 푸시
git push -u origin main  # 또는 master
```

## 방법 2: GitHub CLI 사용 (선택)

```bash
# GitHub CLI 설치 필요 (https://cli.github.com)
gh auth login
gh repo create ai-invest-analysis --public --description "AI 기반 콘텐츠 투자 분석 시스템"
git remote add origin https://github.com/YOUR_USERNAME/ai-invest-analysis.git
git push -u origin main
```

## 저장소 연결 확인

```bash
# 원격 저장소 확인
git remote -v

# 출력 예시:
# origin  https://github.com/YOUR_USERNAME/ai-invest-analysis.git (fetch)
# origin  https://github.com/YOUR_USERNAME/ai-invest-analysis.git (push)
```

## 다음 단계

저장소 생성 및 푸시 완료 후:
1. **Supabase 마이그레이션**: `docs/Supabase_마이그레이션_가이드.md` 참고
2. **Vercel 배포**: `docs/Vercel_배포_가이드.md` 참고

---

**참고**: GitHub MCP 인증이 설정되어 있다면 MCP를 통해 저장소를 생성할 수 있습니다.



