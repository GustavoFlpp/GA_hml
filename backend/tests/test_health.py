from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_check_returns_service_status() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "gestao-ativos-api"


def test_responses_are_not_cached():
    response = client.get("/api/health")
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-content-type-options"] == "nosniff"


def test_cors_allows_local_post_but_rejects_other_origins():
    allowed = client.options("/api/usuarios/consulta", headers={
        "Origin": "http://127.0.0.1:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
    })
    assert allowed.status_code == 200
    assert allowed.headers["access-control-allow-origin"] == "http://127.0.0.1:5173"
    assert "access-control-allow-credentials" not in allowed.headers
    denied = client.options("/api/usuarios/consulta", headers={
        "Origin": "https://example.invalid",
        "Access-Control-Request-Method": "POST",
    })
    assert denied.status_code == 400
    assert "access-control-allow-origin" not in denied.headers
