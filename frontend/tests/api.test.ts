import { afterEach, describe, expect, it, vi } from 'vitest';
import { consultarUsuario } from '../src/services/api';
import { categoriasAtivos } from '../src/types';

const sucesso = {
  usuario: 'U090001', sucesso: true, origem: 'API corporativa', mensagem: null,
  ativos: Object.fromEntries(categoriasAtivos.map(([campo]) => [campo, null])),
};

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('Cliente de consulta', () => {
  it('em produção sem URL não tenta consultar o computador do usuário', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_API_URL', '');
    vi.resetModules();
    const service = await import('../src/services/api');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(service.consultarUsuario('U090001')).rejects.toThrow('endereço do serviço');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('envia somente a chave normalizada, sem credenciais da conta de serviço', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(sucesso)));
    vi.stubGlobal('fetch', fetch);
    expect(await consultarUsuario('  u090001  ')).toEqual(sucesso);
    const [, options] = fetch.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ usuario: 'U090001' });
  });

  it.each([
    ['CONFIGURACAO_INCOMPLETA', 'ainda não está configurada'],
    ['INTEGRACAO_NAO_AUTORIZADA', 'não foi autorizado'],
    ['LIMITE_ATINGIDO', 'Limite de consultas'],
    ['TEMPO_ESGOTADO', 'demorou para responder'],
    ['CONEXAO_FALHOU', 'rede da empresa'],
    ['RESPOSTA_INVALIDA', 'formato inesperado'],
  ])('mostra uma mensagem segura para %s', async (codigo, mensagem) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      detail: { codigo, mensagem: 'SEGREDO-SINTETICO-NAO-MOSTRAR' },
    }), { status: 502 })));
    await expect(consultarUsuario('U090001')).rejects.toThrow(mensagem);
  });

  it('não repassa texto arbitrário de erro enviado pelo servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      detail: { codigo: 'DESCONHECIDO', mensagem: 'SEGREDO-SINTETICO' },
    }), { status: 503 })));
    await expect(consultarUsuario('U090001')).rejects.toThrow('serviço está indisponível');
  });

  it('trata erro HTTP que não contém JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>error</html>', { status: 504 })));
    await expect(consultarUsuario('U090001')).rejects.toThrow('demorou para responder');
  });

  it.each([
    { ...sucesso, sucesso: 'true' },
    { ...sucesso, ativos: { notebook: null } },
    { ...sucesso, ativos: { ...sucesso.ativos, notebook: { value: 'invalid' } } },
    { ...sucesso, mensagem: 123 },
    null,
  ])('rejeita contrato inválido em resposta 200', async (data) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(data))));
    await expect(consultarUsuario('U090001')).rejects.toThrow('formato inesperado');
  });

  it('distingue timeout do navegador de desconexão', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('private', 'TimeoutError')));
    await expect(consultarUsuario('U090001')).rejects.toThrow('demorou para responder');
  });

  it('trata desconexão sem expor erro técnico', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('SEGREDO-SINTETICO')));
    await expect(consultarUsuario('U090001')).rejects.toThrow('Verifique a conexão');
  });
});
