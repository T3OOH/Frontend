import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { panelsService, PanelData } from '@/services/panels.service';

export function Panels() {
    const [panelsList, setPanelsList] = useState<PanelData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        async function fetchPanels() {
            try {
                const data = await panelsService.getAllPanels();
                setPanelsList(data);
            } catch (error) {
                console.error("Erro ao buscar painéis:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPanels();
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este painel permanentemente?')) {
            try {
                await panelsService.deletePanel(id);
                setPanelsList(panelsList.filter(p => p.id !== id));
            } catch (error) {
                console.error("Erro ao deletar:", error);
                alert("Falha ao deletar o painel.");
            }
        }
    };

    const filteredPanels = panelsList.filter((panel) => {
        const matchBusca = panel.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === '' || panel.status === statusFilter;
        return matchBusca && matchStatus;
    });

    return (
        // Wrapper ocupa 100% da altura disponível no Main
        <div className="flex flex-col h-full max-w-7xl mx-auto w-full">
            
            {/* Header (Fixo) */}
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

            {/* Filtros (Fixos) */}
            <div className="glass-panel p-3 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between flex-shrink-0 mb-4 border-brand-border/40">
                <div className="w-full sm:w-[400px] relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                    <input
                        placeholder="Buscar por avenida ou setor..."
                        className="w-full bg-brand-black/50 border border-brand-border/60 rounded-lg pl-9 pr-4 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-neon transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full sm:w-auto">
                    <select
                        className="w-full sm:w-auto bg-brand-black/50 border border-brand-border/60 rounded-lg px-4 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-neon transition-colors"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Todos os Status</option>
                        <option value="AVAILABLE">Disponível</option>
                        <option value="OCCUPIED">Ocupado</option>
                        <option value="MAINTENANCE">Manutenção</option>
                    </select>
                </div>
            </div>

            {/* Tabela (Área com Scroll Interno) */}
            <div className="flex-1 min-h-0 glass-panel rounded-xl overflow-hidden flex flex-col relative border-brand-border/40">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-brand-black/50 backdrop-blur-sm">
                        <Loader2 className="w-6 h-6 text-brand-neon animate-spin" />
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-[#0d0d0f] z-10 shadow-sm">
                            <tr className="border-b border-brand-border/40">
                                <th className="px-5 py-3.5 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Localização</th>
                                <th className="px-5 py-3.5 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Status</th>
                                <th className="px-5 py-3.5 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Impacto Diário</th>
                                <th className="px-5 py-3.5 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Formato</th>
                                <th className="px-5 py-3.5 text-[10px] font-semibold text-brand-muted uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/20">
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
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium border ${
                                                panel.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                panel.status === 'OCCUPIED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    panel.status === 'AVAILABLE' ? 'bg-green-500' :
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
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link to={`/dashboard/paineis/editar/${panel.id}`}>
                                                    <button className="p-1.5 text-brand-muted hover:text-brand-neon hover:bg-brand-neon/10 rounded transition-colors" title="Editar">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </Link>
                                                <button
                                                    className="p-1.5 text-brand-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                    title="Excluir"
                                                    onClick={() => handleDelete(panel.id)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
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
    );
}