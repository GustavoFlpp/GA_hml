import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


def carregar_ambiente(env_file: Path = BACKEND_ENV_FILE) -> None:
    # Independente da pasta atual; aceita BOM de editores Windows.
    # Variaveis do processo/deploy continuam tendo prioridade.
    load_dotenv(dotenv_path=env_file, override=False, encoding="utf-8-sig")


def fonte_consulta() -> str:
    source = os.getenv("IAM_SOURCE", "mock").strip().lower()
    return source if source in {"api", "mock"} else "invalid"
