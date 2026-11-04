import { useState, type FormEvent } from 'react';
import { Download, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { api } from '@/lib/axios';
import { apiErrorMessage } from '@/lib/upload';

type Link = { url: string; name: string; size: number; expiresIn: number };

const mb = (bytes: number) => `${(bytes / 1_048_576).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} MB`;

/**
 * Download do T3 Launcher protegido por senha. A senha é conferida só no servidor
 * (POST /downloads/launcher), com limite de tentativas: nada dela fica no código do site.
 */
export function LauncherDownload() {
    const [senha, setSenha] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');
    const [link, setLink] = useState<Link | null>(null);

    async function liberar(e: FormEvent) {
        e.preventDefault();
        if (!senha.trim()) {
            setErro('Digite a senha do download.');
            return;
        }
        setEnviando(true);
        setErro('');
        try {
            const { data } = await api.post<Link>('/downloads/launcher', { senha: senha.trim() });
            setLink(data);
            setSenha('');
        } catch (error) {
            setErro(apiErrorMessage(error, 'Não foi possível liberar o download agora. Tente de novo.'));
        } finally {
            setEnviando(false);
        }
    }

    if (link) {
        return (
            <div className="flex flex-col gap-4">
                <p className="flex items-center gap-2 text-sm text-brand-text">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" strokeWidth={1.75} aria-hidden="true" />
                    Download liberado. O link vale por {Math.round(link.expiresIn / 60)} minutos.
                </p>
                <a href={link.url} rel="noopener"
                    className="inline-flex w-full items-center justify-center gap-2 bg-brand-neon px-6 py-4 text-sm font-semibold uppercase tracking-wide text-ink-950 transition-colors hover:bg-brand-neonHover active:translate-y-px sm:w-auto">
                    <Download className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                    Baixar o T3 Launcher ({mb(link.size)})
                </a>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-brand-muted">
                    <li>Extraia o arquivo <span className="font-mono text-brand-text">{link.name}</span> (botão direito › Extrair tudo).</li>
                    <li>Abra o <span className="text-brand-text">T3 Launcher.exe</span> e entre com o e-mail e a senha do site.</li>
                    <li>Clique em <span className="text-brand-text">Baixar</span>, escolha o disco e pronto: depois é só <span className="text-brand-text">Abrir</span>.</li>
                </ol>
                <button type="button" onClick={() => setLink(null)} className="self-start text-xs text-brand-muted underline hover:text-brand-text">
                    Fechar
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={liberar} className="flex flex-col gap-4" noValidate>
            <p className="flex gap-2 text-sm text-brand-muted">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-brand-neon" strokeWidth={1.75} aria-hidden="true" />
                Área restrita: digite a senha do download para liberar o botão do T3 Launcher.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="sm:w-64">
                    <Input id="senha-launcher" label="Senha do download" type="password" inputMode="numeric" autoComplete="off"
                        value={senha} onChange={(e) => setSenha(e.target.value)} error={erro || undefined} />
                </div>
                <Button type="submit" isLoading={enviando} className="sm:mt-7">
                    Liberar download
                </Button>
            </div>
            <p className="text-xs text-brand-muted">A senha é conferida no servidor, com limite de tentativas.</p>
        </form>
    );
}
