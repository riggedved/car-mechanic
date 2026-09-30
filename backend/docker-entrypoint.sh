#!/bin/sh
set -e

echo "=== Starting Django Backend Entrypoint ==="

# Ensure persistence directories exist
if [ -n "$DATABASE_DIR" ]; then
    mkdir -p "$DATABASE_DIR"
fi

mkdir -p /app/media
mkdir -p /app/staticfiles

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "=== Initialization Complete. Starting WSGI Server ==="
exec "$@"
