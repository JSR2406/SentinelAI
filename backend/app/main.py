import time
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import init_db
from app.api.router import root_router

# Configure logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("sentinelai_gateway")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown hooks."""
    logger.info("Initializing SentinelAI Database Schema...")
    init_db()
    logger.info("SentinelAI API Gateway successfully initialized.")
    yield
    logger.info("SentinelAI API Gateway shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Production-ready DevSecOps Security Copilot API Gateway. "
        "Provides repository management, scanner orchestration (Gitleaks, TruffleHog, Semgrep, Trivy, ZAP), "
        "attack graph generation, AI vulnerability explanations & patch autofix, and security reports."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev/production integration
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple Rate Limiting Middleware
REQUEST_COUNTS = {}

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    
    # Clean old records
    window_start = now - 60
    history = [t for t in REQUEST_COUNTS.get(client_ip, []) if t > window_start]
    
    if len(history) >= settings.RATE_LIMIT_PER_MINUTE:
        return Response(
            content='{"detail": "Rate limit exceeded. Maximum 60 requests per minute allowed."}',
            status_code=429,
            media_type="application/json"
        )
    
    history.append(now)
    REQUEST_COUNTS[client_ip] = history
    
    response = await call_next(request)
    return response

# Include all API routes
app.include_router(root_router)

@app.get("/health", tags=["Health Check"])
def health_check():
    """Health check endpoint to verify gateway and service status."""
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "timestamp": time.time()
    }
