import { Calendar, FileText, Filter, LayoutDashboard, Ticket, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell, ShellNavItem } from './AppShell';

const NAV: ShellNavItem[] = [
    { to: '/crm', label: 'Início', icon: LayoutDashboard, end: true },
    { to: '/crm/pipeline', label: 'Funil de vendas', short: 'Funil', icon: Filter },
    { to: '/crm/clientes', label: 'Clientes', icon: Users },
    { to: '/crm/propostas', label: 'Propostas', icon: FileText },
    { to: '/crm/agenda', label: 'Agenda', icon: Calendar },
    { to: '/crm/cupons', label: 'Cupons', icon: Ticket },
];

export function CrmLayout() {
    const { user } = useAuth();
    const isManagement = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    return <AppShell area="Comercial" nav={NAV} switchTo={isManagement ? { to: '/dashboard', label: 'Painel de gestão' } : undefined} />;
}
