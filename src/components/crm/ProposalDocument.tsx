import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { PanelData } from '@/services/panels.service';
import type { ProposalAssets } from '@/lib/pdf/proposalAssets';

/*
 * PDF da proposta comercial, feito para imprimir: fundo branco, texto escuro, laranja da marca
 * só em detalhes finos, Geist e cantos retos. Página 01: apresentação e dados da proposta (sem fotos).
 * Da página 02 em diante: os painéis em lista, cada um com uma foto de capa pequena (economiza tinta).
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
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    surface2: '#F4F4F5',
    border: '#E4E4E7',
    text: '#111113',
    soft: '#3F3F46',
    muted: '#71717A',
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

    summary: { fontSize: 10, lineHeight: 1.6, color: C.soft },
    bottomRow: { flexDirection: 'row' },
    bottomClient: { width: '40%', paddingRight: 10 },
    bottomTotals: { width: '60%' },
    clientBox: { flexGrow: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, padding: 12 },
    clientGap: { marginTop: 8 },
    clientValue: { fontSize: 9.5, marginTop: 3, color: C.text },


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

    listTitle: { marginTop: 2, marginBottom: 10 },
    card: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 10 },
    cover: { width: 132, height: 84, marginRight: 14, backgroundColor: C.surface2 },
    coverMissing: { width: '100%', height: '100%', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
    photo: { width: '100%', height: '100%', objectFit: 'cover' },
    cardBody: { flex: 1 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardInfo: { flex: 1, paddingRight: 8 },
    panelName: { fontSize: 12, fontWeight: 600, lineHeight: 1.25, marginTop: 3 },
    panelCity: { fontSize: 8.5, color: C.soft, marginTop: 2 },
    cardPrice: { fontSize: 11, fontWeight: 700, color: C.text, textAlign: 'right' },
    cardPriceNote: { fontSize: 7, color: C.muted, textAlign: 'right', marginTop: 2 },
    cardPriceLabel: { fontFamily: 'GeistMono', fontSize: 6.5, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'right' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
    chip: { borderWidth: 1, borderColor: C.border, paddingVertical: 2.5, paddingHorizontal: 6, marginRight: 5, marginBottom: 4, flexDirection: 'row' },
    chipLabel: { fontFamily: 'GeistMono', fontSize: 6.5, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginRight: 4 },
    chipValue: { fontSize: 7.5, fontWeight: 500 },
});

const brl = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const pad = (n: number) => String(n).padStart(2, '0');
const monthsLabel = (m: number) => `${m} ${m === 1 ? 'mês' : 'meses'}`;
const place = (p: CalculatedPanel) => [p.city, p.state].filter(Boolean).join(' · ');
/** "Goiânia (7), Itumbiara (4) e Uberlândia (1)", na ordem em que os painéis aparecem. */
const regions = (panels: CalculatedPanel[]) => {
    const count = new Map<string, number>();
    for (const p of panels) {
        const r = p.city || p.state || 'outras cidades';
        count.set(r, (count.get(r) ?? 0) + 1);
    }
    const parts = [...count].map(([r, n]) => `${r} (${n})`);
    return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}` : parts[0] ?? '';
};

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

/** Foto de capa pequena do painel (uma só por painel, para gastar pouca tinta). */
const Cover = ({ src }: { src: string | null }) => (
    <View style={styles.cover}>
        {src ? <Image src={src} style={styles.photo} /> : (
            <View style={styles.coverMissing}><Text style={styles.footerText}>Sem foto</Text></View>
        )}
    </View>
);

const PanelCard = ({ panel, index, total, cover }: { panel: CalculatedPanel; index: number; total: number; cover: string | null }) => {
    const chips = ([
        ['Formato', panel.size],
        ['Resolução', panel.px],
        ['Impactos', panel.impacts],
    ] as [string, string | undefined][]).filter(([, v]) => v && String(v).trim()) as [string, string][];
    const where = [place(panel), panel.address].filter(Boolean).join(' — ');
    return (
        <View style={styles.card} wrap={false}>
            <Cover src={cover} />
            <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                    <View style={styles.cardInfo}>
                        <Eyebrow brand>{`Painel ${pad(index + 1)} de ${pad(total)}`}</Eyebrow>
                        <Text style={styles.panelName}>{panel.name}</Text>
                        {where && <Text style={styles.panelCity}>{where}</Text>}
                    </View>
                    <View>
                        <Text style={styles.cardPriceLabel}>Mensal</Text>
                        <Text style={styles.cardPrice}>{brl(panel.finalPrice)}</Text>
                        {panel.discountPct > 0 && (
                            <Text style={styles.cardPriceNote}>{`Tabela ${brl(panel.basePrice)} · −${panel.discountPct}%`}</Text>
                        )}
                    </View>
                </View>
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
        </View>
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
                    <SectionTitle>Painéis</SectionTitle>
                    <Text style={styles.summary}>
                        {`${pad(panels.length)} ${panels.length === 1 ? 'painel' : 'painéis'} em ${regions(panels)}. Foto, endereço, formato e valor de cada um a partir da página 02.`}
                    </Text>
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

            {/* Página 02 em diante: os painéis em lista, com a foto de capa pequena de cada um */}
            <Page size="A4" style={styles.page}>
                <Header logo={assets.logo} date={date} fixed />
                <View style={styles.listTitle}>
                    <SectionTitle>{`Painéis da proposta · ${pad(panels.length)} ${panels.length === 1 ? 'painel' : 'painéis'}`}</SectionTitle>
                </View>
                {panels.map((p, i) => (
                    <PanelCard key={p.id} panel={p} index={i} total={panels.length} cover={assets.photos[p.id]?.[0] ?? null} />
                ))}
                <Footer sellerName={sellerName} />
            </Page>
        </Document>
    );
};
