import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.usuario import AtivosUsuario
from app.services import usuario_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def configure_mock(monkeypatch):
    monkeypatch.setenv("IAM_SOURCE", "mock")


def install_api(monkeypatch, handler):
    monkeypatch.setenv("IAM_SOURCE", "api")
    monkeypatch.setenv("IAM_API_URL", "https://example.invalid/GestaoAtivos/ConsultaUsuario")
    monkeypatch.setenv("IAM_API_USERNAME", "synthetic-account")
    monkeypatch.setenv("IAM_API_PASSWORD", "synthetic-secret")
    monkeypatch.setenv("IAM_API_TIMEOUT_SECONDS", "15")
    monkeypatch.delenv("IAM_CA_BUNDLE", raising=False)
    original_client = httpx.Client
    monkeypatch.setattr(usuario_service.httpx, "Client", lambda **kwargs: original_client(
        transport=httpx.MockTransport(handler), **kwargs,
    ))


def payload(**kwargs):
    return {**{field: None for field in AtivosUsuario.model_fields}, "sucesso": True, **kwargs}


def test_mock_normalizes_user_and_returns_all_categories():
    response = client.post("/api/usuarios/consulta", json={"usuario": "  u090001  "})
    assert response.status_code == 200
    body = response.json()
    assert body["usuario"] == "U090001"
    assert body["sucesso"] is True
    assert "fictícios" in body["origem"]
    assert len(body["ativos"]) == 9
    assert body["ativos"]["notebook"] is not None
    assert body["ativos"]["tablet"] is None


def test_success_with_no_assets_is_distinct_from_failure():
    empty = client.post("/api/usuarios/consulta", json={"usuario": "U090002"}).json()
    missing = client.post("/api/usuarios/consulta", json={"usuario": "UNKNOWN"}).json()
    assert empty["sucesso"] is True
    assert all(value is None for value in empty["ativos"].values())
    assert missing["sucesso"] is False


@pytest.mark.parametrize("usuario", ["", "   ", "A" * 129, "U\n123"])
def test_invalid_user_is_rejected(usuario):
    assert client.post("/api/usuarios/consulta", json={"usuario": usuario}).status_code == 422


def test_official_post_body_and_raw_asset_values(monkeypatch):
    def handler(request):
        assert request.method == "POST"
        assert request.url.path == "/GestaoAtivos/ConsultaUsuario"
        assert json.loads(request.content) == {
            "username": "synthetic-account", "password": "synthetic-secret", "Usuario": "U090001",
        }
        return httpx.Response(200, json=payload(nome="Marina Almeida de Oliveira", notebook="HOST, SERIAL, MODELO, TEXTO EXTRA", desktop="DESKTOP TESTE"))
    install_api(monkeypatch, handler)
    response = client.post("/api/usuarios/consulta", json={"usuario": "u090001"})
    assert response.status_code == 200
    body = response.json()
    assert body["origem"] == "API corporativa"
    assert body["nome"] == "Marina Almeida de Oliveira"
    assert body["ativos"]["notebook"] == "HOST, SERIAL, MODELO, TEXTO EXTRA"
    assert body["ativos"]["desktop"] == "DESKTOP TESTE"
    assert "synthetic-secret" not in response.text


@pytest.mark.parametrize("status,expected", [(401, 502), (403, 502), (404, 502), (429, 503), (500, 502), (302, 502)])
def test_upstream_errors_do_not_fallback_or_expose_body(monkeypatch, status, expected):
    install_api(monkeypatch, lambda request: httpx.Response(status, text="synthetic-secret private details"))
    response = client.post("/api/usuarios/consulta", json={"usuario": "U090001"})
    assert response.status_code == expected
    assert "synthetic-secret" not in response.text
    assert "ativos" not in response.json()
    expected_codes = {401: "INTEGRACAO_NAO_AUTORIZADA", 403: "INTEGRACAO_NAO_AUTORIZADA", 429: "LIMITE_ATINGIDO"}
    assert response.json()["detail"]["codigo"] == expected_codes.get(status, "INTEGRACAO_FALHOU")


@pytest.mark.parametrize("exception,expected", [(httpx.ReadTimeout, 504), (httpx.ConnectError, 502)])
def test_network_failures(monkeypatch, exception, expected):
    def handler(request):
        raise exception("synthetic-secret", request=request)
    install_api(monkeypatch, handler)
    response = client.post("/api/usuarios/consulta", json={"usuario": "U090001"})
    assert response.status_code == expected
    assert "synthetic-secret" not in response.text


def test_error_response_has_safe_code_for_unconfigured_integration(monkeypatch):
    monkeypatch.setenv("IAM_SOURCE", "api")
    monkeypatch.delenv("IAM_API_PASSWORD", raising=False)
    response = client.post("/api/usuarios/consulta", json={"usuario": "U090001"})
    assert response.status_code == 503
    assert response.json()["detail"]["codigo"] == "CONFIGURACAO_INCOMPLETA"


@pytest.mark.parametrize("body", [
    {"sucesso": True}, payload(sucesso="true"), payload(notebook={"unexpected": "object"}),
    payload(monitor=123), [],
])
def test_malformed_payloads(monkeypatch, body):
    install_api(monkeypatch, lambda request: httpx.Response(200, json=body))
    assert client.post("/api/usuarios/consulta", json={"usuario": "U090001"}).status_code == 502


def test_non_json_response(monkeypatch):
    install_api(monkeypatch, lambda request: httpx.Response(200, text="<html>private</html>"))
    assert client.post("/api/usuarios/consulta", json={"usuario": "U090001"}).status_code == 502


def test_unsuccessful_response_is_not_classified_as_nonexistent(monkeypatch):
    install_api(monkeypatch, lambda request: httpx.Response(200, json=payload(sucesso=False)))
    body = client.post("/api/usuarios/consulta", json={"usuario": "U090001"}).json()
    assert body["sucesso"] is False
    assert "não confirmou" in body["mensagem"]


@pytest.mark.parametrize("source", ["api", "invalid-source"])
def test_configuration_failure_does_not_fallback(monkeypatch, source):
    monkeypatch.setenv("IAM_SOURCE", source)
    monkeypatch.delenv("IAM_API_PASSWORD", raising=False)
    assert client.post("/api/usuarios/consulta", json={"usuario": "U090001"}).status_code == 503


@pytest.mark.parametrize("setting,value", [
    ("IAM_API_URL", "http://example.invalid/consulta"),
    ("IAM_API_TIMEOUT_SECONDS", "0"),
    ("IAM_CA_BUNDLE", "missing-corporate-certificate.pem"),
])
def test_invalid_tls_and_configuration(monkeypatch, setting, value):
    install_api(monkeypatch, lambda request: pytest.fail("Network must not be called"))
    monkeypatch.setenv(setting, value)
    assert client.post("/api/usuarios/consulta", json={"usuario": "U090001"}).status_code == 503
