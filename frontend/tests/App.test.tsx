import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { UserAssetsResult } from '../src/components/UserAssetsResult';
import { AppErrorBoundary } from '../src/components/AppErrorBoundary';
import { categoriasAtivos, type ConsultaUsuarioResponse } from '../src/types';
import { consultarUsuario } from '../src/services/api';

vi.mock('../src/services/api', () => ({ consultarUsuario: vi.fn() }));
const consultar = vi.mocked(consultarUsuario);

function resposta(overrides: Partial<ConsultaUsuarioResponse> = {}): ConsultaUsuarioResponse {
  return {
    usuario: 'U090001', sucesso: true, origem: 'API corporativa', mensagem: null,
    ativos: Object.fromEntries(categoriasAtivos.map(([campo]) => [campo, null])) as ConsultaUsuarioResponse['ativos'],
    ...overrides,
  };
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Consulta por usuário', () => {
  it('começa com formulário rotulado e sem resultado', () => {
    render(<App />);
    const input = screen.getByRole('textbox', { name: 'Chave do usuário' });
    expect(input.getAttribute('maxlength')).toBe('128');
    expect(screen.queryByRole('region', { name: 'Retorno da consulta' })).toBeNull();
  });

  it('rejeita espaços sem fazer consulta e direciona foco ao campo', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('textbox', { name: 'Chave do usuário' });
    await user.type(input, '   ');
    await user.click(screen.getByRole('button', { name: 'Consultar ativos' }));
    expect(consultar).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('chave de usuário válida');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(input);
  });

  it('consulta pelo teclado, normaliza a chave e preserva todos os textos', async () => {
    const data = resposta();
    categoriasAtivos.forEach(([campo]) => { data.ativos[campo] = `CONTEUDO-${campo}, TEXTO ORIGINAL`; });
    consultar.mockResolvedValue(data);
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('textbox'), '  u090001  {Enter}');
    await screen.findByRole('heading', { name: 'Ativos de U090001' });
    expect(consultar).toHaveBeenCalledWith('U090001');
    categoriasAtivos.forEach(([campo, label]) => {
      expect(screen.getByText(label)).toBeTruthy();
      expect(screen.getByText(`CONTEUDO-${campo}, TEXTO ORIGINAL`)).toBeTruthy();
    });
    expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Retorno da consulta' }));
  });

  it('mostra progresso, bloqueia duplicidade e oculta o formulário ao concluir com sucesso', async () => {
    let resolve: (value: ConsultaUsuarioResponse) => void = () => undefined;
    consultar.mockImplementation(() => new Promise((done) => { resolve = done; }));
    render(<App />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'U090001' } });
    const form = input.closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(consultar).toHaveBeenCalledTimes(1);
    expect(input.disabled).toBe(true);
    expect(form.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('status').textContent).toContain('Buscando');
    resolve(resposta());
    await screen.findByRole('heading', { name: 'Ativos de U090001' });
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Consultar ativos' })).toBeNull();
  });

  it('distingue sucesso sem ativos e mantém todas as categorias visíveis', () => {
    render(<UserAssetsResult resultado={resposta()} />);
    expect(screen.getByRole('status').textContent).toContain('Nenhum ativo informado');
    expect(screen.getAllByText('Sem ativo informado')).toHaveLength(3);
    expect(screen.queryByText('Consulta não concluída')).toBeNull();
  });

  it('conta categorias preenchidas sem confundir com quantidade de equipamentos', () => {
    const data = resposta();
    data.ativos.notebook = 'NOTEBOOK-TESTE-001';
    data.ativos.monitor = 'MONITOR-TESTE-A; MONITOR-TESTE-B';
    data.ativos.smartphone = '  ';
    data.ativos.tablet = 'TABLET-TESTE-001';
    render(<UserAssetsResult resultado={data} />);
    expect(screen.getByText('2 categorias com ativos informados')).toBeTruthy();
    expect(screen.getAllByText('Sem ativo informado')).toHaveLength(1);
    ['Notebook', 'Smartphone', 'Tablet', 'NOTEBOOK-TESTE-001', 'TABLET-TESTE-001'].forEach((text) => {
      expect(screen.getByText(text)).toBeTruthy();
    });
    ['Desktop', 'Monitor', 'Telefonia fixa', 'Coletor', 'Palm', 'Certificado digital', data.ativos.monitor].forEach((text) => {
      expect(screen.queryByText(text)).toBeNull();
    });
  });

  it('não mostra dados de uma resposta cujo sucesso não foi confirmado', () => {
    const data = resposta({ sucesso: false, mensagem: 'Consulta não confirmada.' });
    data.ativos.notebook = 'TEXTO QUE NAO DEVE SER MOSTRADO';
    render(<UserAssetsResult resultado={data} />);
    expect(screen.getByRole('heading', { name: 'Consulta não concluída' })).toBeTruthy();
    expect(screen.queryByText(data.ativos.notebook)).toBeNull();
  });

  it('nova consulta limpa a resposta e devolve foco ao campo', async () => {
    consultar.mockResolvedValue(resposta());
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('textbox'), 'U090001{Enter}');
    await screen.findByRole('heading', { name: 'Ativos de U090001' });
    await user.click(screen.getByRole('button', { name: 'Nova consulta' }));
    expect(screen.queryByRole('region', { name: 'Retorno da consulta' })).toBeNull();
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
    expect(document.activeElement).toBe(screen.getByRole('textbox'));
  });

  it('permite corrigir um erro e consultar novamente sem resultado anterior', async () => {
    consultar.mockRejectedValueOnce(new Error('Falha de conexão.')).mockResolvedValueOnce(resposta());
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await user.type(input, 'U090001{Enter}');
    expect((await screen.findByRole('alert')).textContent).toBe('Falha de conexão.');
    expect(input.getAttribute('aria-invalid')).toBe('false');
    await user.clear(input);
    expect(screen.queryByRole('alert')).toBeNull();
    await user.type(input, 'U090001{Enter}');
    await screen.findByRole('heading', { name: 'Ativos de U090001' });
  });

  it('uma consulta positiva deixa somente a ação de nova consulta', async () => {
    consultar.mockResolvedValue(resposta());
    render(<App />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'U090001' } });
    fireEvent.submit(input.closest('form')!);
    await screen.findByRole('heading', { name: 'Ativos de U090001' });
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Consultar ativos' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Nova consulta' })).toBeTruthy();
    expect(consultar).toHaveBeenCalledTimes(1);
  });

  it('renderiza textos longos como texto, sem interpretar HTML', () => {
    const data = resposta();
    data.ativos.notebook = '<script>example()</script>' + 'X'.repeat(500);
    render(<UserAssetsResult resultado={data} />);
    expect(screen.getByText(data.ativos.notebook)).toBeTruthy();
    expect(document.querySelector('script')).toBeNull();
  });

  it('exibe o nome completo retornado e mantém a chave visível', () => {
    render(<UserAssetsResult resultado={resposta({ nome: 'Marina Almeida de Oliveira' })} />);
    expect(screen.getByRole('heading', { name: 'Ativos de Marina Almeida de Oliveira' })).toBeTruthy();
    expect(screen.getByText('Chave: U090001')).toBeTruthy();
  });

  it('erro inesperado de renderização oferece recuperação sem tela vazia', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function Broken(): never { throw new Error('Detalhe privado sintético'); }
    render(<AppErrorBoundary><Broken /></AppErrorBoundary>);
    expect(screen.getByRole('alert').textContent).toContain('Não foi possível exibir');
    expect(screen.getByRole('button', { name: 'Recarregar' })).toBeTruthy();
    expect(screen.queryByText('Detalhe privado sintético')).toBeNull();
  });
});
