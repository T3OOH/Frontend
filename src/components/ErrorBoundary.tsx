import { Component, ErrorInfo, ReactNode } from 'react';
import { isChunkError, reportError } from '@/lib/errorReporting';
import { supportUrl } from '@/lib/support';

interface State { error: Error | null; code: string | null }

const RELOAD_KEY = 't3:chunk-reload';

/**
 * Erro inesperado numa tela: em vez de página em branco, mostra o aviso com "Recarregar"
 * e "Acionar suporte" (WhatsApp com o erro e o código do registro).
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
    state: State = { error: null, code: null };

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // Site atualizado enquanto a página estava aberta: recarrega uma vez sozinho
        if (isChunkError(error)) {
            try {
                if (!sessionStorage.getItem(RELOAD_KEY)) {
                    sessionStorage.setItem(RELOAD_KEY, '1');
                    window.location.reload();
                    return;
                }
            } catch { /* sem storage */ }
        }
        const withStack = new Error(error.message);
        withStack.stack = `${error.stack ?? ''}\n\nComponente:${info.componentStack ?? ''}`.slice(0, 4000);
        void reportError(withStack, isChunkError(error) ? 'chunk' : 'render').then((code) => this.setState({ code }));
    }

    render() {
        const { error, code } = this.state;
        if (!error) return this.props.children;
        return (
            <div className="flex min-h-[100dvh] items-center bg-ink-950 px-4 py-16 text-ink-100">
                <div className="mx-auto w-full max-w-lg border border-white/10 bg-ink-900 p-6 md:p-8">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-400">Erro inesperado</p>
                    <h1 className="mt-3 text-2xl font-light uppercase tracking-tight">Algo deu errado nesta tela</h1>
                    <p className="mt-3 text-sm leading-relaxed text-ink-300">
                        O erro já foi registrado. Recarregue a página; se continuar, acione o suporte e a mensagem segue com os detalhes.
                    </p>
                    {code && <p className="mt-4 font-mono text-xs text-ink-400">Código: {code}</p>}
                    <div className="mt-6 flex flex-col gap-2 whitespace-nowrap sm:flex-row sm:flex-wrap">
                        <button type="button" onClick={() => window.location.reload()}
                            className="inline-flex items-center justify-center bg-brand-neon px-5 py-3 text-sm font-semibold text-ink-950 hover:bg-brand-neonHover">
                            Recarregar página
                        </button>
                        <a href={supportUrl({ message: error.message, code })} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center justify-center border border-white/15 px-5 py-3 text-sm text-ink-100 hover:border-white/40">
                            Acionar suporte no WhatsApp
                        </a>
                        <a href="/" className="inline-flex items-center justify-center px-5 py-3 text-sm text-ink-400 hover:text-ink-100">Ir para o início</a>
                    </div>
                </div>
            </div>
        );
    }
}
