import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://t3ooh.com';
const SITE_NAME = 'T3 OOH';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

interface SeoProps {
    title: string;
    description: string;
    /** Caminho canônico da página (ex.: "/mapa"). */
    path: string;
    /** Páginas privadas ou utilitárias não devem ser indexadas. */
    noIndex?: boolean;
}

/** Título, descrição, canonical e metadados de compartilhamento por página. */
export function Seo({ title, description, path, noIndex }: SeoProps) {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const url = `${SITE_URL}${path}`;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />
            {noIndex && <meta name="robots" content="noindex, nofollow" />}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={DEFAULT_IMAGE} />
        </Helmet>
    );
}
