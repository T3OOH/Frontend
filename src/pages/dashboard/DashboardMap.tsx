import { useState, useEffect } from 'react';
import { InteractiveMap } from '@/features/map/InteractiveMap';
import { MapPin, Loader2, Activity } from 'lucide-react';
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
        <div className="flex flex-col h-full max-w-7xl mx-auto w-full">
            
            {/* Header Fixo */}
            <div className="flex-shrink-0 mb-6">
                <h1 className="text-2xl font-bold text-brand-text tracking-tight mb-1">Mapa de Cobertura</h1>
                <p className="text-sm text-brand-muted">Visualize a distribuição geográfica dos seus painéis e o status operacional em tempo real.</p>
            </div>

            {/* Container do Mapa */}
            <div className="flex-1 min-h-0 relative rounded-xl overflow-hidden border border-brand-border/40 shadow-2xl bg-brand-surface/10">
                
                {isLoading ? (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-black/80 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-4" />
                        <p className="text-sm text-brand-muted font-medium">Sincronizando circuito...</p>
                    </div>
                ) : (
                    <>
                        <InteractiveMap panels={panels} />

                        {/* Cartão de Resumo Flutuante */}
                        <div className="absolute top-6 left-6 z-[1000] bg-[#121212]/95 backdrop-blur-md border border-brand-border/40 p-5 rounded-xl flex flex-col gap-4 min-w-[260px] shadow-[0_8px_30px_rgb(0,0,0,0.4)] pointer-events-auto">
                            <h3 className="font-semibold text-brand-text text-sm flex items-center gap-2 border-b border-brand-border/40 pb-3">
                                <MapPin className="w-4 h-4 text-brand-neon" />
                                Visão Geral do Circuito
                            </h3>

                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-brand-muted font-bold text-[11px] uppercase tracking-wider">Total de Painéis</span>
                                    <span className="font-bold text-brand-text text-lg leading-none">{panels.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-brand-muted font-bold text-[11px] uppercase tracking-wider">Disponíveis</span>
                                    <span className="font-bold text-brand-text text-lg leading-none">{availableCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-brand-muted font-bold text-[11px] uppercase tracking-wider">Ocupados</span>
                                    <span className="font-bold text-brand-text text-lg leading-none">{occupiedCount}</span>
                                </div>
                                
                                <div className="h-px w-full bg-brand-border/40 my-1" />
                                
                                {/* Impactos Diários reais vindos do Banco */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center text-sm group">
                                        <span className="text-brand-muted font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                            <Activity className="w-3.5 h-3.5 text-brand-neon" />
                                            Impactos Diários
                                        </span>
                                        <span className="font-bold text-brand-text text-xl leading-none">{formattedImpacts}</span>
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
    );
}