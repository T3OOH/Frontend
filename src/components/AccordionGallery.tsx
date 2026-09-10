import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccordionGallery({ panels }: { panels: any[] }) {
    const [hoveredIndex, setHoveredIndex] = useState<number>(0);

    if (!panels || panels.length === 0) return null;

    return (
        <div className="flex w-full h-[400px] gap-2 overflow-hidden rounded-[5px]">
            {panels.map((panel, idx) => {
                const isActive = hoveredIndex === idx;

                return (
                    <motion.div
                        key={panel.id || idx}
                        onHoverStart={() => setHoveredIndex(idx)}
                        onClick={() => setHoveredIndex(idx)} // Suporte para Touch (Mobile)
                        layout
                        className={`relative h-full rounded-[5px] overflow-hidden cursor-pointer transition-all duration-500 ease-out border bg-[#111113] ${
                            isActive ? 'border-[#FF5E00]/50 flex-[4] shadow-[0_0_30px_rgba(255,94,0,0.15)]' : 'border-white/10 flex-1 opacity-70 hover:opacity-100'
                        }`}
                    >
                        {/* Imagem de Fundo */}
                        <img 
                            src={panel.images?.[0] || '/placeholder.jpg'} 
                            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${isActive ? 'scale-105' : 'scale-100'}`} 
                            alt={panel.name} 
                        />
                        
                        {/* Degradê sobre a imagem */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/60 to-transparent transition-opacity duration-500 ${isActive ? 'opacity-90' : 'opacity-80'}`} />

                        {/* Conteúdo Expansível */}
                        <div className="absolute inset-0 p-6 flex flex-col justify-end">
                            
                            {/* Badges do Topo (Aparece só quando ativo) */}
                            <div className={`flex items-center gap-3 mb-3 transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <div className="bg-[#FF5E00]/20 text-[#FF5E00] text-[10px] font-black px-2 py-1 rounded border border-[#FF5E00]/30 uppercase tracking-widest">
                                    Premium
                                </div>
                                <span className="text-xs text-[#8F8F91] flex items-center gap-1 font-bold">
                                    <MapPin className="w-3 h-3 text-[#FF5E00]" /> {panel.city}
                                </span>
                            </div>

                            {/* Título: Muda de eixo dependendo se está ativo ou não */}
                            <h3 className={`font-black text-white transition-all duration-300 transform-gpu ${
                                isActive 
                                ? 'text-2xl mb-4 origin-left' 
                                : 'text-lg origin-bottom-left -rotate-90 absolute bottom-8 left-[40%] whitespace-nowrap'
                            }`}>
                                {panel.name}
                            </h3>

                            {/* Informações Extras e Botão de Ação */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ delay: 0.1 }} 
                                        className="flex justify-between items-end border-t border-white/10 pt-4"
                                    >
                                        <div className="flex gap-6">
                                            <div>
                                                <p className="text-[10px] text-[#8F8F91] uppercase font-bold tracking-wider mb-0.5">Impacto/Dia</p>
                                                <p className="text-base font-black text-white">{panel.impacts || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-[#8F8F91] uppercase font-bold tracking-wider mb-0.5">Formato</p>
                                                <p className="text-base font-black text-white">{panel.size || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <Link to={`/servicos?panelId=${panel.id}`} className="w-12 h-12 bg-[#FF5E00] rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,94,0,0.4)] text-[#0A0A0B]">
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}