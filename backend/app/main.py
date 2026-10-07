import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.ativos import router as ativos_router
from app.routes.usuarios import router as usuarios_router
from app.config import carregar_ambiente, fonte_consulta

carregar_ambiente()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    nomes = {"api": "API corporativa", "mock": "Mock (dados fictícios)", "invalid": "Configuração inválida"}
    logging.getLogger("uvicorn.error").info("Fonte de consulta: %s", nomes[fonte_consulta()])
    yield

app = FastAPI(
    title="Gestão de Ativos",
    description="API para consulta de ativos pela chave do usuário",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",") if origin.strip() and origin.strip() != "*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(ativos_router)
app.include_router(usuarios_router)


@app.middleware("http")
async def proteger_respostas(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "gestao-ativos-api",
        "version": "0.1.0",
        "iam_source": fonte_consulta(),
    }
