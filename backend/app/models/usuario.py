from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictStr, field_validator


class ConsultaUsuarioRequest(BaseModel):
    usuario: str = Field(min_length=1, max_length=128)

    @field_validator("usuario")
    @classmethod
    def normalizar_usuario(cls, value: str) -> str:
        value = value.strip().upper()
        if not value or any(ord(char) < 32 for char in value):
            raise ValueError("Informe uma chave de usuario valida.")
        return value


class AtivosUsuario(BaseModel):
    # Valores originais: nao inferir serial/modelo por separacao de virgulas.
    model_config = ConfigDict(extra="ignore")
    smartphone: StrictStr | None = None
    telFixa: StrictStr | None
    coletor: StrictStr | None
    notebook: StrictStr | None = None
    palm: StrictStr | None
    desktop: StrictStr | None
    tablet: StrictStr | None = None
    certificado: StrictStr | None
    monitor: StrictStr | None


class RespostaCorporativa(AtivosUsuario):
    sucesso: StrictBool
    nome: StrictStr | None = None


class ConsultaUsuarioResponse(BaseModel):
    usuario: str
    nome: str | None = None
    sucesso: bool
    origem: str
    ativos: AtivosUsuario
    mensagem: str | None = None
