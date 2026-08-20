import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, MoreVertical, Mail, Phone, Calendar, ArrowUpRight, MapPin, X, Loader2, Edit2, Trash2, Briefcase, Users, FileDown, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { crmService, CrmClient, CreateClientData } from '@/services/crm.service';
import { useToast } from '@/contexts/ToastContext';

// Dependências de exportação de documentos
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function CrmClients() {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlDealId = searchParams.get('dealId');

    const [clients, setClients] = useState<CrmClient[]>([]);
    const [allDeals, setAllDeals] = useState<any[]>([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Estados de Modais
    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [isProfileOpen, setIsProfileOpen] = useState(false); 
    const [clientToDelete, setClientToDelete] = useState<string | null>(null); // Estado para o modal de exclusão
    const [selectedClient, setSelectedClient] = useState<CrmClient | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const [editingClient, setEditingClient] = useState<CrmClient | null>(null);
    const [formData, setFormData] = useState<CreateClientData>({
        name: '', email: '', phone: '', document: '', city: '',
    });

    const { addToast } = useToast();

    useEffect(() => {
        fetchData();

        const handleClickOutside = () => setOpenDropdownId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [clientsData, dealsData] = await Promise.all([
                crmService.getClients(),
                crmService.getDeals()
            ]);

            setClients(clientsData);
            setAllDeals(dealsData);

            if (urlDealId) {
                const targetDeal = dealsData.find((d: any) => d.id === urlDealId);
                if (targetDeal) {
                    const targetClient = clientsData.find((c: any) => c.id === targetDeal.clientId);
                    if (targetClient) {
                        setSelectedClient(targetClient);
                        setIsProfileOpen(true);
                        searchParams.delete('dealId');
                        setSearchParams(searchParams);
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            addToast('Não foi possível carregar a carteira de clientes.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveClient = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            addToast('O nome do cliente é obrigatório.', 'error');
            return;
        }

        try {
            setIsSubmitting(true);
            if (editingClient) {
                await crmService.updateClient(editingClient.id, formData);
                addToast('Cliente atualizado com sucesso!', 'success');
            } else {
                await crmService.createClient(formData);
                addToast('Cliente cadastrado com sucesso!', 'success');
            }
            closeModal();
            fetchData();
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            addToast('Erro ao salvar cliente. Verifique os dados.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openModalForCreate = () => {
        setEditingClient(null);
        setFormData({ name: '', email: '', phone: '', document: '', city: '' });
        setIsModalOpen(true);
    };

    const openModalForEdit = (client: CrmClient) => {
        setEditingClient(client);
        setFormData({
            name: client.name, email: client.email || '', phone: client.phone || '',
            document: client.document || '', city: client.city || '',
        });
        setIsModalOpen(true);
        setOpenDropdownId(null);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
        setFormData({ name: '', email: '', phone: '', document: '', city: '' });
    };

    // Função de execução do modal de exclusão
    const executeDeleteClient = async () => {
        if (!clientToDelete) return;
        try {
            await crmService.deleteClient(clientToDelete);
            addToast('Cliente excluído com sucesso.', 'success');
            setOpenDropdownId(null);
            fetchData();
        } catch (error) {
            console.error("Erro ao excluir:", error);
            addToast('Erro ao excluir cliente.', 'error');
        } finally {
            setClientToDelete(null);
        }
    };

    const handleOpenProfile = (client: CrmClient) => {
        setSelectedClient(client);
        setIsProfileOpen(true);
    };

    const handleNewDeal = (client: CrmClient) => {
        addToast(`Iniciando nova oportunidade para ${client.name}...`, 'success');
        setOpenDropdownId(null);
    };

    // =========================================================
    // GERAÇÃO DE CONTRATO (PDF) DIRETO DA FICHA DO CLIENTE
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

            const clientName = deal.client?.name || selectedClient?.name || "Cliente Não Informado";
            const clientCompany = deal.client?.company || (selectedClient as any)?.company || "Não Informada";
            const clientEmail = deal.client?.email || selectedClient?.email || "Não Informado";
            const clientPhone = deal.client?.phone || selectedClient?.phone || "Não Informado";
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

    const formatDate = (dateString: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateString));
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const getInitials = (name: string) => {
        if (!name) return 'CL';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const getStatusInfo = (status: string) => {
        if (status === 'WON') return { icon: <CheckCircle2 className="w-3.5 h-3.5" />, text: 'Ganho', color: 'text-[#25D366]', bg: 'bg-[#25D366]/10 border-[#25D366]/20' };
        if (status === 'LOST') return { icon: <XCircle className="w-3.5 h-3.5" />, text: 'Perdido', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' };
        return { icon: <Clock className="w-3.5 h-3.5" />, text: 'Em Andamento', color: 'text-brand-neon', bg: 'bg-brand-neon/10 border-brand-neon/20' };
    };

    const filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });

    const clientDeals = selectedClient ? allDeals.filter(d => d.clientId === selectedClient.id) : [];

    return (
        <div className="w-full h-full flex flex-col relative gap-6">

            {/* ========================================================= */}
            {/* VIEWPORT: DESKTOP                                         */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col h-full max-w-7xl mx-auto w-full animate-fade-in gap-6">

                <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-text tracking-tight flex items-center gap-2">
                            <Users className="w-6 h-6 text-brand-neon" /> Minha Carteira
                        </h1>
                        <p className="text-sm text-brand-muted mt-1 font-medium">Gerencie seus clientes, leads e histórico de contratos.</p>
                    </div>
                    <button
                        onClick={openModalForCreate}
                        className="flex items-center gap-2 bg-brand-neon text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-neonHover transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" /> Novo Cliente
                    </button>
                </div>

                <div className="bg-brand-surface p-4 rounded-[24px] flex flex-col sm:flex-row gap-4 items-center justify-between flex-shrink-0 border border-brand-border shadow-sm relative z-20 transition-colors">
                    <div className="w-full sm:w-[450px] relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input
                            placeholder="Buscar por nome ou email..."
                            className="w-full bg-brand-background border border-brand-border rounded-xl pl-11 pr-4 py-3 text-sm text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-sm text-brand-muted px-4 font-medium">
                        Total: <strong className="text-brand-text font-bold">{filteredClients.length}</strong> clientes
                    </div>
                </div>

                <div className="flex-1 min-h-0 bg-brand-surface rounded-[24px] overflow-hidden flex flex-col relative border border-brand-border shadow-sm transition-colors">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-brand-background/50 backdrop-blur-sm">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
                        </div>
                    )}

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[950px]">
                            <thead className="sticky top-0 bg-brand-background/90 backdrop-blur-md z-10 border-b border-brand-border">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Cliente</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Contato</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Localização</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-center">Negócios</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Cadastrado em</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border">
                                {!isLoading && filteredClients.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-brand-muted">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-full bg-brand-background border border-brand-border flex items-center justify-center mb-2 shadow-sm">
                                                    <Search className="w-8 h-8 text-brand-muted opacity-50" />
                                                </div>
                                                <p className="text-sm font-bold text-brand-text">Nenhum cliente encontrado</p>
                                                <p className="text-xs">Tente ajustar os filtros de busca ou cadastre um novo cliente.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClients.map((client) => (
                                        <tr
                                            key={client.id}
                                            onClick={() => handleOpenProfile(client)}
                                            className="hover:bg-brand-background/50 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-brand-background border border-brand-border flex items-center justify-center text-xs font-black text-brand-text shadow-sm shrink-0">
                                                        {getInitials(client.name)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-brand-text group-hover:text-brand-neon transition-colors">
                                                            {client.name}
                                                        </span>
                                                        {client.document && (
                                                            <span className="text-[10px] text-brand-muted mt-0.5 tracking-wider font-medium">
                                                                Doc: {client.document}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5 text-xs text-brand-muted font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                                                        <span className="truncate max-w-[150px]">{client.email || '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                                                        {client.phone || '-'}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs text-brand-muted font-medium">
                                                    <MapPin className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                                                    {client.city ? client.city : 'Não informada'}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-brand-background border border-brand-border text-brand-text text-xs font-black px-3 py-1.5 rounded-full inline-block min-w-[32px] shadow-sm">
                                                    {client._count?.deals || 0}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-brand-text font-medium">
                                                    <Calendar className="w-4 h-4 text-brand-muted shrink-0" />
                                                    {formatDate(client.createdAt)}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-center relative">
                                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOpenProfile(client); }}
                                                        className="p-2 text-brand-muted hover:text-brand-neon hover:bg-brand-neon/10 rounded-lg transition-colors border border-transparent hover:border-brand-neon/20"
                                                        title="Abrir Ficha Completa"
                                                    >
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    </button>

                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenDropdownId(openDropdownId === client.id ? null : client.id);
                                                            }}
                                                            className={`p-2 rounded-lg transition-colors border ${openDropdownId === client.id ? 'bg-brand-background text-brand-text border-brand-border' : 'text-brand-muted hover:text-brand-text hover:bg-brand-background border-transparent'}`}
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>

                                                        {openDropdownId === client.id && (
                                                            <div className="absolute right-8 top-0 mt-2 w-48 bg-brand-surface border border-brand-border rounded-xl shadow-xl py-1.5 z-50 animate-fade-in text-left">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleNewDeal(client); }}
                                                                    className="w-full text-left px-4 py-2 text-xs font-bold text-brand-text hover:bg-brand-background flex items-center gap-2 transition-colors"
                                                                >
                                                                    <Briefcase className="w-3.5 h-3.5 text-brand-neon" /> Nova Oportunidade
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); openModalForEdit(client); }}
                                                                    className="w-full text-left px-4 py-2 text-xs font-bold text-brand-text hover:bg-brand-background flex items-center gap-2 transition-colors"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5 text-brand-muted" /> Editar Cliente
                                                                </button>
                                                                <div className="h-px w-full bg-brand-border my-1"></div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setClientToDelete(client.id); setOpenDropdownId(null); }}
                                                                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" /> Excluir Cliente
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
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
            {/* VIEWPORT: MOBILE                                          */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full pb-2 relative gap-4">

                <div className="flex items-center justify-between mt-2 px-4">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-text tracking-tight flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-neon" /> Clientes
                        </h1>
                        <p className="text-[11px] text-brand-muted mt-0.5 font-medium">Sua carteira comercial</p>
                    </div>
                    <button
                        onClick={openModalForCreate}
                        className="w-12 h-12 bg-brand-neon text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform shrink-0"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                <div className="relative z-40 px-4">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted z-10" />
                    <input
                        placeholder="Buscar por nome ou email..."
                        className="w-full bg-brand-surface border border-brand-border rounded-[16px] pl-11 pr-4 py-3.5 text-[13px] text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-4 relative px-4 z-30">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-3" />
                            <span className="text-[10px] text-brand-muted uppercase font-bold tracking-widest">Buscando Clientes...</span>
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="bg-brand-surface border border-brand-border rounded-[24px] p-8 flex flex-col items-center text-center mt-2 shadow-sm">
                            <Search className="w-10 h-10 text-brand-muted opacity-50 mb-3" />
                            <h3 className="text-sm font-bold text-brand-text mb-1">Nenhum cliente</h3>
                            <p className="text-[11px] text-brand-muted font-medium">Ajuste os filtros ou crie um novo cadastro.</p>
                        </div>
                    ) : (
                        filteredClients.map((client) => (
                            <div key={client.id} className="bg-brand-surface border border-brand-border rounded-[24px] p-5 flex flex-col shadow-sm relative transition-colors">

                                <div className="flex items-center justify-between border-b border-brand-border pb-4 mb-4">
                                    <div className="flex items-center gap-3 min-w-0" onClick={() => handleOpenProfile(client)}>
                                        <div className="w-12 h-12 flex-shrink-0 rounded-full bg-brand-background border border-brand-border flex items-center justify-center text-brand-text font-black text-[15px] shadow-sm">
                                            {getInitials(client.name)}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <h3 className="text-[15px] font-bold text-brand-text truncate">{client.name}</h3>
                                            <div className="flex items-center gap-1.5 text-[11px] text-brand-muted font-medium mt-0.5">
                                                <MapPin className="w-3.5 h-3.5 text-brand-neon" /> {client.city || 'Não informada'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 mb-5">
                                    {client.email && (
                                        <div className="flex items-center gap-2 text-[13px] font-medium text-brand-muted">
                                            <Mail className="w-4 h-4 text-brand-muted" /> <span className="truncate">{client.email}</span>
                                        </div>
                                    )}
                                    {client.phone && (
                                        <div className="flex items-center gap-2 text-[13px] font-medium text-brand-muted">
                                            <Phone className="w-4 h-4 text-brand-muted" /> {client.phone}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 pt-4 border-t border-brand-border">
                                    <button
                                        onClick={() => handleNewDeal(client)}
                                        className="flex-1 bg-brand-neon/10 text-brand-neon border border-brand-neon/20 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 active:bg-brand-neon/20 transition-colors shadow-sm"
                                    >
                                        <Briefcase className="w-4 h-4" /> Nova Oportunidade
                                    </button>
                                    <button
                                        onClick={() => openModalForEdit(client)}
                                        className="p-3 bg-brand-background text-brand-text rounded-xl border border-brand-border active:border-brand-neon transition-colors shadow-sm"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setClientToDelete(client.id)}
                                        className="p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 active:bg-red-500/20 transition-colors shadow-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="h-[200px] w-full shrink-0 pointer-events-none" aria-hidden="true" />
            </div>

            {/* ========================================================= */}
            {/* MODAL GLOBAL: FICHA DO CLIENTE / HISTÓRICO DE CONTRATOS   */}
            {/* ========================================================= */}
            {isProfileOpen && selectedClient && (
                <div className="fixed inset-0 z-[99999] flex items-end lg:items-center justify-center bg-brand-background/80 backdrop-blur-md p-0 lg:p-4">
                    <div className="bg-brand-surface border-t lg:border border-brand-border rounded-t-[32px] lg:rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl animate-slide-up lg:animate-scale-up relative flex flex-col max-h-[90vh] pb-safe lg:pb-0 transition-colors">

                        {/* Header Ficha */}
                        <div className="flex items-center justify-between p-6 lg:p-8 border-b border-brand-border bg-brand-surface shrink-0 sticky top-0 z-20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-brand-background border border-brand-border flex items-center justify-center text-sm font-black text-brand-text shadow-sm">
                                    {getInitials(selectedClient.name)}
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-bold text-brand-text tracking-tight">{selectedClient.name}</h2>
                                    <p className="text-[11px] text-brand-muted uppercase tracking-widest font-bold mt-0.5">Ficha do Cliente</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsProfileOpen(false)}
                                className="text-brand-muted hover:text-brand-text bg-brand-background p-2.5 rounded-full border border-brand-border transition-colors active:scale-95 shadow-sm"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body Ficha */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">

                            <h3 className="text-xs font-black uppercase tracking-widest text-brand-muted mb-3">Informações de Contato</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-brand-background p-6 rounded-[24px] border border-brand-border mb-8 shadow-sm">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">Email</span>
                                    <span className="text-[13px] text-brand-text font-bold">{selectedClient.email || 'Não informado'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">Telefone</span>
                                    <span className="text-[13px] text-brand-text font-bold">{selectedClient.phone || 'Não informado'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">CPF / CNPJ</span>
                                    <span className="text-[13px] text-brand-text font-bold">{selectedClient.document || 'Não informado'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">Cidade</span>
                                    <span className="text-[13px] text-brand-text font-bold">{selectedClient.city || 'Não informada'}</span>
                                </div>
                            </div>

                            <h3 className="text-xs font-black uppercase tracking-widest text-brand-muted mb-3">Histórico de Contratos / Negócios</h3>
                            <div className="flex flex-col gap-4">
                                {clientDeals.length === 0 ? (
                                    <div className="text-center p-8 bg-brand-background border-2 border-dashed border-brand-border rounded-[24px] text-brand-muted text-sm font-medium">
                                        Nenhuma negociação atrelada a este cliente.
                                    </div>
                                ) : (
                                    clientDeals.map(deal => {
                                        const statusInfo = getStatusInfo(deal.status);
                                        return (
                                            <div key={deal.id} className="bg-brand-background border border-brand-border rounded-[24px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm transition-colors hover:border-brand-neon/50">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-brand-text truncate max-w-[300px] mb-2">{deal.title || 'Contrato Padrão'}</span>
                                                    <div className="flex items-center gap-2 text-[12px] text-brand-muted font-bold mb-3">
                                                        <Calendar className="w-3.5 h-3.5" /> {formatDate(deal.createdAt)}
                                                        <span className="w-1 h-1 rounded-full bg-brand-border"></span>
                                                        <span className="text-brand-text">{formatCurrency(deal.expectedValue)}</span>
                                                    </div>
                                                    <div className={`w-fit flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[10px] font-black uppercase tracking-widest shadow-sm ${statusInfo.bg} ${statusInfo.color}`}>
                                                        {statusInfo.icon} {statusInfo.text}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleGenerateContract(deal)}
                                                    disabled={actionLoadingId === `pdf-${deal.id}`}
                                                    className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 bg-brand-surface hover:bg-brand-background border border-brand-border text-brand-text font-bold text-xs py-3 px-5 rounded-xl transition-colors active:scale-95 disabled:opacity-50 shadow-sm"
                                                >
                                                    {actionLoadingId === `pdf-${deal.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4 text-brand-neon" />}
                                                    Baixar Contrato
                                                </button>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                            
                            <div className="h-[30px] lg:hidden w-full shrink-0" />
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL GLOBAL (CRIAÇÃO E EDIÇÃO DE CLIENTES)                 */}
            {/* ========================================================= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[99999] flex items-end lg:items-center justify-center bg-brand-background/80 backdrop-blur-sm p-0 lg:p-4">
                    <div className="bg-brand-surface border-t lg:border border-brand-border rounded-t-[32px] lg:rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-slide-up lg:animate-fade-in relative flex flex-col max-h-[90vh] pb-safe lg:pb-0 transition-colors">

                        <div className="flex items-center justify-between p-6 lg:p-8 border-b border-brand-border bg-brand-surface shrink-0 relative z-10">
                            <h2 className="text-xl font-bold text-brand-text flex items-center gap-2 tracking-tight">
                                {editingClient ? <Edit2 className="w-6 h-6 text-brand-neon" /> : <Plus className="w-6 h-6 text-brand-neon" />}
                                {editingClient ? 'Editar Cliente' : 'Cadastrar Cliente'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-brand-muted hover:text-brand-text bg-brand-background p-2.5 rounded-full border border-brand-border transition-colors active:scale-95 shadow-sm"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
                            <form id="clientForm" onSubmit={handleSaveClient} className="flex flex-col gap-5 relative z-10">
                                <div>
                                    <label className="block text-[11px] font-bold text-brand-muted mb-2 uppercase tracking-widest ml-1">Nome da Empresa / Contato *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-4 lg:py-3.5 text-[14px] font-medium text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-sm"
                                        placeholder="Ex: Felipe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-brand-muted mb-2 uppercase tracking-widest ml-1">Telefone</label>
                                        <input
                                            type="text"
                                            className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-4 lg:py-3.5 text-[14px] font-medium text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-sm"
                                            placeholder="(11) 99999-9999"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-brand-muted mb-2 uppercase tracking-widest ml-1">Doc (CPF/CNPJ)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-4 lg:py-3.5 text-[14px] font-medium text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-sm"
                                            placeholder="000.000.000-00"
                                            value={formData.document}
                                            onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-brand-muted mb-2 uppercase tracking-widest ml-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-4 lg:py-3.5 text-[14px] font-medium text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-sm"
                                        placeholder="felipe@magistrareducacional.com.br"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-brand-muted mb-2 uppercase tracking-widest ml-1">Cidade</label>
                                    <input
                                        type="text"
                                        className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-4 lg:py-3.5 text-[14px] font-medium text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-sm"
                                        placeholder="Ex: Goiânia"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                            </form>
                            
                            <div className="h-[30px] lg:hidden w-full shrink-0" />
                        </div>

                        <div className="p-6 lg:p-8 border-t border-brand-border shrink-0 bg-brand-surface z-20">
                            <button
                                type="submit"
                                form="clientForm"
                                disabled={isSubmitting}
                                className="w-full bg-brand-neon text-white py-4 rounded-xl text-[14px] font-bold uppercase tracking-widest hover:bg-brand-neonHover transition-all flex items-center justify-center shadow-md disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingClient ? 'Salvar Edição' : 'Cadastrar Cliente')}
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL GLOBAL (CONFIRMAÇÃO DE EXCLUSÃO)                    */}
            {/* ========================================================= */}
            {clientToDelete && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-brand-background/80 backdrop-blur-sm p-4">
                    <div className="bg-brand-surface border border-brand-border rounded-[24px] w-full max-w-sm p-6 md:p-8 shadow-2xl animate-scale-up relative flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-5">
                            <Trash2 className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-brand-text mb-2">Excluir Cliente?</h3>
                        <p className="text-[13px] text-brand-muted mb-8 leading-relaxed">
                            Esta ação removerá permanentemente o cliente e pode afetar os contratos vinculados a ele. Essa ação não pode ser desfeita.
                        </p>
                        <div className="flex w-full gap-3">
                            <button
                                onClick={() => setClientToDelete(null)}
                                className="flex-1 py-3.5 rounded-xl border border-brand-border text-brand-text font-bold text-[13px] hover:bg-brand-background transition-colors active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={executeDeleteClient}
                                className="flex-1 py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-[13px] shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-colors active:scale-95"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}