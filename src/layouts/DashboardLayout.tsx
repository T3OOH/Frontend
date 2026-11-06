import { BarChart3, Building2, FileBarChart, Gauge, ScrollText, Images, LayoutDashboard, List, Map as MapIcon, ShoppingCart, Users } from 'lucide-react';
import { AppShell, ShellNavItem } from './AppShell';

/** Menu da gestão em grupos: acompanhar, vender, catálogo e empresa. */
const NAV: ShellNavItem[] = [
    { group: 'Acompanhamento', to: '/dashboard', label: 'Visão geral', short: 'Início', icon: LayoutDashboard, end: true },
    { group: 'Acompanhamento', to: '/dashboard/indicadores', label: 'Indicadores e SLA', short: 'Indicadores', icon: Gauge },
    { group: 'Acompanhamento', to: '/dashboard/relatorios', label: 'Relatórios', icon: FileBarChart },
    { group: 'Vendas', to: '/dashboard/pedidos', label: 'Pedidos do site', icon: ShoppingCart },
    { group: 'Vendas', to: '/dashboard/trafego', label: 'Tráfego e leads', short: 'Tráfego', icon: BarChart3 },
    { group: 'Catálogo', to: '/dashboard/paineis', label: 'Painéis', icon: List },
    { group: 'Catálogo', to: '/dashboard/mapa', label: 'Mapa', icon: MapIcon },
    { group: 'Catálogo', to: '/dashboard/solution', label: 'T3 Solution', icon: Images },
    { group: 'Empresa', to: '/dashboard/usuarios', label: 'Usuários e e-mails', icon: Users },
    { group: 'Empresa', to: '/dashboard/info', label: 'Página Sobre', icon: Building2 },
    { group: 'Empresa', to: '/dashboard/registros', label: 'Registros (auditoria)', icon: ScrollText },
];

/** Área de gestão (ADMIN e MANAGER). */
export function DashboardLayout() {
    return <AppShell area="Gestão" nav={NAV} switchTo={{ to: '/crm', label: 'Ir para o CRM' }} />;
}
