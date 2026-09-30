FROM python:3.12-slim

# Prevent Python from writing .pyc files and enable unbuffered output for real-time logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install minimal runtime tools (curl for health check)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first to leverage Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create directories for persistent SQLite data, uploaded media, and static assets
RUN mkdir -p /app/data /app/media /app/staticfiles

# Copy application source code
COPY . .

# Ensure entrypoint script is executable
RUN chmod +x /app/docker-entrypoint.sh

# Expose Django WSGI server port (internal to Docker network)
EXPOSE 8000

ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Conservative Gunicorn worker configuration optimized for 1 GB RAM (t3.micro)
# 2 workers, 2 threads per worker, 120s timeout for Gemini multimodal analysis
CMD ["gunicorn", "mechanic_backend.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "2", \
     "--threads", "2", \
     "--timeout", "120", \
     "--max-requests", "1000", \
     "--max-requests-jitter", "100", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
