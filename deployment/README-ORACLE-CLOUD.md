# Oracle Cloud ARM64 Production 배포 가이드

이 문서는 Oracle Cloud ARM64 서버에 Bible Daily 애플리케이션을 배포하는 방법을 설명합니다.

## 📋 사전 요구사항

### 1. Oracle Cloud 서버 준비

- **인스턴스 타입**: ARM64 기반 (Ampere A1)
- **운영체제**: Ubuntu 20.04 LTS 또는 22.04 LTS
- **최소 사양**:
  - CPU: 2 OCPU (ARM64)
  - RAM: 8GB
  - 스토리지: 50GB
- **네트워크**: 공인 IP 할당

### 2. 도메인 설정

- 도메인을 서버 IP에 연결
- DNS A 레코드 설정 완료

## 🚀 초기 서버 설정

### 1. 서버 접속 및 초기 설정

```bash
# 서버 접속
ssh -i your-key.pem ubuntu@your-server-ip

# 서버 설정 스크립트 다운로드 및 실행
curl -fsSL https://raw.githubusercontent.com/your-repo/bible-daily/main/deployment/scripts/oracle-cloud-setup.sh | bash
```

### 2. SSL 인증서 설치

```bash
# Let's Encrypt 인증서 설치
sudo certbot --nginx -d your-domain.com

# 자동 갱신 설정 확인
sudo systemctl status certbot.timer
```

## 🔧 GitHub Actions 설정

### 1. Repository Secrets 설정

GitHub 저장소의 Settings > Secrets and variables > Actions에서 다음 시크릿을 설정하세요:

#### 서버 접속 정보

```
ORACLE_CLOUD_SERVER_IP=your.server.ip.address
ORACLE_CLOUD_USER=ubuntu
ORACLE_CLOUD_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

#### 데이터베이스 설정

```
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=bible_user
DB_PASSWORD=secure_password_here
DB_DATABASE=bible_daily
DB_ROOT_PASSWORD=root_password_here
```

#### Redis 설정

```
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password_here
```

#### JWT 설정

```
JWT_SECRET=your_super_secret_jwt_key_here_32_chars_minimum
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_32_chars_minimum
```

#### Firebase 설정

```
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

#### 기타 설정

```
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com
DOMAIN=your-domain.com
BUILD_VERSION=1.0.0
```

#### 알림 설정 (선택사항)

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

### 2. SSH 키 생성 및 등록

```bash
# 로컬에서 SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "github-actions@bible-daily"

# 공개키를 서버에 등록
ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@your-server-ip

# 개인키 내용을 GitHub Secrets의 ORACLE_CLOUD_SSH_KEY에 등록
cat ~/.ssh/id_rsa
```

## 🏗️ 배포 실행

### 1. 수동 배포

GitHub Actions 탭에서 "Production Deployment to Oracle Cloud ARM64" 워크플로우를 수동으로 실행:

1. **Actions** 탭 클릭
2. **Production Deployment to Oracle Cloud ARM64** 워크플로우 선택
3. **Run workflow** 클릭
4. 배포 옵션 선택:
   - `service`: 배포할 서비스 (all/backend/frontend)
   - `force_rebuild`: 강제 리빌드 여부
   - `skip_tests`: 테스트 건너뛰기 여부

### 2. 자동 배포

다음 조건에서 자동으로 배포됩니다:

- `main` 브랜치에 푸시 시 (backend 또는 frontend 변경사항이 있는 경우)
- 버전 태그 푸시 시 (`v1.0.0` 형식)

```bash
# 버전 태그로 배포
git tag v1.0.0
git push origin v1.0.0
```

## 📊 모니터링 및 관리

### 1. 시스템 상태 확인

```bash
# 전체 시스템 상태 확인
bible-daily-status

# Docker 컨테이너 상태 확인
sudo docker-compose -f /opt/bible-daily/docker-compose.prod.yml ps

# 로그 확인
sudo docker-compose -f /opt/bible-daily/docker-compose.prod.yml logs -f backend
sudo docker-compose -f /opt/bible-daily/docker-compose.prod.yml logs -f frontend
```

