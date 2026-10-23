# ── AI Programming Tutor ── Backend Dockerfile ──────────────────────────
# Flask + PostgreSQL (psycopg2) on Python 3.11 slim

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy and install Python dependencies first (layer cache benefit)
# Note: psycopg2-binary is a pre-compiled wheel — no gcc/libpq-dev needed
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Expose Flask port
EXPOSE 5000

# Run Flask app (host 0.0.0.0 so Docker can route traffic to it)
CMD ["python", "run.py"]

