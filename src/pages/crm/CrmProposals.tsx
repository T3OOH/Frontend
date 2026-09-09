import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    FileText, Search, MapPin, CalendarDays, User as UserIcon, 
    Loader2, Download, MonitorPlay, CheckCircle2, Percent, Tag, Settings, CreditCard, ArrowLeft
} from 'lucide-react';
import { 
    Document, Page, Text, View, StyleSheet, Image, PDFViewer, pdf 
} from '@react-pdf/renderer';
import { motion, AnimatePresence } from 'framer-motion';

import { api } from '@/lib/axios';
import { panelsService, PanelData } from '@/services/panels.service';
import { crmService } from '@/services/crm.service';
import { CustomSelect } from '@/components/CustomSelect';
import { Button } from '@/components/Button';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

type PanelWithPrice = PanelData & { price?: number | string };

interface CalculatedPanel extends PanelWithPrice {
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
    grandTotalValue: { fontSize: 14, color: '#25D366', fontWeight: 'bold' },
    
    imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 15 },
    imageCard: { width: '48%', marginBottom: 10 },
    panelImage: { width: '100%', height: 100, objectFit: 'cover', borderRadius: 4 },
    imageCaption: { fontSize: 8, color: '#666666', marginTop: 4, textAlign: 'center' },

    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTop: '1px solid #EEEEEE', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
    footerText: { fontSize: 8, color: '#999999' },
});

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const DISCOUNT_OPTIONS = [
    { value: '0', label: 'Sem Desc.' },
    ...Array.from({ length: 15 }, (_, i) => {
        const val = (i + 1) * 5;
        return { value: String(val), label: `${val}% OFF` };
    })
];

// ==========================================
// COMPONENTE DO DOCUMENTO PDF
// ==========================================
interface ProposalPDFProps {
    client: any;
    panels: CalculatedPanel[];
    months: number;
    totals: any;
    date: string;
    sellerName: string;
}

