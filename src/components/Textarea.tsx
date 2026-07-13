import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, id, ...props }, ref) => {
        return (
            <div className="w-full flex flex-col gap-1.5 text-left">
                {label && (
                    <label htmlFor={id} className="text-sm font-medium text-brand-muted pl-1">
                        {label}
                    </label>
                )}
                <textarea
                    id={id}
                    ref={ref}
                    className={cn(
                        "w-full bg-brand-surface border border-brand-border rounded-lg px-5 py-3.5 text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-neon focus:border-brand-neon transition-all duration-300 resize-y min-h-[120px] disabled:opacity-50 disabled:cursor-not-allowed",
                        error && "border-red-500/50 focus:ring-red-500/50",
                        className
                    )}
                    {...props}
                />
                {error && <span className="text-sm text-red-500 mt-1 pl-1">{error}</span>}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';