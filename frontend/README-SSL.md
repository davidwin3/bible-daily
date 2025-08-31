# SSL 설정 가이드 - Let's Encrypt 자동화

이 문서는 Bible Daily에서 Let's Encrypt를 사용하여 SSL 인증서를 자동으로 발급하고 갱신하는 방법을 설명합니다.

## 환경변수 설정

### Let's Encrypt 환경변수

```bash
# 도메인 설정
DOMAIN=bible-daily.com
ADDITIONAL_DOMAINS=www.bible-daily.com,api.bible-daily.com

# Let's Encrypt 설정
CERTBOT_EMAIL=admin@bible-daily.com
CERTBOT_STAGING=0  # 1로 설정하면 테스트 환경 사용

# SSL 인증서 경로 (자동 설정됨)
SSL_CERT_PATH=/etc/letsencrypt/live/bible-daily.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/bible-daily.com/privkey.pem
USE_LETSENCRYPT=true
```

## 빠른 시작

### 1. 환경변수 설정

`.env` 파일을 생성하고 다음 내용을 설정하세요:

```bash
# .env
DOMAIN=your-domain.com
ADDITIONAL_DOMAINS=www.your-domain.com,api.your-domain.com
CERTBOT_EMAIL=your-email@example.com
CERTBOT_STAGING=0
```

### 2. 자동 SSL 설정 실행

```bash
# 루트 권한으로 실행
sudo ./scripts/ssl-setup.sh
```

이 스크립트는 다음을 자동으로 수행합니다:

- 필요한 디렉토리 생성
- Let's Encrypt 인증서 발급
- 자동 갱신 설정
- Docker 서비스 시작

### 3. 서비스 시작

```bash
# SSL이 포함된 전체 서비스 시작
docker-compose -f docker-compose.ssl.yml up -d
```

## 상세 사용 방법

### Let's Encrypt 인증서 발급

#### 단일 도메인

```bash
# .env 설정
DOMAIN=bible-daily.com
CERTBOT_EMAIL=admin@bible-daily.com

# 서비스 시작
docker-compose -f docker-compose.ssl.yml up -d
```

#### 멀티 도메인 (SAN 인증서)

```bash
# .env 설정
DOMAIN=bible-daily.com
ADDITIONAL_DOMAINS=www.bible-daily.com,api.bible-daily.com,admin.bible-daily.com
CERTBOT_EMAIL=admin@bible-daily.com

# 서비스 시작
docker-compose -f docker-compose.ssl.yml up -d
```

#### 테스트 환경 (Staging)

```bash
# .env 설정 (테스트용)
DOMAIN=test.bible-daily.com
CERTBOT_EMAIL=admin@bible-daily.com
CERTBOT_STAGING=1  # 테스트 환경 사용

# 서비스 시작
docker-compose -f docker-compose.ssl.yml up -d
```

### 수동 인증서 관리

#### 인증서 발급

```bash
# 컨테이너에서 직접 실행
docker-compose -f docker-compose.ssl.yml exec certbot \
  certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@bible-daily.com \
  --agree-tos \
  --no-eff-email \
  -d bible-daily.com \
  -d www.bible-daily.com
```

#### 인증서 갱신

```bash
# 수동 갱신
docker-compose -f docker-compose.ssl.yml exec certbot certbot renew

# nginx 재로드
docker-compose -f docker-compose.ssl.yml exec frontend nginx -s reload
```

## SSL 설정 상세

### nginx.conf.template

템플릿 파일에서 다음 변수들이 치환됩니다:

- `${DOMAIN}`: 서버 도메인명
- `${SSL_CERT_PATH}`: SSL 인증서 파일 경로
- `${SSL_KEY_PATH}`: SSL 개인키 파일 경로

### 자동 리다이렉트

HTTP(80포트) 요청은 자동으로 HTTPS(443포트)로 리다이렉트됩니다.

### SSL 보안 설정

