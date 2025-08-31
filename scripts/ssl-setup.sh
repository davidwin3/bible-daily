#!/bin/bash

# SSL Setup Script for Bible Daily
# This script sets up Let's Encrypt SSL certificates with automatic renewal

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SSL_DIR="/opt/bible-daily/ssl"
LETSENCRYPT_DIR="$SSL_DIR/letsencrypt"
WWW_DIR="$SSL_DIR/www"

# Functions
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

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Create necessary directories
create_directories() {
    log_info "Creating SSL directories..."
    
    mkdir -p "$LETSENCRYPT_DIR"
    mkdir -p "$WWW_DIR"
    mkdir -p "/opt/bible-daily/logs/certbot"
    mkdir -p "/opt/bible-daily/logs/nginx"
    
    # Set proper permissions
    chmod 755 "$SSL_DIR"
    chmod 755 "$LETSENCRYPT_DIR"
    chmod 755 "$WWW_DIR"
    
    log_success "SSL directories created"
}

# Load environment variables
load_env() {
    if [ -f "$PROJECT_ROOT/.env" ]; then
        log_info "Loading environment variables from .env file..."
        export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
    else
        log_warning ".env file not found. Using default values."
    fi
    
    # Set default values
    export DOMAIN=${DOMAIN:-"bible-daily.com"}
    export ADDITIONAL_DOMAINS=${ADDITIONAL_DOMAINS:-"www.bible-daily.com,api.bible-daily.com"}
    export CERTBOT_EMAIL=${CERTBOT_EMAIL:-"admin@bible-daily.com"}
    export CERTBOT_STAGING=${CERTBOT_STAGING:-"0"}
}

# Validate domain configuration
validate_domains() {
    log_info "Validating domain configuration..."
    
    if [ -z "$DOMAIN" ]; then
        log_error "DOMAIN environment variable is required"
        exit 1
    fi
    
    if [ -z "$CERTBOT_EMAIL" ]; then
        log_error "CERTBOT_EMAIL environment variable is required"
        exit 1
    fi
    
    log_info "Primary domain: $DOMAIN"
    if [ ! -z "$ADDITIONAL_DOMAINS" ]; then
        log_info "Additional domains: $ADDITIONAL_DOMAINS"
    fi
    log_info "Email: $CERTBOT_EMAIL"
    
    if [ "$CERTBOT_STAGING" = "1" ]; then
        log_warning "Using Let's Encrypt STAGING environment (for testing)"
    fi
}

# Initial certificate setup
setup_initial_certificate() {
    log_info "Setting up initial SSL certificate..."
    
    # Start only frontend and backend for initial setup
    cd "$PROJECT_ROOT"
    
    # Create a temporary nginx config for HTTP-only
    log_info "Starting services for initial certificate request..."
    
    # Use docker-compose to start services
    docker-compose -f docker-compose.ssl.yml up -d mysql redis backend
    
    # Wait for backend to be ready
    log_info "Waiting for backend to be ready..."
    sleep 30
    
    # Start frontend with HTTP-only mode
    docker-compose -f docker-compose.ssl.yml up -d frontend
    
    # Wait for frontend to be ready
    log_info "Waiting for frontend to be ready..."
    sleep 10
    
    # Request certificate
    log_info "Requesting SSL certificate from Let's Encrypt..."
    docker-compose -f docker-compose.ssl.yml up certbot
    
    log_success "Initial certificate setup completed"
}

# Setup automatic renewal
setup_renewal() {
    log_info "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > /opt/bible-daily/scripts/renew-ssl.sh << 'EOF'
#!/bin/bash

# SSL Certificate Renewal Script
# This script is run by cron to automatically renew SSL certificates

set -e

PROJECT_ROOT="/opt/bible-daily"
LOG_FILE="/opt/bible-daily/logs/certbot/renewal.log"

# Function to log with timestamp
log_with_timestamp() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log_with_timestamp "Starting certificate renewal check..."

cd "$PROJECT_ROOT"

# Try to renew certificates
if docker-compose -f docker-compose.ssl.yml exec -T certbot certbot renew --webroot --webroot-path=/var/www/certbot >> "$LOG_FILE" 2>&1; then
    log_with_timestamp "Certificate renewal check completed successfully"
    
    # Reload nginx to use new certificates
    if docker-compose -f docker-compose.ssl.yml exec -T frontend nginx -s reload >> "$LOG_FILE" 2>&1; then
        log_with_timestamp "Nginx reloaded successfully"
    else
        log_with_timestamp "Failed to reload nginx"
    fi
else
    log_with_timestamp "Certificate renewal failed"
    exit 1
fi

log_with_timestamp "Certificate renewal process completed"
EOF

    chmod +x /opt/bible-daily/scripts/renew-ssl.sh
    
    # Add cron job for automatic renewal (runs twice daily)
    (crontab -l 2>/dev/null; echo "0 12,0 * * * /opt/bible-daily/scripts/renew-ssl.sh") | crontab -
    
    log_success "Automatic renewal setup completed"
    log_info "Certificates will be checked for renewal twice daily at 12:00 and 00:00"
}

# Main setup function
main() {
    log_info "Starting SSL setup for Bible Daily..."
    
    check_root
    load_env
    validate_domains
    create_directories
    setup_initial_certificate
    setup_renewal
    
    log_success "SSL setup completed successfully!"
    log_info ""
    log_info "Next steps:"
    log_info "1. Update your DNS records to point to this server"
    log_info "2. Start the full application with: docker-compose -f docker-compose.ssl.yml up -d"
    log_info "3. Check certificate status with: docker-compose -f docker-compose.ssl.yml logs certbot"
    log_info ""
    log_info "Your domains:"
    log_info "- Primary: https://$DOMAIN"
    if [ ! -z "$ADDITIONAL_DOMAINS" ]; then
        for domain in $(echo "$ADDITIONAL_DOMAINS" | tr ',' ' '); do
            log_info "- Additional: https://$domain"
        done
    fi
}

# Run main function
main "$@"
