import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext'; // ✨ Importação do Toast

import { MainLayout } from '@/layouts/MainLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Home } from '@/pages/Home';
import { Contact } from '@/pages/Contact';
import { Map } from '@/pages/Map';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Overview } from '@/pages/dashboard/Overview';
import { Panels } from '@/pages/dashboard/Panels';
import { DashboardMap } from '@/pages/dashboard/DashboardMap';
import { PanelForm } from '@/pages/dashboard/PanelForm';
import { Services } from '@/pages/Services';

// 🛡️ O "Segurança" Aprimorado: Verifica o Crachá (Token) e o Cargo (Role)
function PrivateRoute({ allowedRoles }: { allowedRoles?: string[] }) {
    const { isAuthenticated, user } = useAuth();

    // 1. Se não tem token nenhum, manda pro Login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 2. Se a rota exige um cargo específico e o usuário NÃO tem, manda pra Home
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    // 3. Tudo certo! Pode entrar.
    return <Outlet />;
}

export function AppRoutes() {
    return (
        // ✨ ToastProvider envolvendo toda a aplicação
        <ToastProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* ROTAS PÚBLICAS (Qualquer um acessa) */}
                        <Route path="/" element={<MainLayout />}>
                            <Route index element={<Home />} />
                            <Route path="contato" element={<Contact />} />
                            <Route path="mapa" element={<Map />} />
                            <Route path="servicos" element={<Services />} />
                        </Route>

                        <Route path="/login" element={<Login />} />
                        <Route path="/cadastro" element={<Register />} />

                        {/* ROTAS RESTRITAS DO GESTOR (Apenas ADMIN e MANAGER entram) */}
                        <Route element={<PrivateRoute allowedRoles={['ADMIN', 'MANAGER']} />}>
                            <Route path="/dashboard" element={<DashboardLayout />}>
                                <Route index element={<Overview />} />
                                <Route path="paineis" element={<Panels />} />
                                <Route path="paineis/novo" element={<PanelForm />} />
                                <Route path="paineis/editar/:panelId" element={<PanelForm />} />
                                <Route path="mapa" element={<DashboardMap />} />
                            </Route>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ToastProvider>
    );
}