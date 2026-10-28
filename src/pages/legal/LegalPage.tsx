import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Seo } from '@/components/Seo';

interface LegalPageProps {
    title: string;
    description: string;
    path: string;
    updatedAt: string;
    children: ReactNode;
}

/** Layout comum das páginas institucionais (privacidade, termos). */
export function LegalPage({ title, description, path, updatedAt, children }: LegalPageProps) {
    return (
        <>
            <Seo title={title} description={description} path={path} />
            <article className="w-full max-w-3xl mx-auto px-6 py-12 md:py-16 text-[#C9C9CC]">
                <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8F8F91] hover:text-white transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Voltar ao início
                </Link>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">{title}</h1>
                <p className="text-xs text-[#8F8F91] mb-10">Última atualização: {updatedAt}</p>
                <div className="legal-content space-y-6 text-[15px] leading-relaxed">
                    {children}
                </div>
            </article>
        </>
    );
}
