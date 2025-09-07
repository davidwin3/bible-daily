#!/bin/bash

# Bible Daily 개발환경 설정 스크립트
# .env 파일을 개발환경에 맞게 설정합니다

set -e

echo "🔧 Bible Daily 개발환경을 설정합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# .env 파일 백업
if [ -f ".env" ]; then
    print_status ".env 파일을 백업합니다..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# 새로운 .env 파일 생성
print_status "개발환경용 .env 파일을 생성합니다..."

cat > .env << EOF
# Bible Daily 개발환경 설정

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3307
DB_USERNAME=bible_user
DB_PASSWORD=bible_password
DB_DATABASE=bible_daily_dev
DB_ROOT_PASSWORD=root_password

# Redis 설정
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_URL=redis://localhost:6379

# JWT 설정 (개발용)
JWT_SECRET=development-super-secret-jwt-key-for-bible-daily
JWT_EXPIRES_IN=24h

# Firebase 설정 (실제 값으로 변경 필요)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Google OAuth 설정 (실제 값으로 변경 필요)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# VAPID 키 (푸시 알림용 - 실제 값으로 변경 필요)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# 서버 설정
PORT=3000
NODE_ENV=development

# 관리 도구 포트
ADMINER_PORT=8080
REDIS_COMMANDER_PORT=8081

# 프론트엔드 환경변수
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
VITE_FIREBASE_CONFIG={"apiKey":"your-api-key","authDomain":"your-auth-domain","projectId":"your-project-id"}
EOF

print_success ".env 파일이 생성되었습니다!"

echo ""
print_warning "⚠️  다음 설정들을 실제 값으로 변경해주세요:"
echo "   - FIREBASE_* 설정들"
echo "   - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET"
echo "   - VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY"
echo "   - VITE_* 설정들"

echo ""
print_status "📋 다음 단계:"
echo "   1. ./scripts/dev-start.sh 로 개발환경 시작"
echo "   2. 필요한 OAuth 및 Firebase 설정 완료"
echo "   3. 백엔드 및 프론트엔드 애플리케이션 시작"

