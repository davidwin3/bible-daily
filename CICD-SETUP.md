# Bible Daily - CI/CD 설정 가이드

이 문서는 Bible Daily 프로젝트의 CI/CD 파이프라인을 설정하는 단계별 가이드입니다.

## 🚀 빠른 시작

### 1. GitHub Repository 설정

#### Secrets 설정
GitHub Repository → Settings → Secrets and variables → Actions에서 다음 시크릿들을 추가하세요:

```bash
# 필수 공통 시크릿
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id  
VERCEL_PROJECT_ID=your_vercel_project_id
RAILWAY_TOKEN=your_railway_token
SLACK_WEBHOOK_URL=your_slack_webhook_url

# 보안 도구 (선택사항)
SONAR_TOKEN=your_sonar_token
SNYK_TOKEN=your_snyk_token
SEMGREP_APP_TOKEN=your_semgrep_token
```

#### Environments 설정
GitHub Repository → Settings → Environments에서 다음 환경들을 생성하세요:

1. **development**
   - Protection rules: None
   - Environment secrets: `*_DEVELOPMENT` 시크릿들

2. **staging** 
   - Protection rules: None
   - Environment secrets: `*_STAGING` 시크릿들

3. **production**
   - Protection rules: Required reviewers (1명 이상)
   - Environment secrets: `*_PRODUCTION` 시크릿들

### 2. 외부 서비스 설정

#### Vercel (Frontend 배포)
1. [Vercel](https://vercel.com)에 로그인
2. 프로젝트 생성 및 GitHub 연동
3. API 토큰 생성: Settings → Tokens
4. 프로젝트 ID 확인: Project Settings → General

#### Railway (Backend 배포)
1. [Railway](https://railway.app)에 로그인
2. 각 환경별 프로젝트 생성 (dev, staging, prod)
3. API 토큰 생성: Account Settings → Tokens
4. 프로젝트 ID 확인: Project Settings

#### 데이터베이스 설정
각 환경별로 MySQL 데이터베이스를 준비하세요:
- **Development**: Railway MySQL 또는 로컬 MySQL
- **Staging**: Railway MySQL 또는 AWS RDS
- **Production**: AWS RDS (권장)

### 3. 환경 변수 설정

각 환경별로 다음 시크릿들을 GitHub Secrets에 추가하세요:

#### Development Environment
```bash
DB_HOST_DEVELOPMENT=your_dev_db_host
DB_PORT_DEVELOPMENT=3306
DB_USERNAME_DEVELOPMENT=your_dev_db_user
DB_PASSWORD_DEVELOPMENT=your_dev_db_password
DB_DATABASE_DEVELOPMENT=bible_daily_dev
JWT_SECRET_DEVELOPMENT=your_dev_jwt_secret
# ... (전체 목록은 DEPLOYMENT.md 참조)
```

#### Staging Environment
```bash
DB_HOST_STAGING=your_staging_db_host
DB_PORT_STAGING=3306
# ... (development와 동일한 패턴)
```

#### Production Environment
```bash
DB_HOST_PRODUCTION=your_prod_db_host
DB_PORT_PRODUCTION=3306
# ... (development와 동일한 패턴)
```

## 📋 체크리스트

### GitHub 설정
- [ ] Repository secrets 추가 완료
- [ ] Environments (development, staging, production) 생성
- [ ] Production environment에 reviewer 설정
- [ ] Branch protection rules 설정 (main, develop)

### 외부 서비스
- [ ] Vercel 프로젝트 생성 및 토큰 발급
- [ ] Railway 프로젝트 생성 (3개 환경)
- [ ] 데이터베이스 준비 (3개 환경)
- [ ] 도메인 설정 (선택사항)

### 환경 변수
- [ ] Development 환경 시크릿 설정
- [ ] Staging 환경 시크릿 설정  
- [ ] Production 환경 시크릿 설정
- [ ] Google OAuth 설정 (3개 환경)
- [ ] Firebase 설정 (3개 환경)

### 테스트 및 보안
- [ ] SonarCloud 연동 (선택사항)
- [ ] Snyk 연동 (선택사항)
- [ ] Slack 알림 설정
- [ ] 테스트 데이터베이스 설정

## 🔧 로컬 개발 환경 설정

### Docker Compose 사용
```bash
# 환경 변수 파일 생성
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env

# 환경 변수 값 설정 (실제 값으로 변경)
vim backend/.env
vim frontend/.env

# Docker Compose로 전체 스택 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

### 개별 실행
```bash
# 의존성 설치
pnpm install

# 데이터베이스 마이그레이션
pnpm --filter backend migration:run

# 개발 서버 실행
pnpm --filter backend start:dev    # Backend: http://localhost:3000
pnpm --filter frontend dev          # Frontend: http://localhost:5173
```

## 🚀 배포 프로세스

### 자동 배포
1. **Development**: `develop` 브랜치에 푸시
2. **Staging**: `main` 브랜치에 푸시 또는 PR 머지
3. **Production**: Staging 배포 후 GitHub Actions에서 수동 승인

### 수동 배포 (Kubernetes)
```bash
# 배포 스크립트 사용
./deployment/scripts/deploy.sh production all

# 또는 kubectl 직접 사용
kubectl apply -f deployment/environments/production.yml
```

## 📊 모니터링 설정

### Grafana 대시보드
1. Grafana 인스턴스 설정
2. Prometheus 데이터 소스 추가
3. 대시보드 임포트: `monitoring/grafana/dashboards/`

### 알림 설정
1. Slack 웹훅 URL 생성
2. GitHub Secrets에 `SLACK_WEBHOOK_URL` 추가
3. 알림 채널 설정:
   - `#deployments`: 배포 알림
   - `#testing`: 테스트 실패 알림
   - `#security`: 보안 이슈 알림

## 🔍 트러블슈팅

### 일반적인 문제

#### 1. GitHub Actions 실패
```bash
# 워크플로우 로그 확인
gh run list --repo your-org/bible-daily
gh run view [RUN_ID] --log

# 재실행
gh run rerun [RUN_ID]
```

#### 2. 시크릿 값 확인
```bash
# GitHub CLI로 시크릿 목록 확인
gh secret list

# 특정 시크릿 설정
gh secret set SECRET_NAME --body "secret_value"
```

#### 3. 배포 실패
- 환경 변수 값 확인
- 외부 서비스 상태 확인
- 로그 분석 및 디버깅

### 도움 요청
- 이슈 생성: [GitHub Issues](https://github.com/your-org/bible-daily/issues)
- 문서 참조: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 팀 연락: dev@bible-daily.com

## 📚 추가 리소스

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Vercel 배포 가이드](https://vercel.com/docs)
- [Railway 배포 가이드](https://docs.railway.app)
- [Docker 가이드](https://docs.docker.com)
- [Kubernetes 가이드](https://kubernetes.io/docs)

---

설정 완료 후 첫 번째 배포를 테스트해보세요! 🎉
