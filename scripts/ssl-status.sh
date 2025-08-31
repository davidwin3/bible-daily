#!/bin/bash

# SSL Status Check Script for Bible Daily
# This script checks the status of SSL certificates

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

# Load environment variables
load_env() {
    if [ -f "$PROJECT_ROOT/.env" ]; then
        export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
    fi
    
    export DOMAIN=${DOMAIN:-"bible-daily.com"}
    export ADDITIONAL_DOMAINS=${ADDITIONAL_DOMAINS:-"www.bible-daily.com,api.bible-daily.com"}
}

# Check certificate expiration
check_certificate_expiration() {
    local domain=$1
    
    log_info "Checking certificate for $domain..."
    
    # Check if we can connect to the domain
    if ! curl -s --connect-timeout 5 "https://$domain" > /dev/null 2>&1; then
        log_warning "Cannot connect to https://$domain"
        return 1
    fi
    
    # Get certificate expiration date
    local expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    
    if [ -z "$expiry_date" ]; then
        log_error "Could not retrieve certificate expiration date for $domain"
        return 1
    fi
    
    # Convert to epoch time
    local expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry_date" +%s 2>/dev/null)
    local current_epoch=$(date +%s)
    local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    echo "  Certificate expires: $expiry_date"
    
    if [ $days_until_expiry -lt 0 ]; then
        log_error "  Certificate EXPIRED $((days_until_expiry * -1)) days ago!"
        return 1
    elif [ $days_until_expiry -lt 30 ]; then
        log_warning "  Certificate expires in $days_until_expiry days (renewal recommended)"
        return 2
    else
        log_success "  Certificate is valid for $days_until_expiry days"
        return 0
    fi
}

# Check Let's Encrypt certificate files
check_letsencrypt_files() {
    local domain=$1
    local cert_path="/opt/bible-daily/ssl/letsencrypt/live/$domain"
    
    log_info "Checking Let's Encrypt certificate files for $domain..."
    
    if [ ! -d "$cert_path" ]; then
        log_error "  Certificate directory not found: $cert_path"
        return 1
    fi
    
    local files=("fullchain.pem" "privkey.pem" "cert.pem" "chain.pem")
    local all_exist=true
    
    for file in "${files[@]}"; do
        if [ -f "$cert_path/$file" ]; then
            log_success "  ✓ $file exists"
            
            # Check file permissions
            local perms=$(stat -c "%a" "$cert_path/$file" 2>/dev/null || stat -f "%A" "$cert_path/$file" 2>/dev/null)
            echo "    Permissions: $perms"
            
            # Check file age
            local age_days=$(( ($(date +%s) - $(stat -c %Y "$cert_path/$file" 2>/dev/null || stat -f %m "$cert_path/$file" 2>/dev/null)) / 86400 ))
            echo "    Age: $age_days days"
        else
            log_error "  ✗ $file missing"
            all_exist=false
        fi
    done
    
    if $all_exist; then
        log_success "  All certificate files present"
        return 0
    else
        log_error "  Some certificate files are missing"
        return 1
    fi
}

# Check Docker containers
check_docker_containers() {
    log_info "Checking Docker container status..."
    
    cd "$PROJECT_ROOT"
    
    local containers=("bible-daily-frontend-ssl" "bible-daily-certbot")
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$container"; then
            local status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not found")
            if [ "$status" = "running" ]; then
                log_success "  ✓ $container is running"
            else
                log_warning "  ⚠ $container status: $status"
            fi
        else
            log_warning "  ⚠ $container not found or not running"
        fi
    done
}

# Check renewal cron job
check_renewal_cron() {
    log_info "Checking automatic renewal setup..."
    
    if crontab -l 2>/dev/null | grep -q "renew-ssl.sh"; then
        log_success "  ✓ Automatic renewal cron job is configured"
        echo "  Cron schedule:"
        crontab -l 2>/dev/null | grep "renew-ssl.sh" | sed 's/^/    /'
    else
        log_warning "  ⚠ Automatic renewal cron job not found"
    fi
    
    if [ -f "/opt/bible-daily/scripts/renew-ssl.sh" ]; then
        log_success "  ✓ Renewal script exists"
    else
        log_warning "  ⚠ Renewal script not found"
    fi
}

# Check recent renewal logs
check_renewal_logs() {
    local log_file="/opt/bible-daily/logs/certbot/renewal.log"
    
    log_info "Checking recent renewal logs..."
    
    if [ -f "$log_file" ]; then
        log_success "  ✓ Renewal log file exists"
        echo "  Recent entries:"
        tail -n 5 "$log_file" 2>/dev/null | sed 's/^/    /' || echo "    No recent entries"
    else
        log_warning "  ⚠ Renewal log file not found: $log_file"
    fi
}

# Main status check function
main() {
    log_info "Checking SSL certificate status for Bible Daily..."
    echo
    
    load_env
    
    # Check primary domain
    check_certificate_expiration "$DOMAIN"
    echo
    check_letsencrypt_files "$DOMAIN"
    echo
    
    # Check additional domains
    if [ ! -z "$ADDITIONAL_DOMAINS" ]; then
        for domain in $(echo "$ADDITIONAL_DOMAINS" | tr ',' ' '); do
            domain=$(echo "$domain" | xargs) # trim whitespace
            check_certificate_expiration "$domain"
            echo
        done
    fi
    
    # Check Docker containers
    check_docker_containers
    echo
    
    # Check renewal setup
    check_renewal_cron
    echo
    
    # Check renewal logs
    check_renewal_logs
    echo
    
    log_info "SSL status check completed"
}

# Show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -d, --domain   Check specific domain only"
    echo ""
    echo "Examples:"
    echo "  $0                           # Check all configured domains"
    echo "  $0 -d bible-daily.com        # Check specific domain"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -d|--domain)
            DOMAIN="$2"
            ADDITIONAL_DOMAINS=""
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run main function
main "$@"
