import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { CartProvider } from '@/contexts/CartContext'; 
import { ThemeProvider } from '@/contexts/ThemeContext';
import { MainLayout } from '@/layouts/MainLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { CrmLayout } from '@/layouts/CrmLayout'; 
import { ScrollToTopButton } from '@/components/ScrollToTopButton';
import { ScrollToTop } from '@/components/ScrollToTop';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';

// ==========================================
// MODULE IMPORTS (CODE SPLITTING)
// Lazy loading das rotas para otimização de bundle
// ==========================================

// Public Views
const Home = lazy(() => import('@/pages/Home').then(m => ({ default: m.Home })));
const Contact = lazy(() => import('@/pages/Contact').then(m => ({ default: m.Contact })));
const Services = lazy(() => import('@/pages/Services').then(m => ({ default: m.Services })));
const Map = lazy(() => import('@/pages/Map').then(m => ({ default: m.Map })));
const Login = lazy(() => import('@/pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('@/pages/Register').then(m => ({ default: m.Register })));
const Info = lazy(() => import('@/pages/Info').then(m => ({ default: m.Info })));
const Solution = lazy(() => import('@/pages/Solution').then(m => ({ default: m.Solution })));

// Dashboard Views (Admin & Manager)
const Traffic = lazy(() => import('@/pages/dashboard/Traffic').then(m => ({ default: m.Traffic })));
const Overview = lazy(() => import('@/pages/dashboard/Overview').then(m => ({ default: m.Overview })));
const Panels = lazy(() => import('@/pages/dashboard/Panels').then(m => ({ default: m.Panels })));
const PanelForm = lazy(() => import('@/pages/dashboard/PanelForm').then(m => ({ default: m.PanelForm })));
const DashboardMap = lazy(() => import('@/pages/dashboard/DashboardMap').then(m => ({ default: m.DashboardMap })));
const UsersList = lazy(() => import('@/pages/dashboard/Users').then(m => ({ default: m.Users })));
const OrdersList = lazy(() => import('@/pages/dashboard/Orders').then(m => ({ default: m.Orders })));
const SolutionManager = lazy(() => import('@/pages/dashboard/SolutionManager').then(m => ({ default: m.SolutionManager })));
// NOVA ROTA INSTITUCIONAL AQUI
const DashboardInfo = lazy(() => import('@/pages/dashboard/DashboardInfo').then(m => ({ default: m.DashboardInfo })));

// CRM Views (Commercial)
const CrmOverview = lazy(() => import('@/pages/crm/CrmOverview').then(m => ({ default: m.CrmOverview })));
const CrmPipeline = lazy(() => import('@/pages/crm/CrmPipeline').then(m => ({ default: m.CrmPipeline })));
const CrmClients = lazy(() => import('@/pages/crm/CrmClients').then(m => ({ default: m.CrmClients })));
const CrmProposals = lazy(() => import('@/pages/crm/CrmProposals').then(m => ({ default: m.CrmProposals })));
const CrmAgenda = lazy(() => import('@/pages/crm/CrmAgenda').then(m => ({ default: m.CrmAgenda })));
const CrmCoupons = lazy(() => import('@/pages/crm/CrmCoupons').then(m => ({ default: m.CrmCoupons })));

// Legal Views
const Privacy = lazy(() => import('@/pages/legal/Privacy').then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import('@/pages/legal/Terms').then(m => ({ default: m.Terms })));

// Auth Views
const UpdatePassword = lazy(() => import('@/pages/UpdatePassword').then(m => ({ default: m.UpdatePassword })));

// User Views
const UserProfile = lazy(() => import('@/pages/UserProfile').then(m => ({ default: m.UserProfile })));

// ==========================================
// LOADING FALLBACKS
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
// ACCESS CONTROL (GUARDS)
// Validação baseada em contexto de autenticação e RBAC
// ==========================================
function PrivateRoute({ allowedRoles }: { allowedRoles?: string[] }) {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

function NotFound() {
    return (
        <>
        <Seo title="Página não encontrada" description="O endereço acessado não existe." path="/404" noIndex />
        <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="text-6xl font-black text-[#FF5E00]">404</span>
            <h1 className="text-2xl font-bold text-white">Página não encontrada</h1>
            <p className="text-[#8F8F91] max-w-md">O endereço acessado não existe ou foi removido.</p>
            <Link to="/" className="mt-2 px-6 py-3 bg-white text-[#0A0A0B] font-black uppercase tracking-widest text-xs">Voltar ao início</Link>
        </div>
        </>
    );
}

export function AppRoutes() {
    return (
        // ThemeProvider (preferências visuais) fica dentro do AuthProvider: sincroniza com a conta
        // e controla o MotionConfig (segue o sistema ou o "menos movimento" do perfil)
        <ToastProvider>
            <AuthProvider>
                <ThemeProvider>
                    <CartProvider>
                        <BrowserRouter>
                            {/* 
                              * INVISIBLE SCROLL HANDLER 
                              * Intercepta mudanças de rota e reseta a posição de scroll da janela para top 0
                              */}
                            <ScrollToTop />
                            <AnalyticsTracker />

                            <Routes>
                                {/* ROTAS PÚBLICAS */}
                                <Route path="/" element={<MainLayout />}>
                                    <Route index element={<Suspense fallback={<PageLoader />}><Home /></Suspense>} />
                                    <Route path="contato" element={<Suspense fallback={<PageLoader />}><Contact /></Suspense>} />
                                    <Route path="servicos" element={<Suspense fallback={<PageLoader />}><Services /></Suspense>} />
                                    <Route path="mapa" element={<Suspense fallback={<MapLoader />}><Map /></Suspense>} />
                                    <Route path="sobre" element={<Suspense fallback={<PageLoader />}><Info /></Suspense>} />
                                    <Route path="solution" element={<Suspense fallback={<PageLoader />}><Solution /></Suspense>} />
                                    <Route path="privacidade" element={<Suspense fallback={<PageLoader />}><Privacy /></Suspense>} />
                                    <Route path="termos" element={<Suspense fallback={<PageLoader />}><Terms /></Suspense>} />
                                    <Route path="*" element={<NotFound />} />
                                </Route>

                                {/* ROTAS DE AUTENTICAÇÃO */}
                                <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
                                <Route path="/cadastro" element={<Suspense fallback={<PageLoader />}><Register /></Suspense>} />
                                <Route path="/recuperar-senha" element={<Suspense fallback={<PageLoader />}><UpdatePassword /></Suspense>} />
                                <Route path="/atualizar-senha" element={<Suspense fallback={<PageLoader />}><UpdatePassword /></Suspense>} />

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
                                        <Route path="trafego" element={<Suspense fallback={<PageLoader />}><Traffic /></Suspense>} />
                                        <Route path="solution" element={<Suspense fallback={<PageLoader />}><SolutionManager /></Suspense>} />
                                        {/* A ROTA NOVA VAI AQUI DENTRO DO DASHBOARD */}
                                        <Route path="info" element={<Suspense fallback={<PageLoader />}><DashboardInfo /></Suspense>} />
                                        
                                    </Route>
                                </Route>

                                {/* ROTAS RESTRITAS (CRM / COMERCIAL) */}
                                <Route element={<PrivateRoute allowedRoles={['ADMIN', 'MANAGER', 'COMERCIAL']} />}>
                                    <Route path="/crm" element={<CrmLayout />}>
                                        <Route index element={<Suspense fallback={<PageLoader />}><CrmOverview /></Suspense>} />
                                        <Route path="pipeline" element={<Suspense fallback={<PageLoader />}><CrmPipeline /></Suspense>} />
                                        <Route path="clientes" element={<Suspense fallback={<PageLoader />}><CrmClients /></Suspense>} />
                                        
                                        {/* Dynamic Proposal Routes */}
                                        <Route path="propostas" element={<Suspense fallback={<PageLoader />}><CrmProposals /></Suspense>} />
                                        <Route path="proposta/:id" element={<Suspense fallback={<PageLoader />}><CrmProposals /></Suspense>} />
                                        
                                        <Route path="agenda" element={<Suspense fallback={<PageLoader />}><CrmAgenda /></Suspense>} />
                                        <Route path="cupons" element={<Suspense fallback={<PageLoader />}><CrmCoupons /></Suspense>} />
                                    </Route>

                                    {/* COMPATIBILITY ROUTE
                                      * Captura eventuais links absolutos de modulos paralelos (/dashboard/crm/proposta/:id)
                                      * Montando apropriadamente com o contexto do CrmLayout
                                      */}
                                    <Route path="/dashboard/crm/proposta/:id" element={<CrmLayout />}>
                                        <Route index element={<Suspense fallback={<PageLoader />}><CrmProposals /></Suspense>} />
                                    </Route>
                                </Route>

                                {/* ROTAS AUTENTICADAS GENÉRICAS */}
                                <Route element={<PrivateRoute />}>
                                    <Route path="/" element={<MainLayout />}>
                                        <Route path="perfil" element={<Suspense fallback={<PageLoader />}><UserProfile /></Suspense>} />
                                    </Route>
                                </Route>

                            </Routes>

                            {/* Global Action Component for Scroll Management */}
                            <ScrollToTopButton />

                        </BrowserRouter>
                    </CartProvider>
                </ThemeProvider>
            </AuthProvider>
        </ToastProvider>
    );
}