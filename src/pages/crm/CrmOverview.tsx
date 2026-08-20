import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { crmService } from '@/services/crm.service';
import { 
    Target, DollarSign, TrendingUp, Users, Clock, 
    CheckCircle2, UserPlus, Loader2, FileDown, MessageCircle 
} from 'lucide-react';

// Dependências de exportação de documentos
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function CrmOverview() {
    const { user } = useAuth();
    const { addToast } = useToast();
    
    // =========================================================
    // ESTADOS
    // =========================================================
    const [metrics, setMetrics] = useState({
        totalExpectedValue: 0,
        totalActiveDeals: 0,
        totalClients: 0,
        totalWonValue: 0
    });
    
    const [panels, setPanels] = useState<any[]>([]);
    const [globalDeals, setGlobalDeals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

    // =========================================================
    // EFEITOS E POLLING
    // =========================================================
    useEffect(() => {
        let isPolling = true;
        let pollInterval: ReturnType<typeof setInterval>;

        const initFetch = async () => {
            const success = await fetchData();
            if (success && isPolling) {
                pollInterval = setInterval(fetchData, 60000);
            }
        };

        initFetch();

        return () => {
            isPolling = false;
            if (pollInterval) clearInterval(pollInterval);
        };
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [metricsData, dealsData, panelsData] = await Promise.all([
                crmService.getMetrics().catch(() => null),
                crmService.getGlobalDeals(),
                crmService.getDeals ? crmService.getDeals() : fetch('http://localhost:3333/panels').then(res => res.json()).catch(() => [])
            ]);
            if (metricsData) setMetrics(metricsData);
            if (dealsData) setGlobalDeals(dealsData);
            if (panelsData && Array.isArray(panelsData)) setPanels(panelsData);
            return true;
        } catch (error: any) {
            console.error("Erro ao carregar dados do overview:", error);
            if (error.response?.status === 429) {
                addToast("Limite de requisições atingido.", "error");
                return false; 
            }
            return true; 
        } finally {
            setIsLoading(false);
        }
    };

    // Assumir o pedido para si
    const handleClaimDeal = async (dealId: string) => {
        try {
            setClaimingId(dealId);
            await crmService.claimDeal(dealId);
            addToast('Pedido assumido com sucesso!', 'success');
            fetchData();
        } catch (error: any) {
            addToast(error.response?.data?.error || 'Erro ao assumir pedido.', 'error');
            fetchData(); 
        } finally {
            setClaimingId(null);
        }
    };

    // Enviar mensagem no WhatsApp do Cliente
    const handleOpenWhatsApp = (deal: any) => {
        const phone = deal.client?.whatsapp || deal.client?.phone;
        if (!phone) {
            addToast('Este cliente não possui telefone cadastrado.', 'error');
            return;
        }
        
        let cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) {
            cleanPhone = '55' + cleanPhone;
        }

        const firstName = deal.client?.name?.split(' ')[0] || 'Cliente';
        const sellerName = user?.name?.split(' ')[0] || 'Comercial';
        
        const text = `Olá, *${firstName}*! Tudo bem?\n\nAqui é *${sellerName}* da *T3 OOH*.\nReferente à sua solicitação/proposta...`;
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
        
        window.open(waUrl, '_blank');
    };

    // Alterar o estágio da negociação (Aberto, Negociando, etc)
    const handleChangeStage = async (dealId: string, stage: string) => {
        try {
            // UI Otimista
            setGlobalDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage } : d));
            if ((crmService as any).updateDealStage) {
                await (crmService as any).updateDealStage(dealId, stage);
            }
            addToast('Status da negociação atualizado!', 'success');
        } catch (error) {
            addToast('Erro ao atualizar status.', 'error');
            fetchData();
        }
    };

    // Fechar Negócio (Ganho ou Perdido - Remove da fila)
    const handleUpdateStatus = async (dealId: string, newStatus: string) => {
        try {
            // UI Otimista
            setGlobalDeals(prev => prev.filter(d => d.id !== dealId));
            addToast(newStatus === 'WON' ? 'Parabéns! Negócio Fechado.' : 'Negócio finalizado (Perdido).', 'success');
            
            if ((crmService as any).updateDealStatus) {
                await (crmService as any).updateDealStatus(dealId, newStatus);
            } else if ((crmService as any).updateDeal) {
                await (crmService as any).updateDeal(dealId, { status: newStatus });
            }
            fetchData();
        } catch (error) {
            addToast('Erro ao fechar negócio.', 'error');
            fetchData();
        }
    };

    // =========================================================
    // SERVIÇO: GERAÇÃO DE CONTRATO PDF
    // =========================================================
    const generateContractPDF = async (deal: any) => {
        try {
            setIsGeneratingPdf(deal.id);
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            
            const marginLeft = 20; 
            const marginRight = 20;
            const contentWidth = pageWidth - marginLeft - marginRight;
            let currentY = 0;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(28);
            doc.setTextColor(255, 94, 0);
            doc.text("t3", pageWidth / 2, 25, { align: "center" });

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text("T3 LED MÍDIA E TECNOLOGIA LTDA", pageWidth / 2, 32, { align: "center" });

            currentY = 50;

            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text("PROPOSTA COMERCIAL E CONTRATO DE VEICULAÇÃO OOH", pageWidth / 2, currentY, { align: "center" });
            currentY += 15;

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            
            const clientName = deal.client?.name || "Cliente Não Informado";
            const clientCompany = deal.client?.company || "Não Informada";
            const clientEmail = deal.client?.email || "Não Informado";
            const clientPhone = deal.client?.phone || deal.client?.whatsapp || "Não Informado";
            const clientCpf = deal.client?.document || deal.client?.cpf || "___.___.___-__"; 
            const orderDate = new Date(deal.createdAt).toLocaleDateString('pt-BR');

            const clientData = [
                `CONTRATANTE: ${clientName}`,
                `EMPRESA / AGÊNCIA: ${clientCompany}`,
                `CPF / CNPJ: ${clientCpf}`,
                `E-MAIL: ${clientEmail}`,
                `TELEFONE: ${clientPhone}`,
                `DATA DO PEDIDO: ${orderDate}`,
            ];

            clientData.forEach((text: string) => {
                doc.text(text, marginLeft, currentY);
                currentY += 6;
            });
            currentY += 10;

            const sourceText = deal.description || deal.message || deal.notes || deal.client?.message || "";
            let dealPanels = deal.panels || deal.items || [];

            if (dealPanels.length === 0 && sourceText) {
                const panelsMatch = sourceText.match(/Painéis Solicitados:\s*([^\n]+)/);
                if (panelsMatch) {
                    const rawNames = panelsMatch[1].replace(/\.$/, '').trim();
                    const panelNames = rawNames.split(',').map((n: string) => n.trim());
                    
                    dealPanels = panelNames.map((name: string) => {
                        const found = panels.find(p => p.name?.trim().toLowerCase() === name.toLowerCase());
                        return found ? { panel: found } : { panel: { name, city: 'GOIÂNIA', state: 'GO', price: deal.expectedValue / panelNames.length } }; 
                    });
                }
            }

            let finalMonthlyValue = Number(deal.expectedValue || 0);
            let finalTotalContract = Number(deal.expectedValue || 0);

            const monthlyMatch = sourceText.match(/Valor mensal:\s*R\$\s*([\d.,]+)/);
            if (monthlyMatch) {
                finalMonthlyValue = Number(monthlyMatch[1].replace(/\./g, '').replace(',', '.'));
            }

            const totalMatch = sourceText.match(/Valor Total Contrato.*?\:\s*R\$\s*([\d.,]+)/);
            if (totalMatch) {
                finalTotalContract = Number(totalMatch[1].replace(/\./g, '').replace(',', '.'));
            }

            const totalOriginal = dealPanels.reduce((sum: number, item: any) => sum + Number(item.panel?.price || item.price || 0), 0);
            const discountRatio = totalOriginal > 0 ? (finalMonthlyValue / totalOriginal) : 1;

            doc.setFont("helvetica", "bold");
            doc.text("1. ESCOPO DOS SERVIÇOS E INVESTIMENTO", marginLeft, currentY);
            currentY += 5;

            const tableRows = dealPanels.length > 0 
                ? dealPanels.map((item: any) => {
                    const p = item.panel || item; 
                    const originalPrice = Number(p.price || 0);
                    const discountedPrice = item.priceSnapshot ? Number(item.priceSnapshot) : (originalPrice * discountRatio);
                    
                    const city = p.city ? String(p.city).toUpperCase() : 'CIDADE';
                    const state = p.state ? String(p.state).toUpperCase() : 'UF';
                    const locationPrefix = `(${city} - ${state}) `;
                    
                    return [
                        `${locationPrefix}${p.name || 'Painel'}`,
                        formatCurrency(originalPrice),           
                        formatCurrency(discountedPrice)          
                    ];
                })
                : [["Circuito T3 LED Mídia - Pacote Customizado", formatCurrency(finalMonthlyValue), formatCurrency(finalMonthlyValue)]];

            autoTable(doc, {
                startY: currentY,
                head: [['Painéis Solicitados', 'Valor do Painel', 'Valor com Desconto']],
                body: [
                    ...tableRows,
                    [{ content: 'VALOR MENSAL (COM DESCONTO):', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } }, formatCurrency(finalMonthlyValue)],
                    [{ content: 'VALOR TOTAL A SER PAGO (CONTRATO):', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 94, 0], textColor: [255, 255, 255] } }, formatCurrency(finalTotalContract)]
                ],
                theme: 'striped',
                headStyles: { fillColor: [17, 17, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { left: marginLeft, right: marginRight },
                styles: { font: 'helvetica', fontSize: 9 }
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;

            doc.setFont("helvetica", "bold");
            doc.text("2. TERMOS DE CONTRATAÇÃO E VEICULAÇÃO", marginLeft, currentY);
            currentY += 6;

            doc.setFont("helvetica", "normal");
            
            const paragraphs = [
                "Pelo presente instrumento, a T3 LED MÍDIA compromete-se a realizar a veiculação de mídia digital outdoor (DOOH) nas localizações e faces especificadas na planilha de custos acima. A CONTRATANTE reconhece que o período padrão de veiculação (contrato) compreende ciclos de 30 (trinta) dias consecutivos, contados a partir da data de ativação efetiva da campanha em nosso sistema central de exibição.",
                "Os valores apresentados representam o custo integral para a exibição no formato inserção em loop ou exclusividade, conforme ajustado previamente em tratativas comerciais registradas, estando sujeitos à validação técnica e adequação do material criativo enviado. É de inteira responsabilidade da CONTRATANTE o envio dos arquivos digitais nas especificações técnicas exigidas (resolução, formato e duração).",
                "Em caso de manutenção técnica imprevista que resulte na inatividade dos telões contratados, a CONTRATANTE será devidamente compensada através da extensão do período de veiculação ou realocação em equipamento de impacto visual equivalente, não cabendo multas recíprocas por casos de força maior. O presente pedido consolida a intenção de contratação, pendente apenas da assinatura digital e da compensação do investimento inicial para o início da veiculação."
            ];

            const writeParagraph = (text: string) => {
                const lines = doc.splitTextToSize(text, contentWidth);
                if (currentY + (lines.length * 5) > pageHeight - 40) {
                    doc.addPage();
                    currentY = 20;
                }
                
                doc.text(text, marginLeft, currentY, { align: "justify", maxWidth: contentWidth }); 
                currentY += (lines.length * 5) + 4;
            };

            paragraphs.forEach(writeParagraph);

            currentY += 20;
            if (currentY > pageHeight - 40) {
                doc.addPage();
                currentY = 40;
            }

            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            
            doc.line(marginLeft, currentY, marginLeft + 60, currentY); 
            doc.line(pageWidth - marginRight - 60, currentY, pageWidth - marginRight, currentY); 
            
            currentY += 5;
            doc.setFontSize(9);
            doc.text("T3 LED Mídia e Tecnologia", marginLeft, currentY);
            
            const clientSigName = doc.splitTextToSize(clientName, 60);
            doc.text(clientSigName, pageWidth - marginRight - 60, currentY);

            const pageCount = (doc.internal as any).getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                
                const footerY = pageHeight - 15;
                doc.setDrawColor(200, 200, 200);
                doc.line(marginLeft, footerY - 5, pageWidth - marginRight, footerY - 5);
                
                doc.text("T3 LED Mídia • CNPJ: 00.000.000/0000-00 • Goiânia, Goiás, Brasil", pageWidth / 2, footerY, { align: "center" });
                doc.text("contato@t3ooh.com.br • Segurança e Performance em OOH", pageWidth / 2, footerY + 4, { align: "center" });
                doc.text(`Página ${i} de ${pageCount}`, pageWidth - marginRight, footerY + 4, { align: "right" });
            }

            doc.save(`Contrato_T3_${clientName.replace(/\s+/g, '_')}.pdf`);
            addToast("Documento gerado com sucesso!", "success");

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            addToast("Ocorreu um erro ao formatar o documento.", "error");
        } finally {
            setIsGeneratingPdf(null);
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const statCards = [
        { title: 'Pipeline Ativo (Em aberto)', value: formatCurrency(metrics.totalExpectedValue), desc: 'Valor total em negociação', icon: Target, color: 'text-[#FF5E00]', bg: 'bg-[#FF5E00]/10' },
        { title: 'Negócios Fechados (Ganhos)', value: formatCurrency(metrics.totalWonValue), desc: 'Faturamento consolidado', icon: DollarSign, color: 'text-[#25D366]', bg: 'bg-[#25D366]/10' },
        { title: 'Oportunidades Abertas', value: metrics.totalActiveDeals, desc: 'No funil de vendas', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { title: 'Carteira de Clientes', value: metrics.totalClients, desc: 'Total cadastrados', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' }
    ];

    // Remove os ganhos/perdidos da visualização da fila
    const activeDeals = globalDeals.filter(deal => deal.status !== 'WON' && deal.status !== 'LOST');

    return (
        <div className="w-full h-full flex flex-col relative gap-6">

            {/* ========================================================= */}
            {/* VIEWPORT: DESKTOP                                         */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto w-full">
                
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-text mb-1">Olá, {user?.name?.split(' ')[0]}!</h1>
                        <p className="text-sm text-brand-muted font-medium">Aqui está o resumo da sua performance comercial de hoje.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {statCards.map((stat, i) => (
                        <div key={i} className="bg-brand-surface p-6 rounded-[24px] border border-brand-border shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                            </div>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1.5">{stat.title}</h3>
                            <p className="text-2xl font-black text-brand-text tracking-tight mb-2">{stat.value}</p>
                            <p className="text-[10px] text-brand-muted/80 uppercase tracking-wider font-bold">{stat.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px]">
                    
                    {/* Fila de Pedidos Global */}
                    <div className="lg:col-span-2 bg-brand-surface rounded-[24px] border border-brand-border shadow-sm flex flex-col overflow-hidden transition-colors">
                        <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-background/50">
                            <div>
                                <h2 className="text-lg font-bold text-brand-text flex items-center gap-2">
                                    <Users className="w-5 h-5 text-brand-neon" /> Fila de Pedidos Ativos
                                </h2>
                                <p className="text-xs text-brand-muted font-medium mt-1">Pedidos aguardando atendimento ou em negociação.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-neon"></span>
                                </span>
                                <span className="text-xs font-bold text-brand-neon uppercase tracking-widest">Ao Vivo</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-brand-background/30">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
                                </div>
                            ) : activeDeals.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-brand-muted">
                                    <Users className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="font-medium">A fila está vazia no momento.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activeDeals.map(deal => {
                                        const isUnassigned = !deal.sellerId;
                                        const isMine = deal.sellerId === user?.id;

                                        return (
                                            <div key={deal.id} className={`p-5 rounded-2xl border flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-all shadow-sm ${isUnassigned ? 'bg-brand-surface border-brand-neon/30 hover:border-brand-neon/60' : isMine ? 'bg-[#25D366]/5 border-[#25D366]/30' : 'bg-brand-background border-brand-border opacity-75'}`}>
                                                
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-sm font-bold text-brand-text">{deal.client?.name}</span>
                                                        {!isUnassigned && (
                                                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest ${isMine ? 'bg-[#25D366]/20 text-[#25D366]' : 'bg-brand-surface border border-brand-border text-brand-muted'}`}>
                                                                {isMine ? 'Seu Atendimento' : `Com ${deal.seller?.name}`}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-brand-muted font-medium">
                                                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(deal.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className="font-bold text-brand-text">{formatCurrency(deal.expectedValue)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 mt-3 xl:mt-0">
                                                    {isUnassigned ? (
                                                        <button 
                                                            onClick={() => handleClaimDeal(deal.id)}
                                                            disabled={claimingId === deal.id}
                                                            className="w-full xl:w-auto bg-brand-neon hover:bg-brand-neonHover text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
                                                        >
                                                            {claimingId === deal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Atender Agora</>}
                                                        </button>
                                                    ) : isMine ? (
                                                        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                                                            
                                                            <select 
                                                                value={deal.status === 'WON' ? 'WON' : deal.stage || 'NEW_LEAD'}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    if (val === 'WON' || val === 'LOST') {
                                                                        handleUpdateStatus(deal.id, val);
                                                                    } else {
                                                                        handleChangeStage(deal.id, val);
                                                                    }
                                                                }}
                                                                className="flex-1 xl:flex-none bg-brand-background text-brand-text border border-brand-border px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:border-brand-neon outline-none shadow-sm appearance-none cursor-pointer"
                                                            >
                                                                <option value="NEW_LEAD">Aberta (Lead)</option>
                                                                <option value="NEGOTIATION">Em Negociação</option>
                                                                <option value="PROPOSAL_SENT">Proposta Enviada</option>
                                                                <option value="WON">Fechar (Ganha)</option>
                                                                <option value="LOST">Fechar (Perdida)</option>
                                                            </select>

                                                            <button 
                                                                onClick={() => generateContractPDF(deal)}
                                                                disabled={isGeneratingPdf === deal.id}
                                                                className="flex-1 xl:flex-none bg-brand-background hover:bg-brand-surface text-brand-text border border-brand-border hover:border-brand-neon/50 px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                                                                title="Baixar Contrato"
                                                            >
                                                                {isGeneratingPdf === deal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} Contrato
                                                            </button>
                                                            
                                                            <button 
                                                                onClick={() => handleOpenWhatsApp(deal)}
                                                                className="flex-1 xl:flex-none bg-[#25D366] hover:brightness-110 text-[#0A0A0B] px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                                            >
                                                                <MessageCircle className="w-4 h-4" /> WhatsApp
                                                            </button>

                                                        </div>
                                                    ) : (
                                                        <div className="w-full xl:w-auto px-5 py-2.5 rounded-xl text-[11px] uppercase tracking-widest font-bold text-brand-muted border border-brand-border flex items-center justify-center bg-brand-background cursor-not-allowed">
                                                            Em Atendimento
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Próximos Passos */}
                    <div className="bg-brand-surface rounded-[24px] border border-brand-border shadow-sm flex flex-col transition-colors">
                        <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-background/50">
                            <h2 className="text-lg font-bold text-brand-text">Próximos Passos</h2>
                            <span className="bg-brand-neon/10 text-brand-neon text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest border border-brand-neon/20">Hoje</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <CheckCircle2 className="w-12 h-12 text-brand-muted opacity-50 mb-4" />
                            <p className="text-sm font-medium text-brand-muted mb-6">Nenhuma tarefa pendente para hoje.</p>
                            <button className="w-full py-3 rounded-xl border border-brand-border text-sm font-bold text-brand-text hover:text-brand-neon hover:border-brand-neon/50 bg-brand-background transition-colors shadow-sm">
                                + Adicionar Lembrete
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* VIEWPORT: MOBILE (APP PATTERN NATIVO)                       */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full h-full pb-4 gap-5">
                
                <div className="px-2">
                    <h1 className="text-2xl font-bold text-brand-text mb-1">Olá, {user?.name?.split(' ')[0]}!</h1>
                    <p className="text-xs text-brand-muted font-medium">Sua performance comercial hoje.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {statCards.map((stat, i) => (
                        <div key={i} className="bg-brand-surface p-4 rounded-[24px] border border-brand-border shadow-sm flex flex-col justify-between h-[140px] transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className={`p-2.5 rounded-[12px] ${stat.bg}`}>
                                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest leading-tight mb-1 line-clamp-2">{stat.title}</h3>
                                <p className="text-xl font-black text-brand-text tracking-tight">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-4">
                    
                    {/* Fila de Pedidos Mobile */}
                    <div className="bg-brand-surface rounded-[24px] border border-brand-border flex flex-col overflow-hidden shadow-sm transition-colors">
                        <div className="p-5 border-b border-brand-border flex justify-between items-center bg-brand-background/50">
                            <h2 className="text-[15px] font-bold text-brand-text flex items-center gap-2">
                                <Users className="w-4 h-4 text-brand-neon" /> Fila de Pedidos
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <span className="flex h-2.5 w-2.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-neon"></span>
                                </span>
                                <span className="text-[9px] font-black text-brand-neon uppercase tracking-widest">Ao Vivo</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col custom-scrollbar p-4 max-h-[400px] overflow-y-auto bg-brand-background/30">
                            {isLoading ? (
                                <div className="py-10 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-brand-neon animate-spin" />
                                </div>
                            ) : activeDeals.length === 0 ? (
                                <div className="py-10 flex flex-col items-center justify-center text-brand-muted">
                                    <Users className="w-10 h-10 mb-2 opacity-20" />
                                    <p className="text-xs font-medium">A fila está vazia no momento.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {activeDeals.map(deal => {
                                        const isUnassigned = !deal.sellerId;
                                        const isMine = deal.sellerId === user?.id;

                                        return (
                                            <div key={deal.id} className={`p-5 rounded-[24px] border flex flex-col gap-4 transition-all shadow-sm ${isUnassigned ? 'bg-brand-surface border-brand-neon/40' : isMine ? 'bg-[#25D366]/5 border-[#25D366]/30' : 'bg-brand-background border-brand-border opacity-75'}`}>
                                                
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[15px] font-bold text-brand-text truncate">{deal.client?.name}</span>
                                                        {!isUnassigned && (
                                                            <span className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-widest shrink-0 border ${isMine ? 'bg-[#25D366]/20 border-[#25D366]/30 text-[#25D366]' : 'bg-brand-background border-brand-border text-brand-muted'}`}>
                                                                {isMine ? 'Você' : deal.seller?.name?.split(' ')[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-brand-muted font-medium">
                                                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-brand-border" /> {new Date(deal.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className="font-bold text-brand-text">{formatCurrency(deal.expectedValue)}</span>
                                                    </div>
                                                </div>

                                                {isUnassigned ? (
                                                    <div className="mt-1 flex gap-3">
                                                        <button 
                                                            onClick={() => handleClaimDeal(deal.id)}
                                                            disabled={claimingId === deal.id}
                                                            className="w-full bg-brand-neon text-white py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98]"
                                                        >
                                                            {claimingId === deal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Atender Agora</>}
                                                        </button>
                                                    </div>
                                                ) : isMine ? (
                                                    <div className="mt-2 flex flex-col gap-2 border-t border-brand-border pt-4">
                                                        <select 
                                                            value={deal.status === 'WON' ? 'WON' : deal.stage || 'NEW_LEAD'}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === 'WON' || val === 'LOST') {
                                                                    handleUpdateStatus(deal.id, val);
                                                                } else {
                                                                    handleChangeStage(deal.id, val);
                                                                }
                                                            }}
                                                            className="w-full bg-brand-background text-brand-text border border-brand-border px-4 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-widest focus:border-brand-neon outline-none shadow-sm appearance-none cursor-pointer"
                                                        >
                                                            <option value="NEW_LEAD">Aberta (Lead)</option>
                                                            <option value="NEGOTIATION">Em Negociação</option>
                                                            <option value="PROPOSAL_SENT">Proposta Enviada</option>
                                                            <option value="WON">Fechar (Ganha)</option>
                                                            <option value="LOST">Fechar (Perdida)</option>
                                                        </select>
                                                        
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => generateContractPDF(deal)}
                                                                disabled={isGeneratingPdf === deal.id}
                                                                className="flex-1 bg-brand-background text-brand-text border border-brand-border active:border-brand-neon px-4 py-3.5 rounded-xl flex items-center justify-center shadow-sm font-bold text-xs"
                                                            >
                                                                {isGeneratingPdf === deal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4 md:mr-2" />} <span className="hidden sm:inline">PDF</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => handleOpenWhatsApp(deal)}
                                                                className="flex-[2] bg-[#25D366] text-[#0A0A0B] py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-[0_0_15px_rgba(37,211,102,0.3)]"
                                                            >
                                                                <MessageCircle className="w-4 h-4" /> WhatsApp
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full mt-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-muted border border-brand-border flex items-center justify-center bg-brand-background">
                                                        Em Atendimento
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Próximos Passos Mobile */}
                    <div className="bg-brand-surface rounded-[24px] border border-brand-border flex flex-col shadow-sm transition-colors">
                        <div className="p-5 border-b border-brand-border flex justify-between items-center bg-brand-background/50">
                            <h2 className="text-[15px] font-bold text-brand-text">Próximos Passos</h2>
                            <span className="bg-brand-neon/10 text-brand-neon border border-brand-neon/20 text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-widest">Hoje</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                            <CheckCircle2 className="w-10 h-10 text-brand-muted opacity-50 mb-3" />
                            <p className="text-xs font-medium text-brand-muted mb-4">Nenhuma tarefa pendente para hoje.</p>
                            <button className="w-full py-3 rounded-xl border border-brand-border text-xs font-bold text-brand-text hover:text-brand-neon bg-brand-background active:bg-brand-surface transition-colors shadow-sm">
                                + Adicionar Lembrete
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}