from fastapi.testclient import TestClient

from app.main import app
from app.services.iam_service import buscar_por_hostname


client = TestClient(app)


def test_returns_complete_asset() -> None:
    response = client.get("/api/ativos/UNBHZ1990001")

    assert response.status_code == 200
    body = response.json()
    assert body["encontrado"] is True
    assert body["completo"] is True
    assert body["ativo"]["hostname"] == "UNBHZ1990001"
    assert body["responsavel"]["chave"] == "U090001"


def test_marks_missing_required_model_as_incomplete() -> None:
    response = client.get("/api/ativos/UNIPA1990003")

    assert response.status_code == 200
    body = response.json()
    assert body["encontrado"] is True
    assert body["completo"] is False
    assert "modelo" in body["validacao"]["campos_ausentes"]


def test_returns_not_found_for_unknown_identifier() -> None:
    response = client.get("/api/ativos/ATIVO-QUE-NAO-EXISTE")

    assert response.status_code == 200
    body = response.json()
    assert body["encontrado"] is False
    assert body["completo"] is False
    assert body["ativo"] is None
    assert body["responsavel"] is None


def test_accepts_short_identifier_without_pattern_inference() -> None:
    response = client.get("/api/ativos/QZ9")

    assert response.status_code == 200
    assert response.json()["encontrado"] is True


def test_lookup_is_case_insensitive_and_trims_outer_spaces() -> None:
    result = buscar_por_hostname("  qz9  ")

    assert result is not None
    assert result["notebook"]["hostname"] == "QZ9"


def test_lookup_does_not_change_internal_characters() -> None:
    assert buscar_por_hostname("QZ 9") is None


def test_missing_optional_fields_do_not_make_asset_incomplete() -> None:
    response = client.get("/api/ativos/UNBHZ1990001")

    body = response.json()
    assert body["completo"] is True
    assert body["validacao"]["campos_opcionais_nao_informados"] == [
        "smartphone",
        "tablet",
        "certificado_digital",
        "palm",
        "telefonia_fixa",
        "coletor_de_dados",
    ]
