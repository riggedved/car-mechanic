#!/bin/sh
set -e

# Ensure volume mount directories exist
mkdir -p /app/data /app/media /app/staticfiles

# Run database migrations
echo "==> Running database migrations..."
python manage.py migrate --noinput

# Collect static files for Nginx / WhiteNoise
echo "==> Collecting static assets..."
python manage.py collectstatic --noinput

# If arguments are provided, execute them (e.g. gunicorn or custom commands)
if [ $# -gt 0 ]; then
    echo "==> Executing: $@"
    exec "$@"
else
    echo "==> Starting Gunicorn server on 0.0.0.0:8000..."
    exec gunicorn mechanic_backend.wsgi:application \
        --bind 0.0.0.0:8000 \
        --workers 2 \
        --threads 2 \
        --timeout 120 \
        --access-logfile - \
        --error-logfile -
fi
