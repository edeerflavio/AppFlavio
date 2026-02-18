"""
app/main.py — Medical Scribe Enterprise v3.0
FastAPI + Async PostgreSQL + SOAP Engine + LGPD
Single entry point: uvicorn app.main:app
"""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers.analyze import router as analyze_router
from app.routers.consultations import router as consultations_router
from app.routers.bi import router as bi_router
from app.routers.transcription import router as transcription_router
from app.routers.llm_settings import router as llm_settings_router


# ── Logging ──
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medical-scribe")


# ── Lifespan ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Medical Scribe Enterprise starting...")
    await init_db()
    logger.info("✅ Database tables created/verified")
    yield
    logger.info("🛑 Medical Scribe Enterprise shutting down")


# ══════════════════════════════════════════════════════════════
# FastAPI App
# ══════════════════════════════════════════════════════════════

app = FastAPI(
    title="Medical Scribe Enterprise",
    version="3.0",
    description="Enterprise backend: SOAP engine + async PostgreSQL + LGPD compliance",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ──
app.include_router(analyze_router)
app.include_router(consultations_router)
app.include_router(bi_router)
app.include_router(transcription_router)
app.include_router(llm_settings_router)


# ══════════════════════════════════════════════════════════════
# Health Check
# ══════════════════════════════════════════════════════════════

@app.get("/api/health")
async def health():
    return {"status": "healthy", "version": "3.0", "engine": "enterprise"}
