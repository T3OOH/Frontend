import { useState, useEffect } from 'react';
import { InteractiveMap } from '@/features/map/InteractiveMap';
import { MapPin, Loader2 } from 'lucide-react';
import { panelsService } from '@/services/panels.service';

export function DashboardMap() {
    const [panels, setPanels] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPanels = async () => {
            try {
                setIsLoading(true);
                const data = await panelsService.getAllPanels();
                setPanels(data);
            } catch (error) {
                console.error("Erro ao carregar os painéis:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPanels();
    }, []);

    const availableCount = panels.filter((p: any) => p.status === 'AVAILABLE').length;
    const occupiedCount = panels.filter((p: any) => p.status === 'OCCUPIED').length;

    return (
        // Wrapper ocupa 100% do Main
        <div className="flex flex-col h-full max-w-7xl mx-auto w-full">
            
            {/* Header Fixo */}
            <div className="flex-shrink-0 mb-6">
                <h1 className="text-2xl font-bold text-brand-text tracking-tight mb-1">Mapa de Cobertura</h1>
                <p className="text-sm text-brand-muted">Visualize a distribuição geográfica dos seus painéis e o status operacional em tempo real.</p>
            </div>

            {/* Container do Mapa (Ocupa o resto do espaço) */}
            <div className="flex-1 min-h-0 relative rounded-xl overflow-hidden border border-brand-border/40 shadow-2xl bg-brand-surface/10">
                
                {isLoading ? (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-black/80 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-4" />
                        <p className="text-sm text-brand-muted font-medium">Sincronizando circuito...</p>
                    </div>
                ) : (
                    <>
                        <InteractiveMap panels={panels} />

                        {/* Cartão de Resumo Flutuante (Estilo Glassmorphism Refinado) */}
                        <div className="absolute top-6 left-6 z-[1000] bg-brand-black/80 backdrop-blur-md border border-brand-border/40 p-5 rounded-xl flex flex-col gap-4 min-w-[240px] shadow-2xl pointer-events-auto">
                            <h3 className="font-semibold text-brand-text text-sm flex items-center gap-2 border-b border-brand-border/40 pb-3">
                                <MapPin className="w-4 h-4 text-brand-neon" />
                                Resumo da Rede
                            </h3>

                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-brand-muted">Total de Painéis</span>
                                    <span className="font-bold text-brand-text">{panels.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-brand-muted">Disponíveis</span>
                                    <span className="font-bold text-green-500">{availableCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-brand-muted">Ocupados</span>
                                    <span className="font-bold text-red-500">{occupiedCount}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}