#!/bin/bash

# Oracle Cloud ARM64 서버 초기 설정 스크립트
# Bible Daily Production 환경 구축

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 사용자 확인
check_user() {
    if [[ $EUID -eq 0 ]]; then
        log_error "이 스크립트는 root 사용자로 실행하면 안됩니다."
        exit 1
    fi
}

# 시스템 업데이트
update_system() {
    log_info "시스템 패키지 업데이트 중..."
    sudo apt update && sudo apt upgrade -y
    log_success "시스템 업데이트 완료"
}

# Docker 설치
install_docker() {
    log_info "Docker 설치 확인 중..."
    
    if command -v docker &> /dev/null; then
        log_success "Docker가 이미 설치되어 있습니다."
        return 0
    fi
    
    log_info "Docker 설치 중..."
    
    # 필요한 패키지 설치
    sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Docker GPG 키 추가
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Docker 저장소 추가
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Docker 설치
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io
    
    # 현재 사용자를 docker 그룹에 추가
    sudo usermod -aG docker $USER
    
    log_success "Docker 설치 완료"
}

# Docker Compose 설치
install_docker_compose() {
    log_info "Docker Compose 설치 확인 중..."
    
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose가 이미 설치되어 있습니다."
        return 0
    fi
    
    log_info "Docker Compose 설치 중..."
    
    # 최신 버전 확인 (ARM64용)
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    
    # Docker Compose 다운로드 및 설치
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # 심볼릭 링크 생성
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    log_success "Docker Compose 설치 완료"
}

# 필수 도구 설치
install_essential_tools() {
    log_info "필수 도구 설치 중..."
    
    sudo apt install -y \
        curl \
        wget \
        git \
        unzip \
        htop \
        nginx \
        certbot \
        python3-certbot-nginx \
        ufw \
        fail2ban \
        logrotate
    
    log_success "필수 도구 설치 완료"
}

# 방화벽 설정
setup_firewall() {
    log_info "방화벽 설정 중..."
    
    # UFW 초기화
    sudo ufw --force reset
    
    # 기본 정책 설정
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # 필요한 포트 허용
    sudo ufw allow ssh
    sudo ufw allow 80/tcp   # HTTP
    sudo ufw allow 443/tcp  # HTTPS
    sudo ufw allow 3000/tcp # Backend API (임시, 나중에 nginx로 프록시)
    
    # UFW 활성화
    sudo ufw --force enable
    
    log_success "방화벽 설정 완료"
}

# Nginx 설정
setup_nginx() {
    log_info "Nginx 설정 중..."
    
    # 기본 설정 제거
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Bible Daily 설정 생성
    sudo tee /etc/nginx/sites-available/bible-daily << 'EOF'
upstream backend {
    server localhost:3000;
}

upstream frontend {
    server localhost:80;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name _;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name _;
    
    # SSL 설정 (Let's Encrypt 인증서 설치 후 활성화)
    # ssl_certificate /etc/letsencrypt/live/your-domain/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your-domain/privkey.pem;
    
    # SSL 보안 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 보안 헤더
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # API 프록시
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 프론트엔드 프록시
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # 설정 활성화
    sudo ln -sf /etc/nginx/sites-available/bible-daily /etc/nginx/sites-enabled/
    
    # Nginx 설정 테스트
    sudo nginx -t
    
    # Nginx 재시작
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    log_success "Nginx 설정 완료"
}

# 디렉토리 구조 생성
create_directories() {
    log_info "디렉토리 구조 생성 중..."
    
    # 애플리케이션 디렉토리 생성
    sudo mkdir -p /opt/bible-daily/{logs,backups,ssl}
    sudo chown -R $USER:$USER /opt/bible-daily
    
    # 로그 디렉토리 권한 설정
    sudo chmod 755 /opt/bible-daily/logs
    
    log_success "디렉토리 구조 생성 완료"
}

# 로그 로테이션 설정
setup_log_rotation() {
    log_info "로그 로테이션 설정 중..."
    
    sudo tee /etc/logrotate.d/bible-daily << 'EOF'
/opt/bible-daily/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        /usr/bin/docker-compose -f /opt/bible-daily/docker-compose.prod.yml restart > /dev/null 2>&1 || true
    endscript
}
EOF
    
    log_success "로그 로테이션 설정 완료"
}

