import os
import ssl
from urllib.parse import urlparse

import httpx
from pydantic import ValidationError

from app.models.usuario import AtivosUsuario, ConsultaUsuarioResponse, RespostaCorporativa


class ErroIntegracao(Exception):
    def __init__(self, status_code: int, mensagem: str, codigo: str = "INTEGRACAO_FALHOU"):
        self.status_code = status_code
        self.mensagem = mensagem
        self.codigo = codigo
        super().__init__(mensagem)


def consultar_usuario(usuario: str) -> ConsultaUsuarioResponse:
    source = os.getenv("IAM_SOURCE", "mock").strip().lower()
    if source == "mock":
        # Fixtures sinteticas. Nunca acionado como fallback de uma falha real.
        dados = {campo: None for campo in AtivosUsuario.model_fields}
        sucesso = usuario in {"U090001", "U090002"}
        if usuario == "U090001":
            dados.update(
                notebook="NOTEBOOK-TESTE-001, SERIAL-FICTICIO, MODELO DEMONSTRACAO",
                monitor="MONITOR-TESTE-001",
                smartphone="SMARTPHONE-TESTE-001",
            )
        return ConsultaUsuarioResponse(
            usuario=usuario, nome={"U090001": "Marina Almeida", "U090002": "Carlos Ferreira"}.get(usuario),
            sucesso=sucesso, origem="Mock (dados fictícios)",
            ativos=AtivosUsuario(**dados),
            mensagem=None if sucesso else "Chave não encontrada na base fictícia.",
        )
    if source != "api":
        raise ErroIntegracao(503, "Fonte de consulta não configurada corretamente.", "CONFIGURACAO_INCOMPLETA")

    url = os.getenv("IAM_API_URL", "").strip()
    username = os.getenv("IAM_API_USERNAME", "")
    password = os.getenv("IAM_API_PASSWORD", "")
    try:
        parsed = urlparse(url)
        parsed.port  # Valida porta, sem incluir URL ou credenciais em erros.
    except ValueError:
        raise ErroIntegracao(503, "Configure uma URL corporativa HTTPS válida.", "CONFIGURACAO_INCOMPLETA") from None
    if (parsed.scheme != "https" or not parsed.hostname or parsed.username
            or parsed.password or parsed.query or parsed.fragment
            or not username or not password):
        raise ErroIntegracao(503, "Configure a integração corporativa no backend.", "CONFIGURACAO_INCOMPLETA")
    try:
        timeout = float(os.getenv("IAM_API_TIMEOUT_SECONDS", "15"))
        if not 0 < timeout <= 60:
            raise ValueError
        ca_bundle = os.getenv("IAM_CA_BUNDLE", "").strip()
        tls = ssl.create_default_context(cafile=ca_bundle or None)
    except (ValueError, OSError, ssl.SSLError):
        raise ErroIntegracao(503, "Configuração de timeout ou certificado inválida.", "CONFIGURACAO_INVALIDA") from None

    try:
        with httpx.Client(timeout=timeout, verify=tls, follow_redirects=False) as client:
            response = client.post(url, json={
                "username": username, "password": password, "Usuario": usuario,
            })
    except httpx.TimeoutException:
        raise ErroIntegracao(504, "O serviço corporativo demorou para responder.", "TEMPO_ESGOTADO") from None
    except httpx.RequestError:
        raise ErroIntegracao(502, "Não foi possível conectar ao serviço corporativo. Verifique a rede e o certificado.", "CONEXAO_FALHOU") from None
    except httpx.InvalidURL:
        raise ErroIntegracao(503, "Configure uma URL corporativa HTTPS válida.", "CONFIGURACAO_INCOMPLETA") from None

    if response.status_code in {401, 403}:
        raise ErroIntegracao(502, "A integração não foi autorizada pelo serviço corporativo.", "INTEGRACAO_NAO_AUTORIZADA")
    if response.status_code == 429:
        raise ErroIntegracao(503, "Limite de consultas do serviço atingido. Tente novamente mais tarde.", "LIMITE_ATINGIDO")
    if not 200 <= response.status_code < 300:
        raise ErroIntegracao(502, "O serviço corporativo não concluiu a consulta.")
    try:
        dados_api = RespostaCorporativa.model_validate(response.json())
    except (ValueError, ValidationError):
        raise ErroIntegracao(502, "O serviço corporativo retornou uma resposta em formato inesperado.", "RESPOSTA_INVALIDA") from None

    return ConsultaUsuarioResponse(
        usuario=usuario, nome=dados_api.nome, sucesso=dados_api.sucesso, origem="API corporativa",
        ativos=AtivosUsuario(**dados_api.model_dump(exclude={"sucesso", "nome"})),
        mensagem=None if dados_api.sucesso else
        "O serviço corporativo não confirmou o sucesso da consulta. Verifique a chave ou procure o suporte.",
    )
