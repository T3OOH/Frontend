import { useState, useEffect } from 'react';
import { InteractiveMap } from '@/features/map/InteractiveMap';
import { MapPin, Loader2, Activity, BarChart2 } from 'lucide-react';
import { panelsService } from '@/services/panels.service';

export function DashboardMap() {
    const [panels, setPanels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPanels = async () => {
            try {
                setIsLoading(true);
                const data = await panelsService.getMapMarkers();
                setPanels(data);
            } catch (error) {
                console.error("Erro ao carregar os painéis:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPanels();
    }, []);

    // 1. Contagens exatas direto dos dados (sem valores estáticos)
    const availableCount = panels.filter((p: any) => p.status === 'AVAILABLE').length;
    const occupiedCount = panels.filter((p: any) => p.status === 'OCCUPIED').length;
    
    // 2. Soma real da coluna 'impacts' do banco
    const totalImpacts = panels.reduce((acc, p: any) => {
        let val = p.impacts;
        if (!val) return acc;
        
        // Se o banco retornar como string (ex: "700mil/dia" ou "700.000")
        if (typeof val === 'string') {
            // Extrai apenas os números e casas decimais
            const numericPart = parseFloat(val.replace(/[^0-9,.]/g, '').replace(',', '.'));
            if (isNaN(numericPart)) return acc;
            
            // Checa se a string contém 'mil' ou 'mi' para multiplicar pelo valor correto
            if (val.toLowerCase().includes('mil')) {
                return acc + (numericPart * 1000);
            }
            if (val.toLowerCase().includes('mi') && !val.toLowerCase().includes('mil')) {
                return acc + (numericPart * 1000000);
            }
            
            return acc + numericPart;
        }
        
        // Se já for um número no banco
        return acc + (Number(val) || 0);
    }, 0);
    
    // 3. Formata o resultado final (ex: 1800000 -> "1,8 mi", 700000 -> "700 mil")
    let formattedImpacts = totalImpacts.toString();
    if (totalImpacts >= 1000000) {
        formattedImpacts = `${(totalImpacts / 1000000).toFixed(totalImpacts % 1000000 === 0 ? 0 : 1).replace('.', ',')} mi`;
    } else if (totalImpacts >= 1000) {
        formattedImpacts = `${Math.floor(totalImpacts / 1000)} mil`;
    }

    return (
        <div className="w-full h-full flex flex-col relative gap-6">
            
            {/* ========================================================= */}
            {/* DESKTOP LAYOUT (ESTILO XENITH UI)                           */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col h-full max-w-7xl mx-auto w-full gap-6">
                
                {/* Header Fixo */}
                <div className="flex-shrink-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-brand-text tracking-tight mb-1 flex items-center gap-2">
                        Mapa de Cobertura
                    </h1>
                    <p className="text-sm text-brand-muted font-medium">Visualize a distribuição geográfica dos seus painéis e o status operacional em tempo real.</p>
                </div>

                {/* Container do Mapa */}
                <div className="flex-1 min-h-0 relative rounded-[24px] overflow-hidden border border-brand-border shadow-sm bg-brand-background z-10">
                    
                    {isLoading ? (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-background/80 backdrop-blur-sm">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-4" />
                            <p className="text-xs text-brand-muted font-bold uppercase tracking-widest">Sincronizando circuito...</p>
                        </div>
                    ) : (
                        <>
                            <InteractiveMap panels={panels} />

                            {/* Cartão de Resumo Flutuante */}
                            <div className="absolute top-6 left-6 z-[1000] bg-brand-surface/95 backdrop-blur-md border border-brand-border p-6 rounded-[24px] flex flex-col gap-4 min-w-[280px] shadow-lg pointer-events-auto transition-colors">
                                <h3 className="font-bold text-brand-text text-sm flex items-center gap-2 border-b border-brand-border pb-3">
                                    <MapPin className="w-4 h-4 text-brand-neon" />
                                    Visão Geral do Circuito
                                </h3>

                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-brand-muted font-bold text-[11px] uppercase tracking-wider">Total de Painéis</span>
                                        <span className="font-black text-brand-text text-lg leading-none">{panels.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-brand-muted font-bold text-[11px] uppercase tracking-wider">Disponíveis</span>
                                        <span className="font-black text-brand-text text-lg leading-none">{availableCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-brand-muted font-bold text-[11px] uppercase tracking-wider">Ocupados</span>
                                        <span className="font-black text-brand-text text-lg leading-none">{occupiedCount}</span>
                                    </div>
                                    
                                    <div className="h-px w-full bg-brand-border my-1" />
                                    
                                    {/* Impactos Diários reais vindos do Banco */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center text-sm group">
                                            <span className="text-brand-muted font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                                <Activity className="w-3.5 h-3.5 text-brand-neon" />
                                                Impactos Diários
                                            </span>
                                            <span className="font-black text-brand-text text-xl leading-none">{formattedImpacts}</span>
                                        </div>
                                        {totalImpacts > 0 && (
                                            <span className="text-[#10b981] font-medium text-[11px] text-right">
                                                +8% de alcance estimado
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ========================================================= */}
            {/* MOBILE LAYOUT (NATIVO E FLUIDO)                             */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col flex-1 w-full min-h-[500px]">
                
                {/* Header Compacto Mobile */}
                <div className="px-4 py-3 shrink-0 bg-brand-surface border-b border-brand-border shadow-sm z-10 flex items-center justify-between transition-colors">
                    <div>
                        <h1 className="text-lg font-bold text-brand-text tracking-tight flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-brand-neon" /> Mapa de Cobertura
                        </h1>
                        <p className="text-[11px] text-brand-muted font-medium mt-0.5">Distribuição geográfica em tempo real</p>
                    </div>
                </div>

                {/* Container do Mapa Mobile */}
                <div className="flex-1 relative bg-brand-background transition-colors">
                    {isLoading ? (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-background/80 backdrop-blur-sm">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-4" />
                            <p className="text-xs text-brand-muted font-bold uppercase tracking-widest">Sincronizando...</p>
                        </div>
                    ) : (
                        <>
                            <InteractiveMap panels={panels} />

                            {/* Cartão de Resumo Flutuante (Bottom Sheet Style) */}
                            <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
                                <div className="bg-brand-surface/95 backdrop-blur-xl border border-brand-border p-4 rounded-[24px] shadow-lg pointer-events-auto transition-colors">
                                    
                                    <div className="flex items-center justify-between mb-3 border-b border-brand-border pb-3">
                                        <span className="text-[11px] font-bold text-brand-muted uppercase tracking-widest flex items-center gap-1.5">
                                            <BarChart2 className="w-3.5 h-3.5" /> Resumo
                                        </span>
                                        <div className="bg-[#25D366]/10 px-2 py-1 rounded-md text-[10px] font-bold text-[#25D366]">
                                            {panels.length} Totais
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div className="bg-brand-background p-3 rounded-[16px] border border-brand-border flex flex-col shadow-sm">
                                            <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wider mb-0.5">Disponíveis</span>
                                            <span className="text-lg font-black text-brand-text leading-none">{availableCount}</span>
                                        </div>
                                        <div className="bg-brand-background p-3 rounded-[16px] border border-brand-border flex flex-col shadow-sm">
                                            <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wider mb-0.5">Ocupados</span>
                                            <span className="text-lg font-black text-brand-text leading-none">{occupiedCount}</span>
                                        </div>
                                    </div>

                                    <div className="bg-brand-neon/10 border border-brand-neon/20 p-3 rounded-[16px] flex justify-between items-center shadow-sm">
                                        <span className="text-[10px] text-brand-neon font-black uppercase tracking-widest flex items-center gap-1.5">
                                            <Activity className="w-3.5 h-3.5" /> Impactos/Dia
                                        </span>
                                        <span className="text-xl font-black text-brand-neon leading-none">{formattedImpacts}</span>
                                    </div>

                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

        </div>
    );
}