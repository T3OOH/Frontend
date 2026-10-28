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
    /**
     * "span" renderiza apenas a aparência do botão, para uso dentro de <Link>
     * (evita um <button> dentro de <a>, que é HTML inválido e cria dois focos de teclado).
     */
    as?: 'button' | 'span';
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
    as = 'button',
    ...props
}: ButtonProps) {

    // Padrão da interface: cantos retos, sem brilho, empurrão de 1px no clique
    const baseStyles = "inline-flex items-center justify-center font-semibold transition-colors duration-200 active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon focus-visible:ring-offset-2 focus-visible:ring-offset-brand-background disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-brand-neon text-ink-950 hover:bg-brand-neonHover border border-transparent",
        secondary: "bg-brand-surface border border-brand-border text-brand-text hover:border-brand-muted",
        ghost: "bg-transparent text-brand-muted hover:text-brand-text hover:bg-brand-surface",
    };

    const sizes = {
        sm: "text-sm px-4 py-2 gap-2 min-h-[40px]",
        md: "text-sm px-6 py-3 gap-2.5 min-h-[44px]",
        lg: "text-base px-8 py-4 gap-3 min-h-[52px]",
    };

    const content = (
        <>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            {!isLoading && leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>}
            {/* Flexbox evita que ícones e textos quebrem a linha */}
            <span className="truncate flex items-center justify-center gap-2">{children}</span>
            {!isLoading && rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
        </>
    );

    if (as === 'span') {
        return (
            <motion.span
                className={cn(baseStyles, variants[variant], sizes[size], 'cursor-pointer', className)}
            >
                {content}
            </motion.span>
        );
    }

    return (
        <motion.button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {content}
        </motion.button>
    );
}