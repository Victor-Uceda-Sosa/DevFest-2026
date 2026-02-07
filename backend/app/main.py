from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="MedEd Platform API",
    description="Medical Education Hackathon Platform",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "MedEd Platform API",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Import and include routers (add as features are implemented)
# from app.routes import auth, elevenlabs, k2_reasoning
# app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
# app.include_router(elevenlabs.router, prefix="/api/consultations", tags=["consultations"])
