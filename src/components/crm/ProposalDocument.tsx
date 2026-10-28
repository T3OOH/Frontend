import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { PanelData } from '@/services/panels.service';

/* PDF da proposta comercial (cores fixas: o arquivo não segue o tema da tela). */

export type PanelWithPrice = PanelData & { price?: number | string };

export interface CalculatedPanel extends PanelWithPrice {
    basePrice: number;
    discountPct: number;
    finalPrice: number;
}

// ==========================================
// ESTILOS DO PDF (Mantidos com cores absolutas para o arquivo gerado)
// ==========================================
const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#FFFFFF', position: 'relative' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #FF5E00', paddingBottom: 15, marginBottom: 20 },
    logoImage: { height: 28, objectFit: 'contain' },
    headerInfo: { textAlign: 'right' },
    headerTitle: { fontSize: 10, color: '#666666', textTransform: 'uppercase' },
    headerDate: { fontSize: 10, color: '#111113', marginTop: 4 },
    
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#111113', marginBottom: 10, marginTop: 20, borderLeft: '3px solid #FF5E00', paddingLeft: 6 },
    clientBox: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 4, marginBottom: 15 },
    textNormal: { fontSize: 10, color: '#333333', marginBottom: 4 },
    textBold: { fontSize: 10, fontWeight: 'bold', color: '#111113' },
    
    table: { width: '100%', marginTop: 10 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#111113', padding: 8 },
    tableHeaderCell: { color: '#FFFFFF', fontSize: 9, fontWeight: 'bold', flex: 1 },
    tableRow: { flexDirection: 'row', borderBottom: '1px solid #EEEEEE', padding: 8, alignItems: 'center' },
    tableCell: { fontSize: 9, color: '#333333', flex: 1 },
    tableCellBold: { fontSize: 9, fontWeight: 'bold', color: '#111113', flex: 1 },
    
    totalsBox: { marginTop: 20, alignSelf: 'flex-end', width: '60%', backgroundColor: '#F8F9FA', padding: 15, borderRadius: 4 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    totalText: { fontSize: 10, color: '#666666' },
    totalValue: { fontSize: 10, color: '#111113', fontWeight: 'bold' },
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid #DDDDDD' },
    grandTotalText: { fontSize: 12, color: '#111113', fontWeight: 'bold' },
    grandTotalValue: { fontSize: 14, color: '#FF5E00', fontWeight: 'bold' },
    
    imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 15 },
    imageCard: { width: '48%', marginBottom: 10 },
    panelImage: { width: '100%', height: 100, objectFit: 'cover', borderRadius: 4 },
    imageCaption: { fontSize: 8, color: '#666666', marginTop: 4, textAlign: 'center' },

    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTop: '1px solid #EEEEEE', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
    footerText: { fontSize: 8, color: '#999999' },
});

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);


// ==========================================
// COMPONENTE DO DOCUMENTO PDF
// ==========================================
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

interface ProposalPDFProps {
    client: ProposalClient;
    panels: CalculatedPanel[];
    months: number;
    totals: ProposalTotals;
    date: string;
    sellerName: string;
}

export const ProposalDocument = ({ client, panels, months, totals, date, sellerName }: ProposalPDFProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Image src="/t3-logo-black.png" style={styles.logoImage} />
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Proposta Comercial</Text>
                    <Text style={styles.headerDate}>{date}</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Dados do Cliente</Text>
            <View style={styles.clientBox}>
                <Text style={styles.textNormal}><Text style={styles.textBold}>Cliente/Empresa:</Text> {client?.name || 'Cliente Não Informado'} {client?.company ? `- ${client.company}` : ''}</Text>
                <Text style={styles.textNormal}><Text style={styles.textBold}>Documento:</Text> {client?.document || 'N/A'}</Text>
                <Text style={styles.textNormal}><Text style={styles.textBold}>Contato:</Text> {client?.email || ''} | {client?.phone || ''}</Text>
            </View>

            <Text style={styles.sectionTitle}>Resumo da Campanha ({months} {months > 1 ? 'meses' : 'mês'})</Text>
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Painel / Localização</Text>
                    <Text style={styles.tableHeaderCell}>Formato</Text>
                    <Text style={styles.tableHeaderCell}>Valor Orig.</Text>
                    <Text style={styles.tableHeaderCell}>Desc.</Text>
                    <Text style={styles.tableHeaderCell}>Valor Mensal</Text>
                </View>
                {panels.map((p, i) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={[styles.tableCellBold, { flex: 2 }]}>{p.name}{'\n'}<Text style={{ fontSize: 8, color: '#666', fontWeight: 'normal' }}>{p.city} - {p.state}</Text></Text>
                        <Text style={styles.tableCell}>{p.size || '7x3'}</Text>
                        <Text style={styles.tableCell}>{formatCurrency(p.basePrice)}</Text>
                        <Text style={styles.tableCell}>{p.discountPct > 0 ? `${p.discountPct}% OFF` : '-'}</Text>
                        <Text style={styles.tableCellBold}>{formatCurrency(p.finalPrice)}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.totalsBox}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalText}>Subtotal Mensal:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(totals.monthlyAfterIndividual)}</Text>
                </View>
                
                {totals.termDiscountPercent > 0 && (
                    <View style={styles.totalRow}>
                        <Text style={styles.totalText}>Desc. de Prazo ({totals.termDiscountPercent * 100}%):</Text>
                        <Text style={styles.totalValue}>
                            - {formatCurrency(totals.monthlyAfterIndividual * totals.termDiscountPercent)}
                        </Text>
                    </View>
                )}

                {totals.globalDiscountNum > 0 && (
                    <View style={styles.totalRow}>
                        <Text style={styles.totalText}>Desc. Negociação ({totals.globalDiscountNum}%):</Text>
                        <Text style={styles.totalValue}>
                            - {formatCurrency(totals.monthlyAfterTerm * (totals.globalDiscountNum / 100))}
                        </Text>
                    </View>
                )}
                
                <View style={styles.grandTotalRow}>
                    <Text style={styles.grandTotalText}>Investimento Mensal Final:</Text>
                    <Text style={styles.grandTotalValue}>{formatCurrency(totals.finalMonthlyValue)}</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Pontos Selecionados</Text>
            <View style={styles.imagesGrid}>
                {panels.map((p, i) => (
                    <View key={i} style={styles.imageCard}>
                        {p.images?.[0] ? <Image src={p.images[0]} style={styles.panelImage} /> : <View style={[styles.panelImage, { backgroundColor: '#EEEEEE' }]} />}
                        <Text style={styles.imageCaption}>{p.name} - {p.city}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.footer}>
                <View>
                    <Text style={styles.footerText}>T3 OOH Mídia Exterior | CNPJ: 43.773.494/0001-50</Text>
                    <Text style={[styles.footerText, { marginTop: 2 }]}>www.t3ooh.com</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.footerText}>Vendedor(a): {sellerName}</Text>
                    <Text style={[styles.footerText, { marginTop: 2 }]}>Proposta válida por 7 dias</Text>
                </View>
            </View>
        </Page>
    </Document>
);
