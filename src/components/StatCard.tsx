import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils'; 

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
    return (
        <div className="glass-panel p-6 rounded-xl border border-brand-border/50 flex flex-col gap-4 relative overflow-hidden group hover:border-brand-neon/50 transition-colors">
            
            {/* Efeito de brilho de fundo no hover */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-neon/5 rounded-full blur-3xl group-hover:bg-brand-neon/10 transition-colors" />

            <div className="flex items-center justify-between relative z-10">
                <span className="text-sm font-medium text-brand-muted">{title}</span>
                <div className="p-2.5 bg-brand-surface border border-brand-border/50 rounded-lg group-hover:border-brand-neon/30 transition-colors">
                    <Icon className="w-5 h-5 text-brand-neon" />
                </div>
            </div>
            
            <div className="relative z-10">
                <h4 className="text-3xl font-bold text-brand-text tracking-tight">{value}</h4>
                {trend && (
                    <p className={cn(
                        "text-xs font-medium mt-2 flex items-center gap-1",
                        trend.isPositive ? "text-green-500" : "text-red-500"
                    )}>
                        {trend.isPositive ? "+" : "-"}{trend.value}% 
                        <span className="text-brand-muted font-normal">desde o mês passado</span>
                    </p>
                )}
            </div>
        </div>
    );
}