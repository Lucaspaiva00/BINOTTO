#!/usr/bin/env bash
set -e

cd /var/www/html

# Render's container filesystem is ephemeral. When a persistent disk is mounted,
# point Laravel's public uploads at that disk BEFORE starting PHP/nginx.
# Configure PUBLIC_UPLOADS_PATH with the disk mount path (e.g. /var/data/uploads).
if [ -n "${PUBLIC_UPLOADS_PATH:-}" ]; then
    case "$PUBLIC_UPLOADS_PATH" in
        /*) ;;
        *) echo "PUBLIC_UPLOADS_PATH must be an absolute path" >&2; exit 1 ;;
    esac
    mkdir -p "$PUBLIC_UPLOADS_PATH"
    if [ -L storage/app/public ]; then
        current_target="$(readlink storage/app/public)"
        if [ "$current_target" != "$PUBLIC_UPLOADS_PATH" ]; then
            rm storage/app/public
        fi
    elif [ -d storage/app/public ]; then
        # Do not silently hide existing files with a mount/symlink.
        if [ -n "$(ls -A storage/app/public 2>/dev/null)" ]; then
            echo "Refusing to replace non-empty storage/app/public; migrate existing uploads first" >&2
            exit 1
        fi
        rmdir storage/app/public
    elif [ -e storage/app/public ]; then
        echo "Unexpected file at storage/app/public" >&2
        exit 1
    fi
    if [ ! -L storage/app/public ]; then
        ln -s "$PUBLIC_UPLOADS_PATH" storage/app/public
    fi
    chown -R www-data:www-data "$PUBLIC_UPLOADS_PATH"
    echo "Public uploads configured on persistent path: $PUBLIC_UPLOADS_PATH"
else
    echo "WARNING: PUBLIC_UPLOADS_PATH not configured; local uploads are ephemeral on Render" >&2
fi

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
