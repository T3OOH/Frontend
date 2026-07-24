import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

export interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
}

export function CustomSelect({ 
    options, 
    value, 
    onChange, 
    placeholder = "Selecione...", 
    icon,
    disabled = false 
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Fecha o dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={`relative w-full text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} ref={containerRef}>
            {/* BOTÃO DO SELECT */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between bg-[#0f0f11]/80 border rounded-xl px-4 py-3 transition-all duration-200 outline-none backdrop-blur-md
                    ${disabled 
                        ? 'border-brand-border/30 text-brand-muted/70 pointer-events-none' 
                        : isOpen 
                            ? 'border-brand-neon shadow-[0_0_15px_rgba(255,94,0,0.15)] text-white' 
                            : 'border-brand-border/50 text-brand-muted hover:border-brand-neon/50 hover:text-white'
                    }
                `}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {icon && <span className={`${isOpen && !disabled ? 'text-brand-neon' : 'text-brand-muted'}`}>{icon}</span>}
                    <span className="truncate font-medium">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen && !disabled ? 'rotate-180 text-brand-neon' : 'text-brand-muted'}`} />
            </button>

            {/* LISTA SUSPENSA (DROPDOWN) */}
            <AnimatePresence>
                {isOpen && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-50 w-full mt-2 bg-[#1C1C1E] border border-brand-border/50 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-xl"
                    >
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {options.map((option) => {
                                const isSelected = option.value === value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-left
                                            ${isSelected 
                                                ? 'bg-brand-neon/10 text-brand-neon font-bold' 
                                                : 'text-brand-muted hover:bg-brand-surface hover:text-white'
                                            }
                                        `}
                                    >
                                        <span className="truncate">{option.label}</span>
                                        {isSelected && <Check className="w-4 h-4 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}