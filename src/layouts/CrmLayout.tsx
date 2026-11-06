import { Calendar, FileText, Filter, LayoutDashboard, Ticket, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell, ShellNavItem } from './AppShell';

const NAV: ShellNavItem[] = [
    { group: 'Vendas', to: '/crm', label: 'Início', icon: LayoutDashboard, end: true },
    { group: 'Vendas', to: '/crm/pipeline', label: 'Funil de vendas', short: 'Funil', icon: Filter },
    { group: 'Vendas', to: '/crm/propostas', label: 'Propostas', icon: FileText },
    { group: 'Relacionamento', to: '/crm/clientes', label: 'Clientes', icon: Users },
    { group: 'Relacionamento', to: '/crm/agenda', label: 'Agenda', icon: Calendar },
    { group: 'Ferramentas', to: '/crm/cupons', label: 'Cupons', icon: Ticket },
];

export function CrmLayout() {
    const { user } = useAuth();
    const isManagement = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    return <AppShell area="Comercial" nav={NAV} switchTo={isManagement ? { to: '/dashboard', label: 'Painel de gestão' } : undefined} />;
}
