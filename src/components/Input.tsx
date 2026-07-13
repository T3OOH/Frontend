import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, leftIcon, rightIcon, id, ...props }, ref) => {
        return (
            <div className="w-full flex flex-col gap-1.5 text-left">
                {label && (
                    <label htmlFor={id} className="text-sm font-medium text-brand-muted pl-1">
                        {label}
                    </label>
                )}
                <div className="relative flex items-center">
                    {leftIcon && (
                        <div className="absolute left-4 text-brand-muted pointer-events-none">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        id={id}
                        ref={ref}
                        className={cn(
                            "w-full bg-brand-surface border border-brand-border rounded-lg px-5 py-3.5 text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-neon focus:border-brand-neon transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
                            leftIcon && "pl-12",
                            rightIcon && "pr-12",
                            error && "border-red-500/50 focus:ring-red-500/50",
                            className
                        )}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-4 text-brand-muted pointer-events-none">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && <span className="text-sm text-red-500 mt-1 pl-1">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';