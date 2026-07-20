import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';

import { MainLayout } from '@/layouts/MainLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Home } from '@/pages/Home';
import { Contact } from '@/pages/Contact';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Overview } from '@/pages/dashboard/Overview';
import { Panels } from '@/pages/dashboard/Panels';
import { PanelForm } from '@/pages/dashboard/PanelForm';
import { Services } from '@/pages/Services';

// ==========================================
// 🚀 LAZY LOADING DOS MAPAS
// Como você usa exportação nomeada (export function Map), precisamos do ".then"
// ==========================================
const Map = lazy(() => import('@/pages/Map').then(module => ({ default: module.Map })));
const DashboardMap = lazy(() => import('@/pages/dashboard/DashboardMap').then(module => ({ default: module.DashboardMap })));

// Componente visual enquanto o mapa é baixado sob demanda
const MapLoader = () => (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[#0A0A0B] gap-4">
        <div className="w-8 h-8 border-4 border-[#FF5E00] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[#8F8F91] text-sm font-medium tracking-widest uppercase">Carregando Mapa...</span>
    </div>
);

// 🛡️ O "Segurança" Aprimorado
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
                <BrowserRouter>
                    <Routes>
                        {/* ROTAS PÚBLICAS */}
                        <Route path="/" element={<MainLayout />}>
                            <Route index element={<Home />} />
                            <Route path="contato" element={<Contact />} />
                            
                            {/* ✨ Rota do Mapa envolvida no Suspense */}
                            <Route path="mapa" element={
                                <Suspense fallback={<MapLoader />}>
                                    <Map />
                                </Suspense>
                            } />
                            
                            <Route path="servicos" element={<Services />} />
                        </Route>

                        <Route path="/login" element={<Login />} />
                        <Route path="/cadastro" element={<Register />} />

                        {/* ROTAS RESTRITAS DO GESTOR */}
                        <Route element={<PrivateRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
                            <Route path="/dashboard" element={<DashboardLayout />}>
                                <Route index element={<Overview />} />
                                <Route path="paineis" element={<Panels />} />
                                <Route path="paineis/novo" element={<PanelForm />} />
                                <Route path="paineis/editar/:panelId" element={<PanelForm />} />
                                
                                {/* ✨ Rota do Mapa do Dashboard envolvida no Suspense */}
                                <Route path="mapa" element={
                                    <Suspense fallback={<MapLoader />}>
                                        <DashboardMap />
                                    </Suspense>
                                } />
                            </Route>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ToastProvider>
    );
}