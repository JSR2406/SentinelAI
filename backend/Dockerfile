FROM python:3.11-slim

# Install system dependencies & scanner utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install CLI scanner tools (Gitleaks, Semgrep, Trivy)
RUN curl -sSFL https://raw.githubusercontent.com/gitleaks/gitleaks/main/scripts/install.sh | sh
RUN pip install --no-cache-dir semgrep trufflehog

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
