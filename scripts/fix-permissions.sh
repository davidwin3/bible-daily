#!/bin/bash

# Bible Daily - 권한 및 디렉토리 설정 스크립트
# 서버에서 Docker 컨테이너 실행 전 필요한 디렉토리와 권한을 설정합니다.

set -e

echo "🔧 Bible Daily 권한 및 디렉토리 설정을 시작합니다..."

# 기본 디렉토리 생성
BASE_DIR="/opt/bible-daily"

echo "📁 기본 디렉토리 생성 중..."
sudo mkdir -p ${BASE_DIR}/{data/{mysql,redis},logs/{nginx,backend,redis,certbot},ssl/{letsencrypt,www},backups,uploads}

# SSL 관련 디렉토리 생성
echo "🔐 SSL 디렉토리 생성 중..."
sudo mkdir -p ${BASE_DIR}/ssl/www/certbot
sudo mkdir -p ${BASE_DIR}/ssl/letsencrypt

# 권한 설정 (Docker에서 사용할 수 있도록)
echo "🔑 권한 설정 중..."

# 로그 디렉토리 권한 (nginx 사용자 ID: 101, 그룹 ID: 101)
sudo chown -R 101:101 ${BASE_DIR}/logs/nginx
sudo chmod -R 755 ${BASE_DIR}/logs/nginx

# SSL 디렉토리 권한 (certbot과 nginx가 모두 접근 가능하도록)
sudo chown -R 101:101 ${BASE_DIR}/ssl
sudo chmod -R 755 ${BASE_DIR}/ssl

# MySQL 데이터 디렉토리 권한 (mysql 사용자 ID: 999)
sudo chown -R 999:999 ${BASE_DIR}/data/mysql
sudo chmod -R 755 ${BASE_DIR}/data/mysql

# Redis 데이터 디렉토리 권한 (redis 사용자 ID: 999)
sudo chown -R 999:999 ${BASE_DIR}/data/redis
sudo chmod -R 755 ${BASE_DIR}/data/redis

# 백엔드 로그 및 업로드 디렉토리 권한 (node 사용자 ID: 1000)
sudo chown -R 1000:1000 ${BASE_DIR}/logs/backend
sudo chown -R 1000:1000 ${BASE_DIR}/uploads
sudo chmod -R 755 ${BASE_DIR}/logs/backend
sudo chmod -R 755 ${BASE_DIR}/uploads

# 백업 디렉토리 권한
sudo chown -R 999:999 ${BASE_DIR}/backups
sudo chmod -R 755 ${BASE_DIR}/backups

echo "✅ 디렉토리 구조:"
tree ${BASE_DIR} 2>/dev/null || find ${BASE_DIR} -type d | head -20

echo "✅ 권한 설정 완료!"

# Docker 그룹에 현재 사용자 추가 (필요한 경우)
if ! groups $USER | grep -q docker; then
    echo "🐳 Docker 그룹에 사용자 추가 중..."
    sudo usermod -aG docker $USER
    echo "⚠️  Docker 그룹 변경사항을 적용하려면 로그아웃 후 다시 로그인하세요."
fi

# Docker Compose 파일 권한 확인
if [ -f "docker-compose.ssl.yml" ]; then
    echo "📋 Docker Compose 파일 권한 확인 중..."
    chmod 644 docker-compose*.yml
fi

echo "🎉 모든 설정이 완료되었습니다!"
echo ""
echo "다음 단계:"
echo "1. 환경 변수 파일(.env) 설정 확인"
echo "2. Docker 이미지 빌드 또는 풀"
echo "3. Docker Compose로 서비스 시작"
echo ""
echo "예시 명령어:"
echo "  docker-compose -f docker-compose.ssl.yml up -d"
