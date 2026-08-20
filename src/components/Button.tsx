import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    className,
    disabled,
    ...props
}: ButtonProps) {

    // Xenith UI: Bordas mais redondas (rounded-xl) e fonte bold para destaque
    const baseStyles = "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-brand-neon text-white hover:bg-brand-neonHover shadow-sm hover:shadow-[0_0_20px_rgba(255,94,0,0.3)] border border-transparent",
        secondary: "bg-brand-surface border border-brand-border text-brand-text hover:bg-brand-background hover:border-brand-neon/50 hover:text-brand-neon shadow-sm",
        ghost: "bg-transparent text-brand-muted hover:text-brand-text hover:bg-brand-surface",
    };

    const sizes = {
        sm: "text-xs px-4 py-2 gap-2",
        md: "text-sm px-6 py-3 gap-2.5",
        lg: "text-base px-8 py-4 gap-3",
    };

    return (
        <motion.button
            whileHover={disabled || isLoading ? {} : { scale: 1.02 }}
            whileTap={disabled || isLoading ? {} : { scale: 0.98 }}
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            
            {!isLoading && leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>}
            
            {/* Adicionando Flexbox aqui previne que ícones e textos quebrem a linha no futuro */}
            <span className="truncate flex items-center justify-center gap-2">{children}</span>
            
            {!isLoading && rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
        </motion.button>
    );
}