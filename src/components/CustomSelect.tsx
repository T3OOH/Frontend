import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    icon?: React.ReactNode;
    maxHeight?: string; // Propriedade nova para controlar o scroll
}

export function CustomSelect({ options, value, onChange, placeholder, icon, maxHeight = "max-h-[220px]" }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative w-full" ref={ref}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-[#0A0A0B] border border-white/10 rounded-md px-4 py-3.5 text-sm text-white focus:border-[#FF5E00] outline-none transition-colors shadow-inner"
            >
                <div className="flex items-center gap-2 truncate">
                    {icon && <span className="text-[#8F8F91] shrink-0">{icon}</span>}
                    <span className="truncate font-medium">{selectedOption ? selectedOption.label : placeholder}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#8F8F91] transition-transform ${isOpen ? 'rotate-180' : ''} shrink-0`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        // Z-index altíssimo para sobrepor tudo ao redor
                        className="absolute left-0 right-0 mt-2 bg-[#111113] border border-white/10 rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[99999] overflow-hidden"
                    >
                        {/* Aplica a altura dinâmica (Ex: max-h-[132px] mostrará exatos 3 itens) */}
                        <ul className={`${maxHeight} overflow-y-auto custom-scrollbar`}>
                            {options.map(opt => (
                                <li
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`px-4 py-3 text-sm cursor-pointer transition-colors flex items-center ${value === opt.value ? 'text-[#0A0A0B] font-black tracking-widest uppercase bg-[#FF5E00]' : 'text-[#8F8F91] font-medium hover:bg-white/5 hover:text-white'}`}
                                >
                                    {opt.label}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}