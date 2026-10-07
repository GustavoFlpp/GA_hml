from app.config import carregar_ambiente, fonte_consulta


def test_loads_local_env_with_windows_bom_without_using_working_directory(tmp_path, monkeypatch):
    env_file = tmp_path / "backend.env"
    env_file.write_text('IAM_SOURCE=api\nIAM_API_PASSWORD="synthetic#secret"\n', encoding="utf-8-sig")
    monkeypatch.delenv("IAM_SOURCE", raising=False)
    monkeypatch.delenv("IAM_API_PASSWORD", raising=False)
    monkeypatch.chdir(tmp_path.parent)
    carregar_ambiente(env_file)
    assert fonte_consulta() == "api"
    import os
    assert os.environ["IAM_API_PASSWORD"] == "synthetic#secret"


def test_process_environment_has_priority(tmp_path, monkeypatch):
    env_file = tmp_path / "backend.env"
    env_file.write_text("IAM_SOURCE=api\n", encoding="utf-8")
    monkeypatch.setenv("IAM_SOURCE", "mock")
    carregar_ambiente(env_file)
    assert fonte_consulta() == "mock"


def test_missing_env_keeps_explicit_demo_default(tmp_path, monkeypatch):
    monkeypatch.delenv("IAM_SOURCE", raising=False)
    carregar_ambiente(tmp_path / "missing.env")
    assert fonte_consulta() == "mock"
