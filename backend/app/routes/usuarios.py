from fastapi import APIRouter, HTTPException

from app.models.usuario import ConsultaUsuarioRequest, ConsultaUsuarioResponse
from app.services.usuario_service import ErroIntegracao, consultar_usuario

router = APIRouter(prefix="/api/usuarios", tags=["Usuários"])


@router.post("/consulta", response_model=ConsultaUsuarioResponse)
def consultar_ativos_usuario(body: ConsultaUsuarioRequest):
    try:
        return consultar_usuario(body.usuario)
    except ErroIntegracao as error:
        raise HTTPException(status_code=error.status_code, detail={"codigo": error.codigo, "mensagem": error.mensagem}) from None
