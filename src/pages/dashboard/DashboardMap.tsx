import { useState, useEffect } from 'react';
// 👇 Apenas o componente é importado (sem o antigo goianiaPanels)
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
                console.error("Erro ao carregar os painéis do banco:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPanels();
    }, []);

    const availableCount = panels.filter((p: any) => p.status === 'AVAILABLE').length;
    const occupiedCount = panels.filter((p: any) => p.status === 'OCCUPIED').length;

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] gap-6">
            <div>
                <h1 className="text-3xl font-bold text-brand-text tracking-tight mb-2">Mapa de Cobertura</h1>
                <p className="text-brand-muted">Visualize a distribuição geográfica dos seus painéis e o status operacional em tempo real.</p>
            </div>

            <div className="flex-1 relative rounded-xl overflow-hidden border border-brand-border shadow-ios bg-brand-surface/30">
                {isLoading ? (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-black/50 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-4" />
                        <p className="text-brand-muted font-medium">Sincronizando circuito de painéis...</p>
                    </div>
                ) : (
                    <>
                        {/* 👇 A propriedade "panels" sendo passada obrigatoriamente aqui */}
                        <InteractiveMap panels={panels} />

                        <div className="absolute top-6 left-6 z-[1000] glass-panel p-5 rounded-xl flex flex-col gap-4 min-w-[260px] shadow-2xl pointer-events-auto">
                            <h3 className="font-semibold text-brand-text text-sm flex items-center gap-2 border-b border-brand-border/50 pb-3">
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