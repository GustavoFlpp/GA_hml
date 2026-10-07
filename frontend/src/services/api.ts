import { categoriasAtivos, type ConsultaUsuarioResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL?.trim() || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');

export async function consultarUsuario(usuario: string): Promise<ConsultaUsuarioResponse> {
  if (!API_URL) {
    throw new Error('O endereço do serviço de consulta não foi configurado. Procure o suporte.');
  }
  let response: Response;
  try {
    response = await fetch(`${API_URL.replace(/\/$/, '')}/api/usuarios/consulta`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: usuario.trim().toUpperCase() }),
      signal: AbortSignal.timeout(65000),
    });
  } catch (error) {
    if ((error instanceof Error || error instanceof DOMException) && ['TimeoutError', 'AbortError'].includes(error.name)) {
      // Nao guardar o erro original: pode conter detalhes internos de conexao.
      // eslint-disable-next-line preserve-caught-error
      throw new Error('O serviço demorou para responder. Tente novamente.');
    }
    // eslint-disable-next-line preserve-caught-error
    throw new Error('Não foi possível conectar ao serviço. Verifique a conexão e tente novamente.');
  }
  if (!response.ok) {
    const mensagensPorCodigo: Record<string, string> = {
      CONFIGURACAO_INCOMPLETA: 'A consulta corporativa ainda não está configurada. Procure o suporte.',
      CONFIGURACAO_INVALIDA: 'A configuração do serviço precisa ser revisada pelo suporte.',
      INTEGRACAO_NAO_AUTORIZADA: 'O serviço de consulta não foi autorizado. Procure o suporte.',
      LIMITE_ATINGIDO: 'Limite de consultas atingido. Aguarde e tente novamente.',
      TEMPO_ESGOTADO: 'O serviço corporativo demorou para responder. Tente novamente.',
      CONEXAO_FALHOU: 'Não foi possível acessar o serviço corporativo. Verifique a conexão com a rede da empresa ou procure o suporte.',
      RESPOSTA_INVALIDA: 'O serviço retornou dados em formato inesperado. Procure o suporte.',
    };
    let codigo: unknown;
    try {
      codigo = (await response.json())?.detail?.codigo;
    } catch {
      // Usa a mensagem pelo status quando o servidor nao retorna JSON.
    }
    if (typeof codigo === 'string' && Object.hasOwn(mensagensPorCodigo, codigo)) {
      throw new Error(mensagensPorCodigo[codigo]);
    }
    const mensagens: Record<number, string> = {
      422: 'Informe uma chave de usuário válida, com até 128 caracteres.',
      502: 'A integração corporativa não concluiu a consulta. Verifique a conexão ou procure o suporte.',
      503: 'O serviço está indisponível ou a integração ainda não foi configurada.',
      504: 'O serviço corporativo demorou para responder. Tente novamente.',
    };
    throw new Error(mensagens[response.status] ?? 'Não foi possível consultar os ativos do usuário.');
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('O serviço retornou dados em formato inesperado. Procure o suporte.');
  }
  if (!data || typeof data.usuario !== 'string' || typeof data.sucesso !== 'boolean' ||
    typeof data.origem !== 'string' || !data.ativos ||
    (data.nome !== undefined && data.nome !== null && typeof data.nome !== 'string') ||
    (data.mensagem !== null && typeof data.mensagem !== 'string') ||
    !categoriasAtivos.every(([campo]) => data.ativos[campo] === null || typeof data.ativos[campo] === 'string')) {
    throw new Error('O serviço retornou dados em formato inesperado. Procure o suporte.');
  }
  return data;
}
