# SSL 배포 가이드

## 개요

이 가이드는 Bible Daily 프로젝트에서 Let's Encrypt SSL 인증서를 사용한 HTTPS 배포 방법을 설명합니다.

## GitHub Actions SSL 배포

### 필요한 GitHub Secrets

다음 Secrets를 GitHub 저장소 설정에서 추가해야 합니다:

#### 기존 Secrets (필수)

- `ORACLE_CLOUD_SERVER_IP`: Oracle Cloud 서버 IP 주소
- `ORACLE_CLOUD_USER`: SSH 사용자명
- `ORACLE_CLOUD_SSH_KEY`: SSH 개인키
- `GHCR_TOKEN`: GitHub Container Registry 토큰
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `DB_DATABASE`: 데이터베이스 설정
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Redis 설정
- `JWT_SECRET`, `JWT_REFRESH_SECRET`: JWT 토큰 설정
- `FIREBASE_*`: Firebase 인증 설정

#### SSL 관련 Secrets (선택사항)

- `CERTBOT_EMAIL`: Let's Encrypt 알림을 받을 이메일 주소 (기본값: admin@bible-daily.com)

### 필요한 GitHub Variables

다음 Variables를 GitHub 저장소 설정에서 추가해야 합니다:

#### 기존 Variables

- `DOMAIN`: 메인 도메인 (예: bible-daily.com)
- `CORS_ORIGIN`: CORS 허용 도메인

#### SSL 관련 Variables (선택사항)

- `CERTBOT_EMAIL`: Let's Encrypt 이메일 (Secrets보다 우선)
- `ADDITIONAL_DOMAINS`: 추가 도메인들 (쉼표로 구분, 예: www.bible-daily.com,api.bible-daily.com)
- `CERTBOT_STAGING`: 스테이징 모드 (테스트용, 0=운영, 1=스테이징)

## SSL 배포 방법

### 1. GitHub Actions를 통한 배포

1. GitHub 저장소의 **Actions** 탭으로 이동
2. **Production Deployment to OCI** 워크플로우 선택
3. **Run workflow** 클릭
4. 다음 옵션들을 설정:
   - **배포할 서비스**: `all` (또는 필요한 서비스)
   - **SSL 인증서 사용**: `true` ✅ 체크
   - 기타 옵션들은 필요에 따라 설정
5. **Run workflow** 버튼 클릭

### 2. 수동 배포 (서버에서 직접)

```bash
# 서버에 SSH 접속
ssh your-user@your-server-ip

# 프로젝트 디렉토리로 이동
cd /opt/bible-daily

# SSL 환경 변수 설정
export USE_SSL=true
export DOMAIN=your-domain.com
export CERTBOT_EMAIL=admin@your-domain.com
export ADDITIONAL_DOMAINS=www.your-domain.com,api.your-domain.com

# SSL 배포 실행
docker-compose -f docker-compose.ssl.yml --env-file .env.production up -d
```

## 배포 과정 설명

### SSL 배포 시 추가 단계

1. **SSL 디렉토리 생성**: Let's Encrypt 인증서와 ACME 챌린지 파일을 위한 디렉토리 생성
2. **Certbot 컨테이너 시작**: Let's Encrypt 인증서 자동 발급 및 갱신
3. **SSL 볼륨 생성**: 인증서 데이터를 위한 Docker 볼륨 생성
4. **HTTPS 헬스체크**: SSL 인증서가 적용된 HTTPS 엔드포인트 확인

### 인증서 발급 과정

1. **도메인 검증**: Certbot이 ACME 챌린지를 통해 도메인 소유권 확인
2. **인증서 발급**: Let's Encrypt에서 SSL 인증서 발급
3. **Nginx 설정**: 발급된 인증서로 HTTPS 설정 적용
4. **자동 갱신**: 12시간마다 인증서 갱신 확인

## 주요 차이점

### HTTP vs HTTPS 배포

| 구분                | HTTP 배포                        | HTTPS 배포                                                 |
| ------------------- | -------------------------------- | ---------------------------------------------------------- |
| Docker Compose 파일 | `docker-compose.prod.yml`        | `docker-compose.ssl.yml`                                   |
| 포트                | 80                               | 80, 443                                                    |
| 추가 컨테이너       | 없음                             | Certbot                                                    |
| 볼륨                | mysql_prod_data, redis_prod_data | mysql_ssl_data, redis_ssl_data, certbot_certs, certbot_www |
| 컨테이너 이름       | \*-prod                          | \*-ssl                                                     |

### 볼륨 및 컨테이너 이름

SSL 배포 시에는 기존 HTTP 배포와 다른 이름을 사용하여 충돌을 방지합니다:

```yaml
# HTTP 배포
container_name: bible-daily-frontend-prod
volumes:
  mysql_prod_data:
  redis_prod_data:

# SSL 배포
container_name: bible-daily-frontend-ssl
volumes:
  mysql_ssl_data:
  redis_ssl_data:
  certbot_certs:
  certbot_www:
```

## 트러블슈팅

### 1. 인증서 발급 실패

```bash
# Certbot 로그 확인
docker logs bible-daily-certbot

# 도메인 DNS 설정 확인
nslookup your-domain.com

# 방화벽 포트 80, 443 열려있는지 확인
sudo ufw status
```

### 2. HTTPS 접속 불가

```bash
# Nginx 설정 확인
docker exec bible-daily-frontend-ssl nginx -t

# SSL 인증서 파일 존재 확인
ls -la /opt/bible-daily/ssl/letsencrypt/live/your-domain.com/

# 컨테이너 상태 확인
docker-compose -f docker-compose.ssl.yml ps
```

### 3. 기존 HTTP 배포와 충돌

```bash
# 기존 HTTP 컨테이너 중지
docker-compose -f docker-compose.prod.yml down

# SSL 배포 시작
docker-compose -f docker-compose.ssl.yml up -d
```

## 보안 고려사항

1. **스테이징 모드**: 처음 테스트할 때는 `CERTBOT_STAGING=1`로 설정
2. **도메인 검증**: 실제 도메인이 서버를 가리키고 있는지 확인
3. **방화벽 설정**: 포트 80, 443이 열려있는지 확인
4. **인증서 백업**: 정기적으로 인증서 디렉토리 백업

## 모니터링

### 인증서 만료일 확인

```bash
# 인증서 정보 확인
openssl x509 -in /opt/bible-daily/ssl/letsencrypt/live/your-domain.com/fullchain.pem -text -noout | grep "Not After"

# Certbot으로 인증서 목록 확인
docker exec bible-daily-certbot certbot certificates
```

### 자동 갱신 로그 확인

```bash
# Certbot 갱신 로그
tail -f /opt/bible-daily/logs/certbot/letsencrypt.log
```

## 롤백 방법

SSL 배포에서 문제가 발생한 경우 HTTP 배포로 롤백:

```bash
# SSL 컨테이너 중지
docker-compose -f docker-compose.ssl.yml down

# HTTP 배포로 복원
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## 참고 자료

- [Let's Encrypt 공식 문서](https://letsencrypt.org/docs/)
- [Certbot 사용법](https://certbot.eff.org/instructions)
- [Docker Compose SSL 설정](https://docs.docker.com/compose/compose-file/#volumes)
