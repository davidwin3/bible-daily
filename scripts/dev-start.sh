#!/bin/bash

# Bible Daily 개발환경 시작 스크립트

set -e

echo "🚀 Bible Daily 개발환경을 시작합니다..."

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Docker 설치 확인
if ! command -v docker &> /dev/null; then
    print_error "Docker가 설치되어 있지 않습니다. Docker를 먼저 설치해주세요."
    exit 1
fi

# Docker Compose 설치 확인
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose가 설치되어 있지 않습니다. Docker Compose를 먼저 설치해주세요."
    exit 1
fi

# .env 파일 확인 및 생성
if [ ! -f ".env" ]; then
    print_warning ".env 파일이 없습니다. .env.example을 복사합니다."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success ".env 파일이 생성되었습니다. 필요한 환경변수를 설정해주세요."
    else
        print_error ".env.example 파일이 없습니다."
        exit 1
    fi
fi

# 기존 컨테이너 정리 (선택사항)
read -p "기존 개발 컨테이너를 정리하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "기존 개발 컨테이너를 정리합니다..."
    docker-compose -f docker-compose.dev.yml down -v --remove-orphans || true
fi

# 개발 서비스 시작
print_status "개발 서비스를 시작합니다..."
docker-compose -f docker-compose.dev.yml up -d mysql-dev redis-dev

# 헬스체크 대기
print_status "서비스 헬스체크를 기다립니다..."

# MySQL 헬스체크
print_status "MySQL 서비스 확인 중..."
for i in {1..30}; do
    if docker-compose -f docker-compose.dev.yml exec -T mysql-dev mysqladmin ping -h localhost --silent; then
        print_success "MySQL 서비스가 준비되었습니다!"
        break
    fi
    
    if [ $i -eq 30 ]; then
        print_error "MySQL 서비스 시작에 실패했습니다."
        exit 1
    fi
    
    echo -n "."
    sleep 2
done

# Redis 헬스체크
print_status "Redis 서비스 확인 중..."
for i in {1..15}; do
    if docker-compose -f docker-compose.dev.yml exec -T redis-dev redis-cli ping | grep -q PONG; then
        print_success "Redis 서비스가 준비되었습니다!"
        break
    fi
    
    if [ $i -eq 15 ]; then
        print_error "Redis 서비스 시작에 실패했습니다."
        exit 1
    fi
    
    echo -n "."
    sleep 1
done

print_success "🎉 개발환경이 성공적으로 시작되었습니다!"

echo ""
echo "📊 서비스 정보:"
echo "  MySQL:  localhost:3306 (사용자: bible_user, 데이터베이스: bible_daily_dev)"
echo "  Redis:  localhost:6379"
echo ""
echo "🛠️  관리 도구 (선택사항):"
echo "  Adminer를 시작하려면: docker-compose -f docker-compose.dev.yml --profile tools up -d adminer"
echo "  Redis Commander를 시작하려면: docker-compose -f docker-compose.dev.yml --profile tools up -d redis-commander"
echo ""
echo "📋 다음 단계:"
echo "  1. .env 파일의 Google OAuth 및 Firebase 설정을 완료하세요"
echo "  2. 백엔드 애플리케이션을 시작하세요: cd backend && npm run start:dev"
echo "  3. 프론트엔드 애플리케이션을 시작하세요: cd frontend && npm run dev"
echo ""
echo "🔧 유용한 명령어:"
echo "  서비스 중지: ./scripts/dev-stop.sh"
echo "  로그 확인: ./scripts/dev-logs.sh"
echo "  데이터베이스 리셋: ./scripts/dev-reset.sh"
