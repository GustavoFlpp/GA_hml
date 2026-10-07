import { Component, type ErrorInfo, type ReactNode } from 'react';

export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, info: ErrorInfo) {
    // Não registrar o objeto do erro: ele pode conter dados da consulta.
    console.error('Falha ao exibir a aplicação.', info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className='min-h-svh bg-[#050505] p-8 text-white' role='alert'>
          <h1 className='text-xl font-bold'>Não foi possível exibir a aplicação</h1>
          <p className='mt-3'>Recarregue a página para tentar novamente.</p>
          <button
            type='button'
            className='mt-5 rounded-xl bg-[#84DB00] px-5 py-3 font-bold text-black'
            onClick={() => window.location.reload()}
          >
            Recarregar
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