# 시스템 모니터링 설정
setup_monitoring() {
    log_info "시스템 모니터링 설정 중..."
    
    # 시스템 상태 확인 스크립트 생성
    sudo tee /usr/local/bin/bible-daily-status << 'EOF'
#!/bin/bash

echo "=== Bible Daily System Status ==="
echo "Date: $(date)"
echo ""

echo "=== System Resources ==="
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2 $3 $4 $5 $6 $7 $8}'
echo ""

echo "Memory Usage:"
free -h
echo ""

echo "Disk Usage:"
df -h /
echo ""

echo "=== Docker Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "=== Service Status ==="
systemctl status nginx --no-pager -l
echo ""

echo "=== Recent Logs ==="
echo "Backend logs (last 10 lines):"
docker-compose -f /opt/bible-daily/docker-compose.prod.yml logs --tail=10 backend 2>/dev/null || echo "Backend not running"
echo ""

echo "Frontend logs (last 10 lines):"
docker-compose -f /opt/bible-daily/docker-compose.prod.yml logs --tail=10 frontend 2>/dev/null || echo "Frontend not running"
EOF
    
    sudo chmod +x /usr/local/bin/bible-daily-status
    
    # 크론탭에 시스템 체크 추가 (매일 오전 9시)
    (crontab -l 2>/dev/null; echo "0 9 * * * /usr/local/bin/bible-daily-status >> /opt/bible-daily/logs/daily-status.log 2>&1") | crontab -
    
    log_success "시스템 모니터링 설정 완료"
}

# 백업 스크립트 설정
setup_backup() {
    log_info "백업 스크립트 설정 중..."
    
    # 백업 스크립트 생성
    tee /opt/bible-daily/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/bible-daily/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 데이터베이스 백업 (Docker 컨테이너에서 실행)
echo "Creating database backup..."
docker-compose -f /opt/bible-daily/docker-compose.prod.yml exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD bible_daily > $BACKUP_DIR/db_backup_$DATE.sql

# 애플리케이션 설정 백업
echo "Creating application config backup..."
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz /opt/bible-daily/.env.production /opt/bible-daily/docker-compose.prod.yml

# 오래된 백업 파일 삭제 (7일 이상)
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF
    
    chmod +x /opt/bible-daily/backup.sh
    
    # 크론탭에 백업 스케줄 추가 (매일 새벽 2시)
    (crontab -l 2>/dev/null; echo "0 2 * * * /opt/bible-daily/backup.sh >> /opt/bible-daily/logs/backup.log 2>&1") | crontab -
    
    log_success "백업 스크립트 설정 완료"
}

# 보안 강화
enhance_security() {
    log_info "보안 설정 강화 중..."
    
    # Fail2Ban 설정
    sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF
    
    sudo systemctl restart fail2ban
    sudo systemctl enable fail2ban
    
    # SSH 보안 강화
    sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    sudo systemctl restart ssh
    
    log_success "보안 설정 강화 완료"
}

# 메인 실행 함수
main() {
    log_info "Oracle Cloud ARM64 서버 설정을 시작합니다..."
    
    check_user
    update_system
    install_essential_tools
    install_docker
    install_docker_compose
    setup_firewall
    setup_nginx
    create_directories
    setup_log_rotation
    setup_monitoring
    setup_backup
    enhance_security
    
    log_success "서버 설정이 완료되었습니다!"
    log_info "다음 단계:"
    log_info "1. 도메인을 서버 IP에 연결"
    log_info "2. Let's Encrypt SSL 인증서 설치: sudo certbot --nginx"
    log_info "3. GitHub Actions에서 배포 실행"
    log_info "4. 시스템 상태 확인: bible-daily-status"
    
    log_warning "주의: Docker 그룹 변경사항을 적용하려면 로그아웃 후 다시 로그인하세요."
}

# 스크립트 실행
main "$@"
