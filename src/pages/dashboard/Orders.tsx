import { useState, useEffect } from 'react';
import { 
    Search, ShoppingCart, Loader2, Calendar, ReceiptText, 
    UserCircle, FileDown, MessageSquare, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { crmService } from '@/services/crm.service';
import { useToast } from '@/contexts/ToastContext';
import { CustomSelect } from '@/components/CustomSelect';

// Dependências de exportação de documentos
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function Orders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    
    const { addToast } = useToast();

    useEffect(() => {
        fetchOrders();
    }, []);

    async function fetchOrders() {
        try {
            setIsLoading(true);
            const data = await crmService.getGlobalDeals();
            setOrders(data);
        } catch (error) {
            console.error("Erro ao buscar pedidos do CRM:", error);
            addToast("Erro ao carregar a lista de pedidos.", "error");
        } finally {
            setIsLoading(false);
        }
    }

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            setUpdatingId(orderId);
            await crmService.updateDealStatus(orderId, newStatus as any);
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            addToast("Status atualizado com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            addToast("Falha ao atualizar o status do pedido.", "error");
        } finally {
            setUpdatingId(null);
        }
    };

    // =========================================================
    // EXPORTAÇÃO DO HISTÓRICO DO CHAT (.TXT)
    // =========================================================
    const handleExportChat = async (order: any) => {
        try {
            setActionLoadingId(`chat-${order.id}`);
            const history = await crmService.getChatHistory(order.id);
            
            if (!history || history.length === 0) {
                addToast("Não há mensagens para exportar neste atendimento.", "info");
                return;
            }

            const clientName = order.client?.name || 'Cliente';
            const sellerName = order.seller?.name || 'Comercial T3';
            
            let textContent = `======================================================\n`;
            textContent += `HISTÓRICO DE ATENDIMENTO - T3 MÍDIA E TECNOLOGIA\n`;
            textContent += `======================================================\n`;
            textContent += `PEDIDO ID: ${order.id}\n`;
            textContent += `CLIENTE: ${clientName}\n`;
            textContent += `ATENDENTE: ${sellerName}\n`;
            textContent += `STATUS: ${order.status === 'WON' ? 'Concluído' : order.status}\n`;
            textContent += `DATA DE EXPORTAÇÃO: ${new Date().toLocaleString('pt-BR')}\n`;
            textContent += `======================================================\n\n`;

            history.forEach((msg: any) => {
                const date = new Date(msg.createdAt).toLocaleString('pt-BR');
                const isClient = msg.senderId === order.clientId;
                const sender = isClient ? clientName : (msg.isInternal ? '[NOTA INTERNA] ' + sellerName : sellerName);
                
                textContent += `[${date}] ${sender}:\n`;
                if (msg.content) textContent += `${msg.content}\n`;
                if (msg.mediaUrl) textContent += `[ANEXO ENVIADO]: ${msg.mediaUrl}\n`;
                textContent += `------------------------------------------------------\n`;
            });

            const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `Historico_Atendimento_${clientName.replace(/\s+/g, '_')}.txt`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            addToast("Histórico exportado com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao exportar chat:", error);
            addToast("Falha ao exportar as conversas.", "error");
        } finally {
            setActionLoadingId(null);
        }
    };

    // =========================================================
    // GERAÇÃO DE CONTRATO (PDF)
    // =========================================================
    const handleGenerateContract = async (deal: any) => {
        try {
            setActionLoadingId(`pdf-${deal.id}`);
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
            doc.text("CONTRATO DE VEICULAÇÃO OOH", pageWidth / 2, currentY, { align: "center" });
            currentY += 15;

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            
            const clientName = deal.client?.name || "Cliente Não Informado";
            const clientCompany = deal.client?.company || "Não Informada";
            const clientEmail = deal.client?.email || "Não Informado";
            const clientPhone = deal.client?.phone || deal.client?.whatsapp || "Não Informado";
            const orderDate = new Date(deal.createdAt).toLocaleDateString('pt-BR');

            const clientData = [
                `CONTRATANTE: ${clientName}`,
                `EMPRESA / AGÊNCIA: ${clientCompany}`,
                `E-MAIL: ${clientEmail}`,
                `TELEFONE: ${clientPhone}`,
                `DATA DO PEDIDO: ${orderDate}`,
            ];

            clientData.forEach((text: string) => {
                doc.text(text, marginLeft, currentY);
                currentY += 6;
            });
            currentY += 10;

            let finalMonthlyValue = Number(deal.expectedValue || 0);
            let finalTotalContract = Number(deal.expectedValue || 0);

            doc.setFont("helvetica", "bold");
            doc.text("1. ESCOPO DOS SERVIÇOS E INVESTIMENTO", marginLeft, currentY);
            currentY += 5;

            const tableRows = (deal.items || []).map((item: any) => {
                const p = item.panel || {};
                const city = p.city ? String(p.city).toUpperCase() : 'CIDADE';
                const state = p.state ? String(p.state).toUpperCase() : 'UF';
                return [
                    `(${city} - ${state}) ${p.name || 'Painel'}`,
                    formatCurrency(Number(item.priceSnapshot || 0))
                ];
            });

            if (tableRows.length === 0) {
                tableRows.push(["Pacote Customizado", formatCurrency(finalMonthlyValue)]);
            }

            autoTable(doc, {
                startY: currentY,
                head: [['Painéis Solicitados', 'Valor Negociado']],
                body: [
                    ...tableRows,
                    [{ content: 'VALOR TOTAL DO PEDIDO:', styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 94, 0], textColor: [255, 255, 255] } }, formatCurrency(finalTotalContract)]
                ],
                theme: 'striped',
                headStyles: { fillColor: [17, 17, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { left: marginLeft, right: marginRight },
                styles: { font: 'helvetica', fontSize: 9 }
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;

            doc.setFont("helvetica", "bold");
            doc.text("2. TERMOS DE CONTRATAÇÃO", marginLeft, currentY);
            currentY += 6;

            doc.setFont("helvetica", "normal");
            const paragraphs = [
                "Pelo presente instrumento, a T3 LED MÍDIA compromete-se a realizar a veiculação de mídia digital outdoor (DOOH) nas localizações e faces especificadas na planilha de custos acima.",
                "O presente pedido consolida a intenção de contratação. É de inteira responsabilidade da CONTRATANTE o envio dos arquivos digitais nas especificações técnicas exigidas."
            ];

            paragraphs.forEach(text => {
                const lines = doc.splitTextToSize(text, contentWidth);
                if (currentY + (lines.length * 5) > pageHeight - 40) {
                    doc.addPage();
                    currentY = 20;
                }
                doc.text(text, marginLeft, currentY, { align: "justify", maxWidth: contentWidth }); 
                currentY += (lines.length * 5) + 4;
            });

            currentY += 20;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(marginLeft, currentY, marginLeft + 60, currentY); 
            doc.line(pageWidth - marginRight - 60, currentY, pageWidth - marginRight, currentY); 
            currentY += 5;
            doc.setFontSize(9);
            doc.text(`T3 LED Mídia / ${deal.seller?.name || 'Comercial'}`, marginLeft, currentY);
            const clientSigName = doc.splitTextToSize(clientName, 60);
            doc.text(clientSigName, pageWidth - marginRight - 60, currentY);

            const pageCount = (doc.internal as any).getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                const footerY = pageHeight - 15;
                doc.text("T3 LED Mídia e Tecnologia • CNPJ: 00.000.000/0000-00", pageWidth / 2, footerY, { align: "center" });
            }

            doc.save(`Contrato_${clientName.replace(/\s+/g, '_')}.pdf`);
            addToast("Documento gerado com sucesso!", "success");

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            addToast("Ocorreu um erro ao gerar o documento.", "error");
        } finally {
            setActionLoadingId(null);
        }
    };

    const filteredOrders = orders.filter((order) => {
        const searchTarget = searchTerm.toLowerCase();
        const matchesSearch = 
            (order.client?.name || '').toLowerCase().includes(searchTarget) || 
            (order.seller?.name || '').toLowerCase().includes(searchTarget) ||
            order.items?.some((i: any) => i.panel?.name?.toLowerCase().includes(searchTarget));
        
        const matchesStatus = statusFilter === '' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusOptions = [
        { value: 'OPEN', label: 'Em Andamento' },
        { value: 'WON', label: 'Concluído (Ganho)' },
        { value: 'LOST', label: 'Cancelado (Perdido)' }
    ];

    const filterOptions = [
        { value: '', label: 'Todos os Status' },
        ...statusOptions
    ];

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const formatDate = (dateString: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString));

    const getStatusIcon = (status: string) => {
        if (status === 'WON') return <CheckCircle2 className="w-4 h-4 text-[#25D366]" />;
        if (status === 'LOST') return <XCircle className="w-4 h-4 text-red-500" />;
        return <Clock className="w-4 h-4 text-brand-neon" />;
    };

    return (
        <div className="w-full h-full flex flex-col gap-6">
            
            {/* ========================================================= */}
            {/* DESKTOP LAYOUT                                            */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col h-full max-w-7xl mx-auto w-full gap-6">
                
                {/* HEADER */}
                <div className="flex-shrink-0">
                    <h1 className="text-2xl font-bold text-brand-text tracking-tight mb-1 flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-brand-neon" /> Gestão de Pedidos
                    </h1>
                    <p className="text-sm text-brand-muted">Acompanhe os tickets, histórico de atendimento e gere contratos.</p>
                </div>

                {/* FILTROS E BUSCA */}
                <div className="bg-brand-surface p-4 rounded-[24px] flex flex-col sm:flex-row gap-4 items-center justify-between flex-shrink-0 border border-brand-border shadow-sm relative z-20">
                    <div className="w-full sm:w-[450px] relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input
                            placeholder="Buscar por cliente, vendedor ou painel..."
                            className="w-full bg-brand-background border border-brand-border rounded-xl pl-11 pr-4 py-3 text-sm text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="w-full sm:w-72 relative">
                        <CustomSelect
                            options={filterOptions}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder="Todos os Status"
                        />
                    </div>
                </div>

                {/* TABELA */}
                <div className="flex-1 min-h-0 bg-brand-surface rounded-[24px] overflow-hidden flex flex-col relative border border-brand-border shadow-sm z-10">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-brand-background/50 backdrop-blur-sm">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
                        </div>
                    )}

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead className="sticky top-0 bg-brand-background/90 backdrop-blur-md z-40">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest border-b border-brand-border">Cliente / Data</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest border-b border-brand-border">Atendimento / Itens</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest border-b border-brand-border">Valor</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-center border-b border-brand-border">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right border-b border-brand-border">Ações Documentais</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border relative z-0">
                                {!isLoading && filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-sm text-brand-muted">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <ReceiptText className="w-8 h-8 opacity-50 mb-2" />
                                                <span className="font-medium">Nenhum pedido encontrado.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-brand-background/50 transition-colors group">
                                            <td className="px-6 py-5 align-top">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="font-bold text-sm text-brand-text">{order.client?.name || 'Sem Nome'}</div>
                                                    <div className="text-xs text-brand-muted mb-1">{order.client?.email || ''}</div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-brand-muted font-medium bg-brand-background w-fit px-2 py-1 rounded-md border border-brand-border">
                                                        <Calendar className="w-3 h-3" /> {formatDate(order.createdAt)}
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            <td className="px-6 py-5 align-top">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-1.5 text-xs text-brand-neon font-bold">
                                                        <UserCircle className="w-4 h-4" /> {order.seller?.name || 'Aguardando Atendente'}
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        {(order.items || []).map((item: any, i: number) => (
                                                            <div key={i} className="text-xs text-brand-muted flex items-center gap-1.5">
                                                                <span className="w-1 h-1 rounded-full bg-brand-border"></span>
                                                                <span className="truncate max-w-[200px]" title={item.panel?.name}>{item.panel?.name || 'Painel'}</span>
                                                            </div>
                                                        ))}
                                                        {(!order.items || order.items.length === 0) && (
                                                            <span className="text-xs text-brand-muted italic">Itens customizados via chat</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-5 align-top">
                                                <span className="font-black text-[15px] text-[#25D366]">
                                                    {formatCurrency(order.expectedValue)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5 align-top">
                                                <div className="w-44 mx-auto">
                                                    {updatingId === order.id ? (
                                                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-brand-neon bg-brand-neon/10 py-2.5 rounded-xl border border-brand-neon/20">
                                                            <Loader2 className="w-4 h-4 animate-spin" /> Atualizando...
                                                        </div>
                                                    ) : (
                                                        <CustomSelect
                                                            options={statusOptions}
                                                            value={order.status}
                                                            onChange={(val) => handleStatusChange(order.id, val)}
                                                        />
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-5 align-top text-right">
                                                <div className="flex flex-col gap-2 items-end">
                                                    <button 
                                                        disabled={actionLoadingId === `pdf-${order.id}`}
                                                        onClick={() => handleGenerateContract(order)}
                                                        className="flex items-center justify-center gap-2 text-xs font-bold bg-brand-background border border-brand-border hover:border-brand-neon hover:text-brand-neon text-brand-text px-3 py-2 rounded-xl transition-colors w-40 disabled:opacity-50"
                                                    >
                                                        {actionLoadingId === `pdf-${order.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />} 
                                                        Abrir Contrato
                                                    </button>
                                                    <button 
                                                        disabled={order.status !== 'WON' || actionLoadingId === `chat-${order.id}`}
                                                        onClick={() => handleExportChat(order)}
                                                        className={`flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-colors w-40 border ${
                                                            order.status === 'WON' 
                                                            ? 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/20' 
                                                            : 'bg-transparent text-brand-muted border-brand-border cursor-not-allowed opacity-50'
                                                        }`}
                                                        title={order.status !== 'WON' ? "Disponível apenas para pedidos concluídos" : "Baixar histórico de conversas"}
                                                    >
                                                        {actionLoadingId === `chat-${order.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                                                        Exportar Chat
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MOBILE LAYOUT                                             */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full pb-[100px] h-full overflow-y-auto gap-4">
                
                <div className="flex items-center justify-between mt-2">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-text tracking-tight flex items-center gap-2">
                            Pedidos CRM
                        </h1>
                        <p className="text-[11px] text-brand-muted mt-0.5 font-medium">Gerenciamento de tickets e contratos</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 relative z-50">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted z-10" />
                        <input
                            placeholder="Buscar cliente, vendedor ou painel..."
                            className="w-full bg-brand-surface border border-brand-border rounded-[16px] pl-11 pr-4 py-3.5 text-[13px] text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full bg-brand-surface rounded-[16px] shadow-sm border border-brand-border">
                        <CustomSelect
                            options={filterOptions}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder="Filtrar por Status"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-3" />
                            <span className="text-xs text-brand-muted uppercase font-bold tracking-widest">Carregando...</span>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="bg-brand-surface border border-brand-border rounded-[24px] p-8 flex flex-col items-center text-center shadow-sm">
                            <ReceiptText className="w-10 h-10 text-brand-muted mb-3 opacity-50" />
                            <h3 className="text-sm font-bold text-brand-text mb-1">Nenhum pedido</h3>
                            <p className="text-xs text-brand-muted">Não encontramos registros com estes filtros.</p>
                        </div>
                    ) : (
                        filteredOrders.map((order) => (
                            <div key={order.id} className="bg-brand-surface border border-brand-border rounded-[24px] p-5 flex flex-col shadow-sm relative">
                                
                                {/* Topo: Status e Valor */}
                                <div className="flex justify-between items-center border-b border-brand-border pb-3 mb-4">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-brand-text bg-brand-background px-3 py-1.5 rounded-lg border border-brand-border shadow-sm">
                                        {getStatusIcon(order.status)} 
                                        {statusOptions.find(o => o.value === order.status)?.label || order.status}
                                    </div>
                                    <span className="font-black text-xl text-[#25D366] tracking-tight">{formatCurrency(order.expectedValue)}</span>
                                </div>

                                {/* Meio: Cliente e Atendente */}
                                <div className="flex flex-col gap-4 mb-5">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-brand-muted uppercase font-bold tracking-widest mb-0.5">Cliente</span>
                                        <span className="font-bold text-brand-text text-[15px]">{order.client?.name || 'Não informado'}</span>
                                        <span className="text-xs text-brand-muted flex items-center gap-1.5 mt-1.5 font-medium">
                                            <Calendar className="w-3.5 h-3.5" /> {formatDate(order.createdAt)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col bg-brand-background p-3.5 rounded-xl border border-brand-border shadow-sm">
                                        <span className="text-[9px] text-brand-muted uppercase font-bold tracking-widest mb-1.5 flex items-center gap-1">
                                            <UserCircle className="w-3.5 h-3.5" /> Atendimento
                                        </span>
                                        <span className="text-sm font-bold text-brand-neon">{order.seller?.name || 'Aguardando Atendente'}</span>
                                    </div>
                                </div>

                                {/* Ações */}
                                <div className="flex flex-col gap-3 border-t border-brand-border pt-4">
                                    {updatingId === order.id ? (
                                        <div className="w-full flex items-center justify-center gap-2 text-xs font-bold text-brand-neon bg-brand-neon/10 py-3 rounded-xl border border-brand-neon/20">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Atualizando...
                                        </div>
                                    ) : (
                                        <CustomSelect
                                            options={statusOptions}
                                            value={order.status}
                                            onChange={(val) => handleStatusChange(order.id, val)}
                                        />
                                    )}

                                    <div className="grid grid-cols-2 gap-3 mt-1">
                                        <button 
                                            disabled={actionLoadingId === `pdf-${order.id}`}
                                            onClick={() => handleGenerateContract(order)}
                                            className="flex items-center justify-center gap-1.5 text-[11px] font-bold bg-brand-background border border-brand-border text-brand-text py-3 rounded-xl transition-colors active:border-brand-neon disabled:opacity-50 shadow-sm"
                                        >
                                            {actionLoadingId === `pdf-${order.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} Contrato
                                        </button>
                                        <button 
                                            disabled={order.status !== 'WON' || actionLoadingId === `chat-${order.id}`}
                                            onClick={() => handleExportChat(order)}
                                            className={`flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-colors border shadow-sm ${
                                                order.status === 'WON' 
                                                ? 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30 active:bg-[#25D366]/20' 
                                                : 'bg-brand-background text-brand-muted border-brand-border opacity-50 cursor-not-allowed'
                                            }`}
                                        >
                                            {actionLoadingId === `chat-${order.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />} Exportar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}