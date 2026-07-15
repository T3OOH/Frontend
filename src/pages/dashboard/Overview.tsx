import { useState, useEffect } from 'react';
import { MonitorPlay, CheckCircle, XCircle, TrendingUp, BarChart2, Clock, Loader2 } from 'lucide-react';
import { panelsService, PanelData } from '@/services/panels.service';

export function Overview() {
    const [panels, setPanels] = useState<PanelData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchPanels() {
            try {
                const data = await panelsService.getAllPanels();
                setPanels(data);
            } catch (error) {
                console.error("Erro ao buscar painéis para a visão geral:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPanels();
    }, []);

    // 🧮 Cálculos Automáticos baseados no Banco de Dados
    const totalPanels = panels.length;
    const availablePanels = panels.filter(p => p.status === 'AVAILABLE').length;
    const occupiedPanels = panels.filter(p => p.status === 'OCCUPIED').length;

    // Função para extrair números da string de impacto (Ex: "400.000/dia" vira 400000) e somar tudo
    const totalImpacts = panels.reduce((acc, curr) => {
        const numbersOnly = curr.impacts.replace(/\D/g, '');
        const value = parseInt(numbersOnly, 10);
        return acc + (isNaN(value) ? 0 : value);
    }, 0);

    // Formata o número grande para algo legível (Ex: 900000 vira "900 mil")
    const formatImpacts = (num: number) => {
        if (num === 0) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.', ',') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(0) + ' mil';
        return num.toString();
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-w-7xl mx-auto w-full">
            
            {/* Cabeçalho */}
            <div className="flex-shrink-0 mb-6">
                <h1 className="text-2xl font-bold text-brand-text tracking-tight mb-1">Visão Geral</h1>
                <p className="text-sm text-brand-muted">Acompanhe as métricas principais do seu circuito OOH.</p>
            </div>

            {/* Grid Principal (Flex-1 para empurrar o layout e min-h-0 para scroll interno se necessário em telas pequenas) */}
            <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1">
                
                {/* 📊 LINHA 1: Cards de Métricas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
                    
                    {/* Card 1: Total */}
                    <div className="glass-panel p-5 rounded-xl border border-brand-border/40 hover:border-brand-border/80 transition-colors flex flex-col justify-between h-36">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Total de Painéis</span>
                            <div className="p-1.5 border border-brand-border/40 rounded-lg bg-brand-surface/30">
                                <MonitorPlay className="w-4 h-4 text-brand-neon" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-bold text-brand-text mb-1">{totalPanels}</h3>
                            <div className="text-[10px] text-brand-muted flex items-center gap-1">
                                <span className="text-green-500 font-medium">+12%</span> desde o mês passado
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Disponíveis (Com destaque sutil no border) */}
                    <div className="glass-panel p-5 rounded-xl border border-brand-neon/30 bg-brand-neon/5 hover:border-brand-neon/60 transition-colors flex flex-col justify-between h-36">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Painéis Disponíveis</span>
                            <div className="p-1.5 border border-brand-neon/20 rounded-lg bg-brand-neon/10">
                                <CheckCircle className="w-4 h-4 text-brand-neon" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-bold text-brand-text mb-1">{availablePanels}</h3>
                            <div className="text-[10px] text-brand-muted flex items-center gap-1">
                                <span className="text-green-500 font-medium">+5%</span> desde o mês passado
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Ocupados */}
                    <div className="glass-panel p-5 rounded-xl border border-brand-border/40 hover:border-brand-border/80 transition-colors flex flex-col justify-between h-36">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Painéis Ocupados</span>
                            <div className="p-1.5 border border-brand-border/40 rounded-lg bg-brand-surface/30">
                                <XCircle className="w-4 h-4 text-red-400" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-bold text-brand-text mb-1">{occupiedPanels}</h3>
                            <div className="text-[10px] text-brand-muted flex items-center gap-1">
                                Em andamento
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Impactos */}
                    <div className="glass-panel p-5 rounded-xl border border-brand-border/40 hover:border-brand-border/80 transition-colors flex flex-col justify-between h-36">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Impactos Diários</span>
                            <div className="p-1.5 border border-brand-border/40 rounded-lg bg-brand-surface/30">
                                <TrendingUp className="w-4 h-4 text-brand-neon" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-bold text-brand-text mb-1">{formatImpacts(totalImpacts)}</h3>
                            <div className="text-[10px] text-brand-muted flex items-center gap-1">
                                <span className="text-green-500 font-medium">+8%</span> de alcance estimado
                            </div>
                        </div>
                    </div>

                </div>

                {/* 📈 LINHA 2: Gráficos e Feeds (Widgets) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[300px]">
                    
                    {/* Widget 1: Desempenho Comercial (Ocupa 2 colunas) */}
                    <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-brand-border/40 flex flex-col">
                        <h2 className="text-sm font-semibold text-brand-text flex items-center gap-2 mb-4">
                            <BarChart2 className="w-4 h-4 text-brand-neon" />
                            Desempenho Comercial
                        </h2>
                        
                        {/* Placeholder do Gráfico */}
                        <div className="flex-1 border-2 border-dashed border-brand-border/40 rounded-xl flex items-center justify-center bg-brand-surface/10">
                            <p className="text-sm text-brand-muted">Gráfico de Vendas e Ocupação (Em Breve)</p>
                        </div>
                    </div>

                    {/* Widget 2: Últimas Atualizações (Ocupa 1 coluna) */}
                    <div className="lg:col-span-1 glass-panel p-5 rounded-xl border border-brand-border/40 flex flex-col">
                        <h2 className="text-sm font-semibold text-brand-text flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-brand-neon" />
                            Últimas Atualizações
                        </h2>
                        
                        {/* Placeholder do Feed */}
                        <div className="flex-1 border-2 border-dashed border-brand-border/40 rounded-xl flex items-center justify-center bg-brand-surface/10">
                            <p className="text-sm text-brand-muted">Feed de Atividades (Em Breve)</p>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}