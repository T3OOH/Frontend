import { useState, useEffect, FormEvent } from 'react';
import { Search, Plus, FileText, MoreVertical, Mail, Phone, Calendar, ArrowUpRight, MapPin, X, Loader2, Edit2, Trash2, Briefcase, Users } from 'lucide-react';
import { crmService, CrmClient, CreateClientData } from '@/services/crm.service';
import { useToast } from '@/contexts/ToastContext';

/**
 * Componente principal de Gestão de Carteira de Clientes (CRM).
 * Implementa arquitetura responsiva separando a interface em dois viewports:
 * - Desktop: Layout em Data Table com filtros e menu de ações em dropdown.
 * - Mobile: Layout em Stack de Cards com ações diretas e scroll fluido,
 *   incluindo espaçador estrutural para não conflitar com a navegação nativa.
 */
export function CrmClients() {
    const [clients, setClients] = useState<CrmClient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingClient, setEditingClient] = useState<CrmClient | null>(null);
    const [formData, setFormData] = useState<CreateClientData>({
        name: '',
        email: '',
        phone: '',
        document: '',
        city: '',
    });

    const { addToast } = useToast();

    /**
     * Efeito de inicialização e fechamento global de dropdown.
     * Escuta cliques fora da área do menu suspenso (Desktop) para fechá-lo automaticamente.
     */
    useEffect(() => {
        fetchClients();

        const handleClickOutside = () => setOpenDropdownId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    /**
     * Busca os clientes ativos na API e preenche o estado da aplicação.
     */
    const fetchClients = async () => {
        try {
            setIsLoading(true);
            const data = await crmService.getClients();
            setClients(data);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
            addToast('Não foi possível carregar a carteira de clientes.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Valida e submete os dados do formulário para criação ou atualização de um cliente.
     * @param e - Evento de submissão do formulário.
     */
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
            fetchClients(); 
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            addToast('Erro ao salvar cliente. Verifique os dados.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Prepara o estado do modal para inserção de um novo registro.
     */
    const openModalForCreate = () => {
        setEditingClient(null);
        setFormData({ name: '', email: '', phone: '', document: '', city: '' });
        setIsModalOpen(true);
    };

    /**
     * Prepara o estado do modal para alteração de um registro existente.
     * @param client - Ojeto contendo os dados do cliente a ser editado.
     */
    const openModalForEdit = (client: CrmClient) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            email: client.email || '',
            phone: client.phone || '',
            document: client.document || '',
            city: client.city || '',
        });
        setIsModalOpen(true);
        setOpenDropdownId(null);
    };

    /**
     * Limpa o estado temporário e fecha o modal de criação/edição.
     */
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
        setFormData({ name: '', email: '', phone: '', document: '', city: '' });
    };

    /**
     * Confirma e executa a exclusão de um cliente da base de dados.
     * @param id - Identificador único do cliente.
     */
    const handleDeleteClient = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente? Essa ação não pode ser desfeita.')) {
            try {
                await crmService.deleteClient(id);
                addToast('Cliente excluído com sucesso.', 'success');
                setOpenDropdownId(null);
                fetchClients(); 
            } catch (error) {
                console.error("Erro ao excluir:", error);
                addToast('Erro ao excluir cliente.', 'error');
            }
        }
    };

    /**
     * Simula a abertura da ficha de perfil detalhada do cliente.
     * @param client - Ojeto do cliente selecionado.
     */
    const handleOpenProfile = (client: CrmClient) => {
        addToast(`Abrindo ficha completa de ${client.name}...`, 'success');
    };

    /**
     * Inicia o processo de criação de uma nova oportunidade de negócio (Deal).
     * @param client - Objeto do cliente vinculado.
     */
    const handleNewDeal = (client: CrmClient) => {
        addToast(`Iniciando nova oportunidade para ${client.name}...`, 'success');
        setOpenDropdownId(null);
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateString));
    };

    const getInitials = (name: string) => {
        if (!name) return 'CL';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });

    return (
        <div className="w-full h-full flex flex-col relative">
            
            {/* ========================================================= */}
            {/* VIEWPORT: DESKTOP                                           */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col h-full max-w-7xl mx-auto w-full animate-fade-in">
                
                <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-wide">Minha Carteira</h1>
                        <p className="text-sm text-brand-muted mt-1">Gerencie seus clientes, leads e histórico de interações.</p>
                    </div>
                    <button 
                        onClick={openModalForCreate}
                        className="flex items-center gap-2 bg-brand-neon text-[#0A0A0B] px-5 py-2.5 rounded-xl font-bold hover:bg-brand-neon/90 transition-colors shadow-[0_0_15px_rgba(255,94,0,0.2)]"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Cliente
                    </button>
                </div>

                <div className="glass-panel p-3 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between flex-shrink-0 mb-4 border-brand-border/40 relative z-20">
                    <div className="w-full sm:w-[400px] relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input
                            placeholder="Buscar por nome ou email..."
                            className="w-full bg-[#0A0A0B]/50 border border-brand-border/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-neon transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-sm text-brand-muted px-4">
                        Total: <strong className="text-brand-neon">{filteredClients.length}</strong> clientes
                    </div>
                </div>

                <div className="flex-1 min-h-0 glass-panel rounded-xl overflow-hidden flex flex-col relative border-brand-border/40">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0A0A0B]/50 backdrop-blur-sm">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
                        </div>
                    )}

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[950px]">
                            <thead className="sticky top-0 bg-[#0d0d0f] z-10 shadow-sm border-b border-brand-border/40">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Cliente</th>
                                    <th className="px-6 py-4 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Contato</th>
                                    <th className="px-6 py-4 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Localização</th>
                                    <th className="px-6 py-4 text-[10px] font-semibold text-brand-muted uppercase tracking-widest text-center">Negócios (Kanban)</th>
                                    <th className="px-6 py-4 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Cadastrado em</th>
                                    <th className="px-6 py-4 text-[10px] font-semibold text-brand-muted uppercase tracking-widest text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border/20">
                                {!isLoading && filteredClients.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-brand-muted">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-full bg-brand-surface/50 flex items-center justify-center mb-2">
                                                    <Search className="w-8 h-8 text-brand-border" />
                                                </div>
                                                <p className="text-sm font-medium text-white">Nenhum cliente encontrado</p>
                                                <p className="text-xs">Tente ajustar os filtros de busca ou cadastre um novo cliente.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClients.map((client) => (
                                        <tr 
                                            key={client.id} 
                                            onClick={() => handleOpenProfile(client)}
                                            className="hover:bg-brand-surface/40 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-[#111113] border border-brand-border/80 flex items-center justify-center text-xs font-black text-brand-neon shadow-inner shrink-0">
                                                        {getInitials(client.name)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-white group-hover:text-brand-neon transition-colors">
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
                                                        <Mail className="w-3.5 h-3.5 text-brand-text/40 shrink-0" />
                                                        <span className="truncate max-w-[150px]">{client.email || '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-3.5 h-3.5 text-brand-text/40 shrink-0" />
                                                        {client.phone || '-'}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs text-brand-muted font-medium">
                                                    <MapPin className="w-3.5 h-3.5 text-brand-text/40 shrink-0" />
                                                    {client.city ? client.city : 'Não informada'}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-[#111113] border border-brand-border/80 text-white text-xs font-black px-3 py-1.5 rounded-full inline-block min-w-[32px]">
                                                    {client._count?.deals || 0}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-brand-text font-medium">
                                                    <Calendar className="w-4 h-4 text-brand-muted/70 shrink-0" />
                                                    {formatDate(client.createdAt)}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-center relative">
                                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleOpenProfile(client); }}
                                                        className="p-2 text-brand-muted hover:text-brand-neon hover:bg-brand-neon/10 rounded-lg transition-colors" 
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
                                                            className={`p-2 rounded-lg transition-colors ${openDropdownId === client.id ? 'bg-brand-surface text-white' : 'text-brand-muted hover:text-white hover:bg-brand-surface'}`}
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>

                                                        {openDropdownId === client.id && (
                                                            <div className="absolute right-8 top-0 mt-2 w-48 bg-[#111113] border border-brand-border/60 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] py-1.5 z-50 animate-fade-in text-left">
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleNewDeal(client); }}
                                                                    className="w-full text-left px-4 py-2 text-xs font-medium text-white hover:bg-brand-surface/80 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <Briefcase className="w-3.5 h-3.5 text-brand-neon" /> Nova Oportunidade
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); openModalForEdit(client); }}
                                                                    className="w-full text-left px-4 py-2 text-xs font-medium text-white hover:bg-brand-surface/80 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5 text-brand-muted" /> Editar Cliente
                                                                </button>
                                                                <div className="h-px w-full bg-brand-border/40 my-1"></div>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}
                                                                    className="w-full text-left px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
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
            {/* VIEWPORT: MOBILE (APP PATTERN)                              */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full pb-2 relative">
                
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-neon" /> Clientes
                        </h1>
                        <p className="text-[11px] text-brand-muted mt-0.5">Sua carteira comercial</p>
                    </div>
                    <button 
                        onClick={openModalForCreate}
                        className="w-10 h-10 bg-brand-neon text-[#0A0A0B] rounded-full flex items-center justify-center shadow-lg shadow-brand-neon/20 active:scale-95 transition-transform shrink-0"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="relative mb-5 z-20">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted z-10" />
                    <input
                        placeholder="Buscar por nome ou email..."
                        className="w-full bg-[#111113] border border-brand-border/40 rounded-2xl pl-11 pr-4 py-3.5 text-[13px] text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-4 relative">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-3" />
                            <span className="text-[10px] text-brand-muted uppercase font-bold tracking-widest">Buscando Clientes...</span>
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="bg-[#111113]/50 border border-brand-border/20 rounded-2xl p-8 flex flex-col items-center text-center mt-2">
                            <Search className="w-10 h-10 text-brand-border mb-3" />
                            <h3 className="text-sm font-bold text-white mb-1">Nenhum cliente</h3>
                            <p className="text-[11px] text-brand-muted">Ajuste os filtros ou crie um novo cadastro.</p>
                        </div>
                    ) : (
                        filteredClients.map((client) => (
                            <div key={client.id} className="bg-[#111113] border border-white/5 rounded-[20px] p-4 flex flex-col shadow-md relative">
                                
                                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                                    <div className="flex items-center gap-3 min-w-0" onClick={() => handleOpenProfile(client)}>
                                        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#0A0A0B] border border-brand-border/40 flex items-center justify-center text-brand-neon font-black text-[13px]">
                                            {getInitials(client.name)}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <h3 className="text-[15px] font-bold text-white truncate">{client.name}</h3>
                                            <div className="flex items-center gap-1.5 text-[10px] text-brand-muted font-medium mt-0.5">
                                                <MapPin className="w-3 h-3 text-brand-neon" /> {client.city || 'Não informada'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center bg-brand-surface/50 border border-brand-border/30 rounded-lg px-2 py-1 shrink-0">
                                        <span className="text-[10px] font-bold text-brand-muted">
                                            <span className="text-white mr-1">{client._count?.deals || 0}</span> Deals
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 mb-4">
                                    {client.email && (
                                        <div className="flex items-center gap-2 text-xs text-brand-muted">
                                            <Mail className="w-3.5 h-3.5 text-brand-border" /> <span className="truncate">{client.email}</span>
                                        </div>
                                    )}
                                    {client.phone && (
                                        <div className="flex items-center gap-2 text-xs text-brand-muted">
                                            <Phone className="w-3.5 h-3.5 text-brand-border" /> {client.phone}
                                        </div>
                                    )}
                                    {client.document && (
                                        <div className="flex items-center gap-2 text-xs text-brand-muted">
                                            <FileText className="w-3.5 h-3.5 text-brand-border" /> Doc: {client.document}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 border-t border-brand-border/20 pt-3">
                                    <button 
                                        onClick={() => handleNewDeal(client)}
                                        className="flex-1 bg-brand-neon/10 text-brand-neon border border-brand-neon/20 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 active:bg-brand-neon/20 transition-colors"
                                    >
                                        <Briefcase className="w-3.5 h-3.5" /> Oportunidade
                                    </button>
                                    <button 
                                        onClick={() => openModalForEdit(client)}
                                        className="p-2.5 bg-brand-surface text-brand-muted rounded-xl border border-brand-border/40 active:bg-brand-surface/80 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteClient(client.id)}
                                        className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 active:bg-red-500/20 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Bloco Espaçador Fantasma para Mobile */}
                <div className="h-[200px] w-full shrink-0 pointer-events-none" aria-hidden="true" />
            </div>

            {/* ========================================================= */}
            {/* MODAL GLOBAL (CRIAÇÃO E EDIÇÃO DE CLIENTES)                 */}
            {/* ========================================================= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0B]/80 backdrop-blur-sm p-4">
                    <div className="bg-[#121214] border border-brand-border/40 rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl animate-fade-in relative flex flex-col max-h-[90vh]">
                        
                        <div className="flex items-center justify-between p-5 border-b border-brand-border/40 bg-brand-surface/30 shrink-0 relative z-10">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                {editingClient ? <Edit2 className="w-5 h-5 text-brand-neon" /> : <Plus className="w-5 h-5 text-brand-neon" />}
                                {editingClient ? 'Editar Cliente' : 'Cadastrar Cliente'}
                            </h2>
                            <button 
                                onClick={closeModal}
                                className="text-brand-muted hover:text-white bg-[#0A0A0B] p-2 rounded-full border border-white/5 transition-colors active:scale-95"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <form id="clientForm" onSubmit={handleSaveClient} className="flex flex-col gap-4 relative z-10">
                                <div>
                                    <label className="block text-[11px] font-bold text-brand-muted mb-1.5 uppercase tracking-widest ml-1">Nome da Empresa / Contato *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
                                        placeholder="Ex: Construtora Apex"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-brand-muted mb-1.5 uppercase tracking-widest ml-1">Telefone</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
                                            placeholder="(11) 99999-9999"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-brand-muted mb-1.5 uppercase tracking-widest ml-1">Doc (CPF/CNPJ)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
                                            placeholder="000.000.000-00"
                                            value={formData.document}
                                            onChange={(e) => setFormData({...formData, document: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-brand-muted mb-1.5 uppercase tracking-widest ml-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
                                        placeholder="contato@empresa.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-brand-muted mb-1.5 uppercase tracking-widest ml-1">Cidade</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
                                        placeholder="Ex: São Paulo"
                                        value={formData.city}
                                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                                    />
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-5 border-t border-brand-border/40 shrink-0 bg-[#121214] z-20">
                            <button
                                type="submit"
                                form="clientForm"
                                disabled={isSubmitting}
                                className="w-full bg-brand-neon text-[#0A0A0B] py-4 rounded-xl text-[13px] font-black uppercase tracking-widest hover:bg-[#FF5E00]/90 transition-all flex items-center justify-center shadow-[0_10px_25px_rgba(255,94,0,0.3)] disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingClient ? 'Salvar Edição' : 'Cadastrar Cliente')}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}