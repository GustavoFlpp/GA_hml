import json
from pathlib import Path
from typing import Any


DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "mock_iam.json"


def carregar_dados_iam() -> list[dict[str, Any]]:
    with DATA_FILE.open("r", encoding="utf-8") as arquivo:
        return json.load(arquivo)


def buscar_por_hostname(hostname: str) -> dict[str, Any] | None:
    dados = carregar_dados_iam()

    hostname_normalizado = hostname.strip().upper()

    for usuario in dados:
        notebook = usuario.get("notebook")

        if not notebook:
            continue

        hostname_cadastrado = notebook.get("hostname")

        if not hostname_cadastrado:
            continue

        if hostname_cadastrado.upper() == hostname_normalizado:
            return usuario

    return None