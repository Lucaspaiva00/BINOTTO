#!/usr/bin/env bash
set -e

cd /var/www/html

echo "Discovering packages..."
php artisan package:discover --ansi || true

echo "Caching config..."
php artisan config:cache

echo "Caching routes..."
php artisan route:cache

echo "Storage link..."
php artisan storage:link || true

echo "Running migrations..."
php artisan migrate --force

echo "Starting services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
