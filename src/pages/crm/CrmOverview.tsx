import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { crmService } from '@/services/crm.service';
import { useNavigate } from 'react-router-dom';
import { 
    Target, DollarSign, TrendingUp, Users, Clock, 
    CheckCircle2, ArrowRight, UserPlus, Loader2, FileDown 
} from 'lucide-react';

// Dependências de exportação de documentos
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function CrmOverview() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    
    // =========================================================
    // ESTADOS
    // =========================================================
    const [metrics, setMetrics] = useState({
        totalExpectedValue: 0,
        totalActiveDeals: 0,
        totalClients: 0,
        totalWonValue: 0
    });
    
    // panels: Catálogo em memória para resgatar os preços reais
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
                // Puxamos o catálogo para poder cruzar com os nomes que vêm no texto do CRM
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

    const handleClaimDeal = async (dealId: string) => {
        try {
            setClaimingId(dealId);
            await crmService.claimDeal(dealId);
            addToast('Pedido assumido! Redirecionando para o chat...', 'success');
            navigate(`/crm/chat?dealId=${dealId}`);
        } catch (error: any) {
            addToast(error.response?.data?.error || 'Erro ao assumir pedido.', 'error');
            fetchData(); 
        } finally {
            setClaimingId(null);
        }
    };

    const handleOpenChat = (dealId: string) => {
        navigate(`/crm/chat?dealId=${dealId}`);
    };

    // =========================================================
    // SERVIÇO: GERAÇÃO DE CONTRATO PDF COM EXTRATOR INTELIGENTE E JUSTIFY CORRIGIDO
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

            // 1. CABEÇALHO FUNDO BRANCO E LOGO CENTRALIZADA
            doc.setFont("helvetica", "bold");
            doc.setFontSize(28);
            doc.setTextColor(255, 94, 0);
            doc.text("t3", pageWidth / 2, 25, { align: "center" });

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text("T3 LED MÍDIA E TECNOLOGIA LTDA", pageWidth / 2, 32, { align: "center" });

            currentY = 50;

            // 2. TÍTULO DO DOCUMENTO
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text("PROPOSTA COMERCIAL E CONTRATO DE VEICULAÇÃO OOH", pageWidth / 2, currentY, { align: "center" });
            currentY += 15;

            // 3. DADOS DE IDENTIFICAÇÃO DO CONTRATANTE
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

            // ============================================================
            // MÁGICA DE EXTRAÇÃO DE DADOS (Lendo a string do backend)
            // ============================================================
            const sourceText = deal.description || deal.message || deal.notes || deal.client?.message || "";
            let dealPanels = deal.panels || deal.items || [];

            // Se a API não devolveu o array estruturado, nós "lemos" o texto
            if (dealPanels.length === 0 && sourceText) {
                const panelsMatch = sourceText.match(/Painéis Solicitados:\s*([^\n]+)/);
                if (panelsMatch) {
                    const rawNames = panelsMatch[1].replace(/\.$/, '').trim();
                    const panelNames = rawNames.split(',').map((n: string) => n.trim());
                    
                    dealPanels = panelNames.map((name: string) => {
                        // Cruza o nome do texto com nosso catálogo em memória
                        const found = panels.find(p => p.name?.trim().toLowerCase() === name.toLowerCase());
                        // Se não achar, usa mock com preço rateado
                        return found ? { panel: found } : { panel: { name, city: 'GOIÂNIA', state: 'GO', price: deal.expectedValue / panelNames.length } }; 
                    });
                }
            }

            // Lê os valores matemáticos direto do log do sistema
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

            // Descobre o rateio do desconto para aplicar individualmente
            const totalOriginal = dealPanels.reduce((sum: number, item: any) => sum + Number(item.panel?.price || item.price || 0), 0);
            const discountRatio = totalOriginal > 0 ? (finalMonthlyValue / totalOriginal) : 1;

            // 4. PLANILHA DE GASTOS (AutoTable)
            doc.setFont("helvetica", "bold");
            doc.text("1. ESCOPO DOS SERVIÇOS E INVESTIMENTO", marginLeft, currentY);
            currentY += 5;

            // Monta as linhas baseadas no que foi extraído ou recebido da API nova
            const tableRows = dealPanels.length > 0 
                ? dealPanels.map((item: any) => {
                    const p = item.panel || item; // Suporta tanto o array antigo de panels quanto o novo de items
                    const originalPrice = Number(p.price || 0);
                    const discountedPrice = item.priceSnapshot ? Number(item.priceSnapshot) : (originalPrice * discountRatio);
                    
                    const city = p.city ? String(p.city).toUpperCase() : 'CIDADE';
                    const state = p.state ? String(p.state).toUpperCase() : 'UF';
                    const locationPrefix = `(${city} - ${state}) `;
                    
                    return [
                        `${locationPrefix}${p.name || 'Painel'}`, // Col 1
                        formatCurrency(originalPrice),            // Col 2
                        formatCurrency(discountedPrice)           // Col 3
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
                headStyles: { fillColor: [255, 94, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { left: marginLeft, right: marginRight },
                styles: { font: 'helvetica', fontSize: 9 }
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;

            // 5. CORPO DO DOCUMENTO (Termos Legais)
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
                // Conta as linhas apenas para saber a altura que o parágrafo vai ocupar
                const lines = doc.splitTextToSize(text, contentWidth);
                if (currentY + (lines.length * 5) > pageHeight - 40) {
                    doc.addPage();
                    currentY = 20;
                }
                
                // MÁGICA AQUI: maxWidth diz ao jsPDF para não vazar a margem e respeitar o limite, e align 'justify' faz o alinhamento
                doc.text(text, marginLeft, currentY, { align: "justify", maxWidth: contentWidth }); 
                currentY += (lines.length * 5) + 4;
            };

            paragraphs.forEach(writeParagraph);

            // 6. ÁREA DE ASSINATURAS
            currentY += 20;
            if (currentY > pageHeight - 40) {
                doc.addPage();
                currentY = 40;
            }

            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            
            // Linha Assinatura T3
            doc.line(marginLeft, currentY, marginLeft + 60, currentY); 
            // Linha Assinatura Cliente
            doc.line(pageWidth - marginRight - 60, currentY, pageWidth - marginRight, currentY); 
            
            currentY += 5;
            doc.setFontSize(9);
            doc.text("T3 LED Mídia e Tecnologia", marginLeft, currentY);
            
            const clientSigName = doc.splitTextToSize(clientName, 60);
            doc.text(clientSigName, pageWidth - marginRight - 60, currentY);

            // 7. RODAPÉ PAGINADO (Padrão Footer do Site)
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

    // =========================================================
    // FILTRA OS NEGÓCIOS PARA REMOVER OS FECHADOS (WON E LOST) DA FILA
    // =========================================================
    const activeDeals = globalDeals.filter(deal => deal.status !== 'WON' && deal.status !== 'LOST');

    return (
        <div className="w-full h-full flex flex-col relative">

            {/* ========================================================= */}
            {/* VIEWPORT: DESKTOP                                         */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto w-full">
                
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">Olá, {user?.name?.split(' ')[0]}!</h1>
                        <p className="text-sm text-brand-muted">Aqui está o resumo da sua performance comercial de hoje.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, i) => (
                        <div key={i} className="glass-panel p-5 rounded-2xl border border-brand-border/40 hover:border-brand-border transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                            </div>
                            <h3 className="text-xs font-semibold text-brand-muted mb-1">{stat.title}</h3>
                            <p className="text-2xl font-black text-white tracking-tight mb-1">{stat.value}</p>
                            <p className="text-[10px] text-brand-muted/70 uppercase tracking-wider font-semibold">{stat.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px]">
                    
                    {/* Fila de Pedidos Global */}
                    <div className="lg:col-span-2 glass-panel rounded-2xl border border-brand-border/40 flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-brand-border/40 flex justify-between items-center bg-[#0A0A0B]/50">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-brand-neon" /> Fila de Pedidos Ativos
                                </h2>
                                <p className="text-xs text-brand-muted mt-1">Pedidos aguardando atendimento ou em negociação.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-neon opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-neon"></span>
                                </span>
                                <span className="text-xs font-bold text-brand-neon uppercase tracking-widest">Ao Vivo</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#0A0A0B]/20">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
                                </div>
                            ) : activeDeals.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-brand-muted">
                                    <Users className="w-12 h-12 mb-3 opacity-20" />
                                    <p>A fila está vazia no momento.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activeDeals.map(deal => {
                                        const isUnassigned = !deal.sellerId;
                                        const isMine = deal.sellerId === user?.id;

                                        return (
                                            <div key={deal.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${isUnassigned ? 'bg-brand-surface/40 border-brand-neon/30 hover:border-brand-neon/60' : isMine ? 'bg-[#25D366]/5 border-[#25D366]/20' : 'bg-[#0A0A0B] border-brand-border/30 opacity-75'}`}>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-white">{deal.client?.name}</span>
                                                        {!isUnassigned && (
                                                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest ${isMine ? 'bg-[#25D366]/20 text-[#25D366]' : 'bg-brand-surface text-brand-muted'}`}>
                                                                {isMine ? 'Seu Atendimento' : `Com ${deal.seller?.name}`}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-brand-muted">
                                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(deal.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className="font-medium text-brand-text">{formatCurrency(deal.expectedValue)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {isUnassigned ? (
                                                        <button 
                                                            onClick={() => handleClaimDeal(deal.id)}
                                                            disabled={claimingId === deal.id}
                                                            className="w-full sm:w-auto bg-brand-neon hover:bg-[#e05300] text-black px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(255,94,0,0.2)] flex items-center justify-center gap-2"
                                                        >
                                                            {claimingId === deal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Atender Agora</>}
                                                        </button>
                                                    ) : isMine ? (
                                                        <>
                                                            <button 
                                                                onClick={() => generateContractPDF(deal)}
                                                                disabled={isGeneratingPdf === deal.id}
                                                                className="w-full sm:w-auto bg-[#0A0A0B] hover:bg-brand-surface text-brand-muted border border-brand-border/30 hover:border-brand-neon/50 hover:text-white px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                                                                title="Baixar Contrato"
                                                            >
                                                                {isGeneratingPdf === deal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} Contrato
                                                            </button>
                                                            <button 
                                                                onClick={() => handleOpenChat(deal.id)}
                                                                className="w-full sm:w-auto bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <ArrowRight className="w-4 h-4" /> Abrir Chat
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold text-brand-muted border border-brand-border/30 flex items-center justify-center bg-[#0A0A0B] cursor-not-allowed">
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
                    <div className="glass-panel rounded-2xl border border-brand-border/40 flex flex-col">
                        <div className="p-5 border-b border-brand-border/40 flex justify-between items-center bg-[#0A0A0B]/50">
                            <h2 className="text-lg font-bold text-white">Próximos Passos</h2>
                            <span className="bg-[#FF5E00]/20 text-[#FF5E00] text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-widest">Hoje</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                            <CheckCircle2 className="w-12 h-12 text-brand-border mb-3" />
                            <p className="text-sm text-brand-muted mb-6">Nenhuma tarefa pendente para hoje.</p>
                            <button className="w-full py-2.5 rounded-xl border border-brand-border/60 text-sm font-medium text-brand-text hover:text-white hover:bg-brand-surface transition-colors">
                                + Adicionar Lembrete
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* VIEWPORT: MOBILE (APP PATTERN NATIVO)                       */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full h-full pb-4">
                
                <div className="mb-6 px-1">
                    <h1 className="text-xl font-bold text-white mb-1">Olá, {user?.name?.split(' ')[0]}!</h1>
                    <p className="text-xs text-brand-muted">Sua performance comercial hoje.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    {statCards.map((stat, i) => (
                        <div key={i} className="bg-[#111113] p-4 rounded-[20px] border border-brand-border/20 shadow-sm flex flex-col justify-between h-[130px]">
                            <div className="flex justify-between items-start mb-2">
                                <div className={`p-2 rounded-[10px] ${stat.bg}`}>
                                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest leading-tight mb-1 line-clamp-2">{stat.title}</h3>
                                <p className="text-lg font-black text-white tracking-tight">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-4">
                    
                    {/* Fila de Pedidos Mobile */}
                    <div className="bg-[#111113] rounded-[24px] border border-brand-border/20 flex flex-col overflow-hidden shadow-md">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0A0A0B]/50">
                            <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
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
                        
                        <div className="flex flex-col custom-scrollbar p-3 max-h-[400px] overflow-y-auto">
                            {isLoading ? (
                                <div className="py-10 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-brand-neon animate-spin" />
                                </div>
                            ) : activeDeals.length === 0 ? (
                                <div className="py-10 flex flex-col items-center justify-center text-brand-muted">
                                    <Users className="w-10 h-10 mb-2 opacity-20" />
                                    <p className="text-xs">A fila está vazia no momento.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {activeDeals.map(deal => {
                                        const isUnassigned = !deal.sellerId;
                                        const isMine = deal.sellerId === user?.id;

                                        return (
                                            <div key={deal.id} className={`p-4 rounded-[16px] border flex flex-col gap-3 transition-all ${isUnassigned ? 'bg-brand-surface/30 border-brand-neon/40 shadow-inner' : isMine ? 'bg-[#25D366]/5 border-[#25D366]/30' : 'bg-[#0A0A0B] border-white/5 opacity-75'}`}>
                                                
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[14px] font-bold text-white truncate">{deal.client?.name}</span>
                                                        {!isUnassigned && (
                                                            <span className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-widest shrink-0 ${isMine ? 'bg-[#25D366]/20 text-[#25D366]' : 'bg-brand-surface text-brand-muted'}`}>
                                                                {isMine ? 'Você' : deal.seller?.name?.split(' ')[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between text-[11px] text-brand-muted">
                                                        <span className="flex items-center gap-1 font-medium"><Clock className="w-3 h-3 text-brand-border" /> {new Date(deal.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className="font-bold text-brand-text">{formatCurrency(deal.expectedValue)}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-1 flex gap-2">
                                                    {isUnassigned ? (
                                                        <button 
                                                            onClick={() => handleClaimDeal(deal.id)}
                                                            disabled={claimingId === deal.id}
                                                            className="w-full bg-brand-neon text-[#0A0A0B] py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_4px_15px_rgba(255,94,0,0.2)] flex items-center justify-center gap-2 active:scale-[0.98]"
                                                        >
                                                            {claimingId === deal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Atender Agora</>}
                                                        </button>
                                                    ) : isMine ? (
                                                        <>
                                                            <button 
                                                                onClick={() => generateContractPDF(deal)}
                                                                disabled={isGeneratingPdf === deal.id}
                                                                className="bg-[#0A0A0B] text-white border border-white/10 px-3 rounded-xl flex items-center justify-center"
                                                                title="Baixar Contrato"
                                                            >
                                                                {isGeneratingPdf === deal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                                            </button>
                                                            <button 
                                                                onClick={() => handleOpenChat(deal.id)}
                                                                className="flex-1 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                                            >
                                                                <ArrowRight className="w-4 h-4" /> Abrir Chat
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-muted border border-white/5 flex items-center justify-center bg-[#050505]">
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

                    {/* Próximos Passos Mobile */}
                    <div className="bg-[#111113] rounded-[24px] border border-brand-border/20 flex flex-col shadow-md">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0A0A0B]/50">
                            <h2 className="text-[15px] font-bold text-white">Próximos Passos</h2>
                            <span className="bg-[#FF5E00]/10 text-[#FF5E00] border border-[#FF5E00]/20 text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-widest">Hoje</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                            <CheckCircle2 className="w-10 h-10 text-brand-border mb-3" />
                            <p className="text-xs text-brand-muted mb-4">Nenhuma tarefa pendente para hoje.</p>
                            <button className="w-full py-3 rounded-xl border border-white/10 text-xs font-bold text-brand-text hover:text-white bg-[#0A0A0B] active:bg-brand-surface transition-colors">
                                + Adicionar Lembrete
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}