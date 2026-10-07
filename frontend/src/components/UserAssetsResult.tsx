import { AlertTriangle, Monitor } from 'lucide-react';
import { categoriasAtivos, type ConsultaUsuarioResponse } from '../types';

export function UserAssetsResult({ resultado }: { resultado: ConsultaUsuarioResponse }) {
  if (!resultado.sucesso) {
    return (
      <section role='status' className='rounded-2xl border border-[#e7b84b]/40 bg-white/[0.04] p-6'>
        <AlertTriangle className='text-[#e7b84b]' />
        <h2 className='mt-3 text-lg font-semibold'>Consulta não concluída</h2>
        <p className='mt-2 text-sm text-white/65'>{resultado.mensagem ?? 'O serviço não confirmou o sucesso da consulta.'}</p>
        <p className='mt-4 text-xs text-white/55'>Fonte: {resultado.origem}</p>
      </section>
    );
  }
  const preenchidos = categoriasAtivos.filter(([campo]) => resultado.ativos[campo]?.trim()).length;
  return (
    <section aria-label='Resultado da consulta'>
      <div className='mb-5 flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='[overflow-wrap:anywhere] text-xl font-bold'>Ativos de {resultado.nome?.trim() ? resultado.nome : resultado.usuario}</h2>
          {resultado.nome?.trim() && <p className='mt-1 text-sm text-white/65'>Chave: {resultado.usuario}</p>}
          <p className='mt-1 text-sm text-white/65'>{preenchidos} {preenchidos === 1 ? 'categoria com ativo informado' : 'categorias com ativos informados'}</p>
        </div>
        <span className='rounded-full border border-white/20 px-3 py-2 text-xs text-[#84BD00]'>Fonte: {resultado.origem}</span>
      </div>
      {preenchidos === 0 && <p role='status' className='mb-5 rounded-xl border border-white/15 p-4 text-sm text-white/65'>Consulta concluída. Nenhum ativo informado para este usuário.</p>}
      <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        {categoriasAtivos.map(([campo, label]) => {
          const valor = resultado.ativos[campo];
          const preenchido = Boolean(valor?.trim());
          return (
            <div key={campo} className={`rounded-2xl border p-5 ${preenchido ? 'border-[#84BD00]/45 bg-[#84BD00]/[0.06]' : 'border-white/15 bg-white/[0.03]'}`}>
              <dt className='flex items-center gap-2 text-sm font-semibold'><Monitor size={17} className='text-[#84BD00]' />{label}</dt>
              <dd className={`mt-3 whitespace-pre-wrap [overflow-wrap:anywhere] text-sm leading-6 ${preenchido ? 'text-white' : 'text-white/55'}`}>
                {preenchido ? valor : 'Sem ativo informado'}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
