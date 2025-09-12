# 설정 파일 및 보안 규칙

## 🚫 중요 파일 수정 제한

### 금지된 자동 수정 파일들
- `package.json` - 개발자 승인 후에만 수정
- `.env` 파일들 - 절대 자동 수정 금지
- `vite.config.ts` / `webpack.config.js` - 신중한 검토 필요
- `docker-compose*.yml` - 인프라 영향 검토 필요
- `tsconfig*.json` - 프로젝트 전체 영향 검토
- 인증서 파일 (*.key, *.pem, *.crt) - 절대 수정 금지

### 설정 변경 시 필수 절차
1. **개발자에게 변경 이유 설명**
2. **변경 사항의 영향도 분석 제시**
3. **명시적 동의 확인 후 진행**
4. **백업 방안 제시**

## 🔐 환경 변수 보안 규칙

### .env 파일 관리
```bash
# ✅ 올바른 .env 구조
NODE_ENV=development
PORT=3000

# 데이터베이스 (민감 정보)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=bible_user
DB_PASSWORD=***NEVER_EXPOSE***
DB_DATABASE=bible_daily

# JWT (고보안)
JWT_SECRET=***MINIMUM_32_CHARACTERS***
JWT_REFRESH_SECRET=***DIFFERENT_FROM_JWT_SECRET***

# Google OAuth (공개 가능한 CLIENT_ID, 비공개 SECRET)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=***NEVER_EXPOSE***

# 암호화 (최고보안)
ENCRYPTION_KEY=***EXACTLY_32_CHARACTERS***
```

### 환경 변수 검증 규칙
- JWT_SECRET: 최소 32자 이상
- DB_PASSWORD: 8자 이상, 특수문자 포함
- ENCRYPTION_KEY: 정확히 32자
- 개발/운영 환경 분리 필수

### 금지 사항
```bash
# ❌ 절대 금지
JWT_SECRET=123456
DB_PASSWORD=password
NODE_ENV=production  # 개발 환경에서

# ❌ 코드에 하드코딩 금지
const secret = "my-secret-key";
const dbPassword = "password123";
```

## 📦 패키지 관리 보안

### package.json 수정 시 고려사항
- **의존성 추가**: 보안 취약점 확인 (`npm audit`)
- **버전 업데이트**: Breaking changes 확인
- **스크립트 수정**: 보안 위험 검토
- **권한 변경**: sudo, elevated 권한 사용 금지

### 권장 보안 검사
```bash
# 의존성 보안 검사
npm audit
npm audit fix

# 라이선스 확인
npm list --depth=0
```

## 🐳 Docker 및 인프라 보안

### Dockerfile 보안 규칙
```dockerfile
# ✅ 권장 패턴
FROM node:20-alpine AS base
USER node
WORKDIR /app

# 최소 권한으로 실행
RUN chown -R node:node /app
COPY --chown=node:node package*.json ./

# ❌ 금지 패턴
# FROM node:latest  (취약점 위험)
# USER root          (권한 상승 위험)
# COPY . .          (불필요한 파일 복사)
```

### docker-compose 보안
- 포트 노출 최소화
- 볼륨 마운트 권한 제한
- 네트워크 분리
- 비밀 정보는 secrets 사용

## 🌐 웹서버 설정 보안

### Nginx 보안 설정
```nginx
# 보안 헤더 필수
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# 민감한 파일 접근 차단
location ~ /\. {
    deny all;
}

location ~ \.(env|log|bak)$ {
    deny all;
}
```

## 🔧 TypeScript 및 빌드 설정

### tsconfig.json 보안 고려사항
```json
{
  "compilerOptions": {
    "strict": true, // 타입 안전성 필수
    "noImplicitAny": true, // any 타입 제한
    "noImplicitReturns": true, // 반환값 검증
    "noUnusedLocals": true, // 미사용 변수 검증
    "removeComments": true // 프로덕션 빌드에서 주석 제거
  }
}
```

### Vite 보안 설정
```typescript
// vite.config.ts
export default defineConfig({
  define: {
    // 환경 변수 노출 제한
    __DEV__: process.env.NODE_ENV === "development",
  },
  server: {
    // HTTPS 강제 (운영환경)
    https: process.env.NODE_ENV === "production",
  },
});
```

## 🔑 인증서 및 키 관리

### SSL/TLS 인증서
- 인증서 파일 절대 코드에 포함 금지
- 환경 변수나 볼륨 마운트 사용
- 정기적인 갱신 스케줄링
- 개인키 권한 600으로 제한

### API 키 관리
- 클라이언트에 노출되는 키 최소화
- 서버사이드 키는 환경 변수로만 관리
- 키 순환(rotation) 정책 수립

## 🚨 보안 위험 감지

### 자동 감지 대상
```bash
# 민감한 패턴 검색
grep -r "password\|secret\|key" --include="*.js" --include="*.ts"
grep -r "mongodb://\|mysql://\|postgres://" .

# 하드코딩된 IP 주소
grep -r "[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}" .
```

### Git 보안
```bash
# .gitignore 필수 항목 확인
echo ".env*
*.log
node_modules/
dist/
.DS_Store
*.key
*.pem" >> .gitignore
```

## 📋 설정 파일 체크리스트

### 새 프로젝트 설정 시
- [ ] .env.example 파일 생성
- [ ] .gitignore에 민감 파일 추가
- [ ] 환경 변수 검증 로직 추가
- [ ] Docker 보안 설정 확인
- [ ] 웹서버 보안 헤더 설정
- [ ] SSL/TLS 인증서 설정

### 기존 프로젝트 검토 시
- [ ] 하드코딩된 비밀 정보 검색
- [ ] 의존성 보안 취약점 확인
- [ ] 환경 변수 강도 검증
- [ ] 로그에 민감 정보 노출 여부 확인
- [ ] 접근 권한 설정 검토

## ⚡ Node.js 버전 관리

### 버전 정책
- Node.js 버전은 `.nvmrc` 파일을 우선 따름
- `.nvmrc`가 없을 경우 `v20.19.4` 사용
- LTS 버전 우선 사용
- 보안 패치 버전 정기 업데이트

### 개발 환경 설정
```bash
# 프로젝트 시작 전 필수
nvm use
pnpm install
pnpm dev  # 루트 폴더에서 실행
```