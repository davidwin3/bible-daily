#!/bin/sh

# Certbot SSL Certificate Management Script
# This script handles SSL certificate obtaining and renewal

set -e

echo "Starting Certbot SSL certificate management..."

# Wait for nginx to be ready
echo "Waiting for nginx to be ready..."
sleep 30

# Build domain list
DOMAIN_LIST="-d ${DOMAIN}"
if [ -n "${ADDITIONAL_DOMAINS}" ]; then
  echo "Adding additional domains: ${ADDITIONAL_DOMAINS}"
  for domain in $(echo ${ADDITIONAL_DOMAINS} | tr ',' ' '); do
    DOMAIN_LIST="${DOMAIN_LIST} -d ${domain}"
  done
fi

echo "Domain list: ${DOMAIN_LIST}"

# Set staging flag if needed
STAGING_FLAG=""
if [ "${CERTBOT_STAGING}" = "1" ]; then
  STAGING_FLAG="--staging"
  echo "Running in staging mode"
fi

# Check if certificate already exists
if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
  echo "Obtaining SSL certificate for: ${DOMAIN_LIST}"
  certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email ${CERTBOT_EMAIL} \
    --agree-tos \
    --no-eff-email \
    ${STAGING_FLAG} \
    ${DOMAIN_LIST}
  
  echo "SSL certificate obtained successfully!"
else
  echo "Certificate already exists for ${DOMAIN}"
fi

# Certificate renewal loop
echo "Starting certificate renewal daemon..."
trap exit TERM

while :; do
  echo "Sleeping for 12 hours before next renewal check..."
  sleep 12h &
  wait
  
  echo "Checking for certificate renewal..."
  certbot renew --webroot --webroot-path=/var/www/certbot
  
  # Log renewal status
  if [ $? -eq 0 ]; then
    echo "Certificate renewal check completed successfully"
    # Note: nginx will automatically pick up renewed certificates on next restart
    # For immediate reload, consider using docker-compose restart frontend
  else
    echo "Certificate renewal check failed or no renewal needed"
  fi
done
