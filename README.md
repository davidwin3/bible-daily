# Bible Daily 📖

중고등학생을 위한 성경말씀 소감 공유 플랫폼

[![CI/CD](https://github.com/davidwin3/bible-daily/actions/workflows/frontend-ci-cd.yml/badge.svg)](https://github.com/davidwin3/bible-daily/actions/workflows/frontend-ci-cd.yml)
[![Backend CI/CD](https://github.com/davidwin3/bible-daily/actions/workflows/backend-ci-cd.yml/badge.svg)](https://github.com/davidwin3/bible-daily/actions/workflows/backend-ci-cd.yml)
[![Security](https://github.com/davidwin3/bible-daily/actions/workflows/security-quality.yml/badge.svg)](https://github.com/davidwin3/bible-daily/actions/workflows/security-quality.yml)
[![codecov](https://codecov.io/gh/davidwin3/bible-daily/branch/main/graph/badge.svg)](https://codecov.io/gh/davidwin3/bible-daily)

## 🌟 프로젝트 소개

Bible Daily는 중고등학생들이 매일 성경을 읽고 소감을 나누며, 서로 격려할 수 있는 PWA(Progressive Web App) 플랫폼입니다.

### 주요 기능

- 📱 **PWA 지원**: 네이티브 앱과 같은 사용자 경험
- 📖 **일일 성경 읽기 미션**: 체계적인 성경 읽기 계획
- ✍️ **소감 공유**: 말씀에 대한 개인적인 묵상과 소감 나누기
- 👥 **소그룹(셀) 관리**: 담당자와 구성원 간의 소통
- 💬 **실시간 알림**: 푸시 알림을 통한 격려와 소통
- 🏆 **진행률 추적**: 개인 및 그룹별 성경 읽기 현황

## 🏗️ 기술 스택

### Frontend

- **React 18** + **TypeScript**
- **Vite** (빌드 도구)
- **TailwindCSS** + **Shadcn/ui**
- **React Query** (서버 상태 관리)
- **PWA** (Service Worker, Push Notifications)

### Backend

- **NestJS** + **TypeScript**
- **TypeORM** + **MySQL**
- **JWT** 인증
- **Google OAuth 2.0**
- **Firebase** (푸시 알림)

### DevOps & Infrastructure

- **GitHub Actions** (CI/CD)
- **Docker** (컨테이너화)
- **Vercel** (Frontend 배포)
- **Railway** (Backend 배포)
- **Prometheus** + **Grafana** (모니터링)

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 20+
- pnpm 8+
- MySQL 8.0+
- Docker (선택사항)

### 로컬 개발 환경 설정

1. **저장소 클론**

   ```bash
   git clone https://github.com/davidwin3/bible-daily.git
   cd bible-daily
   ```

2. **의존성 설치**

   ```bash
   pnpm install
   ```

3. **환경 변수 설정**

   ```bash
   # Backend 환경 변수
   cp backend/env.example backend/.env

   # Frontend 환경 변수
   cp frontend/env.example frontend/.env

   # 실제 값으로 수정
   vim backend/.env
   vim frontend/.env
   ```

4. **데이터베이스 설정**

   ```bash
   # 데이터베이스 마이그레이션
   pnpm --filter backend migration:run

   # 시드 데이터 생성 (선택사항)
   pnpm --filter backend seed:run
   ```

5. **개발 서버 실행**

   ```bash
   # Backend 서버 (포트 3000)
   pnpm --filter backend start:dev

   # Frontend 서버 (포트 5173)
   pnpm --filter frontend dev
   ```

### Docker를 사용한 실행

```bash
# 전체 스택 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

## 📁 프로젝트 구조

```
bible-daily/
├── .github/
│   └── workflows/          # GitHub Actions 워크플로우
├── backend/                # NestJS 백엔드 애플리케이션
│   ├── src/
│   │   ├── auth/          # 인증 모듈
│   │   ├── users/         # 사용자 관리
│   │   ├── posts/         # 게시물 관리
│   │   ├── missions/      # 미션 관리
│   │   ├── cells/         # 셀 관리
│   │   └── entities/      # TypeORM 엔티티
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React 프론트엔드 애플리케이션
│   ├── src/
│   │   ├── components/    # 재사용 가능한 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── hooks/         # 커스텀 훅
│   │   ├── lib/           # 유틸리티 및 설정
│   │   └── contexts/      # React Context
│   ├── Dockerfile
│   └── package.json
├── deployment/             # 배포 설정
│   ├── environments/      # 환경별 Kubernetes 설정
│   └── scripts/           # 배포 스크립트
├── docker-compose.yml      # 로컬 개발 환경
├── DEPLOYMENT.md           # 배포 가이드
└── CICD-SETUP.md          # CI/CD 설정 가이드
```

## 🔄 CI/CD 파이프라인

### 워크플로우 개요

- **테스트**: Unit, Integration, E2E 테스트 자동 실행
- **보안 스캔**: SAST, 의존성 스캔, 컨테이너 스캔
- **빌드**: Docker 이미지 빌드 및 레지스트리 푸시
- **배포**: 환경별 자동 배포 (dev → staging → production)

### 배포 환경

| 환경        | 브랜치    | 도메인                    | 배포 방식         |
| ----------- | --------- | ------------------------- | ----------------- |
| Development | `develop` | `dev.bible-daily.com`     | 자동 배포         |
| Staging     | `main`    | `staging.bible-daily.com` | 자동 배포         |
| Production  | `main`    | `bible-daily.com`         | 수동 승인 후 배포 |

### 설정 가이드

CI/CD 파이프라인 설정은 [CICD-SETUP.md](./CICD-SETUP.md)를 참조하세요.

## 🧪 테스트

### 테스트 실행

```bash
# 전체 테스트 실행
pnpm test

# 프로젝트별 테스트
pnpm --filter backend test
pnpm --filter frontend test

# 커버리지 포함 테스트
pnpm --filter backend test:cov
pnpm --filter frontend test:cov

# E2E 테스트
pnpm --filter frontend test:e2e
```

### 테스트 구조

- **Unit Tests**: 개별 함수/컴포넌트 테스트
- **Integration Tests**: API 엔드포인트 테스트
- **E2E Tests**: 전체 사용자 플로우 테스트

## 📊 모니터링

### 메트릭 및 로그

- **애플리케이션 메트릭**: 응답 시간, 처리량, 에러율
- **인프라 메트릭**: CPU, 메모리, 디스크 사용률
- **비즈니스 메트릭**: 사용자 활동, 미션 완료율

### 대시보드

- [Grafana 대시보드](https://grafana.bible-daily.com)
- [GitHub Actions](https://github.com/davdwin3/bible-daily/actions)

## 🤝 기여하기

### 개발 워크플로우

1. **이슈 생성**: 기능 요청이나 버그 리포트
2. **브랜치 생성**: `feature/기능명` 또는 `fix/버그명`
3. **개발 및 테스트**: 로컬에서 개발 및 테스트
4. **Pull Request**: `develop` 브랜치로 PR 생성
5. **코드 리뷰**: 팀원 리뷰 및 승인
6. **머지**: `develop` 브랜치로 머지

### 코딩 컨벤션

- **TypeScript**: 엄격한 타입 체크
- **ESLint + Prettier**: 코드 스타일 자동 포맷팅
- **Conventional Commits**: 커밋 메시지 규칙 준수
- **테스트**: 새로운 기능에 대한 테스트 작성 필수

### 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 설정 변경
```

## 📄 라이선스

이 프로젝트는 [MIT License](LICENSE)를 따릅니다.

## 📞 연락처

- **개발팀**: dev@bible-daily.com
- **이슈 리포트**: [GitHub Issues](https://github.com/davdwin3/bible-daily/issues)
- **문서**: [Wiki](https://github.com/davidwin3/bible-daily/wiki)

## 🙏 감사의 말

이 프로젝트는 중고등학생들의 신앙 성장을 돕기 위해 시작되었습니다. 기여해주신 모든 분들께 감사드립니다.

---

**"너희 말은 항상 은혜 가운데서 소금으로 맛을 냄과 같이 하라 그리하면 각 사람에게 마땅히 대답할 것을 알리라" (골로새서 4:6)**
