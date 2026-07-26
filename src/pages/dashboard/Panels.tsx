import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2, MapPin, LayoutGrid, Zap } from 'lucide-react';
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

    return (
        <div className="w-full h-full flex flex-col">
            
            {/* ========================================================= */}
            {/* DESKTOP LAYOUT (100% PRESERVADO)                            */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col h-full max-w-7xl mx-auto w-full">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-text tracking-tight mb-1">Meus Painéis</h1>
                        <p className="text-sm text-brand-muted">Gerencie o circuito, altere status e visualize o impacto de cada local.</p>
                    </div>

                    <Link to="/dashboard/paineis/novo">
                        <Button leftIcon={<Plus className="w-4 h-4" />} className="shadow-lg shadow-brand-neon/20">
                            Novo Painel
                        </Button>
                    </Link>
                </div>

                <div className="glass-panel p-3 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between flex-shrink-0 mb-4 border-brand-border/40 relative z-20">
                    <div className="w-full sm:w-[400px] relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input
                            placeholder="Buscar por avenida ou setor..."
                            className="w-full bg-brand-black/50 border border-brand-border/60 rounded-xl pl-9 pr-4 py-3 text-sm text-brand-text focus:outline-none focus:border-brand-neon transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:w-64 relative">
                        <CustomSelect
                            options={statusOptions}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder="Todos os Status"
                        />
                    </div>
                </div>

                <div className="flex-1 min-h-0 glass-panel rounded-xl overflow-hidden flex flex-col relative border-brand-border/40 z-10">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-brand-black/50 backdrop-blur-sm">
                            <Loader2 className="w-6 h-6 text-brand-neon animate-spin" />
                        </div>
                    )}

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead className="sticky top-0 bg-[#0d0d0f] z-40 shadow-sm">
                                <tr className="border-b border-brand-border/40">
                                    <th className="px-5 py-3.5 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Localização</th>
                                    <th className="px-5 py-3.5 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Status</th>
                                    <th className="px-5 py-3.5 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Impacto Diário</th>
                                    <th className="px-5 py-3.5 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Formato</th>
                                    <th className="px-5 py-3.5 text-[10px] font-semibold text-brand-muted uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border/20 relative z-0">
                                {!isLoading && filteredPanels.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-8 text-center text-sm text-brand-muted">
                                            Nenhum painel encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPanels.map((panel) => (
                                        <tr key={panel.id} className="hover:bg-brand-surface/40 transition-colors group">
                                            <td className="px-5 py-3">
                                                <div className="font-semibold text-sm text-brand-text mb-0.5">{panel.name}</div>
                                                <div className="text-[11px] text-brand-muted">{panel.city || 'Goiânia'} - {panel.state || 'GO'}</div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium border ${panel.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                        panel.status === 'OCCUPIED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${panel.status === 'AVAILABLE' ? 'bg-green-500' :
                                                            panel.status === 'OCCUPIED' ? 'bg-red-500' : 'bg-yellow-500'
                                                        }`} />
                                                    {panel.status === 'AVAILABLE' ? 'Disponível' :
                                                        panel.status === 'OCCUPIED' ? 'Ocupado' : 'Manutenção'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-sm font-medium text-brand-text">
                                                {panel.impacts}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="text-sm font-medium text-brand-text">{panel.size}</div>
                                                <div className="text-[11px] text-brand-muted mt-0.5">{panel.px}</div>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2 lg:gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link to={`/dashboard/paineis/editar/${panel.id}`}>
                                                        <button className="p-2 lg:p-1.5 text-brand-muted hover:text-brand-neon hover:bg-brand-neon/10 rounded transition-colors" title="Editar">
                                                            <Edit2 className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                                                        </button>
                                                    </Link>
                                                    <button
                                                        className="p-2 lg:p-1.5 text-brand-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                        title="Excluir"
                                                        onClick={() => handleDelete(panel.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
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
            {/* MOBILE LAYOUT (NATIVO, COM IMAGEM E CORREÇÃO DE PADDING)    */}
            {/* ========================================================= */}
            {/* Adicionado pb-[100px] para impedir que a HUD corte o fim da lista */}
            <div className="flex lg:hidden flex-col w-full pb-[100px]">
                
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Meus Painéis</h1>
                        <p className="text-[11px] text-brand-muted mt-0.5">Gerencie seu circuito</p>
                    </div>
                    <Link to="/dashboard/paineis/novo">
                        <button className="w-10 h-10 bg-brand-neon text-black rounded-full flex items-center justify-center shadow-lg shadow-brand-neon/20 active:scale-95 transition-transform">
                            <Plus className="w-5 h-5" />
                        </button>
                    </Link>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted z-10" />
                        <input
                            placeholder="Buscar painel..."
                            className="w-full bg-[#111113] border border-brand-border/40 rounded-2xl pl-11 pr-4 py-3.5 text-[13px] text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <CustomSelect
                        options={statusOptions}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        placeholder="Filtrar por Status"
                    />
                </div>

                <div className="flex flex-col gap-4 mt-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-3" />
                            <span className="text-xs text-brand-muted uppercase font-bold tracking-widest">Carregando...</span>
                        </div>
                    ) : filteredPanels.length === 0 ? (
                        <div className="bg-[#111113]/50 border border-brand-border/20 rounded-2xl p-8 flex flex-col items-center text-center">
                            <LayoutGrid className="w-10 h-10 text-brand-border mb-3" />
                            <h3 className="text-sm font-bold text-white mb-1">Nenhum painel</h3>
                            <p className="text-xs text-brand-muted">Não encontramos painéis para esta busca.</p>
                        </div>
                    ) : (
                        filteredPanels.map((panel) => (
                            <div key={panel.id} className="bg-[#111113] border border-white/5 rounded-[20px] overflow-hidden flex flex-col shadow-md">
                                
                                {/* Área da Imagem (NOVO) */}
                                <div className="w-full h-32 bg-black relative shrink-0">
                                    <img src={panel.images?.[0] || '/placeholder.jpg'} alt={panel.name} className="w-full h-full object-cover opacity-80" />
                                    
                                    <div className="absolute top-3 right-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border backdrop-blur-md ${
                                            panel.status === 'AVAILABLE' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                            panel.status === 'OCCUPIED' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                            'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                panel.status === 'AVAILABLE' ? 'bg-green-500' :
                                                panel.status === 'OCCUPIED' ? 'bg-red-500' : 'bg-yellow-500'
                                            }`} />
                                            {panel.status === 'AVAILABLE' ? 'Disponível' :
                                             panel.status === 'OCCUPIED' ? 'Ocupado' : 'Manutenção'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col">
                                    <h3 className="font-bold text-white text-[15px] leading-tight line-clamp-2">{panel.name}</h3>
                                    <span className="text-[11px] text-brand-muted mt-1 flex items-center gap-1 mb-3">
                                        <MapPin className="w-3 h-3 text-brand-muted" /> {panel.city || 'Goiânia'} - {panel.state || 'GO'}
                                    </span>

                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="bg-[#0A0A0B] border border-white/5 rounded-xl p-2.5 flex flex-col justify-center">
                                            <span className="text-[9px] text-brand-muted uppercase font-bold tracking-widest flex items-center gap-1 mb-0.5"><Zap className="w-3 h-3 text-brand-neon" /> Impacto</span>
                                            <span className="text-[13px] font-bold text-white">{panel.impacts}</span>
                                        </div>
                                        <div className="bg-[#0A0A0B] border border-white/5 rounded-xl p-2.5 flex flex-col justify-center">
                                            <span className="text-[9px] text-brand-muted uppercase font-bold tracking-widest flex items-center gap-1 mb-0.5"><LayoutGrid className="w-3 h-3 text-brand-neon" /> Formato</span>
                                            <span className="text-[13px] font-bold text-white truncate">{panel.size}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-3 border-t border-brand-border/20">
                                        <Link to={`/dashboard/paineis/editar/${panel.id}`} className="flex-1">
                                            <Button variant="secondary" className="w-full h-10 text-xs font-bold bg-[#0A0A0B] border-white/10 hover:border-brand-neon hover:text-brand-neon" leftIcon={<Edit2 className="w-4 h-4" />}>
                                                Editar
                                            </Button>
                                        </Link>
                                        <Button 
                                            variant="secondary" 
                                            className="w-12 h-10 px-0 flex items-center justify-center border-red-500/20 text-red-500 bg-red-500/5 active:bg-red-500/10 shrink-0" 
                                            onClick={() => handleDelete(panel.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
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