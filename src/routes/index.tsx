import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { CartProvider } from '@/contexts/CartContext'; 
import { MainLayout } from '@/layouts/MainLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { CrmLayout } from '@/layouts/CrmLayout'; 

// ==========================================
// CODE SPLITTING 
// Separacao de pacotes de JavaScript (chunks)
// ==========================================
const Home = lazy(() => import('@/pages/Home').then(m => ({ default: m.Home })));
const Contact = lazy(() => import('@/pages/Contact').then(m => ({ default: m.Contact })));
const Services = lazy(() => import('@/pages/Services').then(m => ({ default: m.Services })));
const Map = lazy(() => import('@/pages/Map').then(m => ({ default: m.Map })));
const Login = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('@/pages/Register').then(m => ({ default: m.Register })));

const Overview = lazy(() => import('@/pages/dashboard/Overview').then(m => ({ default: m.Overview })));
const Panels = lazy(() => import('@/pages/dashboard/Panels').then(m => ({ default: m.Panels })));
const PanelForm = lazy(() => import('@/pages/dashboard/PanelForm').then(m => ({ default: m.PanelForm })));
const DashboardMap = lazy(() => import('@/pages/dashboard/DashboardMap').then(m => ({ default: m.DashboardMap })));
const UsersList = lazy(() => import('@/pages/dashboard/Users').then(m => ({ default: m.Users })));
const OrdersList = lazy(() => import('@/pages/dashboard/Orders').then(m => ({ default: m.Orders })));

// Telas do CRM
const CrmOverview = lazy(() => import('@/pages/crm/CrmOverview').then(m => ({ default: m.CrmOverview })));
const CrmPipeline = lazy(() => import('@/pages/crm/CrmPipeline').then(m => ({ default: m.CrmPipeline })));
const CrmClients = lazy(() => import('@/pages/crm/CrmClients').then(m => ({ default: m.CrmClients })));
const CrmChat = lazy(() => import('@/pages/crm/CrmChat').then(m => ({ default: m.CrmChat })));
const CrmAgenda = lazy(() => import('@/pages/crm/CrmAgenda').then(m => ({ default: m.CrmAgenda })));
const CrmCoupons = lazy(() => import('@/pages/crm/CrmCoupons').then(m => ({ default: m.CrmCoupons })));

// Telas do Cliente (Perfil)
const UserProfile = lazy(() => import('@/pages/UserProfile').then(m => ({ default: m.UserProfile })));

// ==========================================
// COMPONENTES DE LOADING
// ==========================================
const PageLoader = () => (
    <div className="w-full h-[calc(100vh-5rem)] flex items-center justify-center bg-[#0A0A0B]">
        <div className="w-8 h-8 border-4 border-[#FF5E00] border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const MapLoader = () => (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[#0A0A0B] gap-4">
        <div className="w-8 h-8 border-4 border-[#FF5E00] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[#8F8F91] text-sm font-medium tracking-widest uppercase">Carregando Mapa...</span>
    </div>
);

// ==========================================
// CONTROLE DE ACESSO
// ==========================================
function PrivateRoute({ allowedRoles }: { allowedRoles?: string[] }) {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

export function AppRoutes() {
    return (
        <ToastProvider>
            <AuthProvider>
                <CartProvider>
                    <BrowserRouter>
                        <Routes>
                            {/* ROTAS PÚBLICAS */}
                            <Route path="/" element={<MainLayout />}>
                                <Route index element={<Suspense fallback={<PageLoader />}><Home /></Suspense>} />
                                <Route path="contato" element={<Suspense fallback={<PageLoader />}><Contact /></Suspense>} />
                                <Route path="servicos" element={<Suspense fallback={<PageLoader />}><Services /></Suspense>} />
                                <Route path="mapa" element={<Suspense fallback={<MapLoader />}><Map /></Suspense>} />
                            </Route>

                            {/* ROTAS DE AUTENTICAÇÃO */}
                            <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
                            <Route path="/cadastro" element={<Suspense fallback={<PageLoader />}><Register /></Suspense>} />

                            {/* ROTAS RESTRITAS (GESTOR / ADMIN) */}
                            <Route element={<PrivateRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
                                <Route path="/dashboard" element={<DashboardLayout />}>
                                    <Route index element={<Suspense fallback={<PageLoader />}><Overview /></Suspense>} />
                                    <Route path="paineis" element={<Suspense fallback={<PageLoader />}><Panels /></Suspense>} />
                                    <Route path="paineis/novo" element={<Suspense fallback={<PageLoader />}><PanelForm /></Suspense>} />
                                    <Route path="paineis/editar/:panelId" element={<Suspense fallback={<PageLoader />}><PanelForm /></Suspense>} />
                                    <Route path="mapa" element={<Suspense fallback={<MapLoader />}><DashboardMap /></Suspense>} />
                                    <Route path="usuarios" element={<Suspense fallback={<PageLoader />}><UsersList /></Suspense>} />
                                    <Route path="pedidos" element={<Suspense fallback={<PageLoader />}><OrdersList /></Suspense>} />
                                </Route>
                            </Route>

                            {/* ROTAS RESTRITAS (CRM / COMERCIAL) */}
                            <Route element={<PrivateRoute allowedRoles={['ADMIN', 'MANAGER', 'COMERCIAL']} />}>
                                <Route path="/crm" element={<CrmLayout />}>
                                    <Route index element={<Suspense fallback={<PageLoader />}><CrmOverview /></Suspense>} />
                                    <Route path="pipeline" element={<Suspense fallback={<PageLoader />}><CrmPipeline /></Suspense>} />
                                    <Route path="clientes" element={<Suspense fallback={<PageLoader />}><CrmClients /></Suspense>} />
                                    <Route path="chat" element={<Suspense fallback={<PageLoader />}><CrmChat /></Suspense>} />
                                    <Route path="agenda" element={<Suspense fallback={<PageLoader />}><CrmAgenda /></Suspense>} />
                                    <Route path="cupons" element={<Suspense fallback={<PageLoader />}><CrmCoupons /></Suspense>} />
                                </Route>
                            </Route>

                            {/* ROTAS RESTRITAS GERAIS (Qualquer usuário autenticado) */}
                            <Route element={<PrivateRoute />}>
                                <Route path="/" element={<MainLayout />}>
                                    <Route path="perfil" element={<Suspense fallback={<PageLoader />}><UserProfile /></Suspense>} />
                                </Route>
                            </Route>

                        </Routes>
                    </BrowserRouter>
                </CartProvider>
            </AuthProvider>
        </ToastProvider>
    );
}