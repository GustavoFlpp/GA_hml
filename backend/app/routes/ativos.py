from fastapi import APIRouter

from app.models.ativo import ConsultaAtivoResponse
from app.services.iam_service import buscar_por_hostname


router = APIRouter(prefix="/api/ativos", tags=["Ativos"])


@router.get(
    "/{hostname}",
    response_model=ConsultaAtivoResponse,
)
def consultar_ativo(hostname: str):
    usuario = buscar_por_hostname(hostname)

    if usuario is None:
        return ConsultaAtivoResponse(
            encontrado=False,
            completo=False,
            origem="IAM",
            hostname_consultado=hostname,
            ativo=None,
            responsavel=None,
            validacao={
                "completo": False,
                "campos_ausentes": [],
                "campos_opcionais_nao_informados": [],
                "criterio": (
                    "Nenhum registro correspondente foi encontrado "
                    "na fonte IAM."
                ),
            },
            mensagem="Nenhum ativo correspondente foi encontrado."
        )

    notebook = usuario.get("notebook")

    campos_ausentes = []

    if not notebook:
        campos_ausentes.append("notebook")
    else:
        if not notebook.get("hostname"):
            campos_ausentes.append("hostname")

        if not notebook.get("serial"):
            campos_ausentes.append("serial")

        if not notebook.get("modelo"):
            campos_ausentes.append("modelo")

    if not usuario.get("chave"):
        campos_ausentes.append("chave")

    if not usuario.get("nome_completo"):
        campos_ausentes.append("nome_completo")

    campos_opcionais = [
        "smartphone",
        "tablet",
        "certificado_digital",
        "palm",
        "telefonia_fixa",
        "coletor_de_dados",
    ]

    campos_opcionais_nao_informados = [
        campo
        for campo in campos_opcionais
        if not usuario.get(campo)
    ]

    completo = len(campos_ausentes) == 0

    return ConsultaAtivoResponse(
        encontrado=True,
        completo=completo,
        origem="IAM",
        hostname_consultado=hostname,
        ativo=notebook,
        responsavel={
            "chave": usuario.get("chave"),
            "nome_completo": usuario.get("nome_completo"),
        },
        validacao={
            "completo": completo,
            "campos_ausentes": campos_ausentes,
            "campos_opcionais_nao_informados": (
                campos_opcionais_nao_informados
            ),
            "criterio": (
                "Considerado completo quando todos os campos "
                "obrigatórios do ativo e responsável estão informados. "
                "Campos opcionais não informados não são considerados "
                "inconsistência."
            ),
        },
    )