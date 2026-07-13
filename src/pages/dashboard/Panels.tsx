import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
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

    // 👇 Correção: O ID agora é explicitamente uma string (UUID do banco)
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
        // 👇 Correção: Compara os status diretamente com os valores do ENUM
        const matchStatus = statusFilter === '' || panel.status === statusFilter;
        return matchBusca && matchStatus;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-brand-text tracking-tight mb-2">Meus Painéis</h1>
                    <p className="text-brand-muted">Gerencie o circuito, altere status e visualize o impacto de cada local.</p>
                </div>

                <Link to="/dashboard/paineis/novo">
                    <Button leftIcon={<Plus className="w-5 h-5" />}>
                        Novo Painel
                    </Button>
                </Link>
            </div>

            <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="w-full sm:w-96">
                    <Input
                        placeholder="Buscar por avenida ou setor..."
                        leftIcon={<Search className="w-4 h-4" />}
                        className="bg-brand-surface/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* 👇 Correção: Os values do Select agora são os ENUMs do banco */}
                    <select
                        className="w-full sm:w-auto bg-brand-surface border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-neon transition-colors"
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

            <div className="glass-panel rounded-xl overflow-hidden min-h-[300px] relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-brand-surface/50 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-brand-border/50 bg-brand-surface/30">
                                <th className="px-6 py-4 text-sm font-semibold text-brand-muted uppercase tracking-wider">Localização</th>
                                <th className="px-6 py-4 text-sm font-semibold text-brand-muted uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-brand-muted uppercase tracking-wider">Impacto Diário</th>
                                <th className="px-6 py-4 text-sm font-semibold text-brand-muted uppercase tracking-wider">Formato</th>
                                <th className="px-6 py-4 text-sm font-semibold text-brand-muted uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/50">
                            {!isLoading && filteredPanels.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-brand-muted">
                                        Nenhum painel encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredPanels.map((panel) => (
                                    <tr key={panel.id} className="hover:bg-brand-surface/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-brand-text">{panel.name}</div>
                                            <div className="text-xs text-brand-muted mt-1">{panel.city || 'Goiânia'} - {panel.state || 'GO'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* 👇 Correção: O visual é definido pelas chaves em inglês, mas o texto é traduzido! */}
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
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
                                        <td className="px-6 py-4 text-sm text-brand-text">
                                            {panel.impacts}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-brand-text">{panel.size}</div>
                                            <div className="text-xs text-brand-muted mt-1">{panel.px}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link to={`/dashboard/paineis/editar/${panel.id}`}>
                                                    <button className="p-2 text-brand-muted hover:text-brand-neon hover:bg-brand-neon/10 rounded-md transition-colors" title="Editar">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                </Link>
                                                <button
                                                    className="p-2 text-brand-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                                                    title="Excluir"
                                                    onClick={() => handleDelete(panel.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
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