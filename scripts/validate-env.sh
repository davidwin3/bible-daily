#!/bin/bash

# Environment File Validation Script
# Usage: ./validate-env.sh [env-file-path]

set -e

ENV_FILE=${1:-.env.production}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

validate_env_file() {
    local env_file="$1"
    local has_errors=false
    local has_warnings=false
    
    log_info "Validating environment file: $env_file"
    
    if [ ! -f "$env_file" ]; then
        log_error "Environment file not found: $env_file"
        return 1
    fi
    
    # Check for empty file
    if [ ! -s "$env_file" ]; then
        log_warning "Environment file is empty: $env_file"
        has_warnings=true
    fi
    
    # Check for problematic characters and patterns
    local line_num=0
    while IFS= read -r line || [ -n "$line" ]; do
        line_num=$((line_num + 1))
        
        # Skip empty lines and comments
        if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
            continue
        fi
        
        # Check for valid environment variable format
        if ! [[ "$line" =~ ^[A-Z_][A-Z0-9_]*= ]]; then
            log_error "Line $line_num: Invalid environment variable format: $line"
            has_errors=true
            continue
        fi
        
        # Extract variable name and value
        var_name="${line%%=*}"
        var_value="${line#*=}"
        
        # Check for unquoted values with spaces (potential issue)
        if [[ "$var_value" =~ [[:space:]] && ! "$var_value" =~ ^\".*\"$ && ! "$var_value" =~ ^\'.*\'$ ]]; then
            log_warning "Line $line_num: Unquoted value with spaces may cause issues: $var_name"
            has_warnings=true
        fi
        
        # Check for multiline values (RSA keys, etc.)
        if [[ "$var_value" =~ \\n || "$var_value" =~ $'\n' ]]; then
            log_warning "Line $line_num: Multiline value detected: $var_name"
            has_warnings=true
        fi
        
        # Check for private keys that should be properly quoted
        if [[ "$var_name" =~ PRIVATE_KEY && ! "$var_value" =~ ^\".*\"$ ]]; then
            log_warning "Line $line_num: Private key should be quoted: $var_name"
            has_warnings=true
        fi
        
        # Check for empty values
        if [[ -z "$var_value" ]]; then
            log_warning "Line $line_num: Empty value: $var_name"
            has_warnings=true
        fi
        
    done < "$env_file"
    
    # Summary
    if [ "$has_errors" = true ]; then
        log_error "Environment file validation failed with errors"
        return 1
    elif [ "$has_warnings" = true ]; then
        log_warning "Environment file validation completed with warnings"
        return 0
    else
        log_success "Environment file validation passed"
        return 0
    fi
}

# Check for SSL configuration
check_ssl_config() {
    local env_file="$1"
    
    if [ -f "$env_file" ]; then
        if grep -q "^USE_SSL=true" "$env_file" 2>/dev/null; then
            echo "ssl"
        else
            echo "no-ssl"
        fi
    else
        echo "no-ssl"
    fi
}

# Main execution
if [ "$#" -eq 0 ]; then
    # Default validation
    validate_env_file "$ENV_FILE"
elif [ "$1" = "--check-ssl" ]; then
    # Check SSL configuration
    check_ssl_config "${2:-.env.production}"
else
    # Validate specific file
    validate_env_file "$1"
fi
