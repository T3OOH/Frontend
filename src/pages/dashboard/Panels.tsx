import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2, MapPin, LayoutGrid, Zap, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { panelsService, PanelData } from '@/services/panels.service';
import { CustomSelect } from '@/components/CustomSelect';
import { useToast } from '@/contexts/ToastContext';

export function Panels() {
    const [panelsList, setPanelsList] = useState<PanelData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const toast = useToast();

    useEffect(() => {
        async function fetchPanels() {
            try {
                const data = await panelsService.getAllPanels();
                setPanelsList(data);
            } catch (error) {
                console.error("Erro ao buscar painéis:", error);
                toast.error("Erro ao buscar painéis do servidor.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchPanels();
    }, [toast]);

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este painel permanentemente?')) {
            try {
                await panelsService.deletePanel(id);
                setPanelsList(panelsList.filter(p => p.id !== id));
                toast.success("Painel deletado com sucesso!");
            } catch (error) {
                console.error("Erro ao deletar:", error);
                toast.error("Falha ao deletar o painel.");
            }
        }
    };

    const filteredPanels = panelsList.filter((panel) => {
        const matchBusca = panel.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === '' || panel.status === statusFilter;
        return matchBusca && matchStatus;
    });

    const statusOptions = [
        { value: '', label: 'Todos os Status' },
        { value: 'AVAILABLE', label: 'Disponível' },
        { value: 'OCCUPIED', label: 'Ocupado' },
        { value: 'MAINTENANCE', label: 'Manutenção' }
    ];

    // Helpers para estilizar os status
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return { bg: 'bg-[#25D366]/10', border: 'border-[#25D366]/20', text: 'text-[#25D366]', dot: 'bg-[#25D366]', label: 'Disponível' };
            case 'OCCUPIED':
                return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-500', dot: 'bg-red-500', label: 'Ocupado' };
            case 'MAINTENANCE':
                return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-500', dot: 'bg-yellow-500', label: 'Manutenção' };
            default:
                return { bg: 'bg-brand-muted/10', border: 'border-brand-muted/20', text: 'text-brand-muted', dot: 'bg-brand-muted', label: 'Desconhecido' };
        }
    };

    return (
        <div className="w-full h-full flex flex-col gap-6">

            {/* ========================================================= */}
            {/* DESKTOP LAYOUT (ESTILO XENITH)                              */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col h-full max-w-7xl mx-auto w-full gap-6">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-text tracking-tight mb-1">Meus Painéis</h1>
                        <p className="text-sm text-brand-muted">Gerencie o circuito, altere status e visualize o impacto de cada local.</p>
                    </div>

                    <Link to="/dashboard/paineis/novo">
                        <Button leftIcon={<Plus className="w-4 h-4" />} className="bg-brand-neon hover:bg-brand-neonHover text-white shadow-lg font-bold rounded-xl px-6">
                            Novo Painel
                        </Button>
                    </Link>
                </div>

                {/* FILTROS E BUSCA */}
                <div className="bg-brand-surface p-4 rounded-[24px] flex flex-col sm:flex-row gap-4 items-center justify-between flex-shrink-0 border border-brand-border shadow-sm relative z-20">
                    <div className="w-full sm:w-[450px] relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input
                            placeholder="Buscar por avenida ou setor..."
                            className="w-full bg-brand-background border border-brand-border rounded-xl pl-11 pr-4 py-3 text-sm text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:w-72 relative">
                        <CustomSelect
                            options={statusOptions}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder="Todos os Status"
                        />
                    </div>
                </div>

                {/* TABELA DE PAINÉIS */}
                <div className="flex-1 min-h-0 bg-brand-surface rounded-[24px] overflow-hidden flex flex-col relative border border-brand-border shadow-sm z-10">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-brand-background/50 backdrop-blur-sm">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
                        </div>
                    )}

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="sticky top-0 bg-brand-background/90 backdrop-blur-md z-40">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest border-b border-brand-border">Localização</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest border-b border-brand-border">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest border-b border-brand-border">Impacto Diário</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest border-b border-brand-border">Formato</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-right border-b border-brand-border">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border relative z-0">
                                {!isLoading && filteredPanels.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 text-brand-muted">
                                                <LayoutGrid className="w-8 h-8 mb-2 opacity-50" />
                                                <span className="text-sm font-medium">Nenhum painel encontrado.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPanels.map((panel) => {
                                        const status = getStatusStyle(panel.status);
                                        return (
                                            <tr key={panel.id} className="hover:bg-brand-background/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-sm text-brand-text mb-0.5">{panel.name}</div>
                                                    <div className="text-xs text-brand-muted font-medium">{panel.city || 'Goiânia'} - {panel.state || 'GO'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${status.bg} ${status.text} ${status.border}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-brand-text">
                                                    {panel.impacts}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-brand-text">{panel.size}</div>
                                                    <div className="text-xs text-brand-muted font-medium mt-0.5">{panel.px}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link to={`/dashboard/paineis/editar/${panel.id}`}>
                                                            <button className="p-2 text-brand-muted hover:text-brand-neon hover:bg-brand-neon/10 rounded-lg border border-transparent hover:border-brand-neon/20 transition-all" title="Editar">
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                        </Link>
                                                        <button
                                                            className="p-2 text-brand-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-all"
                                                            title="Excluir"
                                                            onClick={() => handleDelete(panel.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MOBILE LAYOUT (CARDS REDESENHADOS PARA ADAPTAR AO TEMA)   */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full pb-[100px] gap-4">

                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-text tracking-tight">Meus Painéis</h1>
                        <p className="text-[11px] text-brand-muted mt-0.5 font-medium">Gerencie seu circuito</p>
                    </div>
                    <Link to="/dashboard/paineis/novo">
                        <button className="w-12 h-12 bg-brand-neon text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                            <Plus className="w-6 h-6" />
                        </button>
                    </Link>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted z-10" />
                        <input
                            placeholder="Buscar painel..."
                            className="w-full bg-brand-surface border border-brand-border rounded-[16px] pl-11 pr-4 py-3.5 text-sm text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full bg-brand-surface rounded-[16px] shadow-sm border border-brand-border">
                        <CustomSelect
                            options={statusOptions}
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
                    ) : filteredPanels.length === 0 ? (
                        <div className="bg-brand-surface border border-brand-border rounded-[24px] p-8 flex flex-col items-center text-center shadow-sm">
                            <LayoutGrid className="w-10 h-10 text-brand-muted mb-3 opacity-50" />
                            <h3 className="text-sm font-bold text-brand-text mb-1">Nenhum painel</h3>
                            <p className="text-xs text-brand-muted">Não encontramos painéis para esta busca.</p>
                        </div>
                    ) : (
                        filteredPanels.map((panel) => {
                            const status = getStatusStyle(panel.status);
                            return (
                                <div key={panel.id} className="bg-brand-surface border border-brand-border rounded-[24px] overflow-hidden flex flex-col shadow-sm">

                                    {/* Área da Imagem */}
                                    <div className="w-full h-36 bg-brand-background relative shrink-0">
                                        {panel.images?.[0] ? (
                                            <img src={panel.images[0]} alt={panel.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-8 h-8 text-brand-muted/30" />
                                            </div>
                                        )}

                                        <div className="absolute top-3 right-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border backdrop-blur-md ${status.bg} ${status.text} ${status.border}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Informações */}
                                    <div className="p-5 flex flex-col">
                                        <h3 className="font-bold text-brand-text text-[15px] leading-tight line-clamp-2">{panel.name}</h3>
                                        <span className="text-[11px] text-brand-muted font-medium mt-1 flex items-center gap-1.5 mb-4">
                                            <MapPin className="w-3.5 h-3.5 text-brand-muted" /> {panel.city || 'Goiânia'} - {panel.state || 'GO'}
                                        </span>

                                        <div className="grid grid-cols-2 gap-3 mb-5">
                                            <div className="bg-brand-background border border-brand-border rounded-xl p-3 flex flex-col justify-center">
                                                <span className="text-[9px] text-brand-muted uppercase font-bold tracking-widest flex items-center gap-1 mb-1"><Zap className="w-3.5 h-3.5 text-brand-neon" /> Impacto</span>
                                                <span className="text-sm font-bold text-brand-text">{panel.impacts}</span>
                                            </div>
                                            <div className="bg-brand-background border border-brand-border rounded-xl p-3 flex flex-col justify-center">
                                                <span className="text-[9px] text-brand-muted uppercase font-bold tracking-widest flex items-center gap-1 mb-1"><LayoutGrid className="w-3.5 h-3.5 text-brand-neon" /> Formato</span>
                                                <span className="text-sm font-bold text-brand-text truncate">{panel.size}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 pt-4 border-t border-brand-border">
                                            <Link to={`/dashboard/paineis/editar/${panel.id}`} className="flex-1">
                                                <Button variant="secondary" className="w-full h-11 text-xs font-bold bg-brand-background border-brand-border text-brand-text hover:border-brand-neon hover:text-brand-neon transition-colors" leftIcon={<Edit2 className="w-4 h-4" />}>
                                                    Editar
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="secondary"
                                                className="w-12 h-11 px-0 flex items-center justify-center border-red-500/20 text-red-500 bg-red-500/10 active:bg-red-500/20 shrink-0 transition-colors"
                                                onClick={() => handleDelete(panel.id)}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

        </div>
    );
}