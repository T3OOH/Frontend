import { BarChart3, Building2, Images, LayoutDashboard, List, Map as MapIcon, ShoppingCart, Users } from 'lucide-react';
import { AppShell, ShellNavItem } from './AppShell';

const NAV: ShellNavItem[] = [
    { to: '/dashboard', label: 'Visão geral', short: 'Início', icon: LayoutDashboard, end: true },
    { to: '/dashboard/trafego', label: 'Tráfego e leads', short: 'Tráfego', icon: BarChart3 },
    { to: '/dashboard/paineis', label: 'Painéis', icon: List },
    { to: '/dashboard/pedidos', label: 'Pedidos', icon: ShoppingCart },
    { to: '/dashboard/mapa', label: 'Mapa', icon: MapIcon },
    { to: '/dashboard/usuarios', label: 'Usuários', icon: Users },
    { to: '/dashboard/solution', label: 'T3 Solution', icon: Images },
    { to: '/dashboard/info', label: 'Página Sobre', icon: Building2 },
];

/** Área de gestão (ADMIN e MANAGER). */
export function DashboardLayout() {
    return <AppShell area="Gestão" nav={NAV} switchTo={{ to: '/crm', label: 'Ir para o CRM' }} />;
}
