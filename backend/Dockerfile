# Multi-stage/Production-ready Dockerfile for Django Backend
FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable live unbuffered log streaming
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Set working directory inside container
WORKDIR /app

# Install system dependencies (curl required for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Create volume mount directories for SQLite database, media uploads, and collected staticfiles
RUN mkdir -p /app/data /app/media /app/staticfiles

# Copy application source code
COPY . .

# Normalize line endings (CRLF -> LF) to prevent Windows line break issues in Linux, and set execution permissions
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && \
    chmod +x /app/docker-entrypoint.sh

# Expose backend service port
EXPOSE 8000

# Container healthcheck matching docker-compose definition
HEALTHCHECK --interval=15s --timeout=5s --start-period=25s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Define container entrypoint and default execution command
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["gunicorn", "mechanic_backend.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "2", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-"]
