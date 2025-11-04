# GitHub 푸시 가이드

## 빠른 시작

### 1. GitHub 저장소 생성

1. [GitHub](https://github.com) 접속 및 로그인
2. 우측 상단 "+" → "New repository" 클릭
3. 저장소 정보 입력:
   - **Repository name**: `ai-invest-analysis` (또는 원하는 이름)
   - **Description**: "AI 기반 콘텐츠 투자 분석 시스템"
   - **Visibility**: Private (또는 Public)
   - **Initialize**: 체크 해제 (기존 코드가 있으므로)
4. "Create repository" 클릭

### 2. 로컬 저장소와 연결

```bash
# 현재 디렉토리에서
cd "d:\AI_Work\29. distribution\my-better-t-app"

# GitHub 저장소 URL 확인 (예시)
# https://github.com/[USERNAME]/[REPO_NAME].git

# 원격 저장소 추가
git remote add origin https://github.com/[USERNAME]/[REPO_NAME].git

# 브랜치 이름 확인 및 변경 (필요 시)
git branch -M main

# 첫 푸시
git push -u origin main
```

### 3. 푸시 확인

- GitHub 저장소 페이지에서 파일 확인
- 모든 파일이 올바르게 푸시되었는지 확인
- `.env`, `.env.local` 파일이 제외되었는지 확인

---

## 주의사항

### 민감한 정보 확인
- [ ] `.env`, `.env.local` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 환경변수 파일이 커밋되지 않았는지 확인
- [ ] 데이터베이스 비밀번호가 코드에 하드코딩되지 않았는지 확인

### 커밋 확인
```bash
# 최근 커밋 확인
git log --oneline -10

# 커밋된 파일 확인
git show --name-only HEAD
```

---

## 다음 단계

GitHub 푸시 완료 후:
1. **Supabase 마이그레이션**: `docs/Supabase_마이그레이션_가이드.md` 참고
2. **Vercel 배포**: `docs/Vercel_배포_가이드.md` 참고

