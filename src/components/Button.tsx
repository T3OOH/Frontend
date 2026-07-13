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

    // Alterado para rounded-lg (quadrado com cantos suaves, padrão de sistemas sérios)
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-brand-neon text-white hover:bg-brand-neonHover shadow-neon border border-transparent",
        secondary: "bg-brand-surface border border-brand-border text-brand-text hover:bg-brand-surface/80",
        ghost: "bg-transparent text-brand-text hover:bg-brand-surface",
    };

    const sizes = {
        sm: "text-sm px-4 py-2 gap-2",
        md: "text-base px-6 py-3 gap-2",
        lg: "text-lg px-8 py-4 gap-3",
    };

    return (
        <motion.button
            whileHover={disabled || isLoading ? {} : { scale: 1.02 }}
            whileTap={disabled || isLoading ? {} : { scale: 0.98 }}
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            {!isLoading && leftIcon && leftIcon}
            {children}
            {!isLoading && rightIcon && rightIcon}
        </motion.button>
    );
}