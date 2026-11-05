import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { PanelData } from '@/services/panels.service';
import type { ProposalAssets } from '@/lib/pdf/proposalAssets';

/*
 * PDF da proposta comercial, no visual do site: fundo escuro, laranja da marca, Geist e
 * cantos retos. Página 01: texto de apresentação e dados da proposta (sem fotos).
 * Da página 02 em diante: um painel por página, com nome, cidade e todas as fotos.
 * Cores fixas: o arquivo não segue o tema da tela.
 */

export type PanelWithPrice = PanelData & { price?: number | string };

export interface CalculatedPanel extends PanelWithPrice {
    basePrice: number;
    discountPct: number;
    finalPrice: number;
}

export interface ProposalTotals {
    monthlyAfterIndividual: number;
    termDiscountPercent: number;
    monthlyAfterTerm: number;
    globalDiscountNum: number;
    finalMonthlyValue: number;
}

export interface ProposalClient {
    name: string;
    company?: string;
    document?: string;
    email?: string;
    phone?: string;
}

export interface ProposalPDFProps {
    client: ProposalClient;
    panels: CalculatedPanel[];
    months: number;
    totals: ProposalTotals;
    date: string;
    sellerName: string;
}

const PROPOSAL_INTRO = [
    'A T3 atua há 15 anos no mercado de comunicação e marketing, possuindo alguns canais de publicidade. Os painéis T3 LED outdoor OOH vêm se destacando entre eles.',
    'O segmento vem se consolidando mundo afora, sendo explorado inicialmente por grandes marcas nas grandes capitais. Hoje, a T3 está posicionada comunicando com milhares de pessoas em algumas cidades, como Goiânia, Uberlândia, Itumbiara, Goiatuba, Catalão e Anápolis.',
];

const C = {
    bg: '#0A0A0B',
    surface: '#111113',
    surface2: '#161618',
    border: '#27272A',
    text: '#F8FAFC',
    soft: '#B4B4B9',
    muted: '#86868B',
    brand: '#FF5E00',
};

