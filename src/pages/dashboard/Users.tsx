import { useState, useEffect } from 'react';
import { Search, Shield, User, Loader2, ShieldAlert, ReceiptText } from 'lucide-react';
import { usersService, UserData } from '@/services/users.service';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { CustomSelect } from '@/components/CustomSelect';

/**
 * Componente principal de Gestao de Acessos e Usuarios.
 * Implementa arquitetura responsiva com viewports separados (Desktop Table vs Mobile Cards).
 */
export function Users() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState(''); 
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const toast = useToast();
    const { user: currentUser } = useAuth();

    /**
     * Ciclo de vida de montagem.
     * Dispara a busca de usuarios assim que a tela e carregada.
     */
    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Busca os usuarios cadastrados na API e gerencia os estados de carregamento da interface.
     */
    async function fetchUsers() {
        try {
            setIsLoading(true);
            const data = await usersService.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error("Erro ao buscar usuarios:", error);
            toast.error("Erro ao carregar a lista de usuarios.");
        } finally {
            setIsLoading(false);
        }
    }

    /**
     * Processa a alteracao do nivel de permissao (cargo) de um usuario.
     * Inclui trava de seguranca para impedir que o proprio usuario altere seu nivel
     * acidentalmente, evitando perda de acesso gerencial.
     * 
     * @param userId - Identificador unico do usuario.
     * @param newRole - Novo cargo a ser aplicado.
     */
    const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN' | 'MANAGER' | 'COMERCIAL') => {
        if (userId === currentUser?.id) {
            toast.error("Voce nao pode alterar seu proprio nivel de acesso por aqui.");
            return;
        }

        try {
            setUpdatingId(userId);
            await usersService.updateUserRole(userId, newRole);
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast.success("Cargo atualizado com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar cargo:", error);
            toast.error("Falha ao atualizar o cargo do usuario.");
        } finally {
            setUpdatingId(null);
        }
    };

    /**
     * Filtra a lista de usuarios renderizada com base nos inputs de busca e selecao.
     * A filtragem ocorre em tempo de execucao (client-side).
     */
    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === '' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const roleColors = {
        ADMIN: 'bg-red-500/10 text-red-500 border-red-500/20',
        MANAGER: 'bg-brand-neon/10 text-brand-neon border-brand-neon/20',
        COMERCIAL: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        USER: 'bg-brand-surface/30 text-brand-muted border-brand-border/40'
    };

    const roleLabels = {
        ADMIN: 'Administrador',
        MANAGER: 'Gestor',
        COMERCIAL: 'Comercial',
        USER: 'Usuario'
    };

    const roleOptions = [
        { value: 'USER', label: 'Usuário' },
        { value: 'COMERCIAL', label: 'Comercial' },
        { value: 'MANAGER', label: 'Gestor' },
        { value: 'ADMIN', label: 'Administrador Geral' }
    ];

    const filterOptions = [
        { value: '', label: 'Todos Os Cargos' },
        ...roleOptions
    ];

    return (
        <div className="w-full h-full flex flex-col">
            
            {/* ========================================================= */}
            {/* DESKTOP LAYOUT                                              */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col h-full max-w-7xl mx-auto w-full">
                
                <div className="flex-shrink-0 mb-6">
                    <h1 className="text-2xl font-bold text-brand-text tracking-tight mb-1 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-brand-neon" />
                        Gestão de Acessos
                    </h1>
                    <p className="text-sm text-brand-muted">Gerencie os usuários do sistema e defina seus níveis de permissão.</p>
                </div>

                <div className="glass-panel p-3 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between flex-shrink-0 mb-4 border-brand-border/40 relative z-20">
                    <div className="w-full sm:w-[400px] relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input
                            placeholder="Buscar por nome ou e-mail..."
                            className="w-full bg-brand-black/50 border border-brand-border/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-neon transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="w-full sm:w-64 relative">
                        <CustomSelect
                            options={filterOptions}
                            value={roleFilter}
                            onChange={setRoleFilter}
                            placeholder="Todos Os Cargos"
                        />
                    </div>
                </div>

                <div className="flex-1 min-h-0 glass-panel rounded-xl overflow-hidden flex flex-col relative border-brand-border/40 z-10">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-brand-black/50 backdrop-blur-sm">
                            <Loader2 className="w-6 h-6 text-brand-neon animate-spin" />
                        </div>
                    )}

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead className="sticky top-0 bg-[#0d0d0f] z-40 shadow-sm">
                                <tr className="border-b border-brand-border/40">
                                    <th className="px-5 py-3.5 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Usuário</th>
                                    <th className="px-5 py-3.5 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Cargo Atual</th>
                                    <th className="px-5 py-3.5 text-[10px] font-semibold text-brand-muted uppercase tracking-widest">Ação / Alterar Cargo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border/20 relative z-0">
                                {!isLoading && filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-5 py-8 text-center text-sm text-brand-muted">
                                            Nenhum usuário encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-brand-surface/40 transition-colors group">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-brand-surface border border-brand-border/40 flex items-center justify-center text-brand-text font-bold shadow-inner shrink-0">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="font-semibold text-sm text-brand-text mb-0.5 flex items-center gap-1.5">
                                                            <span className="truncate">{user.name}</span>
                                                            {user.id === currentUser?.id && (
                                                                <span className="text-[9px] bg-brand-neon/20 text-brand-neon px-1.5 rounded uppercase tracking-wider shrink-0">Você</span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-brand-muted truncate">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border ${roleColors[user.role]}`}>
                                                    {user.role === 'ADMIN' && <ShieldAlert className="w-3 h-3" />}
                                                    {user.role === 'MANAGER' && <Shield className="w-3 h-3" />}
                                                    {user.role === 'USER' && <User className="w-3 h-3" />}
                                                    {user.role === 'COMERCIAL' && <ReceiptText className="w-3 h-3" />}
                                                    {roleLabels[user.role]}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                {updatingId === user.id ? (
                                                    <div className="flex items-center gap-2 text-sm text-brand-muted">
                                                        <Loader2 className="w-4 h-4 animate-spin text-brand-neon" />
                                                        Atualizando...
                                                    </div>
                                                ) : (
                                                    <div className="w-48">
                                                        <CustomSelect
                                                            options={roleOptions}
                                                            value={user.role}
                                                            onChange={(value: string) => handleRoleChange(user.id, value as 'USER' | 'ADMIN' | 'MANAGER' | 'COMERCIAL')}
                                                            disabled={user.id === currentUser?.id}
                                                        />
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* MOBILE LAYOUT (APP PATTERN NATIVO)                          */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full relative">
                
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Shield className="w-5 h-5 text-brand-neon" /> Acessos
                        </h1>
                        <p className="text-[11px] text-brand-muted mt-0.5">Gerencie os usuários do sistema</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 mb-4 relative z-50">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted z-10" />
                        <input
                            placeholder="Buscar usuário..."
                            className="w-full bg-[#111113] border border-brand-border/40 rounded-2xl pl-11 pr-4 py-3.5 text-[13px] text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <CustomSelect
                        options={filterOptions}
                        value={roleFilter}
                        onChange={setRoleFilter}
                        placeholder="Filtrar por Cargo"
                    />
                </div>

                <div className="flex flex-col gap-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-3" />
                            <span className="text-xs text-brand-muted uppercase font-bold tracking-widest">Carregando...</span>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="bg-[#111113]/50 border border-brand-border/20 rounded-2xl p-8 flex flex-col items-center text-center mt-2">
                            <User className="w-10 h-10 text-brand-border mb-3" />
                            <h3 className="text-sm font-bold text-white mb-1">Nenhum usuário</h3>
                            <p className="text-xs text-brand-muted">Não encontramos registros com estes filtros.</p>
                        </div>
                    ) : (
                        filteredUsers.map((user, index) => (
                            <div 
                                key={user.id} 
                                style={{ zIndex: filteredUsers.length - index }} 
                                className="bg-[#111113] border border-white/5 rounded-[20px] p-4 flex flex-col shadow-md relative"
                            >
                                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="w-10 h-10 rounded-full bg-brand-surface border border-brand-border/40 flex items-center justify-center text-brand-text font-bold shadow-inner shrink-0">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white text-[15px] truncate">{user.name}</span>
                                                {user.id === currentUser?.id && (
                                                    <span className="text-[9px] bg-brand-neon/20 text-brand-neon px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">Você</span>
                                                )}
                                            </div>
                                            <span className="text-xs text-brand-muted truncate">{user.email}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="py-3 flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Cargo Atual</span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${roleColors[user.role]}`}>
                                        {roleLabels[user.role]}
                                    </span>
                                </div>

                                <div className="pt-3 border-t border-brand-border/20 flex flex-col gap-2 relative">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted ml-1">Alterar Nível de Acesso</label>
                                    {updatingId === user.id ? (
                                        <div className="flex items-center justify-center gap-2 h-12 text-[13px] font-bold text-brand-neon bg-brand-neon/10 rounded-xl border border-brand-neon/20">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Atualizando...
                                        </div>
                                    ) : (
                                        <CustomSelect
                                            options={roleOptions}
                                            value={user.role}
                                            onChange={(value: string) => handleRoleChange(user.id, value as 'USER' | 'ADMIN' | 'MANAGER' | 'COMERCIAL')}
                                            disabled={user.id === currentUser?.id}
                                        />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                {/* 
                 * Espacador invisivel (Spacer) colocado estrategicamente apos a lista. 
                 * Sua funcao e criar area util de scroll garantindo que o ultimo elemento visual 
                 * e seus menus suspensos subam completamente para cima da Bottom Action Bar.
                 */}
                <div className="h-[250px] w-full shrink-0 pointer-events-none" aria-hidden="true" />
            </div>

        </div>
    );
}