### 2. 서비스 관리

```bash
# 서비스 재시작
sudo docker-compose -f /opt/bible-daily/docker-compose.prod.yml restart

# 특정 서비스만 재시작
sudo docker-compose -f /opt/bible-daily/docker-compose.prod.yml restart backend

# 서비스 중지
sudo docker-compose -f /opt/bible-daily/docker-compose.prod.yml down

# 서비스 시작
sudo docker-compose -f /opt/bible-daily/docker-compose.prod.yml up -d
```

### 3. 백업 관리

```bash
# 수동 백업 실행
/opt/bible-daily/backup.sh

# 백업 파일 확인
ls -la /opt/bible-daily/backups/

# 백업 복원 (예시)
sudo docker-compose -f /opt/bible-daily/docker-compose.prod.yml exec mysql mysql -u root -p bible_daily < /opt/bible-daily/backups/db_backup_YYYYMMDD_HHMMSS.sql
```

## 🔧 트러블슈팅

### 1. 일반적인 문제

#### 컨테이너가 시작되지 않는 경우

```bash
# 로그 확인
sudo docker-compose -f /opt/bible-daily/docker-compose.prod.yml logs

# 이미지 다시 풀
sudo docker-compose -f /opt/bible-daily/docker-compose.prod.yml pull

# 컨테이너 재생성
sudo docker-compose -f /opt/bible-daily/docker-compose.prod.yml up -d --force-recreate
```

#### 데이터베이스 연결 오류

```bash
# MySQL 컨테이너 상태 확인
sudo docker-compose -f /opt/bible-daily/docker-compose.prod.yml exec mysql mysqladmin ping -u root -p

# 네트워크 연결 확인
sudo docker network ls
sudo docker network inspect bible-daily_bible-daily-network
```

#### 메모리 부족 오류

```bash
# 시스템 리소스 확인
free -h
df -h

# 사용하지 않는 Docker 이미지 정리
sudo docker system prune -a

# 로그 파일 정리
sudo find /opt/bible-daily/logs -name "*.log" -mtime +7 -delete
```

### 2. 성능 최적화

#### MySQL 성능 튜닝

```bash
# MySQL 설정 파일 편집
sudo nano /opt/bible-daily/mysql/conf.d/mysql.cnf

# 설정 예시
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 200
query_cache_size = 64M
```

#### Redis 메모리 최적화

```bash
# Redis 메모리 사용량 확인
sudo docker-compose -f /opt/bible-daily/docker-compose.prod.yml exec redis redis-cli info memory

# 메모리 정책 확인
sudo docker-compose -f /opt/bible-daily/docker-compose.prod.yml exec redis redis-cli config get maxmemory-policy
```

## 📈 확장성 고려사항

### 1. 로드 밸런싱

- 트래픽 증가 시 여러 인스턴스 운영 고려
- Nginx 로드 밸런서 설정

### 2. 데이터베이스 확장

- MySQL 마스터-슬레이브 복제 설정
- 읽기 전용 복제본 추가

### 3. 캐시 최적화

- Redis 클러스터 구성
- CDN 연동 고려

## 🔒 보안 체크리스트

- [ ] SSH 키 기반 인증 설정
- [ ] 방화벽 규칙 적용
- [ ] SSL/TLS 인증서 설치
- [ ] 정기적인 보안 업데이트
- [ ] 백업 암호화
- [ ] 로그 모니터링
- [ ] Fail2Ban 설정

## 📞 지원

문제가 발생하거나 도움이 필요한 경우:

1. GitHub Issues에 문제 보고
2. 로그 파일과 함께 상세한 오류 정보 제공
3. 시스템 환경 정보 포함 (`bible-daily-status` 출력)

---

**주의**: 이 가이드는 Oracle Cloud ARM64 환경에 특화되어 있습니다. 다른 클라우드 환경에서는 일부 설정이 다를 수 있습니다.
