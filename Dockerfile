FROM python:3.11-slim

# Proxy settings are environment-specific; pass them at build time if needed:
#   docker compose build --build-arg HTTP_PROXY=... --build-arg HTTPS_PROXY=...
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

WORKDIR /app
# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy dependency files first for layer caching
COPY pyproject.toml ./
COPY README.md ./
# Copy application source
COPY src/ src/
COPY scripts/ scripts/
COPY yaml/*.sample yaml/

# Install dependencies and the project
RUN uv sync --no-dev

EXPOSE 9999

CMD ["uv", "run", "nac-aci-gui"]
