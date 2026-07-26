import { useState, useEffect } from 'react';
import { MonitorPlay, CheckCircle, XCircle, TrendingUp, BarChart2, Clock, Loader2 } from 'lucide-react';
import { panelsService, PanelData } from '@/services/panels.service';

export function Overview() {
    const [panels, setPanels] = useState<PanelData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Efeito responsavel pela busca inicial dos dados do circuito.
     * Consome o servico de paineis para popular o estado global da visao geral,
     * garantindo que os calculos subsequentes ocorram sobre dados atualizados.
     */
    useEffect(() => {
        async function fetchPanels() {
            try {
                const data = await panelsService.getAllPanels();
                setPanels(data);
            } catch (error) {
                console.error("Erro ao buscar paineis para a visao geral:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPanels();
    }, []);

    /**
     * Metricas derivadas do estado local.
     * A filtragem e feita em tempo de execucao no client-side para evitar
     * requisicoes desnecessarias ao banco de dados para contagens elementares.
     */
    const totalPanels = panels.length;
    const availablePanels = panels.filter(p => p.status === 'AVAILABLE').length;
    const occupiedPanels = panels.filter(p => p.status === 'OCCUPIED').length;

    /**
     * Agregador e sanitizador de impactos globais.
     * Varre todos os paineis da base, identifica formatos em string contendo 
     * notacoes financeiras (mil, mi) e converte em floats reais para soma exata.
     */
    const totalImpacts = panels.reduce((acc, curr) => {
        let val = curr.impacts;
        if (!val) return acc;
        
        if (typeof val === 'string') {
            const numericPart = parseFloat(val.replace(/[^0-9,.]/g, '').replace(',', '.'));
            if (isNaN(numericPart)) return acc;
            
            if (val.toLowerCase().includes('mil')) {
                return acc + (numericPart * 1000);
            }
            if (val.toLowerCase().includes('mi') && !val.toLowerCase().includes('mil')) {
                return acc + (numericPart * 1000000);
            }
            
            return acc + numericPart;
        }
        
        return acc + (Number(val) || 0);
    }, 0);

    /**
     * Formatador visual de impactos agregados.
     * Converte o montante total numerico para representacoes enxutas (ex: 1.8 mi, 700 mil)
     * melhorando a leiturabilidade em telas pequenas.
     */
    const formatImpacts = (num: number) => {
        if (num === 0) return '0';
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1).replace('.', ',')} mi`;
        }
        if (num >= 1000) {
            return `${Math.floor(num / 1000)} mil`;
        }
        return num.toString();
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center h-full w-full">
                <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            
            {/* ========================================================= */}
            {/* DESKTOP LAYOUT                                              */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col h-full max-w-7xl mx-auto w-full">
                
                <div className="flex-shrink-0 mb-6">
                    <h1 className="text-2xl font-bold text-brand-text tracking-tight mb-1">Visão Geral</h1>
                    <p className="text-sm text-brand-muted">Acompanhe as métricas principais do seu circuito OOH.</p>
                </div>

                <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-1">
                    
                    {/* Linha de Metricas Primarias */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
                        
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

                    {/* Modulos Analiticos e Informativos */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[300px]">
                        
                        <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-brand-border/40 flex flex-col">
                            <h2 className="text-sm font-semibold text-brand-text flex items-center gap-2 mb-4">
                                <BarChart2 className="w-4 h-4 text-brand-neon" />
                                Desempenho Comercial
                            </h2>
                            <div className="flex-1 border-2 border-dashed border-brand-border/40 rounded-xl flex items-center justify-center bg-brand-surface/10">
                                <p className="text-sm text-brand-muted">Gráfico de Vendas e Ocupação (Em Breve)</p>
                            </div>
                        </div>

                        <div className="lg:col-span-1 glass-panel p-5 rounded-xl border border-brand-border/40 flex flex-col">
                            <h2 className="text-sm font-semibold text-brand-text flex items-center gap-2 mb-4">
                                <Clock className="w-4 h-4 text-brand-neon" />
                                Últimas Atualizações
                            </h2>
                            <div className="flex-1 border-2 border-dashed border-brand-border/40 rounded-xl flex items-center justify-center bg-brand-surface/10">
                                <p className="text-sm text-brand-muted">Feed de Atividades (Em Breve)</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MOBILE LAYOUT (APP PATTERN NATIVO)                          */}
            {/* ========================================================= */}
            {/* O padding inferior (pb-24) garante a rolagem completa sem obstrucao da bottom navigation */}
            <div className="flex lg:hidden flex-col w-full pb-24">
                
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Visão Geral</h1>
                        <p className="text-[11px] text-brand-muted mt-0.5">Métricas do seu circuito</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    
                    <div className="bg-[#111113] border border-brand-border/20 rounded-2xl p-4 flex flex-col justify-between shadow-md">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Painéis</span>
                            <MonitorPlay className="w-4 h-4 text-brand-neon" />
                        </div>
                        <h3 className="text-2xl font-black text-white leading-none">{totalPanels}</h3>
                        <span className="text-[9px] text-green-500 font-bold mt-2 tracking-wider">+12% vs mês ant.</span>
                    </div>

                    <div className="bg-brand-neon/10 border border-brand-neon/20 rounded-2xl p-4 flex flex-col justify-between shadow-md">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-bold text-brand-neon uppercase tracking-widest">Livres</span>
                            <CheckCircle className="w-4 h-4 text-brand-neon" />
                        </div>
                        <h3 className="text-2xl font-black text-brand-neon leading-none">{availablePanels}</h3>
                        <span className="text-[9px] text-brand-neon/70 font-bold mt-2 tracking-wider">+5% vs mês ant.</span>
                    </div>

                    <div className="bg-[#111113] border border-brand-border/20 rounded-2xl p-4 flex flex-col justify-between shadow-md">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Ocupados</span>
                            <XCircle className="w-4 h-4 text-red-400" />
                        </div>
                        <h3 className="text-2xl font-black text-white leading-none">{occupiedPanels}</h3>
                        <span className="text-[9px] text-brand-muted font-bold mt-2 tracking-wider">Em andamento</span>
                    </div>

                    <div className="bg-[#111113] border border-brand-border/20 rounded-2xl p-4 flex flex-col justify-between shadow-md">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Impacto/Dia</span>
                            <TrendingUp className="w-4 h-4 text-brand-neon" />
                        </div>
                        <h3 className="text-2xl font-black text-white leading-none truncate">{formatImpacts(totalImpacts)}</h3>
                        <span className="text-[9px] text-green-500 font-bold mt-2 tracking-wider">+8% estimado</span>
                    </div>

                </div>

                <div className="flex flex-col gap-4">
                    
                    <div className="bg-[#111113] border border-brand-border/20 rounded-2xl p-4 flex flex-col shadow-md h-48">
                        <h2 className="text-[13px] font-bold text-white flex items-center gap-2 mb-3">
                            <BarChart2 className="w-4 h-4 text-brand-neon" /> Desempenho Comercial
                        </h2>
                        <div className="flex-1 border border-dashed border-brand-border/40 rounded-xl flex items-center justify-center bg-[#0A0A0B]">
                            <p className="text-[11px] text-brand-muted font-medium uppercase tracking-widest">Em Breve</p>
                        </div>
                    </div>

                    <div className="bg-[#111113] border border-brand-border/20 rounded-2xl p-4 flex flex-col shadow-md h-48">
                        <h2 className="text-[13px] font-bold text-white flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-brand-neon" /> Últimas Atualizações
                        </h2>
                        <div className="flex-1 border border-dashed border-brand-border/40 rounded-xl flex items-center justify-center bg-[#0A0A0B]">
                            <p className="text-[11px] text-brand-muted font-medium uppercase tracking-widest">Em Breve</p>
                        </div>
                    </div>

                </div>

            </div>

        </div>
    );
}