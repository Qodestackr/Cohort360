#!/bin/sh
set -e

# Replace all URLs in nginx.conf by environment variables
sed -i "s@{FHIR_URL}@$FHIR_URL@g" /etc/nginx/conf.d/nginx.conf
sed -i "s@{BACK_URL}@$BACK_URL@g" /etc/nginx/conf.d/nginx.conf


sed -i "s@{VITE_CLARITY_APP_ID}@$VITE_CLARITY_APP_ID@g" /app/build/index.html

# Restart nginx to apply changes
service nginx restart

# Sleep infinity so the container will run forever
sleep infinity