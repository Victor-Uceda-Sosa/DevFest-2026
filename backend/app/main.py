"""
K2 Think FastAPI Application
Main entry point for the clinical reasoning backend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import sessions, reasoning, cases, consultations, case_generation

# Initialize FastAPI app
app = FastAPI(
    title="K2 Think API",
    description="AI-powered clinical reasoning tutor for medical students",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(
    sessions.router,
    prefix="/api/sessions",
    tags=["sessions"]
)

app.include_router(
    reasoning.router,
    prefix="/api/reasoning",
    tags=["reasoning"]
)

app.include_router(
    cases.router,
    prefix="/api/cases",
    tags=["cases"]
)

app.include_router(
    consultations.router,
    prefix="/api/consultations",
    tags=["consultations"]
)

app.include_router(
    case_generation.router,
    prefix="/api/cases/generate",
    tags=["case-generation"]
)


@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "name": "K2 Think API",
        "version": "1.0.0",
        "description": "AI-powered clinical reasoning tutor for medical students",
        "docs": "/docs",
        "endpoints": {
            "sessions": "/api/sessions",
            "reasoning": "/api/reasoning",
            "cases": "/api/cases"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "K2 Think Backend"
    }


# Startup event
@app.on_event("startup")
async def startup_event():
    """Actions to perform on application startup."""
    print("=" * 50)
    print("K2 Think Backend Starting...")
    print(f"CORS Origins: {settings.cors_origins_list}")
    print(f"Featherless Model: {settings.featherless_model}")
    print("=" * 50)


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Actions to perform on application shutdown."""
    print("K2 Think Backend Shutting Down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
