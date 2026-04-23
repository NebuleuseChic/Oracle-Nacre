from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from routers.api_router import router as api_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Sélénia Nocturne API",
        description="Backend FastAPI pour la plateforme de guidance psychique Sélénia Nocturne.",
        version="1.0.0"
    )

    cors_origins_env = os.getenv("CORS_ORIGINS", "*")
    if cors_origins_env.strip() == "*":
        origins = ["*"]
    else:
        origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api")

    @app.get("/", tags=["root"])
    async def root() -> dict:
        return {
            "message": "Bienvenue sur l'API Sélénia Nocturne",
            "status": "ok",
            "docs": "/docs"
        }

    return app


app = create_app()
