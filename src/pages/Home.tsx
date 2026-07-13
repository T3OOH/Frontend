import { ArrowRight, MapPin, BarChart3, Shield, MonitorPlay } from 'lucide-react';
import { Button } from '@/components/Button';

export function Home() {
    return (
        <div className="w-full">
            <section className="relative min-h-[90vh] flex items-center pt-20 pb-16 px-6">

                {/* Container dividido em 2 colunas no Desktop */}
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Coluna da Esquerda - Textos Alinhados */}
                    <div className="flex flex-col items-start text-left">
                        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-brand-border bg-brand-surface/50 text-sm font-medium text-brand-muted">
                            <span className="w-2 h-2 rounded-md bg-brand-neon animate-pulse" />
                            Gestão Profissional de Mídia OOH
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-brand-text mb-6 leading-[1.1]">
                            Presença máxima.<br />
                            <span className="text-brand-neon">Controle absoluto.</span>
                        </h1>

                        <p className="text-lg text-brand-muted max-w-xl mb-10 font-normal leading-relaxed">
                            Plataforma corporativa para gestão e locação de painéis de LED.
                            Posicione sua marca nos pontos de maior conversão do país com métricas e auditoria em tempo real.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-5 h-5" />}>
                                Solicitar Orçamento
                            </Button>
                            <Button size="lg" variant="secondary" className="w-full sm:w-auto" leftIcon={<MapPin className="w-5 h-5" />}>
                                Explorar Mapa
                            </Button>
                        </div>
                    </div>

                    {/* Coluna da Direita - Layout de Plataforma/Dados */}
                    <div className="hidden lg:flex flex-col gap-6">

                        <div className="grid grid-cols-2 gap-6">
                            <div className="glass-panel p-6 rounded-lg flex flex-col gap-4 border-l-2 border-l-brand-neon">
                                <MonitorPlay className="w-8 h-8 text-brand-neon" />
                                <div>
                                    <h3 className="text-3xl font-bold text-brand-text">+200</h3>
                                    <p className="text-sm text-brand-muted">Painéis Ativos</p>
                                </div>
                            </div>

                            <div className="glass-panel p-6 rounded-lg flex flex-col gap-4 translate-y-8 border-l-2 border-l-brand-neon">
                                <BarChart3 className="w-8 h-8 text-brand-neon" />
                                <div>
                                    <h3 className="text-3xl font-bold text-brand-text">1.5M</h3>
                                    <p className="text-sm text-brand-muted">Impactos Diários</p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-lg mt-4 flex items-center gap-5 border-l-2 border-l-brand-neon">
                            <div className="p-3 bg-brand-surface rounded-md border border-brand-border">
                                <Shield className="w-6 h-6 text-brand-neon" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-brand-text">Auditoria de Veiculação</h3>
                                <p className="text-sm text-brand-muted mt-1">Garantia de entrega e relatórios precisos de exibição.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
}