const ProposalDocument = ({ client, panels, months, totals, date, sellerName }: ProposalPDFProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Image src="/T3 Black.png" style={styles.logoImage} />
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

type TabType = 'dados' | 'paineis' | 'financeiro' | 'preview';

export function CrmProposals() {
    const { id: orderId } = useParams(); // ID do pacote de pedidos (Se vier do CRM Overview)
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('dados');
    
    const [clients, setClients] = useState<any[]>([]);
    const [panels, setPanels] = useState<PanelWithPrice[]>([]);
    
    const [loadedOrder, setLoadedOrder] = useState<any>(null); // Armazena o pedido do site
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedPanelIds, setSelectedPanelIds] = useState<string[]>([]);
    const [months, setMonths] = useState(1);
    
    const [individualDiscounts, setIndividualDiscounts] = useState<Record<string, number>>({});
    const [globalDiscount, setGlobalDiscount] = useState<number | ''>('');

    // =========================================================
    // BUSCA DE DADOS E CARREGAMENTO DO PEDIDO
    // =========================================================
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                const [clientsData, panelsData, ordersRes] = await Promise.all([
                    crmService.getClients().catch(() => []),
                    panelsService.getAllPanels().catch(() => []),
                    orderId ? api.get('/orders').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
                ]);
                
                setClients(clientsData);
                setPanels(panelsData.filter(p => p.status === 'AVAILABLE') as PanelWithPrice[]);

                // Se viemos da tela de CRM Overview, carregamos os dados do Pacote (Order)
                if (orderId && ordersRes.data) {
                    const order = ordersRes.data.find((o: any) => o.id === orderId);
                    if (order) {
                        setLoadedOrder(order);
                        
                        // Extrai a duração em meses
                        const startDate = order.startDate ? new Date(order.startDate) : new Date();
                        const endDate = order.endDate ? new Date(order.endDate) : new Date();
                        const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); 
                        const calculatedMonths = Math.max(1, Math.round(diffDays / 30));
                        setMonths(calculatedMonths);

                        // Seleciona os painéis automaticamente
                        if (order.items && Array.isArray(order.items)) {
                            setSelectedPanelIds(order.items.map((i: any) => i.panelId));
                        }
                    }
                }
            } catch (error) {
                addToast('Erro ao carregar dados do CRM e Catálogo.', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [orderId]);

    // O Cliente Atual: ou o do Pedido carregado ou o selecionado na lista (Criação Manual)
    const currentClient = useMemo(() => {
        if (loadedOrder) {
            return {
                name: loadedOrder.user?.name || 'Cliente Site',
                company: loadedOrder.company?.corporateName || loadedOrder.user?.companyName,
                email: loadedOrder.user?.email,
                phone: loadedOrder.user?.phone,
                whatsapp: loadedOrder.user?.phone,
                document: loadedOrder.user?.document
            };
        }
        return clients.find(c => c.id === selectedClientId) || null;
    }, [loadedOrder, clients, selectedClientId]);
    
    // =========================================================
    // CÁLCULOS E TOTALIZADORES
    // =========================================================
    const calculatedPanels = useMemo(() => {
        const selected = panels.filter(p => selectedPanelIds.includes(p.id));
        return selected.map(p => {
            const basePrice = Number(p.price) || 0;
            const discountPct = individualDiscounts[p.id] || 0;
            const finalPrice = basePrice * (1 - discountPct / 100);
            return { ...p, basePrice, discountPct, finalPrice };
        });
    }, [panels, selectedPanelIds, individualDiscounts]);

    const totals = useMemo(() => {
        const baseMonthly = calculatedPanels.reduce((acc, p) => acc + p.basePrice, 0);
        const monthlyAfterIndividual = calculatedPanels.reduce((acc, p) => acc + p.finalPrice, 0);
        
        let termDiscountPercent = 0;
        if (months >= 12) termDiscountPercent = 0.30;
        else if (months >= 6) termDiscountPercent = 0.20;
        else if (months >= 3) termDiscountPercent = 0.15;

        const monthlyAfterTerm = monthlyAfterIndividual * (1 - termDiscountPercent);
        const globalDiscountNum = Number(globalDiscount) || 0;
        const finalMonthlyValue = monthlyAfterTerm * (1 - globalDiscountNum / 100);

        return { 
            baseMonthly, 
            monthlyAfterIndividual, 
            termDiscountPercent,
            monthlyAfterTerm,
            globalDiscountNum, 
            finalMonthlyValue 
        };
    }, [calculatedPanels, months, globalDiscount]);

    const clientOptions = useMemo(() => [
        { value: '', label: 'Selecione um Cliente...' },
        ...clients.map(c => ({ value: c.id, label: `${c.name} ${c.company ? `(${c.company})` : ''}` }))
    ], [clients]);

    const monthOptions = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => ({
            value: String(i + 1),
            label: `${i + 1} ${i === 0 ? 'Mês' : 'Meses'}`
        }));
    }, []);

    // =========================================================
    // HANDLERS
    // =========================================================
    const handleTogglePanel = (id: string) => {
        setSelectedPanelIds(prev => {
            if (prev.includes(id)) {
                const newDiscounts = { ...individualDiscounts };
                delete newDiscounts[id];
                setIndividualDiscounts(newDiscounts);
                return prev.filter(pId => pId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleIndividualDiscount = (id: string, discount: number) => {
        setIndividualDiscounts(prev => ({ ...prev, [id]: discount }));
    };

    const handleDownloadPDF = async () => {
        if (!currentClient || calculatedPanels.length === 0) {
            addToast('Selecione um cliente e pelo menos um painel para gerar a proposta.', 'error');
            return false;
        }

        try {
            const blob = await pdf(
                <ProposalDocument 
                    client={currentClient} 
                    panels={calculatedPanels} 
                    months={months} 
                    totals={totals}
                    date={new Date().toLocaleDateString('pt-BR')}
                    sellerName={user?.name || 'Comercial T3 OOH'}
                />
            ).toBlob();
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Proposta_T3_OOH_${currentClient.name.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            addToast('Proposta baixada com sucesso!', 'success');
            return true;
        } catch (error) {
            addToast('Erro ao gerar o PDF da proposta.', 'error');
            return false;
        }
    };

    const handleSendWhatsApp = async () => {
        if (!currentClient) {
            addToast('O cliente não foi selecionado ou não existe.', 'error');
            return;
        }
        
        const phone = currentClient.whatsapp || currentClient.phone;
        if (!phone) {
            addToast('O cliente não possui um número de WhatsApp cadastrado.', 'error');
            return;
        }

        const isDownloaded = await handleDownloadPDF();
        
        if (isDownloaded) {
            let cleanPhone = phone.replace(/\D/g, '');
            if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) {
                cleanPhone = '55' + cleanPhone;
            }
            
            const firstName = currentClient.name.split(' ')[0];
            const sellerName = user?.name || 'Comercial';
            
            const text = `Olá, *${firstName}*! Tudo bem?\n\nAqui é *${sellerName}* da *T3 OOH*.\n\nConforme sua solicitação em nosso site, preparamos uma proposta comercial personalizada para a sua campanha.\n\nEstou enviando o arquivo PDF com todos os detalhes e valores aplicados. Qualquer dúvida, sigo totalmente à disposição!`;
            
            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
            
            // Se veio de um pacote do site, atualiza o status para "Em Venda" (APPROVED)
            if (loadedOrder) {
                try {
                    await api.patch(`/orders/${loadedOrder.id}`, { status: 'APPROVED' });
                } catch (e) {
                    console.error("Não foi possível atualizar o status do pacote no banco.");
                }
            }

            setTimeout(() => {
                window.open(waUrl, '_blank');
                addToast('WhatsApp aberto! Agora é só anexar o PDF baixado na conversa.', 'success');
                // Se finalizou com o pedido, volta pro CRM
                if(loadedOrder) navigate('/dashboard/crm');
            }, 800);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full overflow-hidden pb-4 gap-4 md:gap-6 relative max-w-7xl mx-auto">
            
            {/* CABEÇALHO */}
            <div className="flex flex-row items-center justify-between gap-4 shrink-0 px-4 lg:px-0">
                <div className="flex items-center gap-3">
                    {loadedOrder && (
                        <button onClick={() => navigate('/dashboard/crm')} className="p-2 bg-brand-surface/30 border border-brand-border/40 hover:bg-brand-surface rounded-full transition-colors text-brand-muted hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-brand-text tracking-tight flex items-center gap-2">
                            <FileText className="w-5 h-5 md:w-6 md:h-6 text-brand-neon" /> 
                            <span className="hidden sm:inline">Gerador de </span>Propostas
                        </h1>
                        <p className="hidden md:block text-xs md:text-sm text-brand-muted mt-1 font-medium">Monte propostas comerciais interativas e gere PDFs automáticos.</p>
                    </div>
                </div>
                <Button 
                    onClick={handleDownloadPDF} 
                    disabled={!currentClient || calculatedPanels.length === 0}
                    className="bg-[#25D366] hover:brightness-110 text-[#0A0A0B] border-none font-black uppercase tracking-widest text-[10px] md:text-[11px] flex items-center gap-2 shadow-[0_0_15px_rgba(37,211,102,0.3)] shrink-0 h-10 md:h-12 px-4 md:px-6 rounded-xl"
                >
                    <Download className="w-4 h-4 md:w-5 md:h-5" /> <span className="hidden sm:inline">Baixar </span>PDF
                </Button>
            </div>

            {/* ÁREA DE CONTEÚDO */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 min-h-0 px-4 lg:px-0">
                
                {/* COLUNA ESQUERDA: WIZARD DE ABAS */}
                <div className={`w-full lg:w-[420px] flex flex-col relative z-10 shrink-0 ${activeTab === 'preview' ? 'flex-none' : 'flex-1 min-h-0 lg:h-full'}`}>
                    
                    {/* Navegação de Abas */}
                    <div className="flex bg-brand-surface p-1.5 rounded-[16px] border border-brand-border mb-4 shrink-0 shadow-sm overflow-x-auto custom-scrollbar gap-1 transition-colors">
                        <button 
                            onClick={() => setActiveTab('dados')}
                            className={`min-w-[90px] flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors ${activeTab === 'dados' ? 'bg-brand-neon text-[#0A0A0B] shadow-sm' : 'text-brand-muted hover:text-brand-text hover:bg-brand-background'}`}
                        >
                            <Settings className="w-3.5 h-3.5" /> <span className="hidden sm:inline">1.</span> Config
                        </button>
                        <button 
                            onClick={() => setActiveTab('paineis')}
                            className={`min-w-[100px] flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors ${activeTab === 'paineis' ? 'bg-brand-neon text-[#0A0A0B] shadow-sm' : 'text-brand-muted hover:text-brand-text hover:bg-brand-background'}`}
                        >
                            <MapPin className="w-3.5 h-3.5" /> <span className="hidden sm:inline">2.</span> Telões
                            {selectedPanelIds.length > 0 && <span className={`ml-1 px-1.5 rounded-full text-[9px] ${activeTab === 'paineis' ? 'bg-black/20 text-black' : 'bg-brand-background text-brand-neon border border-brand-border'}`}>{selectedPanelIds.length}</span>}
                        </button>
                        <button 
                            onClick={() => setActiveTab('financeiro')}
                            className={`min-w-[90px] flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors ${activeTab === 'financeiro' ? 'bg-brand-neon text-[#0A0A0B] shadow-sm' : 'text-brand-muted hover:text-brand-text hover:bg-brand-background'}`}
                        >
                            <CreditCard className="w-3.5 h-3.5" /> <span className="hidden sm:inline">3.</span> Fechar
                        </button>
                        <button 
                            onClick={() => setActiveTab('preview')}
                            className={`lg:hidden min-w-[100px] flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors ${activeTab === 'preview' ? 'bg-brand-neon text-[#0A0A0B] shadow-sm' : 'text-brand-muted hover:text-brand-text hover:bg-brand-background'}`}
                        >
                            <Search className="w-3.5 h-3.5" /> <span className="hidden sm:inline">4.</span> Preview
                        </button>
                    </div>

                    {/* Conteúdo Dinâmico das Abas */}
                    <div className={`flex-1 flex-col overflow-hidden min-h-0 ${activeTab === 'preview' ? 'hidden lg:flex' : 'flex'}`}>
                        <AnimatePresence mode="wait">
                            
                            {/* ABA 1: DADOS CLIENTE E PRAZO */}
                            {activeTab === 'dados' && (
                                <motion.div 
                                    key="dados"
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                                    className="flex flex-col gap-5 flex-1"
                                >
                                    <div className="bg-brand-surface border border-brand-border p-6 rounded-[24px] shadow-sm transition-colors">
                                        <h2 className="text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <UserIcon className="w-4 h-4 text-brand-neon" /> Cliente da Proposta
                                        </h2>
                                        
                                        {/* Se tiver vindo de um pacote, mostra os dados diretos. Se não, mostra o select */}
                                        {loadedOrder ? (
                                            <div className="bg-brand-background border border-brand-neon/30 p-5 rounded-xl shadow-inner">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-base font-bold text-brand-neon">{currentClient?.name}</span>
                                                    <span className="text-[11px] uppercase tracking-wider font-bold text-brand-muted flex items-center gap-2">
                                                        {currentClient?.company || 'Pessoa Física / Sem Empresa'}
                                                    </span>
                                                    <span className="text-xs text-brand-muted mt-2 font-medium bg-brand-surface px-3 py-2 rounded-lg border border-brand-border/50">
                                                        {currentClient?.phone} • {currentClient?.email || 'Sem email'}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <CustomSelect
                                                options={clientOptions}
                                                value={selectedClientId}
                                                onChange={(val: string) => setSelectedClientId(val)}
                                                placeholder="Buscar cliente na base..."
                                            />
                                        )}
                                    </div>

                                    <div className="bg-brand-surface border border-brand-border p-6 rounded-[24px] shadow-sm transition-colors">
                                        <h2 className="text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <CalendarDays className="w-4 h-4 text-brand-neon" /> Prazo da Campanha
                                        </h2>
                                        <CustomSelect
                                            options={monthOptions}
                                            value={String(months)}
                                            onChange={(val: string) => setMonths(Number(val))}
                                            placeholder="Selecione o prazo..."
                                        />
                                    </div>

                                    <Button onClick={() => setActiveTab('paineis')} className="mt-auto bg-brand-surface border-brand-border text-brand-text hover:border-brand-neon hover:text-brand-neon h-12 uppercase tracking-widest text-[11px] font-bold shrink-0 shadow-sm">
                                        Avançar para Telões
                                    </Button>
                                </motion.div>
                            )}

                            {/* ABA 2: PAINÉIS E DESCONTOS INDIVIDUAIS */}
                            {activeTab === 'paineis' && (
                                <motion.div 
                                    key="paineis"
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                                    className="bg-brand-surface border border-brand-border p-5 md:p-6 rounded-[24px] flex-1 flex flex-col min-h-0 shadow-sm transition-colors"
                                >
                                    <div className="flex justify-between items-center mb-5 shrink-0 px-1 border-b border-brand-border pb-4">
                                        <h2 className="text-[11px] font-bold text-brand-muted uppercase tracking-widest flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-brand-neon" /> Catálogo de Telões
                                        </h2>
                                        <span className="text-[10px] bg-brand-background border border-brand-border px-2.5 py-1 rounded-md text-brand-text font-bold shadow-sm">
                                            {panels.length} Opções
                                        </span>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4 pb-4">
                                        {panels.map(panel => {
                                            const isSelected = selectedPanelIds.includes(panel.id);
                                            const currentDiscount = individualDiscounts[panel.id] || 0;
                                            const originalPrice = Number(panel.price) || 0;
                                            const currentPrice = originalPrice * (1 - currentDiscount / 100);

                                            return (
                                                <div 
                                                    key={panel.id}
                                                    onClick={() => handleTogglePanel(panel.id)}
                                                    className={`flex flex-col p-4 rounded-[20px] cursor-pointer transition-all border shadow-sm ${
                                                        isSelected 
                                                        ? 'bg-brand-neon/5 border-brand-neon/40' 
                                                        : 'bg-brand-background border-brand-border hover:border-brand-neon/50'
                                                    }`}
                                                >
                                                    <div className="flex gap-4 w-full items-center">
                                                        <div className="w-14 h-14 rounded-xl bg-brand-surface shrink-0 overflow-hidden border border-brand-border">
                                                            {panel.images?.[0] ? (
                                                                <img src={panel.images[0]} alt={panel.name} className="w-full h-full object-cover opacity-90" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center"><MonitorPlay className="w-5 h-5 text-brand-muted/50" /></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                            <h4 className={`text-[13px] font-bold truncate transition-colors leading-tight ${isSelected ? 'text-brand-neon' : 'text-brand-text'}`}>
                                                                {panel.name}
                                                            </h4>
                                                            <p className="text-[10px] md:text-[11px] text-brand-muted font-medium truncate mt-0.5">{panel.city} - {panel.state}</p>
                                                            <span className="text-[11px] md:text-[12px] font-black text-[#25D366] mt-1.5">
                                                                {formatCurrency(currentPrice)} {currentDiscount > 0 && <span className="text-[9px] md:text-[10px] text-brand-muted line-through ml-1">{formatCurrency(originalPrice)}</span>}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-center px-1">
                                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors shadow-inner ${
                                                                isSelected ? 'bg-brand-neon border-brand-neon text-[#0A0A0B]' : 'border-brand-border bg-brand-surface'
                                                            }`}>
                                                                {isSelected && <CheckCircle2 className="w-4 h-4 md:w-4 md:h-4" />}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isSelected && (
                                                        <div 
                                                            className="mt-4 pt-4 border-t border-brand-border flex items-center justify-between"
                                                            onClick={(e) => e.stopPropagation()} 
                                                        >
                                                            <span className="text-[10px] text-brand-muted uppercase font-bold tracking-widest flex items-center gap-1 md:gap-1.5">
                                                                <Tag className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Desconto </span>Indiv.
                                                            </span>
                                                            <div className="w-[120px] md:w-[130px] relative z-[9999]">
                                                                <CustomSelect
                                                                    options={DISCOUNT_OPTIONS}
                                                                    value={String(currentDiscount)}
                                                                    onChange={(val: string) => handleIndividualDiscount(panel.id, Number(val))}
                                                                    placeholder="Desconto"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="pt-4 border-t border-brand-border shrink-0 bg-brand-surface">
                                        <Button onClick={() => setActiveTab('financeiro')} disabled={selectedPanelIds.length === 0} className="w-full bg-brand-background border-brand-border text-brand-text hover:border-brand-neon hover:text-brand-neon h-12 uppercase tracking-widest text-[11px] font-bold shadow-sm">
                                            Avançar para Valores
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ABA 3: FINANCEIRO E FECHAMENTO */}
                            {activeTab === 'financeiro' && (
                                <motion.div 
                                    key="financeiro"
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                                    className="flex flex-col gap-4 md:gap-6 flex-1 overflow-y-auto custom-scrollbar"
                                >
                                    <div className="bg-brand-surface border border-brand-border p-6 rounded-[24px] relative overflow-hidden shrink-0 shadow-sm transition-colors">
                                        <h2 className="text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                                            <Percent className="w-4 h-4 text-brand-neon" /> Desconto Global Adicional (%)
                                        </h2>
                                        <div className="relative z-10">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                placeholder="0"
                                                value={globalDiscount}
                                                onChange={(e) => setGlobalDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                                                className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-4 text-base font-black text-brand-neon focus:outline-none focus:border-brand-neon transition-colors shadow-sm text-center"
                                            />
                                        </div>
                                        {Number(globalDiscount) > 0 && <div className="absolute right-0 bottom-0 w-32 h-32 bg-brand-neon/10 rounded-full blur-3xl pointer-events-none" />}
                                    </div>

                                    <div className="bg-brand-surface border border-brand-neon/30 p-6 rounded-[24px] shadow-[0_0_20px_rgba(255,94,0,0.05)] shrink-0 transition-colors">
                                        <h2 className="text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-brand-border pb-3">
                                            <CreditCard className="w-4 h-4 text-[#25D366]" /> Resumo Rápido Mensal
                                        </h2>
                                        <div className="flex flex-col gap-3.5 text-xs md:text-sm">
                                            <div className="flex justify-between items-center text-brand-muted font-medium">
                                                <span>Soma dos Telões:</span>
                                                <span className="font-bold text-brand-text">{formatCurrency(totals.monthlyAfterIndividual)}</span>
                                            </div>
                                            {totals.termDiscountPercent > 0 && (
                                                <div className="flex justify-between items-center text-brand-muted font-medium">
                                                    <span>Bônus Prazo ({totals.termDiscountPercent * 100}%):</span>
                                                    <span className="font-bold text-red-500">- {formatCurrency(totals.monthlyAfterIndividual * totals.termDiscountPercent)}</span>
                                                </div>
                                            )}
                                            {totals.globalDiscountNum > 0 && (
                                                <div className="flex justify-between items-center text-brand-muted font-medium">
                                                    <span>Negociação ({totals.globalDiscountNum}%):</span>
                                                    <span className="font-bold text-red-500">- {formatCurrency(totals.monthlyAfterTerm * (totals.globalDiscountNum / 100))}</span>
                                                </div>
                                            )}
                                            <div className="border-t border-brand-border mt-3 pt-5 flex justify-between items-center">
                                                <span className="font-bold text-brand-text uppercase tracking-widest text-[10px] md:text-[11px]">Final Mensal:</span>
                                                <span className="font-black text-xl md:text-2xl text-[#25D366] tracking-tight">{formatCurrency(totals.finalMonthlyValue)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botões Finais */}
                                    <div className="flex flex-col gap-3 mt-auto pt-2 shrink-0">
                                        <Button 
                                            onClick={handleSendWhatsApp} 
                                            disabled={!currentClient || calculatedPanels.length === 0}
                                            className="w-full bg-[#25D366] hover:brightness-110 text-[#0A0A0B] h-14 uppercase tracking-widest text-[12px] font-black border-none shadow-[0_0_15px_rgba(37,211,102,0.3)]"
                                        >
                                            Enviar Proposta
                                        </Button>
                                        
                                        <Button onClick={() => setActiveTab('preview')} className="lg:hidden w-full bg-brand-background border-brand-border text-brand-text hover:border-brand-neon hover:text-brand-neon h-14 uppercase tracking-widest text-[12px] font-bold shadow-sm">
                                            Visualizar PDF
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* COLUNA DIREITA: PREVIEW DO PDF */}
                <div className={`bg-brand-surface border border-brand-border rounded-[24px] flex-col overflow-hidden relative z-0 shadow-sm transition-colors ${activeTab === 'preview' ? 'flex flex-1 min-h-[400px]' : 'hidden lg:flex lg:flex-1 lg:min-h-[500px]'}`}>
                    <div className="p-5 border-b border-brand-border flex justify-between items-center shrink-0 bg-brand-background/50">
                        <span className="text-[11px] font-bold text-brand-muted uppercase tracking-widest flex items-center gap-2">
                            <Search className="w-4 h-4 text-brand-neon" /> Pré-visualização da Proposta
                        </span>
                        {(!currentClient || calculatedPanels.length === 0) && (
                            <span className="text-[10px] text-red-500 bg-red-500/10 px-3 py-1.5 rounded-md border border-red-500/20 font-bold">
                                Configure a proposta primeiro.
                            </span>
                        )}
                    </div>
                    
                    <div className="flex-1 w-full h-full bg-brand-background">
                        {currentClient && calculatedPanels.length > 0 ? (
                            <PDFViewer width="100%" height="100%" className="border-none">
                                <ProposalDocument 
                                    client={currentClient} 
                                    panels={calculatedPanels} 
                                    months={months} 
                                    totals={totals}
                                    date={new Date().toLocaleDateString('pt-BR')}
                                    sellerName={user?.name || 'Comercial T3 OOH'}
                                />
                            </PDFViewer>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 opacity-40">
                                <FileText className="w-16 h-16 md:w-20 md:h-20 text-brand-muted mb-4" />
                                <p className="text-sm text-brand-muted font-bold tracking-widest uppercase">Aguardando dados...</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}