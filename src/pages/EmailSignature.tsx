import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { useToast } from '@/contexts/ToastContext';
import { btnGhost, btnPrimary, eyebrow } from '@/lib/ui';

/*
 * Assinatura de e-mail da equipe no padrão T3 LED, para colar no webmail da Hostinger
 * (a Hostinger não deixa mudar a aparência do webmail; a assinatura é o que leva a marca).
 * HTML de e-mail: tabelas e estilos inline, logo em PNG publicada em /email (WebP não abre no Outlook).
 */

const SITE = 'https://t3led.com.br';
const LOGO = `${SITE}/email/t3-logo-escuro.png`;

interface Dados { nome: string; cargo: string; telefone: string; email: string }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** "62993206010" → "(62) 99320-6010"; outros formatos ficam como foram digitados. */
function formatarTelefone(valor: string) {
    const d = valor.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return valor.trim();
}

function assinaturaHtml({ nome, cargo, telefone, email }: Dados) {
    const fone = formatarTelefone(telefone);
    const whats = telefone.replace(/\D/g, '');
    const linha = (rotulo: string, conteudo: string) =>
        `<tr><td style="padding:1px 8px 1px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8E8E93;">${rotulo}</td><td style="padding:1px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#2A2A2E;">${conteudo}</td></tr>`;
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
<tr>
<td style="vertical-align:top;padding:2px 16px 0 0;border-right:3px solid #FF5E00;"><a href="${SITE}" style="text-decoration:none;"><img src="${LOGO}" width="44" height="48" alt="T3 LED" style="display:block;border:0;"></a></td>
<td style="vertical-align:top;padding:0 0 0 16px;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#0B0B0C;">${esc(nome || 'Seu nome')}</div>
${cargo ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6E6E73;padding-top:2px;">${esc(cargo)} · T3 LED</div>` : '<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6E6E73;padding-top:2px;">T3 LED</div>'}
<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px;">
${fone ? linha('WhatsApp', `<a href="https://wa.me/55${whats.replace(/^55/, '')}" style="color:#2A2A2E;text-decoration:none;">${esc(fone)}</a>`) : ''}
${email ? linha('E-mail', `<a href="mailto:${esc(email)}" style="color:#2A2A2E;text-decoration:none;">${esc(email)}</a>`) : ''}
${linha('Site', `<a href="${SITE}" style="color:#FF5E00;text-decoration:none;font-weight:bold;">t3led.com.br</a>`)}
</table>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8E8E93;padding-top:8px;">Painéis de LED e mídia exterior · Goiânia - GO</div>
</td>
</tr>
</table>`;
}

function assinaturaTexto({ nome, cargo, telefone, email }: Dados) {
    return [nome || 'Seu nome', cargo ? `${cargo} · T3 LED` : 'T3 LED', telefone && `WhatsApp: ${formatarTelefone(telefone)}`, email && `E-mail: ${email}`, 'Site: t3led.com.br', 'Painéis de LED e mídia exterior · Goiânia - GO']
        .filter(Boolean).join('\n');
}

const campo = 'w-full border border-white/15 bg-ink-900 px-4 py-3 text-sm text-ink-100 placeholder:text-ink-500 focus:border-brand-neon focus:outline-none';

export function EmailSignature() {
    const toast = useToast();
    const [dados, setDados] = useState<Dados>({ nome: '', cargo: '', telefone: '', email: '' });
    const [copiado, setCopiado] = useState<'html' | 'codigo' | null>(null);
    const html = useMemo(() => assinaturaHtml(dados), [dados]);
    const set = (k: keyof Dados) => (e: React.ChangeEvent<HTMLInputElement>) => setDados((d) => ({ ...d, [k]: e.target.value }));

    const marcar = (tipo: 'html' | 'codigo') => { setCopiado(tipo); setTimeout(() => setCopiado(null), 2500); };

    /** Copia formatada (com a logo e as cores), pronta para colar no editor de assinatura. */
    const copiarFormatada = async () => {
        try {
            await navigator.clipboard.write([new ClipboardItem({
                'text/html': new Blob([html], { type: 'text/html' }),
                'text/plain': new Blob([assinaturaTexto(dados)], { type: 'text/plain' }),
            })]);
            marcar('html');
            toast.success('Assinatura copiada. Cole no webmail.');
        } catch {
            toast.error('O navegador não deixou copiar formatado. Use "Copiar código HTML".');
        }
    };

    const copiarCodigo = async () => {
        try {
            await navigator.clipboard.writeText(html);
            marcar('codigo');
            toast.success('Código HTML copiado.');
        } catch {
            toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.');
        }
    };

    return (
        <>
            <Seo title="Assinatura de e-mail" description="Monte a assinatura de e-mail da equipe no padrão da T3 LED." path="/assinatura" noIndex />
            <section className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 md:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                <div>
                    <p className={eyebrow}>Equipe · E-mail @t3led.com.br</p>
                    <h1 className="mt-4 text-4xl font-light uppercase leading-[0.95] tracking-tight text-ink-100 md:text-5xl">Sua assinatura T3 LED</h1>
                    <p className="mt-5 max-w-[46ch] leading-relaxed text-ink-300">Preencha os dados, copie e cole no webmail. A assinatura sai com a logo, as cores e os contatos no padrão da marca.</p>

                    <form className="mt-8 grid gap-4" onSubmit={(e) => e.preventDefault()}>
                        <label className="grid gap-1.5 text-sm text-ink-300" htmlFor="as-nome">Nome
                            <input id="as-nome" className={campo} value={dados.nome} onChange={set('nome')} placeholder="Ana Souza" maxLength={80} autoComplete="name" />
                        </label>
                        <label className="grid gap-1.5 text-sm text-ink-300" htmlFor="as-cargo">Cargo
                            <input id="as-cargo" className={campo} value={dados.cargo} onChange={set('cargo')} placeholder="Consultora comercial" maxLength={80} />
                        </label>
                        <label className="grid gap-1.5 text-sm text-ink-300" htmlFor="as-telefone">WhatsApp
                            <input id="as-telefone" className={campo} value={dados.telefone} onChange={set('telefone')} placeholder="(62) 99999-0000" inputMode="tel" maxLength={20} autoComplete="tel" />
                        </label>
                        <label className="grid gap-1.5 text-sm text-ink-300" htmlFor="as-email">E-mail
                            <input id="as-email" className={campo} value={dados.email} onChange={set('email')} placeholder="ana@t3led.com.br" type="email" maxLength={120} autoComplete="email" />
                        </label>
                    </form>
                </div>

                <div className="flex flex-col gap-6">
                    <div>
                        <p className={eyebrow}>Prévia</p>
                        {/* Fundo branco, como no editor de e-mail */}
                        <div className="mt-4 overflow-x-auto border border-white/10 bg-white p-6" dangerouslySetInnerHTML={{ __html: html }} />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button type="button" onClick={copiarFormatada} className={btnPrimary}>
                            {copiado === 'html' ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />} Copiar assinatura
                        </button>
                        <button type="button" onClick={copiarCodigo} className={btnGhost}>
                            {copiado === 'codigo' ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />} Copiar código HTML
                        </button>
                    </div>
                    <div className="border border-white/10 bg-ink-900 p-5 text-sm leading-relaxed text-ink-300">
                        <p className="font-medium text-ink-100">Como colocar no webmail da Hostinger</p>
                        <ol className="mt-3 list-decimal space-y-1.5 pl-5">
                            <li>Entre em <a href="https://mail.hostinger.com" target="_blank" rel="noopener noreferrer" className="text-brand-neon underline-offset-2 hover:underline">mail.hostinger.com</a> com o seu e-mail @t3led.com.br.</li>
                            <li>Abra <strong className="text-ink-100">Configurações</strong> (engrenagem) e depois <strong className="text-ink-100">Assinatura</strong>.</li>
                            <li>Clique no campo da assinatura e cole (Ctrl+V). Salve.</li>
                        </ol>
                        <p className="mt-3 text-ink-400">No Outlook ou no Gmail o caminho é parecido: Configurações → Assinatura → colar.</p>
                    </div>
                </div>
            </section>
        </>
    );
}
