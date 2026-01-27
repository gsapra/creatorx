from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.v1.router import api_router
from app.core.database import engine, Base
import logging
from pathlib import Path
from typing import List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="The Ultimate Creator Platform - AI-Powered Content Creation & Brand Collaboration",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Custom CORS origin validator for ngrok support
def get_cors_origins() -> List[str]:
    """Get CORS origins with ngrok support for local testing"""
    origins = list(settings.CORS_ORIGINS) if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]

    # For local testing with ngrok, allow all ngrok domains
    if settings.ALLOW_NGROK:
        logger.info("⚠️  ngrok CORS enabled - allowing *.ngrok-free.app and *.ngrok.io domains")

    return origins

# CORS Middleware with ngrok support
if settings.ALLOW_NGROK:
    # Allow all origins in development for ngrok testing
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|.*\.ngrok-free\.app|.*\.ngrok\.io)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info("🔓 CORS: Development mode with ngrok support enabled")
else:
    # Production mode - strict origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info(f"🔒 CORS: Production mode - allowed origins: {get_cors_origins()}")

# GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Serve uploaded files
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
async def root():
    return {
        "message": "Welcome to CreatorX API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "creatorx-api",
        "version": settings.APP_VERSION
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
