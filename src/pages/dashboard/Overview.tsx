import { useState, useEffect } from 'react';
import { StatCard } from '@/components/StatCard';
import { 
    MonitorPlay, 
    CheckCircle2, 
    XCircle, 
    TrendingUp,
    BarChart3
} from 'lucide-react';
// Agora chamamos o Service real em vez da lista mockada!
import { panelsService } from '@/services/panels.service';

export function Overview() {
    const [panels, setPanels] = useState<any[]>([]);
    
    // Busca os dados assim que o Dashboard abre
    useEffect(() => {
        const fetchPanels = async () => {
            try {
                const data = await panelsService.getAllPanels(); // Ajuste o nome da função se necessário
                setPanels(data);
            } catch (error) {
                console.error("Erro ao carregar dados da Visão Geral:", error);
            }
        };
        fetchPanels();
    }, []);

    const totalPanels = panels.length;
    const availablePanels = panels.filter(p => p.status?.toLowerCase() === 'disponível').length;
    const occupiedPanels = panels.filter(p => p.status?.toLowerCase() === 'ocupado').length;

    // Cálculo simplificado de impactos baseado nos dados reais (como exemplo)
    const totalImpacts = panels.reduce((acc, panel) => {
        const impactNumber = parseInt(panel.impacts.replace(/\D/g, '')) || 0;
        return acc + impactNumber;
    }, 0);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-brand-text tracking-tight mb-2">Visão Geral</h1>
                <p className="text-brand-muted">Acompanhe as métricas principais do seu circuito OOH.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total de Painéis"
                    value={totalPanels.toString()}
                    icon={MonitorPlay}
                    trend={{ value: 12, isPositive: true }}
                />
                <StatCard
                    title="Painéis Disponíveis"
                    value={availablePanels.toString()}
                    icon={CheckCircle2}
                    trend={{ value: 5, isPositive: true }}
                />
                <StatCard
                    title="Painéis Ocupados"
                    value={occupiedPanels.toString()}
                    icon={XCircle}
                />
                <StatCard
                    title="Impactos Diários"
                    value={`${totalImpacts || 0} mil`}
                    icon={TrendingUp}
                    trend={{ value: 8, isPositive: true }}
                />
            </div>

            {/* Espaço para futuros gráficos e tabelas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
                <div className="lg:col-span-2 glass-panel rounded-xl p-6 flex flex-col">
                    <h3 className="text-lg font-semibold text-brand-text mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-brand-neon" />
                        Desempenho Comercial
                    </h3>
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-brand-border/50 rounded-lg bg-brand-surface/20">
                        <p className="text-brand-muted text-sm">Gráfico de Vendas e Ocupação (Em Breve)</p>
                    </div>
                </div>

                <div className="glass-panel rounded-xl p-6 flex flex-col">
                    <h3 className="text-lg font-semibold text-brand-text mb-4">Últimas Atualizações</h3>
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-brand-border/50 rounded-lg bg-brand-surface/20">
                        <p className="text-brand-muted text-sm">Feed de Atividades (Em Breve)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}