from pydantic import BaseModel


class Ativo(BaseModel):
    original: str | None = None
    hostname: str | None = None
    serial: str | None = None
    modelo: str | None = None


class Responsavel(BaseModel):
    chave: str | None = None
    nome_completo: str | None = None


class Validacao(BaseModel):
    completo: bool
    campos_ausentes: list[str]
    campos_opcionais_nao_informados: list[str]
    criterio: str


class ConsultaAtivoResponse(BaseModel):
    encontrado: bool
    completo: bool
    origem: str
    hostname_consultado: str
    ativo: Ativo | None = None
    responsavel: Responsavel | None = None
    validacao: Validacao
    mensagem: str | None = None