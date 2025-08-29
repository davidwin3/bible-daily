#!/bin/bash

# Bible Daily 개발환경 로그 확인 스크립트

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
    echo "사용법: $0 [옵션] [서비스명]"
    echo ""
    echo "서비스명:"
    echo "  mysql       MySQL 데이터베이스 로그"
    echo "  redis       Redis 캐시 로그"
    echo "  adminer     Adminer 데이터베이스 관리도구 로그"
    echo "  redis-commander  Redis Commander 로그"
    echo "  all         모든 서비스 로그 (기본값)"
    echo ""
    echo "옵션:"
    echo "  -f, --follow    실시간 로그 추적 (tail -f 처럼)"
    echo "  -n, --lines N   마지막 N개 라인만 표시 (기본: 100)"
    echo "  -t, --timestamps 타임스탬프 표시"
    echo "  -h, --help      도움말 표시"
    echo ""
    echo "예시:"
    echo "  $0                     # 모든 서비스의 최근 100줄 로그"
    echo "  $0 -f mysql            # MySQL 실시간 로그"
    echo "  $0 -n 50 redis         # Redis 최근 50줄 로그"
    echo "  $0 -t -f all           # 모든 서비스 실시간 로그 (타임스탬프 포함)"
}

# 기본값 설정
SERVICE="all"
FOLLOW=false
LINES=100
TIMESTAMPS=false

# 옵션 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -n|--lines)
            LINES="$2"
            shift 2
            ;;
        -t|--timestamps)
            TIMESTAMPS=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        mysql|redis|adminer|redis-commander|all)
            SERVICE="$1"
            shift
            ;;
        *)
            print_error "알 수 없는 옵션 또는 서비스: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
done

# Docker Compose 파일 확인
if [ ! -f "docker-compose.dev.yml" ]; then
    print_error "docker-compose.dev.yml 파일을 찾을 수 없습니다."
    exit 1
fi

# 서비스 실행 상태 확인
print_status "서비스 상태를 확인합니다..."

running_services=$(docker-compose -f docker-compose.dev.yml ps --services --filter "status=running")

if [ -z "$running_services" ]; then
    print_warning "실행 중인 개발 서비스가 없습니다."
    print_status "개발환경을 시작하려면: ./scripts/dev-start.sh"
    exit 1
fi

print_success "실행 중인 서비스: $running_services"

# 로그 명령어 구성
cmd="docker-compose -f docker-compose.dev.yml logs"

if [ "$TIMESTAMPS" = true ]; then
    cmd="$cmd -t"
fi

if [ "$FOLLOW" = true ]; then
    cmd="$cmd -f"
else
    cmd="$cmd --tail=$LINES"
fi

# 서비스별 매핑
case $SERVICE in
    "mysql")
        SERVICE_NAME="mysql-dev"
        ;;
    "redis")
        SERVICE_NAME="redis-dev"
        ;;
    "adminer")
        SERVICE_NAME="adminer"
        ;;
    "redis-commander")
        SERVICE_NAME="redis-commander"
        ;;
    "all")
        SERVICE_NAME=""
        ;;
esac

if [ ! -z "$SERVICE_NAME" ]; then
    cmd="$cmd $SERVICE_NAME"
fi

# 로그 출력 시작
if [ "$SERVICE" = "all" ]; then
    print_status "모든 개발 서비스의 로그를 표시합니다..."
else
    print_status "$SERVICE 서비스의 로그를 표시합니다..."
fi

if [ "$FOLLOW" = true ]; then
    print_warning "실시간 로그 모드입니다. 종료하려면 Ctrl+C를 누르세요."
fi

echo ""
echo "----------------------------------------"

# 로그 명령어 실행
eval $cmd