const styles = StyleSheet.create({
    page: { backgroundColor: C.bg, color: C.text, fontFamily: 'Geist', fontSize: 10, paddingTop: 40, paddingBottom: 64, paddingHorizontal: 44 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, marginBottom: 18, borderBottomWidth: 1, borderBottomColor: C.border },
    brandRow: { flexDirection: 'row', alignItems: 'center' },
    logo: { width: 30, height: 30, marginRight: 8 },
    wordmark: { fontSize: 13, fontWeight: 600, letterSpacing: 0.4 },
    eyebrow: { fontFamily: 'GeistMono', fontSize: 7.5, letterSpacing: 1.4, textTransform: 'uppercase', color: C.muted },
    eyebrowBrand: { fontFamily: 'GeistMono', fontSize: 7.5, letterSpacing: 1.4, textTransform: 'uppercase', color: C.brand },
    headerRight: { alignItems: 'flex-end' },
    headerDate: { fontSize: 9, color: C.soft, marginTop: 3 },

    hero: { marginTop: 6 },
    accent: { width: 28, height: 3, backgroundColor: C.brand, marginBottom: 12 },
    title: { fontSize: 23, fontWeight: 600, letterSpacing: -0.4, lineHeight: 1.15, marginTop: 6 },
    intro: { fontSize: 10, lineHeight: 1.6, color: C.soft, marginTop: 10 },


    section: { marginTop: 18 },
    sectionTitle: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    sectionBar: { width: 3, height: 10, backgroundColor: C.brand, marginRight: 6 },

    bottomRow: { flexDirection: 'row' },
    bottomClient: { width: '40%', paddingRight: 10 },
    bottomTotals: { width: '60%' },
    clientBox: { flexGrow: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 12 },
    clientGap: { marginTop: 8 },
    clientValue: { fontSize: 9.5, marginTop: 3, color: C.text },

    tableHead: { flexDirection: 'row', backgroundColor: C.surface2, borderTopWidth: 1, borderTopColor: C.border, paddingVertical: 7, paddingHorizontal: 10 },
    row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 6, paddingHorizontal: 10 },
    cName: { flex: 2.6, paddingRight: 8 },
    cFmt: { flex: 0.9 },
    cMoney: { flex: 1.2, textAlign: 'right' },
    cDisc: { flex: 0.8, textAlign: 'right' },
    cellStrong: { fontSize: 9.5, fontWeight: 500 },
    cell: { fontSize: 9, color: C.soft },
    cellSub: { fontSize: 7.5, color: C.muted, marginTop: 2 },

    totals: { flexGrow: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 12 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    totalLabel: { fontSize: 9, color: C.soft },
    totalValue: { fontSize: 9, fontWeight: 500 },
    grandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
    grandLabel: { fontSize: 10, fontWeight: 600 },
    grandValue: { fontSize: 16, fontWeight: 700, color: C.brand },
    contractRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },

    footer: { position: 'absolute', bottom: 26, left: 44, right: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 9 },
    footerText: { fontSize: 7.5, color: C.muted },
    footerPage: { fontFamily: 'GeistMono', fontSize: 7.5, color: C.muted },

    panelHeader: { marginTop: 4, marginBottom: 14 },
    panelName: { fontSize: 20, fontWeight: 600, letterSpacing: -0.3, lineHeight: 1.2, marginTop: 6 },
    panelCity: { fontSize: 10.5, color: C.soft, marginTop: 4 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    chip: { borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, paddingVertical: 4, paddingHorizontal: 7, marginRight: 6, marginBottom: 6, flexDirection: 'row' },
    chipLabel: { fontFamily: 'GeistMono', fontSize: 7, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginRight: 5 },
    chipValue: { fontSize: 8, fontWeight: 500 },

    photoHero: { width: '100%', height: 300, marginBottom: 8 },
    photoHeroCompact: { width: '100%', height: 220, marginBottom: 8 },
    photoHeroSolo: { width: '100%', height: 440 },
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    photoCell: { width: '49.2%', height: 150, marginBottom: 8 },
    photoEmpty: { width: '100%', height: 300 },
    photo: { width: '100%', height: '100%', objectFit: 'cover' },
    photoMissing: { width: '100%', height: '100%', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
});

const brl = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const pad = (n: number) => String(n).padStart(2, '0');
const monthsLabel = (m: number) => `${m} ${m === 1 ? 'mês' : 'meses'}`;
const place = (p: CalculatedPanel) => [p.city, p.state].filter(Boolean).join(' · ');

const Eyebrow = ({ children, brand }: { children: string; brand?: boolean }) => <Text style={brand ? styles.eyebrowBrand : styles.eyebrow}>{children}</Text>;

const SectionTitle = ({ children }: { children: string }) => (
    <View style={styles.sectionTitle}>
        <View style={styles.sectionBar} />
        <Eyebrow>{children}</Eyebrow>
    </View>
);

const Header = ({ logo, date, fixed }: { logo: string | null; date: string; fixed?: boolean }) => (
    <View style={styles.header} fixed={fixed}>
        <View style={styles.brandRow}>
            {logo && <Image src={logo} style={styles.logo} />}
            <Text style={styles.wordmark}>T3 OOH</Text>
        </View>
        <View style={styles.headerRight}>
            <Eyebrow brand>Proposta comercial</Eyebrow>
            <Text style={styles.headerDate}>{date}</Text>
        </View>
    </View>
);

const Footer = ({ sellerName }: { sellerName: string }) => (
    <View style={styles.footer} fixed>
        <Text style={styles.footerText}>t3led.com.br · Vendedor(a): {sellerName} · Proposta válida por 7 dias</Text>
        <Text style={styles.footerPage} render={({ pageNumber, totalPages }) => `${pad(pageNumber)} / ${pad(totalPages)}`} />
    </View>
);

const Photo = ({ src, style }: { src: string | null; style: (typeof styles)[keyof typeof styles] }) => (
    <View style={style} wrap={false}>
        {src ? <Image src={src} style={styles.photo} /> : (
            <View style={styles.photoMissing}><Text style={styles.footerText}>Foto indisponível</Text></View>
        )}
    </View>
);

const PanelPage = ({ panel, index, total, photos, logo, date, sellerName }: {
    panel: CalculatedPanel; index: number; total: number; photos: (string | null)[]; logo: string | null; date: string; sellerName: string;
}) => {
    const chips = ([
        ['Formato', panel.size],
        ['Resolução', panel.px],
        ['Impactos', panel.impacts],
    ] as [string, string | undefined][]).filter(([, v]) => v && String(v).trim()) as [string, string][];
    const [first, ...rest] = photos;
    const where = [place(panel), panel.address].filter(Boolean).join(' — ');
    return (
        <Page size="A4" style={styles.page}>
            {/* Repetido nas páginas de continuação quando o painel tem muitas fotos */}
            <Header logo={logo} date={date} fixed />
            <View style={styles.panelHeader}>
                <Eyebrow brand>{`Painel ${pad(index + 1)} de ${pad(total)}`}</Eyebrow>
                <Text style={styles.panelName}>{panel.name}</Text>
                {where && <Text style={styles.panelCity}>{where}</Text>}
                {chips.length > 0 && (
                    <View style={styles.chips}>
                        {chips.map(([label, value]) => (
                            <View key={label} style={styles.chip}>
                                <Text style={styles.chipLabel}>{label}</Text>
                                <Text style={styles.chipValue}>{value}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {photos.length === 0 ? (
                <Photo src={null} style={styles.photoEmpty} />
            ) : (
                <>
                    <Photo src={first} style={rest.length > 2 ? styles.photoHeroCompact : rest.length ? styles.photoHero : styles.photoHeroSolo} />
                    {rest.length > 0 && (
                        <View style={styles.photoGrid}>
                            {rest.map((src, i) => <Photo key={i} src={src} style={styles.photoCell} />)}
                        </View>
                    )}
                </>
            )}
            <Footer sellerName={sellerName} />
        </Page>
    );
};

export const ProposalDocument = ({ client, panels, months, totals, date, sellerName, assets }: ProposalPDFProps & { assets: ProposalAssets }) => {
    const contractTotal = totals.finalMonthlyValue * months;
    return (
        <Document title={`Proposta T3 OOH · ${client.name}`} author="T3 OOH" subject="Proposta comercial de mídia OOH" language="pt-BR">
            {/* Página 01: apresentação e dados da proposta, sem fotos */}
            <Page size="A4" style={styles.page}>
                <Header logo={assets.logo} date={date} />

                <View style={styles.hero}>
                    <View style={styles.accent} />
                    <Eyebrow brand>Painéis de LED · Mídia OOH</Eyebrow>
                    <Text style={styles.title}>Proposta para {client.company || client.name}</Text>
                    {PROPOSAL_INTRO.map((p, i) => <Text key={i} style={styles.intro}>{p}</Text>)}
                </View>

                <View style={styles.section}>
                    <SectionTitle>{`Painéis e valores · ${pad(panels.length)} ${panels.length === 1 ? 'painel' : 'painéis'}`}</SectionTitle>
                    <View style={styles.tableHead}>
                        <Text style={[styles.eyebrow, styles.cName]}>Painel</Text>
                        <Text style={[styles.eyebrow, styles.cFmt]}>Formato</Text>
                        <Text style={[styles.eyebrow, styles.cMoney]}>Tabela</Text>
                        <Text style={[styles.eyebrow, styles.cDisc]}>Desc.</Text>
                        <Text style={[styles.eyebrow, styles.cMoney]}>Mensal</Text>
                    </View>
                    {panels.map((p) => (
                        <View key={p.id} style={styles.row} wrap={false}>
                            <View style={styles.cName}>
                                <Text style={styles.cellStrong}>{p.name}</Text>
                                {place(p) && <Text style={styles.cellSub}>{place(p)}</Text>}
                            </View>
                            <Text style={[styles.cell, styles.cFmt]}>{p.size || '—'}</Text>
                            <Text style={[styles.cell, styles.cMoney]}>{brl(p.basePrice)}</Text>
                            <Text style={[styles.cell, styles.cDisc]}>{p.discountPct > 0 ? `${p.discountPct}%` : '—'}</Text>
                            <Text style={[styles.cellStrong, styles.cMoney]}>{brl(p.finalPrice)}</Text>
                        </View>
                    ))}
                </View>

                {/* Cliente e valores lado a lado, para a página 01 caber inteira */}
                <View style={[styles.section, styles.bottomRow]} wrap={false}>
                    <View style={styles.bottomClient}>
                        <SectionTitle>Cliente</SectionTitle>
                        <View style={styles.clientBox}>
                            <Eyebrow>Nome</Eyebrow>
                            <Text style={styles.clientValue}>{client.name}</Text>
                            {client.company && (
                                <>
                                    <Text style={[styles.eyebrow, styles.clientGap]}>Empresa</Text>
                                    <Text style={styles.clientValue}>{client.company}</Text>
                                </>
                            )}
                            {client.email && (
                                <>
                                    <Text style={[styles.eyebrow, styles.clientGap]}>E-mail</Text>
                                    <Text style={styles.clientValue}>{client.email}</Text>
                                </>
                            )}
                            {client.phone && (
                                <>
                                    <Text style={[styles.eyebrow, styles.clientGap]}>Telefone</Text>
                                    <Text style={styles.clientValue}>{client.phone}</Text>
                                </>
                            )}
                        </View>
                    </View>
                    <View style={styles.bottomTotals}>
                        <SectionTitle>Valores</SectionTitle>
                    <View style={styles.totals} wrap={false}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Prazo de veiculação</Text>
                            <Text style={styles.totalValue}>{monthsLabel(months)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal mensal</Text>
                            <Text style={styles.totalValue}>{brl(totals.monthlyAfterIndividual)}</Text>
                        </View>
                        {totals.termDiscountPercent > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Desconto de prazo ({Math.round(totals.termDiscountPercent * 100)}%)</Text>
                                <Text style={styles.totalValue}>− {brl(totals.monthlyAfterIndividual * totals.termDiscountPercent)}</Text>
                            </View>
                        )}
                        {totals.globalDiscountNum > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Desconto de negociação ({totals.globalDiscountNum}%)</Text>
                                <Text style={styles.totalValue}>− {brl(totals.monthlyAfterTerm * (totals.globalDiscountNum / 100))}</Text>
                            </View>
                        )}
                        <View style={styles.grandRow}>
                            <Text style={styles.grandLabel}>Investimento mensal</Text>
                            <Text style={styles.grandValue}>{brl(totals.finalMonthlyValue)}</Text>
                        </View>
                        <View style={styles.contractRow}>
                            <Text style={styles.totalLabel}>Total em {monthsLabel(months)}</Text>
                            <Text style={styles.totalValue}>{brl(contractTotal)}</Text>
                        </View>
                    </View>
                    </View>
                </View>

                <Footer sellerName={sellerName} />
            </Page>

            {/* Página 02 em diante: fotos de cada painel */}
            {panels.map((p, i) => (
                <PanelPage key={p.id} panel={p} index={i} total={panels.length} photos={assets.photos[p.id] ?? []} logo={assets.logo} date={date} sellerName={sellerName} />
            ))}
        </Document>
    );
};
