import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, RotateCcw, Search, ShieldCheck, UserRound } from 'lucide-react';
import { UserAssetsResult } from './components/UserAssetsResult';
import { consultarUsuario } from './services/api';
import type { ConsultaUsuarioResponse } from './types';

function App() {
  const [usuario, setUsuario] = useState('');
  const [resultado, setResultado] = useState<ConsultaUsuarioResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [usuarioInvalido, setUsuarioInvalido] = useState(false);
  const pending = useRef(false);
  const usuarioRef = useRef<HTMLInputElement>(null);
  const resultadoRef = useRef<HTMLDivElement>(null);
  const novaConsultaPendente = useRef(false);

  useEffect(() => {
    if (resultado) {
      resultadoRef.current?.focus();
    } else if (novaConsultaPendente.current) {
      novaConsultaPendente.current = false;
      usuarioRef.current?.focus();
    }
  }, [resultado]);

  async function consultar() {
    if (pending.current) return;
    setResultado(null);
    setUsuarioInvalido(false);
    const chave = usuario.trim().toUpperCase();
    if (!chave || chave.length > 128 || [...chave].some((char) => char.charCodeAt(0) < 32)) {
      setUsuarioInvalido(true);
      setErro('Informe uma chave de usuário válida, com até 128 caracteres.');
      document.getElementById('usuario')?.focus();
      return;
    }
    pending.current = true;
    setLoading(true);
    setErro('');
    setUsuario(chave);
    try {
      setResultado(await consultarUsuario(chave));
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível concluir a consulta.');
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }

  function iniciarNovaConsulta() {
    novaConsultaPendente.current = true;
    setResultado(null);
    setUsuario('');
    setErro('');
    setUsuarioInvalido(false);
  }

  return (
    <main className='min-h-svh bg-black text-white'>
      <div className='mx-auto flex min-h-svh w-full max-w-3xl flex-col px-4 py-5 sm:px-6 sm:py-8'>
        <header className='relative flex items-center justify-between gap-4 border-b border-white/15 pb-5'>
          <span aria-hidden='true' className='absolute -bottom-px left-0 h-px w-24 bg-[#84BD00]' />
          <div className='flex min-w-0 items-center gap-3'>
            <img src='/logo-usiminas.png' alt='Usiminas' width={2500} height={931} className='h-8 w-auto shrink-0 object-contain sm:h-10' />
            <div className='min-w-0'>
              <p className='text-base font-bold'>Gestão de Ativos</p>
              <p className='mt-0.5 text-xs text-white/65'>Consulta por usuário</p>
            </div>
          </div>
          <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#84BD00] text-black'><ShieldCheck size={19} /></div>
        </header>
        <section className='flex-1 py-10'>
          {!resultado?.sucesso && (
            <>
              <div className='mb-8 text-center'>
                <UserRound size={36} className='mx-auto text-[#84BD00]' />
                <h1 className='mt-4 text-3xl font-bold'>Consulte os ativos do usuário</h1>
                <p className='mx-auto mt-3 max-w-xl text-sm leading-6 text-white/65'>Informe a chave do usuário para visualizar os equipamentos e recursos vinculados a ele.</p>
              </div>
              <form aria-busy={loading} onSubmit={(event) => { event.preventDefault(); void consultar(); }} className='rounded-3xl border border-white/15 bg-white/[0.04] p-5 shadow-2xl shadow-black sm:p-7'>
                <label htmlFor='usuario' className='text-sm font-semibold'>Chave do usuário</label>
                <div className='mt-3 flex flex-col gap-3 sm:flex-row'>
                  <input ref={usuarioRef} id='usuario' name='usuario' type='text' required maxLength={128}
                    value={usuario} onChange={(event) => { setUsuario(event.target.value.toUpperCase()); setErro(''); setUsuarioInvalido(false); }}
                    placeholder='Digite a chave do usuário' autoComplete='off' spellCheck={false}
                    disabled={loading} aria-invalid={usuarioInvalido} aria-describedby={erro ? 'consulta-erro' : undefined}
                    className='h-12 min-w-0 flex-1 rounded-xl border border-white/35 bg-black px-4 text-sm outline-none placeholder:text-white/50 focus:border-[#84BD00] focus:ring-2 focus:ring-[#84BD00]/35 disabled:opacity-60' />
                  <button type='submit' disabled={loading} className='flex h-12 items-center justify-center gap-2 rounded-xl bg-[#84BD00] px-5 text-sm font-bold text-black transition-colors hover:bg-[#9bd51a] disabled:opacity-60'>
                    {loading ? <LoaderCircle size={18} className='animate-spin' /> : <Search size={18} />}
                    {loading ? 'Consultando...' : 'Consultar ativos'}
                  </button>
                </div>
                {loading && <p role='status' className='mt-4 text-sm text-white/65'>Buscando os ativos vinculados ao usuário...</p>}
                {erro && <p id='consulta-erro' role='alert' className='mt-4 text-sm leading-6 text-[#ff9b9b]'>{erro}</p>}
              </form>
            </>
          )}
          {resultado && (
            <div ref={resultadoRef} tabIndex={-1} role='region' aria-label='Retorno da consulta' className='mt-8 rounded-2xl outline-none'>
              {resultado.sucesso && <div className='mb-6 flex flex-col gap-4 border-b border-white/15 pb-5 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <p className='text-xs font-bold uppercase tracking-[0.14em] text-[#84BD00]'>Resultado da consulta</p>
                  <p className='mt-1 text-sm text-white/65'>Confira os ativos abaixo ou inicie outra pesquisa.</p>
                </div>
                <button type='button' onClick={iniciarNovaConsulta} className='flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#84BD00] px-5 text-sm font-bold text-[#84BD00] transition-colors hover:bg-[#84BD00] hover:text-black'>
                  <RotateCcw size={17} />Nova consulta
                </button>
              </div>}
              <UserAssetsResult resultado={resultado} />
            </div>
          )}
        </section>
        <footer className='pt-6 text-center text-xs text-white/55'>Consulta de ativos por chave do usuário.</footer>
      </div>
    </main>
  );
}
export default App;
