# GitHub Actions 워크플로우 가이드

이 디렉토리에는 Bible Daily 프로젝트의 모든 GitHub Actions 워크플로우가 포함되어 있습니다. 모든 워크플로우는 **수동 실행**이 가능하도록 설정되어 있습니다.

## 📋 워크플로우 목록

### 1. Frontend CI/CD (`frontend-ci-cd.yml`)

**목적**: 프론트엔드 애플리케이션의 빌드, 테스트, 배포

**자동 트리거**:

- `main`, `develop` 브랜치에 `frontend/**` 경로 변경 시
- Pull Request 생성 시

**수동 실행 옵션**:

- `environment`: 배포 환경 선택 (development/staging/production)
- `skip_tests`: 테스트 건너뛰기 여부
- `deploy_only`: 배포만 실행 (빌드 건너뛰기)

### 2. Backend CI/CD (`backend-ci-cd.yml`)

**목적**: 백엔드 API의 빌드, 테스트, Docker 이미지 생성, 배포

**자동 트리거**:

- `main`, `develop` 브랜치에 `backend/**` 경로 변경 시
- Pull Request 생성 시

**수동 실행 옵션**:

- `environment`: 배포 환경 선택 (development/staging/production)
- `skip_tests`: 테스트 건너뛰기 여부
- `skip_security_scan`: 보안 스캔 건너뛰기 여부
- `deploy_only`: 배포만 실행 (빌드 건너뛰기)

### 3. Test Suite (`test.yml`)

**목적**: 종합적인 테스트 실행 (단위, 통합, E2E, 성능, 시각적 회귀)

**자동 트리거**:

- 모든 브랜치 푸시 및 Pull Request
- 매일 오전 9시 (스케줄)

**수동 실행 옵션**:

- `test_type`: 테스트 타입 선택 (all/unit/integration/e2e/performance/visual)
- `environment`: 테스트 환경 선택 (development/staging/production)
- `parallel_jobs`: 병렬 실행할 작업 수

### 4. Security & Quality (`security-quality.yml`)

**목적**: 보안 취약점 스캔, 코드 품질 분석, 컴플라이언스 검사

**자동 트리거**:

- 모든 브랜치 푸시 및 Pull Request
- 매일 오전 2시 (스케줄)

**수동 실행 옵션**:

- `scan_type`: 스캔 타입 선택 (all/code-quality/security/dependencies/containers/secrets/infrastructure)
- `severity_threshold`: 보안 취약점 심각도 임계값 (low/medium/high/critical)
- `fail_on_issues`: 이슈 발견 시 워크플로우 실패 여부

### 5. Environment Template (`env-template.yml`)

**목적**: 환경 변수 설정 가이드 및 템플릿

**트리거**: 수동 실행만 가능

## 🚀 수동 실행 방법

### GitHub 웹 인터페이스에서 실행

1. **GitHub 저장소로 이동**

   ```
   https://github.com/your-org/bible-daily
   ```

2. **Actions 탭 클릭**

   - 상단 메뉴에서 "Actions" 클릭

3. **워크플로우 선택**

   - 왼쪽 사이드바에서 실행하고 싶은 워크플로우 선택

4. **Run workflow 버튼 클릭**

   - 오른쪽 상단의 "Run workflow" 드롭다운 클릭

5. **옵션 설정 및 실행**
   - 브랜치 선택 (기본값: main)
   - 각 워크플로우별 옵션 설정
   - "Run workflow" 버튼 클릭

### GitHub CLI로 실행

```bash
# GitHub CLI 설치 및 로그인
gh auth login

# 워크플로우 목록 확인
gh workflow list

# 특정 워크플로우 수동 실행
gh workflow run "Frontend CI/CD" \
  --field environment=development \
  --field skip_tests=false

gh workflow run "Backend CI/CD" \
  --field environment=staging \
  --field skip_security_scan=false

gh workflow run "Test Suite" \
  --field test_type=e2e \
  --field environment=development

gh workflow run "Security & Quality Analysis" \
  --field scan_type=security \
  --field severity_threshold=medium
```