- TLS 1.2, 1.3 지원
- 강력한 암호화 스위트 사용
- HSTS 헤더 적용
- 세션 캐싱 최적화

## 모니터링 및 관리

### SSL 상태 확인

```bash
# 전체 SSL 상태 확인
./scripts/ssl-status.sh

# 특정 도메인만 확인
./scripts/ssl-status.sh -d bible-daily.com
```

### 로그 확인

```bash
# Certbot 로그
docker-compose -f docker-compose.ssl.yml logs certbot

# Nginx 로그
docker-compose -f docker-compose.ssl.yml logs frontend

# 갱신 로그
tail -f /opt/bible-daily/logs/certbot/renewal.log
```

### 수동 갱신 테스트

```bash
# 갱신 테스트 (실제 갱신하지 않음)
docker-compose -f docker-compose.ssl.yml exec certbot certbot renew --dry-run

# 강제 갱신 (30일 이내에도 갱신)
docker-compose -f docker-compose.ssl.yml exec certbot certbot renew --force-renewal
```

## 트러블슈팅

### 1. 도메인 검증 실패

```bash
# DNS 설정 확인
nslookup bible-daily.com
dig bible-daily.com

# 방화벽 확인
sudo ufw status
sudo iptables -L

# 포트 80, 443 열기
sudo ufw allow 80
sudo ufw allow 443
```

### 2. ACME Challenge 실패

```bash
# ACME challenge 디렉토리 확인
ls -la /opt/bible-daily/ssl/www/.well-known/acme-challenge/

# nginx 설정 테스트
docker-compose -f docker-compose.ssl.yml exec frontend nginx -t

# HTTP 접근 테스트
curl -I http://bible-daily.com/.well-known/acme-challenge/test
```

### 3. 인증서 파일 권한 문제

```bash
# Let's Encrypt 디렉토리 권한 확인
sudo ls -la /opt/bible-daily/ssl/letsencrypt/live/
sudo ls -la /opt/bible-daily/ssl/letsencrypt/live/bible-daily.com/

# 권한 수정 (필요시)
sudo chown -R root:root /opt/bible-daily/ssl/letsencrypt/
sudo chmod -R 755 /opt/bible-daily/ssl/letsencrypt/
```

### 4. Rate Limiting 문제

```bash
# Staging 환경으로 테스트
CERTBOT_STAGING=1 docker-compose -f docker-compose.ssl.yml up -d

# Rate limit 확인
# Let's Encrypt는 도메인당 주당 50개 인증서 제한
```

### 5. 컨테이너 재시작 문제

```bash
# 서비스 상태 확인
docker-compose -f docker-compose.ssl.yml ps

# 개별 서비스 재시작
docker-compose -f docker-compose.ssl.yml restart frontend
docker-compose -f docker-compose.ssl.yml restart certbot

# 전체 재시작
docker-compose -f docker-compose.ssl.yml down
docker-compose -f docker-compose.ssl.yml up -d
```

## 보안 고려사항

1. **개인키 보안**: SSL 개인키 파일의 권한을 600으로 설정
2. **인증서 갱신**: Let's Encrypt 인증서는 90일마다 갱신 필요
3. **방화벽 설정**: 80, 443 포트 개방 확인
4. **도메인 검증**: 인증서의 도메인과 실제 도메인 일치 확인

## 예시 스크립트

### Let's Encrypt 인증서 자동 갱신

```bash
#!/bin/bash
# renew-ssl.sh

# 인증서 갱신
certbot renew --quiet

# Docker 컨테이너 재시작
docker-compose -f docker-compose.prod.yml restart frontend

echo "SSL certificate renewed and frontend restarted"
```

### 인증서 상태 확인

```bash
#!/bin/bash
# check-ssl.sh

DOMAIN=${1:-bible-daily.com}

echo "Checking SSL certificate for $DOMAIN..."
echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates
```
