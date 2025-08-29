#!/bin/bash

# Bible Daily 개발환경 리셋 스크립트
# 데이터베이스와 Redis 데이터를 완전히 초기화합니다

set -e

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

show_help() {
    echo "사용법: $0 [옵션]"
    echo ""
    echo "이 스크립트는 개발환경을 완전히 초기화합니다:"
    echo "  - 모든 데이터베이스 데이터 삭제"
    echo "  - Redis 캐시 데이터 삭제"
    echo "  - 컨테이너 재시작"
    echo ""
    echo "옵션:"
    echo "  -y, --yes       확인 프롬프트 없이 바로 실행"
    echo "  -h, --help      도움말 표시"
    echo ""
    echo "⚠️  주의: 이 작업은 되돌릴 수 없습니다!"
}

# 기본값 설정
AUTO_YES=false

# 옵션 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        -y|--yes)
            AUTO_YES=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "알 수 없는 옵션: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
done

echo "🔄 Bible Daily 개발환경을 리셋합니다..."
echo ""

# 경고 메시지
print_warning "⚠️  경고: 이 작업은 다음 데이터를 모두 삭제합니다:"
echo "    • 모든 데이터베이스 테이블과 데이터"
echo "    • Redis 캐시 데이터"
echo "    • 사용자 계정, 게시물, 미션 등 모든 데이터"
echo ""
print_error "이 작업은 되돌릴 수 없습니다!"
echo ""

# 확인 프롬프트
if [ "$AUTO_YES" = false ]; then
    read -p "정말로 개발환경을 리셋하시겠습니까? 'RESET'을 입력하세요: " -r
    echo
    if [ "$REPLY" != "RESET" ]; then
        print_status "작업이 취소되었습니다."
        exit 0
    fi
fi

print_status "개발환경 리셋을 시작합니다..."

# 1. 기존 컨테이너 중지 및 볼륨 삭제
print_status "1. 기존 컨테이너와 볼륨을 삭제합니다..."
docker-compose -f docker-compose.dev.yml down -v --remove-orphans

# 2. 개발환경 이미지 재빌드 (필요한 경우)
print_status "2. 컨테이너 이미지를 확인합니다..."
docker-compose -f docker-compose.dev.yml pull

# 3. 새로운 컨테이너 시작
print_status "3. 새로운 컨테이너를 시작합니다..."
docker-compose -f docker-compose.dev.yml up -d mysql-dev redis-dev

# 4. MySQL 서비스 대기
print_status "4. MySQL 서비스가 준비될 때까지 기다립니다..."
for i in {1..60}; do
    if docker-compose -f docker-compose.dev.yml exec -T mysql-dev mysqladmin ping -h localhost --silent 2>/dev/null; then
        print_success "MySQL 서비스가 준비되었습니다!"
        break
    fi
    
    if [ $i -eq 60 ]; then
        print_error "MySQL 서비스 시작에 실패했습니다."
        exit 1
    fi
    
    echo -n "."
    sleep 2
done

# 5. Redis 서비스 대기
print_status "5. Redis 서비스가 준비될 때까지 기다립니다..."
for i in {1..30}; do
    if docker-compose -f docker-compose.dev.yml exec -T redis-dev redis-cli ping 2>/dev/null | grep -q PONG; then
        print_success "Redis 서비스가 준비되었습니다!"
        break
    fi
    
    if [ $i -eq 30 ]; then
        print_error "Redis 서비스 시작에 실패했습니다."
        exit 1
    fi
    
    echo -n "."
    sleep 1
done

# 6. 데이터베이스 초기화 확인
print_status "6. 데이터베이스 상태를 확인합니다..."
DB_NAME=$(grep "^DB_DATABASE=" .env 2>/dev/null | cut -d'=' -f2 || echo "bible_daily_dev")

# 데이터베이스 존재 확인
if docker-compose -f docker-compose.dev.yml exec -T mysql-dev mysql -u root -p"${DB_ROOT_PASSWORD:-root_password}" -e "USE $DB_NAME;" 2>/dev/null; then
    print_success "데이터베이스 '$DB_NAME'가 생성되었습니다."
else
    print_warning "데이터베이스가 아직 생성되지 않았을 수 있습니다."
fi

# 7. Redis 초기화 확인
print_status "7. Redis 상태를 확인합니다..."
REDIS_INFO=$(docker-compose -f docker-compose.dev.yml exec -T redis-dev redis-cli info keyspace 2>/dev/null || echo "")
if [ -z "$REDIS_INFO" ] || echo "$REDIS_INFO" | grep -q "db0:keys=0"; then
    print_success "Redis가 깨끗한 상태로 초기화되었습니다."
else
    print_warning "Redis에 일부 데이터가 남아있을 수 있습니다."
fi

print_success "🎉 개발환경 리셋이 완료되었습니다!"

echo ""
echo "📊 서비스 정보:"
echo "  MySQL:  localhost:3306 (사용자: bible_user, 데이터베이스: $DB_NAME)"
echo "  Redis:  localhost:6379"
echo ""
echo "📋 다음 단계:"
echo "  1. 백엔드 애플리케이션을 시작하여 데이터베이스 스키마를 생성하세요:"
echo "     cd backend && npm run start:dev"
echo ""
echo "  2. 프론트엔드 애플리케이션을 시작하세요:"
echo "     cd frontend && npm run dev"
echo ""
echo "  3. 필요한 경우 초기 데이터를 생성하세요 (관리자 계정, 샘플 미션 등)"
echo ""
echo "🔧 유용한 명령어:"
echo "  로그 확인: ./scripts/dev-logs.sh"
echo "  환경 중지: ./scripts/dev-stop.sh"

