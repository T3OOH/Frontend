import { forwardRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { AlertTriangle } from 'lucide-react';

/** Site key pública do Google reCAPTCHA v2 (definida no build pela Vercel). */
export const RECAPTCHA_SITE_KEY = (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined)?.trim() || '';

interface CaptchaProps {
    onChange: (token: string | null) => void;
}

/**
 * Widget "Não sou um robô".
 * Sem a site key, o script do Google lança um erro não tratado e quebra a página;
 * aqui mostramos um aviso claro no lugar e a tela continua funcionando.
 */
export const Captcha = forwardRef<ReCAPTCHA, CaptchaProps>(function Captcha({ onChange }, ref) {
    if (!RECAPTCHA_SITE_KEY) {
        if (import.meta.env.DEV) {
            console.error('VITE_RECAPTCHA_SITE_KEY não definida: configure a variável no .env ou na Vercel.');
        }
        return (
            <div role="alert" className="flex items-start gap-3 max-w-[304px] p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 text-xs leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>Verificação de segurança indisponível no momento. Tente novamente mais tarde ou fale com o suporte.</span>
            </div>
        );
    }

    return <ReCAPTCHA ref={ref} sitekey={RECAPTCHA_SITE_KEY} onChange={onChange} theme="dark" hl="pt-BR" />;
});
