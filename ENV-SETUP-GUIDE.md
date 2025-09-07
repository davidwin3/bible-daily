# 환경 변수 설정 가이드

## 개요

이 가이드는 Bible Daily 프로젝트의 환경 변수를 안전하게 설정하고 관리하는 방법을 설명합니다.

## 환경 변수 파일 구조

### 개발 환경 (.env.development)

```bash
# Database
DB_HOST=localhost
DB_PORT=13306
DB_USERNAME=root
DB_PASSWORD="Q!w2e3r4"
DB_DATABASE=bible_daily

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=""
REDIS_DB=0
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
JWT_REFRESH_EXPIRES_IN=7d

# Firebase
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_PRIVATE_KEY_ID="your-private-key-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL="your-client-email@your-project.iam.gserviceaccount.com"
FIREBASE_CLIENT_ID="your-client-id"
FIREBASE_AUTH_URI="https://accounts.google.com/o/oauth2/auth"
FIREBASE_TOKEN_URI="https://oauth2.googleapis.com/token"

# Server
PORT=3000
NODE_ENV=development

# SSL Configuration (production only)
USE_SSL=false
```

### 운영 환경 (.env.production)

```bash
# Database
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=bible_user
DB_PASSWORD="your-secure-password"
DB_DATABASE=bible_daily
DB_ROOT_PASSWORD="your-root-password"

# Redis Cache
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD="your-redis-password"
REDIS_DB=0
REDIS_URL="redis://:your-redis-password@redis:6379"

# JWT
JWT_SECRET="your-production-jwt-secret-key"
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET="your-production-refresh-secret-key"
JWT_REFRESH_EXPIRES_IN=7d

# Firebase
FIREBASE_PROJECT_ID="your-production-firebase-project"
FIREBASE_PRIVATE_KEY_ID="your-production-private-key-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRODUCTION_PRIVATE_KEY\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project.iam.gserviceaccount.com"
FIREBASE_CLIENT_ID="your-production-client-id"
FIREBASE_AUTH_URI="https://accounts.google.com/o/oauth2/auth"
FIREBASE_TOKEN_URI="https://oauth2.googleapis.com/token"

# Server
PORT=3000
NODE_ENV=production

# SSL Configuration
USE_SSL=true
DOMAIN=your-domain.com
EMAIL=your-email@domain.com
```

## 중요한 규칙

### 1. 따옴표 사용 규칙

**반드시 따옴표를 사용해야 하는 경우:**

- 값에 공백이 포함된 경우
- 특수 문자가 포함된 경우 (!, @, #, $, %, ^, &, \*, 등)
- 멀티라인 값 (RSA 키 등)
- 빈 값

```bash
# 올바른 예시
DB_PASSWORD="Q!w2e3r4"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"
REDIS_PASSWORD=""

# 잘못된 예시 (쉘 오류 발생 가능)
DB_PASSWORD=Q!w2e3r4
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
YOUR_KEY
-----END PRIVATE KEY-----
```

### 2. 변수명 규칙

- 대문자와 언더스코어만 사용
- 숫자는 중간이나 끝에만 사용
- 알파벳으로 시작해야 함

```bash
# 올바른 예시
DB_HOST=localhost
JWT_SECRET_KEY=secret
API_VERSION_2=v2

# 잘못된 예시
2DB_HOST=localhost
db-host=localhost
DB HOST=localhost
```

### 3. Firebase Private Key 처리

Firebase private key는 특별한 주의가 필요합니다:

```bash
# 방법 1: 이스케이프된 개행 문자 사용
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"

# 방법 2: 실제 개행 문자 사용 (따옴표 필수)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----"
```

## 환경 변수 검증

프로젝트에는 환경 변수 파일을 검증하는 스크립트가 포함되어 있습니다:

```bash
# 환경 변수 파일 검증
./scripts/validate-env.sh .env.production

# SSL 설정 확인
./scripts/validate-env.sh --check-ssl .env.production
```

### 검증 항목

1. **파일 형식 검증**

   - 올바른 환경 변수 형식 (KEY=VALUE)
   - 유효한 변수명 형식

2. **값 검증**

   - 따옴표가 필요한 값 확인
   - 멀티라인 값 감지
   - 빈 값 확인

3. **보안 검증**
   - Private key 형식 확인
   - 민감한 정보 노출 확인

## 배포 시 주의사항

### GitHub Actions에서의 처리

GitHub Actions는 환경 변수 파일을 직접 source하지 않고, 안전한 방법으로 처리합니다:

```bash
# 기존 방식 (문제 발생 가능)
source .env.production

# 개선된 방식 (안전함)
if grep -q "^USE_SSL=true" .env.production; then
  COMPOSE_FILE="docker-compose.ssl.yml"
fi
```

### Docker Compose에서의 처리

Docker Compose는 환경 변수 파일을 자동으로 로드합니다:

```yaml
# docker-compose.yml
services:
  backend:
    env_file:
      - .env.production
    environment:
      - NODE_ENV=production
```

## 보안 모범 사례

### 1. 민감한 정보 관리

- GitHub Secrets 사용
- 환경 변수 파일을 .gitignore에 추가
- 정기적인 키 로테이션

### 2. 권한 관리

```bash
# 환경 변수 파일 권한 설정
chmod 600 .env.production
chown root:root .env.production
```

### 3. 백업 및 복구

```bash
# 환경 변수 파일 백업
cp .env.production .env.production.backup.$(date +%Y%m%d)

# 암호화된 백업
gpg -c .env.production
```

## 문제 해결

### 일반적인 오류

1. **"command not found" 오류**

   ```bash
   # 원인: 따옴표 없이 특수 문자 사용
   PRIVATE_KEY=-----BEGIN PRIVATE KEY-----

   # 해결: 따옴표 추가
   PRIVATE_KEY="-----BEGIN PRIVATE KEY-----"
   ```

2. **"unexpected token" 오류**

   ```bash
   # 원인: 멀티라인 값에 따옴표 없음
   PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
   MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
   -----END PRIVATE KEY-----

   # 해결: 전체를 따옴표로 감싸기
   PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
   MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
   -----END PRIVATE KEY-----"
   ```

3. **환경 변수가 로드되지 않는 경우**

   ```bash
   # 파일 권한 확인
   ls -la .env.production

   # 파일 형식 확인
   ./scripts/validate-env.sh .env.production

   # Docker Compose 로그 확인
   docker-compose logs backend
   ```

## 참고 자료

- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