### REST API로 실행

```bash
# Personal Access Token 필요
TOKEN="your_github_token"
REPO="your-org/bible-daily"

# Frontend CI/CD 실행
curl -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$REPO/actions/workflows/frontend-ci-cd.yml/dispatches \
  -d '{
    "ref": "main",
    "inputs": {
      "environment": "development",
      "skip_tests": "false"
    }
  }'

# 테스트 실행
curl -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$REPO/actions/workflows/test.yml/dispatches \
  -d '{
    "ref": "main",
    "inputs": {
      "test_type": "all",
      "environment": "development"
    }
  }'
```

## 📊 워크플로우 실행 상태 확인

### GitHub 웹 인터페이스

1. Actions 탭에서 실행 중인 워크플로우 확인
2. 특정 실행을 클릭하여 상세 로그 확인
3. 실패한 작업의 로그 분석

### GitHub CLI

```bash
# 최근 실행 목록 확인
gh run list --limit 10

# 특정 실행 상태 확인
gh run view [RUN_ID]

# 실행 로그 확인
gh run view [RUN_ID] --log

# 실패한 실행 재시작
gh run rerun [RUN_ID]
```

## 🔧 일반적인 사용 시나리오

### 1. 긴급 핫픽스 배포

```bash
# 1. 핫픽스 브랜치에서 백엔드 배포 (테스트 건너뛰기)
gh workflow run "Backend CI/CD" \
  --ref hotfix/critical-bug \
  --field environment=production \
  --field skip_tests=true \
  --field deploy_only=true

# 2. 프론트엔드 배포
gh workflow run "Frontend CI/CD" \
  --ref hotfix/critical-bug \
  --field environment=production \
  --field skip_tests=true
```

### 2. 특정 환경 테스트

```bash
# 스테이징 환경에서 E2E 테스트만 실행
gh workflow run "Test Suite" \
  --field test_type=e2e \
  --field environment=staging
```

### 3. 보안 스캔 실행

```bash
# 고위험 보안 취약점만 스캔
gh workflow run "Security & Quality Analysis" \
  --field scan_type=security \
  --field severity_threshold=high \
  --field fail_on_issues=true
```

### 4. 성능 테스트 실행

```bash
# 성능 테스트만 실행
gh workflow run "Test Suite" \
  --field test_type=performance \
  --field environment=staging
```

## ⚠️ 주의사항

### 1. 환경별 권한

- **Development**: 모든 개발자 실행 가능
- **Staging**: 팀 리더 이상 실행 가능
- **Production**: 관리자만 실행 가능 (승인 필요)

### 2. 리소스 사용량

- 동시에 너무 많은 워크플로우를 실행하지 마세요
- 성능 테스트는 리소스를 많이 사용하므로 필요시에만 실행

### 3. 비용 관리

- GitHub Actions 사용량을 정기적으로 확인하세요
- 불필요한 워크플로우 실행을 피하세요

### 4. 보안

- 프로덕션 환경 배포 시 반드시 승인 과정을 거치세요
- 민감한 정보가 로그에 노출되지 않도록 주의하세요

## 📚 추가 리소스

- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [워크플로우 문법](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub CLI 문서](https://cli.github.com/manual/)
- [프로젝트 배포 가이드](../../DEPLOYMENT.md)
- [CI/CD 설정 가이드](../../CICD-SETUP.md)

## 🆘 문제 해결

### 워크플로우 실행 실패 시

1. 실행 로그 확인
2. 환경 변수 및 시크릿 설정 확인
3. 의존성 및 권한 문제 확인
4. 필요시 개발팀에 문의

### 연락처

- **개발팀**: dev@bible-daily.com
- **DevOps**: ops@bible-daily.com
- **이슈 트래킹**: [GitHub Issues](https://github.com/your-org/bible-daily/issues)
