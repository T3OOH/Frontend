import { useState, useEffect } from 'react';
import { MonitorPlay, CheckCircle, XCircle, TrendingUp, BarChart2, Clock, Loader2, Trophy } from 'lucide-react';
import { panelsService, PanelData } from '@/services/panels.service';
import { crmService } from '@/services/crm.service';

export function Overview() {
    const [panels, setPanels] = useState<PanelData[]>([]);
    const [deals, setDeals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Efeito responsavel pela busca inicial dos dados do circuito e CRM.
     * Consome os servicos para popular o estado global da visao geral,
     * garantindo que os calculos subsequentes ocorram sobre dados atualizados.
     */
    useEffect(() => {
        async function fetchData() {
            try {
                const [panelsData, dealsData] = await Promise.all([
                    panelsService.getAllPanels().catch(() => []),
                    crmService.getGlobalDeals().catch(() => [])
                ]);
                setPanels(panelsData);
                setDeals(dealsData);
            } catch (error) {
                console.error("Erro ao buscar dados para a visao geral:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    /**
     * Metricas derivadas do estado local.
     */
    const totalPanels = panels.length;
    const availablePanels = panels.filter(p => p.status === 'AVAILABLE').length;
    const occupiedPanels = panels.filter(p => p.status === 'OCCUPIED').length;

    /**
     * Agregador e sanitizador de impactos globais.
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

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // =========================================================
    // LÓGICA DE DESEMPENHO COMERCIAL (Ranking de Vendas)
    // =========================================================
    const wonDeals = deals.filter(d => d.status === 'WON');
    const totalWonValue = wonDeals.reduce((sum, d) => sum + Number(d.expectedValue || 0), 0);

    const sellerStatsMap: Record<string, number> = wonDeals.reduce((acc: Record<string, number>, deal: any) => {
        const sellerName = String(deal.seller?.name || 'Vendas Diretas / Sistema');
        const value = Number(deal.expectedValue || 0);
        if (!acc[sellerName]) {
            acc[sellerName] = 0;
        }
        acc[sellerName] += value;
        return acc;
    }, {});

    // Ordena do maior para o menor garantindo a tipagem de Numbers
    const sellerStats = Object.entries(sellerStatsMap)
        .map(([name, totalValue]) => {
            const total = Number(totalValue); // Forçando o TypeScript a tratar como número
            return {
                name,
                total,
                percentage: totalWonValue > 0 ? (total / totalWonValue) * 100 : 0
            };
        })
        .sort((a, b) => b.total - a.total);

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
            {/* DESKTOP LAYOUT                                            */}
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
                        
                        <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-brand-border/40 flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between mb-5 shrink-0">
                                <h2 className="text-sm font-semibold text-brand-text flex items-center gap-2">
                                    <BarChart2 className="w-4 h-4 text-brand-neon" />
                                    Desempenho Comercial (Ranking de Vendas)
                                </h2>
                                <span className="text-xs font-bold text-[#25D366] bg-[#25D366]/10 px-3 py-1 rounded-full border border-[#25D366]/20">
                                    Faturamento Total: {formatCurrency(totalWonValue)}
                                </span>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-3">
                                {sellerStats.length === 0 ? (
                                    <div className="h-full flex items-center justify-center border-2 border-dashed border-brand-border/40 rounded-xl bg-brand-surface/10">
                                        <p className="text-sm text-brand-muted">Nenhuma venda concluída ainda.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-5 pb-2">
                                        {sellerStats.map((seller, index) => (
                                            <div key={index} className="flex flex-col gap-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[13px] font-bold text-white flex items-center gap-2">
                                                        {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                                                        {index > 0 && <span className="text-brand-muted/50 w-4 text-center">{index + 1}º</span>}
                                                        {seller.name}
                                                    </span>
                                                    <span className="text-sm font-black text-[#25D366]">{formatCurrency(seller.total)}</span>
                                                </div>
                                                <div className="w-full bg-brand-surface/50 rounded-full h-3 overflow-hidden border border-white/5">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${index === 0 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-brand-neon shadow-[0_0_10px_rgba(255,94,0,0.3)]'}`}
                                                        style={{ width: `${seller.percentage}%` }}
                                                    />
                                                </div>
                                                <div className="text-right text-[10px] text-brand-muted font-bold uppercase tracking-widest">
                                                    {seller.percentage.toFixed(1)}% do total geral
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-1 glass-panel p-5 rounded-xl border border-brand-border/40 flex flex-col">
                            <h2 className="text-sm font-semibold text-brand-text flex items-center gap-2 mb-4 shrink-0">
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
            {/* MOBILE LAYOUT (APP PATTERN NATIVO)                        */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full pb-24 h-full overflow-y-auto custom-scrollbar">
                
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
                    
                    {/* MOBILE: Ranking de Vendas */}
                    <div className="bg-[#111113] border border-brand-border/20 rounded-2xl p-4 flex flex-col shadow-md max-h-96">
                        <div className="flex flex-col gap-2 mb-4 shrink-0 border-b border-white/5 pb-3">
                            <h2 className="text-[13px] font-bold text-white flex items-center gap-2">
                                <BarChart2 className="w-4 h-4 text-brand-neon" /> Ranking de Vendas
                            </h2>
                            <span className="text-[10px] font-black text-[#25D366] tracking-widest">
                                TOTAL: {formatCurrency(totalWonValue)}
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                            {sellerStats.length === 0 ? (
                                <div className="py-6 flex items-center justify-center text-center">
                                    <p className="text-[11px] text-brand-muted">Nenhuma venda concluída.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {sellerStats.map((seller, index) => (
                                        <div key={index} className="flex flex-col gap-1.5">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                                                    {index === 0 && <Trophy className="w-3 h-3 text-yellow-500" />}
                                                    {seller.name}
                                                </span>
                                                <span className="text-[12px] font-black text-[#25D366]">{formatCurrency(seller.total)}</span>
                                            </div>
                                            <div className="w-full bg-brand-surface/50 rounded-full h-2 overflow-hidden border border-white/5">
                                                <div
                                                    className={`h-full rounded-full ${index === 0 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-brand-neon shadow-[0_0_10px_rgba(255,94,0,0.3)]'}`}
                                                    style={{ width: `${seller.percentage}%` }}
                                                />
                                            </div>
                                            <div className="text-right text-[8px] text-brand-muted font-bold uppercase tracking-widest">
                                                {seller.percentage.toFixed(1)}% do total
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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