import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, ShoppingCart, Loader2, Calendar, ReceiptText, 
    FileDown, MessageSquare, ChevronDown, ChevronUp, MapPin, MonitorPlay,
    CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { CustomSelect } from '@/components/CustomSelect';
import { Button } from '@/components/Button';
import { api } from '@/lib/axios';
import { usersService } from '@/services/users.service';
import { crmService } from '@/services/crm.service';

// Dependências de exportação de documentos
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Funções utilitárias globais
const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
};

const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    }).format(new Date(dateString));
};

export function Orders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [sellers, setSellers] = useState<{id: string, name: string}[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    
    const { addToast } = useToast();

    // Carrega os pedidos do Banco de Dados (Agora eles já vêm agrupados como pacotes nativamente)
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [ordersRes, usersData] = await Promise.all([
                    api.get('/orders').catch(() => ({ data: [] })),
                    usersService.getAllUsers().catch(() => [])
                ]);

                // 1. Filtra a equipe comercial/gestores
                const commercialTeam = usersData
                    .filter((u: any) => ['COMERCIAL', 'MANAGER', 'ADMIN'].includes(u.role))
                    .map((u: any) => ({ id: u.id, name: u.name }));
                setSellers(commercialTeam);

                // 2. Mapeamento direto (o Backend já retorna o Order com seus Items)
                const formattedOrders = ordersRes.data.map((order: any) => {
                    const startDate = order.startDate ? new Date(order.startDate) : new Date();
                    const endDate = order.endDate ? new Date(order.endDate) : new Date();
                    const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); 
                    const months = Math.max(1, Math.round(diffDays / 30));

                    return {
                        id: order.id, 
                        createdAt: order.createdAt,
                        clientName: order.user?.name || 'Cliente Sem Nome',
                        clientPhone: order.user?.phone || 'Não informado',
                        clientEmail: order.user?.email || '',
                        company: order.company?.corporateName || order.user?.companyName || '',
                        status: order.status, 
                        expectedValue: order.totalValue,
                        formattedValue: formatCurrency(order.totalValue),
                        months: months,
                        message: order.notes,
                        assignedTo: order.seller ? { id: order.seller.id, name: order.seller.name } : null,
                        items: order.items || [] // O array de painéis já vem pronto do backend!
                    };
                });

                formattedOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setOrders(formattedOrders);

            } catch (error) {
                console.error("Erro ao buscar dados do banco:", error);
                addToast("Erro ao carregar a lista de pedidos.", "error");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [addToast]);

    const sellerOptions = useMemo(() => {
        return [
            { value: '', label: 'Novo (Aguardando)' },
            ...sellers.map(s => ({ value: s.id, label: s.name.split(' ')[0] }))
        ];
    }, [sellers]);

    const assignSeller = async (orderId: string, sellerId: string) => {
        try {
            const seller = sellers.find(s => s.id === sellerId);
            
            // Agora atualizamos 1 único ID no banco, pois a tabela foi corrigida
            await api.patch(`/orders/${orderId}`, { sellerId: sellerId || null });
            
            const updatedOrders = orders.map(order => 
                order.id === orderId ? { ...order, assignedTo: seller || null } : order
            );
            
            setOrders(updatedOrders);
            
            if (seller) addToast(`Pacote atribuído para ${seller.name}`, 'success');
            else addToast(`Atribuição removida do pacote`, 'info');
        } catch (error) {
            addToast("Falha ao atribuir vendedor.", "error");
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            setUpdatingId(orderId);
            
            await api.patch(`/orders/${orderId}`, { status: newStatus });
            
            const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
            setOrders(updatedOrders);
            addToast("Status do pacote atualizado com sucesso!", "success");
        } catch (error) {
            addToast("Falha ao atualizar o status do pacote.", "error");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleExportChat = async (order: any) => {
        try {
            setActionLoadingId(`chat-${order.id}`);
            const history = await crmService.getChatHistory(order.id).catch(() => []);
            
            if (!history || history.length === 0) {
                addToast("Não há mensagens cadastradas na API para exportar.", "info");
                setActionLoadingId(null);
                return;
            }

            const clientName = order.clientName || 'Cliente';
            const sellerName = order.assignedTo?.name || 'Comercial T3';
            
            let textContent = `======================================================\n`;
            textContent += `HISTÓRICO DE ATENDIMENTO - T3 MÍDIA E TECNOLOGIA\n`;
            textContent += `======================================================\n`;
            textContent += `PACOTE ID: ${order.id}\n`;
            textContent += `CLIENTE: ${clientName}\n`;
            textContent += `ATENDENTE: ${sellerName}\n`;
            textContent += `STATUS: ${order.status === 'COMPLETED' ? 'Concluído' : order.status}\n`;
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
            
            const clientName = deal.clientName || "Cliente Não Informado";
            const clientCompany = deal.company || "Não Informada";
            const clientEmail = deal.clientEmail || "Não Informado";
            const clientPhone = deal.clientPhone || "Não Informado";
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

            let finalTotalContract = Number(deal.expectedValue || 0);

            doc.setFont("helvetica", "bold");
            doc.text("1. ESCOPO DOS SERVIÇOS E INVESTIMENTO", marginLeft, currentY);
            currentY += 5;

            const tableRows = (deal.items || []).map((item: any) => {
                const p = item.panel || item;
                const city = p.city ? String(p.city).toUpperCase() : 'CIDADE';
                const state = p.state ? String(p.state).toUpperCase() : 'UF';
                return [
                    `(${city} - ${state}) ${p.name || 'Painel'}`,
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.priceSnapshot || item.price || 0))
                ];
            });

            if (tableRows.length === 0) {
                tableRows.push(["Pacote Customizado", new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalTotalContract)]);
            }

            autoTable(doc, {
                startY: currentY,
                head: [['Painéis Solicitados', 'Valor Negociado']],
                body: [
                    ...tableRows,
                    [{ content: 'VALOR TOTAL DO PEDIDO:', styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 94, 0], textColor: [255, 255, 255] } }, new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalTotalContract)]
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
            doc.text(`T3 LED Mídia / ${deal.assignedTo?.name || 'Comercial'}`, marginLeft, currentY);
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

    const statusOptions = [
        { value: 'PENDING', label: 'Pendente / Novo' },
        { value: 'APPROVED', label: 'Aprovado / Em Venda' },
        { value: 'COMPLETED', label: 'Concluído (Ganho)' },
        { value: 'REJECTED', label: 'Rejeitado / Perdido' }
    ];

    const filterOptions = [
        { value: '', label: 'Todos os Status' },
        ...statusOptions
    ];

    const filteredOrders = orders.filter((order) => {
        const searchTarget = searchTerm.toLowerCase();
        const matchesSearch = 
            (order.clientName || '').toLowerCase().includes(searchTarget) || 
            (order.assignedTo?.name || '').toLowerCase().includes(searchTarget) ||
            (order.id || '').toLowerCase().includes(searchTarget);
        
        const matchesStatus = statusFilter === '' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyles = (status: string) => {
        if (status === 'COMPLETED') return 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20';
        if (status === 'REJECTED') return 'bg-red-500/10 text-red-500 border-red-500/20';
        if (status === 'APPROVED') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    };

    const getStatusIcon = (status: string) => {
        if (status === 'COMPLETED') return <CheckCircle2 className="w-3.5 h-3.5" />;
        if (status === 'REJECTED') return <XCircle className="w-3.5 h-3.5" />;
        if (status === 'APPROVED') return <MonitorPlay className="w-3.5 h-3.5" />;
        return <AlertCircle className="w-3.5 h-3.5" />;
    };

    return (
        <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto w-full pb-10">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-brand-text flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-brand-neon" /> Gestão de Pacotes
                    </h1>
                    <p className="text-sm text-brand-muted mt-1">Acompanhe pacotes de orçamentos gerados pelos clientes na plataforma.</p>
                </div>

                <div className="flex w-full md:w-auto items-center gap-3">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                        <input 
                            type="text" 
                            placeholder="Buscar cliente, ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-text focus:border-brand-neon outline-none"
                        />
                    </div>
                    <div className="w-48 hidden md:block">
                        <CustomSelect
                            options={filterOptions}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder="Status"
                        />
                    </div>
                </div>
            </div>

            {/* Lista de Pedidos (PACOTES) */}
            <div className="flex-1 bg-brand-surface border border-brand-border rounded-[24px] overflow-hidden flex flex-col shadow-sm">
                
                {/* Tabela Header (Desktop) */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-5 border-b border-brand-border bg-brand-background/50 items-center">
                    <div className="col-span-2 text-[10px] font-bold text-brand-muted uppercase tracking-widest">ID Pacote / Data</div>
                    <div className="col-span-3 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Cliente</div>
                    <div className="col-span-2 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Valor do Pacote</div>
                    <div className="col-span-2 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Status Geral</div>
                    <div className="col-span-2 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Responsável</div>
                    <div className="col-span-1"></div>
                </div>

                {/* Conteúdo */}
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center p-10"><Loader2 className="w-8 h-8 text-brand-neon animate-spin" /></div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
                        <ReceiptText className="w-12 h-12 text-brand-muted/30 mb-4" />
                        <h3 className="text-lg font-bold text-brand-text mb-1">Nenhum pacote encontrado.</h3>
                        <p className="text-sm text-brand-muted font-medium">Os orçamentos gerados no site aparecerão aqui.</p>
                    </div>
                ) : (
                    <div className="flex flex-col divide-y divide-brand-border overflow-y-auto custom-scrollbar">
                        {filteredOrders.map(order => {
                            const isExpanded = expandedOrderId === order.id;
                            const currentStatus = order.status || 'PENDING';

                            return (
                                <div key={order.id} className="flex flex-col hover:bg-brand-background/30 transition-colors">
                                    {/* Linha Visível Sempre */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-center cursor-pointer md:cursor-auto" onClick={() => window.innerWidth < 768 && setExpandedOrderId(isExpanded ? null : order.id)}>
                                        
                                        <div className="col-span-1 md:col-span-2 flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start gap-1">
                                            <span className="text-xs font-black text-brand-text bg-brand-background border border-brand-border px-2 py-1 rounded" title={order.id}>
                                                PKG-{order.id.substring(0, 6)}
                                            </span>
                                            <span className="text-[10px] text-brand-muted flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {formatDate(order.createdAt)}
                                            </span>
                                        </div>

                                        <div className="col-span-1 md:col-span-3 flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-brand-text truncate">{order.clientName}</span>
                                            <span className="text-[11px] text-brand-muted truncate">{order.clientPhone} {order.company && `• ${order.company}`}</span>
                                        </div>

                                        <div className="col-span-1 md:col-span-2 flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start">
                                            <span className="md:hidden text-[10px] text-brand-muted uppercase font-bold">Investimento</span>
                                            <span className="text-sm md:text-base font-black text-[#25D366]">{order.formattedValue}</span>
                                            <span className="hidden md:block text-[10px] text-brand-muted uppercase tracking-wider mt-0.5">{order.months} Meses</span>
                                        </div>

                                        <div className="hidden md:flex col-span-2 flex-col items-start justify-center">
                                            {updatingId === order.id ? (
                                                <Loader2 className="w-4 h-4 text-brand-neon animate-spin" />
                                            ) : (
                                                <div className="w-full pr-4">
                                                    <CustomSelect
                                                        options={statusOptions}
                                                        value={currentStatus}
                                                        onChange={(val) => handleStatusChange(order.id, val)}
                                                        placeholder="Status"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Select de Atribuição */}
                                        <div className="col-span-1 md:col-span-2 z-10" onClick={e => e.stopPropagation()}>
                                            <label className="md:hidden text-[10px] text-brand-muted uppercase font-bold mb-1 block">Atribuir Pacote</label>
                                            <div className="w-full relative pr-4">
                                                <CustomSelect 
                                                    options={sellerOptions}
                                                    value={order.assignedTo?.id || ""}
                                                    onChange={(val) => assignSeller(order.id, val)}
                                                    placeholder="Atribuir Vendedor"
                                                />
                                            </div>
                                        </div>

                                        <div className="hidden md:flex col-span-1 justify-end items-center">
                                            <button 
                                                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                                className={`p-2 border rounded-full transition-colors flex items-center justify-center gap-2 px-4 ${isExpanded ? 'bg-brand-neon text-brand-surface border-brand-neon' : 'bg-brand-background text-brand-muted border-brand-border hover:text-brand-text'}`}
                                            >
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Info</span>
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        
                                        <div className="md:hidden flex justify-center pt-2">
                                            <span className="text-xs text-brand-muted font-bold uppercase tracking-widest flex items-center gap-1">
                                                {isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes'} {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </span>
                                        </div>
                                    </div>

                                    {/* ÁREA EXPANDIDA: Pré-Visualização e Ações */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden bg-brand-background/50 border-t border-brand-border shadow-inner"
                                            >
                                                <div className="p-5 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                    
                                                    {/* Painéis do Pedido */}
                                                    <div className="flex flex-col gap-3">
                                                        <h4 className="text-xs font-bold text-brand-muted uppercase tracking-widest flex items-center gap-2">
                                                            <MonitorPlay className="w-4 h-4 text-brand-neon" /> Itens Agrupados no Pacote ({order.items?.length || 0})
                                                        </h4>
                                                        <div className="flex flex-col gap-2 mt-2">
                                                            {(order.items || []).map((item: any, i: number) => {
                                                                const panel = item.panel || item;
                                                                if (!panel) return null; // Prevenção de erro caso falte dado

                                                                return (
                                                                    <div key={i} className="flex items-center gap-4 bg-brand-surface p-3 rounded-xl border border-brand-border">
                                                                        <div className="w-12 h-12 bg-black rounded-lg overflow-hidden shrink-0">
                                                                            <img src={panel.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover opacity-80" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-bold text-brand-text truncate">{panel.name || 'Painel sem nome'}</p>
                                                                            <p className="text-[10px] text-brand-muted truncate flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {panel.city || 'Cidade N/A'}</p>
                                                                        </div>
                                                                        <div className="shrink-0 flex flex-col items-end">
                                                                            <span className="text-xs font-black text-brand-text">{formatCurrency(item.priceSnapshot || panel.price || 0)}</span>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Informações Extras e Ações PDF */}
                                                    <div className="flex flex-col gap-5">
                                                        {order.message && (
                                                            <div className="bg-brand-surface p-4 rounded-xl border border-brand-border">
                                                                <h4 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest flex items-center gap-2 mb-2">
                                                                    <ReceiptText className="w-3.5 h-3.5" /> Notas Internas do Sistema / Lead
                                                                </h4>
                                                                <p className="text-sm text-brand-text italic whitespace-pre-wrap leading-relaxed">
                                                                    "{order.message}"
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div className="mt-auto flex flex-col gap-3">
                                                            <h4 className="text-xs font-bold text-brand-muted uppercase tracking-widest mb-1">Ações do Pacote</h4>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <Button 
                                                                    variant="secondary"
                                                                    disabled={actionLoadingId === `pdf-${order.id}`}
                                                                    onClick={() => handleGenerateContract(order)}
                                                                    className="bg-brand-surface border-brand-border text-brand-text w-full py-4 text-[11px]"
                                                                >
                                                                    {actionLoadingId === `pdf-${order.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} 
                                                                    Gerar Contrato (PDF)
                                                                </Button>
                                                                <Button 
                                                                    disabled={currentStatus !== 'COMPLETED' || actionLoadingId === `chat-${order.id}`}
                                                                    onClick={() => handleExportChat(order)}
                                                                    className={`w-full py-4 text-[11px] border ${
                                                                        currentStatus === 'COMPLETED' 
                                                                        ? 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/20' 
                                                                        : 'bg-brand-surface text-brand-muted border-brand-border opacity-50'
                                                                    }`}
                                                                >
                                                                    {actionLoadingId === `chat-${order.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />} 
                                                                    Exportar Chat
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* MOBILE LAYOUT                                             */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full relative gap-4 pb-[100px]">
                
                <div className="flex items-center justify-between mt-2 px-4">
                    <div>
                        <h1 className="text-xl font-bold text-brand-text tracking-tight flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-brand-neon" /> Pacotes
                        </h1>
                        <p className="text-[11px] text-brand-muted mt-0.5 font-medium">Gestão de orçamentos e contratos</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 px-4 relative z-50">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted z-10" />
                        <input
                            placeholder="Buscar pacote..."
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

                <div className="flex flex-col gap-4 px-4 mt-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-3" />
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="bg-brand-surface border border-brand-border rounded-[24px] p-8 flex flex-col items-center text-center shadow-sm">
                            <ReceiptText className="w-10 h-10 text-brand-muted mb-3 opacity-50" />
                            <h3 className="text-sm font-bold text-brand-text mb-1">Nenhum pacote</h3>
                        </div>
                    ) : (
                        filteredOrders.map((order, index) => {
                            const isExpanded = expandedOrderId === order.id;
                            const currentStatus = order.status || 'PENDING';
                            const statusLabel = statusOptions.find(o => o.value === currentStatus)?.label || currentStatus;

                            return (
                                <div key={order.id} style={{ zIndex: filteredOrders.length - index }} className="bg-brand-surface border border-brand-border rounded-[24px] p-5 flex flex-col shadow-sm relative transition-colors">
                                    <div className="flex justify-between items-start border-b border-brand-border pb-4 mb-4" onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                                                <div className="font-bold text-brand-text text-[15px] truncate">{order.clientName}</div>
                                                <div className="text-xs text-brand-muted font-medium truncate">{order.clientPhone || order.company}</div>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0">
                                                <span className="font-black text-[#25D366]">{order.formattedValue}</span>
                                                <span className="text-[9px] text-brand-muted uppercase font-bold">{order.months}x</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4 flex justify-between items-center">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Status</span>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getStatusStyles(currentStatus)}`}>
                                            {getStatusIcon(currentStatus)} {statusLabel}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-2 relative z-50">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted ml-1">Atribuir Pacote</label>
                                        <div className="w-full relative">
                                            <CustomSelect 
                                                options={sellerOptions}
                                                value={order.assignedTo?.id || ""}
                                                onChange={(val) => assignSeller(order.id, val)}
                                                placeholder="Atribuir Vendedor"
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                        className="mt-4 text-xs font-bold uppercase text-brand-muted w-full text-center flex items-center justify-center gap-1"
                                    >
                                        {isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes'} {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden border-t border-brand-border mt-3 pt-3"
                                            >
                                                <div className="flex flex-col gap-3">
                                                    <h4 className="text-[10px] font-bold text-brand-muted uppercase tracking-widest flex items-center gap-1">
                                                        <MonitorPlay className="w-3 h-3 text-brand-neon" /> Painéis Agrupados ({order.items?.length || 0})
                                                    </h4>
                                                    <div className="flex flex-col gap-2">
                                                        {(order.items || []).map((item: any, i: number) => {
                                                            const panel = item.panel || item;
                                                            if (!panel) return null;

                                                            return (
                                                                <div key={i} className="flex items-center gap-3 bg-brand-background p-2 rounded-xl border border-brand-border">
                                                                    <div className="w-10 h-10 bg-black rounded-lg overflow-hidden shrink-0">
                                                                        <img src={panel.images?.[0] || '/placeholder.jpg'} className="w-full h-full object-cover opacity-80" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-[11px] font-bold text-brand-text truncate">{panel.name || 'Painel sem nome'}</p>
                                                                        <p className="text-[9px] text-brand-muted truncate">{panel.city || 'Cidade N/A'}</p>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                    
                                                    <Button 
                                                        disabled={actionLoadingId === `pdf-${order.id}`}
                                                        onClick={() => handleGenerateContract(order)}
                                                        className="w-full bg-brand-background border border-brand-border text-brand-text mt-2 text-xs py-3"
                                                    >
                                                        {actionLoadingId === `pdf-${order.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />} 
                                                        Gerar Contrato (PDF)
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                </div>
                            );
                        })
                    )}
                </div>
                
                <div className="h-[50px] w-full shrink-0 pointer-events-none" />
            </div>

        </div>
    );
}