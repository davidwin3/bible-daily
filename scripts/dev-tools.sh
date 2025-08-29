#!/bin/bash

# Bible Daily 개발 도구 관리 스크립트

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
    echo "사용법: $0 [명령어]"
    echo ""
    echo "개발 도구 관리 명령어:"
    echo "  start           모든 개발 도구 시작"
    echo "  stop            모든 개발 도구 중지"
    echo "  adminer         Adminer (데이터베이스 관리) 시작/중지"
    echo "  redis-ui        Redis Commander (Redis 관리) 시작/중지"
    echo "  status          도구 실행 상태 확인"
    echo "  urls            접속 URL 표시"
    echo ""
    echo "옵션:"
    echo "  -h, --help      도움말 표시"
    echo ""
    echo "예시:"
    echo "  $0 start        # 모든 개발 도구 시작"
    echo "  $0 adminer      # Adminer만 시작/중지"
    echo "  $0 urls         # 접속 URL 표시"
}

show_urls() {
    echo ""
    echo "🌐 개발 도구 접속 URL:"
    echo ""
    
    # 포트 정보 가져오기
    ADMINER_PORT=$(grep "^ADMINER_PORT=" .env 2>/dev/null | cut -d'=' -f2 || echo "8080")
    REDIS_COMMANDER_PORT=$(grep "^REDIS_COMMANDER_PORT=" .env 2>/dev/null | cut -d'=' -f2 || echo "8081")
    
    echo "📊 Adminer (데이터베이스 관리):"
    echo "   URL: http://localhost:$ADMINER_PORT"
    echo "   서버: mysql-dev"
    echo "   사용자명: bible_user"
    echo "   비밀번호: bible_password"
    echo "   데이터베이스: bible_daily_dev"
    echo ""
    
    echo "🔴 Redis Commander (Redis 관리):"
    echo "   URL: http://localhost:$REDIS_COMMANDER_PORT"
    echo ""
    
    echo "💡 팁:"
    echo "   - Adminer에서 'mysql-dev'를 서버명으로 사용하세요"
    echo "   - Redis Commander는 자동으로 Redis에 연결됩니다"
}

check_status() {
    print_status "개발 도구 상태를 확인합니다..."
    echo ""
    
    # 실행 중인 도구 컨테이너 확인
    running_containers=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "adminer|redis-commander" || true)
    
    if [ -z "$running_containers" ]; then
        print_warning "실행 중인 개발 도구가 없습니다."
    else
        echo "🟢 실행 중인 개발 도구:"
        echo "$running_containers"
    fi
    
    echo ""
    
    # 사용 가능한 도구 프로파일 확인
    available_tools=$(docker-compose -f docker-compose.dev.yml config --services | grep -E "adminer|redis-commander" || true)
    
    if [ ! -z "$available_tools" ]; then
        echo "📋 사용 가능한 도구:"
        echo "$available_tools" | sed 's/^/   - /'
    fi
}

start_all_tools() {
    print_status "모든 개발 도구를 시작합니다..."
    
    # 메인 서비스가 실행 중인지 확인
    if ! docker-compose -f docker-compose.dev.yml ps mysql-dev | grep -q "Up"; then
        print_error "MySQL 서비스가 실행되고 있지 않습니다."
        print_status "먼저 개발환경을 시작하세요: ./scripts/dev-start.sh"
        exit 1
    fi
    
    if ! docker-compose -f docker-compose.dev.yml ps redis-dev | grep -q "Up"; then
        print_error "Redis 서비스가 실행되고 있지 않습니다."
        print_status "먼저 개발환경을 시작하세요: ./scripts/dev-start.sh"
        exit 1
    fi
    
    # 개발 도구 시작
    docker-compose -f docker-compose.dev.yml --profile tools up -d
    
    print_success "개발 도구가 시작되었습니다!"
    show_urls
}

stop_all_tools() {
    print_status "모든 개발 도구를 중지합니다..."
    
    # tools 프로파일의 서비스만 중지
    docker-compose -f docker-compose.dev.yml stop adminer redis-commander 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml rm -f adminer redis-commander 2>/dev/null || true
    
    print_success "개발 도구가 중지되었습니다."
}

toggle_adminer() {
    if docker ps --format "{{.Names}}" | grep -q "adminer"; then
        print_status "Adminer를 중지합니다..."
        docker-compose -f docker-compose.dev.yml stop adminer
        docker-compose -f docker-compose.dev.yml rm -f adminer
        print_success "Adminer가 중지되었습니다."
    else
        print_status "Adminer를 시작합니다..."
        
        # MySQL 서비스 확인
        if ! docker-compose -f docker-compose.dev.yml ps mysql-dev | grep -q "Up"; then
            print_error "MySQL 서비스가 실행되고 있지 않습니다."
            print_status "먼저 개발환경을 시작하세요: ./scripts/dev-start.sh"
            exit 1
        fi
        
        docker-compose -f docker-compose.dev.yml --profile tools up -d adminer
        
        ADMINER_PORT=$(grep "^ADMINER_PORT=" .env 2>/dev/null | cut -d'=' -f2 || echo "8080")
        print_success "Adminer가 시작되었습니다!"
        echo "   접속 URL: http://localhost:$ADMINER_PORT"
    fi
}

toggle_redis_ui() {
    if docker ps --format "{{.Names}}" | grep -q "redis-commander"; then
        print_status "Redis Commander를 중지합니다..."
        docker-compose -f docker-compose.dev.yml stop redis-commander
        docker-compose -f docker-compose.dev.yml rm -f redis-commander
        print_success "Redis Commander가 중지되었습니다."
    else
        print_status "Redis Commander를 시작합니다..."
        
        # Redis 서비스 확인
        if ! docker-compose -f docker-compose.dev.yml ps redis-dev | grep -q "Up"; then
            print_error "Redis 서비스가 실행되고 있지 않습니다."
            print_status "먼저 개발환경을 시작하세요: ./scripts/dev-start.sh"
            exit 1
        fi
        
        docker-compose -f docker-compose.dev.yml --profile tools up -d redis-commander
        
        REDIS_COMMANDER_PORT=$(grep "^REDIS_COMMANDER_PORT=" .env 2>/dev/null | cut -d'=' -f2 || echo "8081")
        print_success "Redis Commander가 시작되었습니다!"
        echo "   접속 URL: http://localhost:$REDIS_COMMANDER_PORT"
    fi
}

# Docker 설치 확인
if ! command -v docker &> /dev/null; then
    print_error "Docker가 설치되어 있지 않습니다."
    exit 1
fi

# Docker Compose 설치 확인
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose가 설치되어 있지 않습니다."
    exit 1
fi

# 명령어 파싱
case "${1:-help}" in
    start)
        start_all_tools
        ;;
    stop)
        stop_all_tools
        ;;
    adminer)
        toggle_adminer
        ;;
    redis-ui)
        toggle_redis_ui
        ;;
    status)
        check_status
        ;;
    urls)
        show_urls
        ;;
    -h|--help|help)
        show_help
        ;;
    *)
        print_error "알 수 없는 명령어: $1"
        echo ""
        show_help
        exit 1
        ;;
esac

