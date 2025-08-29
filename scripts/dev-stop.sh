#!/bin/bash

# Bible Daily 개발환경 중지 스크립트

set -e

echo "🛑 Bible Daily 개발환경을 중지합니다..."

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

# 옵션 파싱
REMOVE_VOLUMES=false
REMOVE_IMAGES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--volumes)
            REMOVE_VOLUMES=true
            shift
            ;;
        -i|--images)
            REMOVE_IMAGES=true
            shift
            ;;
        -h|--help)
            echo "사용법: $0 [옵션]"
            echo ""
            echo "옵션:"
            echo "  -v, --volumes    볼륨도 함께 삭제"
            echo "  -i, --images     이미지도 함께 삭제"
            echo "  -h, --help       도움말 표시"
            exit 0
            ;;
        *)
            print_error "알 수 없는 옵션: $1"
            echo "도움말을 보려면 $0 -h를 실행하세요."
            exit 1
            ;;
    esac
done

# 개발 서비스 중지
print_status "개발 서비스를 중지합니다..."

if [ "$REMOVE_VOLUMES" = true ]; then
    print_warning "볼륨도 함께 삭제합니다. 데이터가 모두 삭제됩니다!"
    read -p "계속하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "작업이 취소되었습니다."
        exit 0
    fi
    
    docker-compose -f docker-compose.dev.yml down -v --remove-orphans
    print_success "컨테이너와 볼륨이 모두 제거되었습니다."
else
    docker-compose -f docker-compose.dev.yml down --remove-orphans
    print_success "컨테이너가 중지되었습니다. (볼륨은 보존됨)"
fi

# 이미지 삭제 (선택사항)
if [ "$REMOVE_IMAGES" = true ]; then
    print_status "관련 이미지를 삭제합니다..."
    
    # 개발환경 이미지만 삭제
    docker images --format "table {{.Repository}}:{{.Tag}}" | grep -E "bible-daily.*dev|mysql:8.0|redis:7-alpine" | awk '{print $1}' | while read image; do
        if [ ! -z "$image" ] && [ "$image" != "REPOSITORY:TAG" ]; then
            docker rmi "$image" 2>/dev/null || print_warning "이미지 $image 삭제에 실패했습니다."
        fi
    done
    
    print_success "이미지가 삭제되었습니다."
fi

# 사용하지 않는 리소스 정리
print_status "사용하지 않는 Docker 리소스를 정리합니다..."
docker system prune -f

print_success "🏁 개발환경이 성공적으로 중지되었습니다!"

echo ""
echo "📋 정보:"
if [ "$REMOVE_VOLUMES" = true ]; then
    echo "  ⚠️  모든 데이터베이스 데이터가 삭제되었습니다."
else
    echo "  💾 데이터베이스 데이터는 보존되었습니다."
fi

echo ""
echo "🔧 다시 시작하려면:"
echo "  ./scripts/dev-start.sh"

