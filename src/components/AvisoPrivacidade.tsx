import { Link } from 'react-router-dom';

/** Aviso curto nos formulários que coletam dados pessoais (LGPD art. 9º: informação clara no momento da coleta). */
export function AvisoPrivacidade({ className = '' }: { className?: string }) {
    return (
        <p className={`text-xs leading-relaxed text-ink-500 ${className}`}>
            Usamos seus dados só para responder este pedido. Saiba mais na{' '}
            <Link to="/privacidade" className="text-ink-300 underline underline-offset-2 hover:text-ink-100">Política de Privacidade</Link>.
        </p>
    );
}
