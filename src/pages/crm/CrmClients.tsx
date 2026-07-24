import { useState, useEffect, FormEvent } from 'react';
import { Search, Plus, MoreVertical, Mail, Phone, Calendar, ArrowUpRight, MapPin, X, Loader2, Edit2, Trash2, Briefcase } from 'lucide-react';
import { crmService, CrmClient, CreateClientData } from '@/services/crm.service';
import { useToast } from '@/contexts/ToastContext';

export function CrmClients() {
    const [clients, setClients] = useState<CrmClient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados do Menu Dropdown
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Estados do Modal
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

    // ==========================================
    // EFEITOS GLOBAIS
    // ==========================================
    useEffect(() => {
        fetchClients();

        // Fecha o dropdown se clicar fora dele
        const handleClickOutside = () => setOpenDropdownId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // ==========================================
    // INTEGRAÇÃO COM A API
    // ==========================================
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

    const handleSaveClient = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            addToast('O nome do cliente é obrigatório.', 'error');
            return;
        }

        try {
            setIsSubmitting(true);
            
            if (editingClient) {
                // 👇 CHAMADA REAL DE EDIÇÃO
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

    // ==========================================
    // HANDLERS DE AÇÕES
    // ==========================================
    const openModalForCreate = () => {
        setEditingClient(null);
        setFormData({ name: '', email: '', phone: '', document: '', city: '' });
        setIsModalOpen(true);
    };

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

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
        setFormData({ name: '', email: '', phone: '', document: '', city: '' });
    };

    const handleDeleteClient = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente? Essa ação não pode ser desfeita.')) {
            try {
                // 👇 CHAMADA REAL DE EXCLUSÃO
                await crmService.deleteClient(id);
                addToast('Cliente excluído com sucesso.', 'success');
                setOpenDropdownId(null);
                fetchClients(); // Recarrega após exclusão
            } catch (error) {
                console.error("Erro ao excluir:", error);
                addToast('Erro ao excluir cliente.', 'error');
            }
        }
    };

    const handleOpenProfile = (client: CrmClient) => {
        addToast(`Abrindo ficha completa de ${client.name}...`, 'success');
    };

    const handleNewDeal = (client: CrmClient) => {
        addToast(`Iniciando nova oportunidade para ${client.name}...`, 'success');
        setOpenDropdownId(null);
    };

    // ==========================================
    // UTILS E FILTROS
    // ==========================================
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
        <div className="flex flex-col h-full max-w-7xl mx-auto w-full animate-fade-in relative">
            
            {/* CABEÇALHO */}
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

            {/* BARRA DE FILTROS */}
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

            {/* TABELA DE CLIENTES */}
            <div className="flex-1 min-h-0 glass-panel rounded-xl overflow-hidden flex flex-col relative border-brand-border/40 pb-16">
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
                                        
                                        {/* INFO DO CLIENTE */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-[#111113] border border-brand-border/80 flex items-center justify-center text-xs font-black text-brand-neon shadow-inner">
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

                                        {/* CONTATO */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 text-xs text-brand-muted font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-3.5 h-3.5 text-brand-text/40" />
                                                    <span className="truncate max-w-[150px]">{client.email || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-3.5 h-3.5 text-brand-text/40" />
                                                    {client.phone || '-'}
                                                </div>
                                            </div>
                                        </td>

                                        {/* LOCALIZAÇÃO */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs text-brand-muted font-medium">
                                                <MapPin className="w-3.5 h-3.5 text-brand-text/40" />
                                                {client.city ? client.city : 'Não informada'}
                                            </div>
                                        </td>

                                        {/* NEGÓCIOS */}
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-[#111113] border border-brand-border/80 text-white text-xs font-black px-3 py-1.5 rounded-full inline-block min-w-[32px]">
                                                {client._count?.deals || 0}
                                            </span>
                                        </td>

                                        {/* DATA CADASTRO */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-brand-text font-medium">
                                                <Calendar className="w-4 h-4 text-brand-muted/70" />
                                                {formatDate(client.createdAt)}
                                            </div>
                                        </td>

                                        {/* AÇÕES COM DROPDOWN */}
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

                                                    {/* DROPDOWN MENU */}
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

            {/* MODAL DE CRIAR / EDITAR CLIENTE */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#0d0d0f] border border-brand-border/50 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-fade-in">
                        
                        <div className="flex items-center justify-between p-5 border-b border-brand-border/40 bg-brand-surface/30">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                {editingClient ? <Edit2 className="w-5 h-5 text-brand-neon" /> : <Plus className="w-5 h-5 text-brand-neon" />}
                                {editingClient ? 'Editar Cliente' : 'Cadastrar Cliente'}
                            </h2>
                            <button 
                                onClick={closeModal}
                                className="text-brand-muted hover:text-white bg-[#0A0A0B] hover:bg-brand-surface p-1.5 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveClient} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-brand-muted mb-1.5 uppercase tracking-widest">Nome da Empresa / Contato *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-[#111113] border border-brand-border/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
                                    placeholder="Ex: Construtora Apex"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-brand-muted mb-1.5 uppercase tracking-widest">Telefone</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#111113] border border-brand-border/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
                                        placeholder="(11) 99999-9999"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-brand-muted mb-1.5 uppercase tracking-widest">Doc (CPF/CNPJ)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#111113] border border-brand-border/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
                                        placeholder="000.000.000-00"
                                        value={formData.document}
                                        onChange={(e) => setFormData({...formData, document: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-brand-muted mb-1.5 uppercase tracking-widest">Email</label>
                                <input
                                    type="email"
                                    className="w-full bg-[#111113] border border-brand-border/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
                                    placeholder="contato@empresa.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-brand-muted mb-1.5 uppercase tracking-widest">Cidade</label>
                                <input
                                    type="text"
                                    className="w-full bg-[#111113] border border-brand-border/60 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
                                    placeholder="Ex: São Paulo"
                                    value={formData.city}
                                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                                />
                            </div>

                            <div className="flex gap-3 mt-6 pt-5 border-t border-brand-border/40">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-3 rounded-xl border border-brand-border/60 text-sm font-bold text-brand-text hover:text-white hover:bg-brand-surface transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-brand-neon text-[#0A0A0B] py-3 rounded-xl text-sm font-bold hover:bg-brand-neon/90 transition-colors flex items-center justify-center shadow-[0_0_15px_rgba(255,94,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingClient ? 'Salvar Edição' : 'Cadastrar')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}