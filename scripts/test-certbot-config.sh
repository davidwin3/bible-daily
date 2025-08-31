#!/bin/sh

# Test script for certbot configuration
# This script validates the certbot setup without actually running it

set -e

echo "🔍 Testing Certbot Configuration..."

# Check if certbot script exists and is executable
SCRIPT_PATH="./scripts/certbot-init.sh"
if [ -f "$SCRIPT_PATH" ]; then
    echo "✅ Certbot script found: $SCRIPT_PATH"
    if [ -x "$SCRIPT_PATH" ]; then
        echo "✅ Script is executable"
    else
        echo "❌ Script is not executable. Run: chmod +x $SCRIPT_PATH"
        exit 1
    fi
else
    echo "❌ Certbot script not found: $SCRIPT_PATH"
    exit 1
fi

# Check docker-compose.prod.yml syntax
echo "🔍 Checking docker-compose.prod.yml syntax..."
if command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f docker-compose.prod.yml config >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ docker-compose.prod.yml syntax is valid"
    else
        echo "❌ docker-compose.prod.yml has syntax errors"
        exit 1
    fi
else
    echo "⚠️  docker-compose not available, skipping syntax check"
fi

# Check required environment variables
echo "🔍 Checking required environment variables..."
for var in CERTBOT_EMAIL DOMAIN; do
    eval "value=\$$var"
    if [ -z "$value" ]; then
        echo "⚠️  Environment variable $var is not set (will use default)"
    else
        echo "✅ $var is set: $value"
    fi
done

# Test script syntax
echo "🔍 Testing script syntax..."
sh -n "$SCRIPT_PATH"
if [ $? -eq 0 ]; then
    echo "✅ Script syntax is valid"
else
    echo "❌ Script has syntax errors"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Certbot configuration looks good."
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in .env file:"
echo "   CERTBOT_EMAIL=your-email@domain.com"
echo "   DOMAIN=your-domain.com"
echo "   ADDITIONAL_DOMAINS=www.your-domain.com,api.your-domain.com"
echo "   CERTBOT_STAGING=1  # Set to 0 for production"
echo ""
echo "2. Run the production stack:"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "3. Check certbot logs:"
echo "   docker logs bible-daily-certbot -f"
