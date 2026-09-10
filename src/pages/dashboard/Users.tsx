import { useState, useEffect } from 'react';
import { Search, Shield, User, Loader2, ShieldAlert, ReceiptText } from 'lucide-react';
import { usersService, UserData } from '@/services/users.service';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { CustomSelect } from '@/components/CustomSelect';

/**
 * Componente principal de Gestão de Acessos e Usuários.
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
     * Dispara a busca de usuários assim que a tela é carregada.
     */
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoading(true);
                const data = await usersService.getAllUsers();
                setUsers(data);
            } catch (error) {
                console.error("Erro ao buscar usuários:", error);
                toast.error("Erro ao carregar a lista de usuários.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [toast]);

    /**
     * Processa a alteração do nível de permissão (cargo) de um usuário.
     * Inclui trava de segurança para impedir que o próprio usuário altere seu nível
     * acidentalmente, evitando perda de acesso gerencial.
     * 
     * @param userId - Identificador único do usuário.
     * @param newRole - Novo cargo a ser aplicado.
     */
    const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN' | 'MANAGER' | 'COMERCIAL') => {
        if (userId === currentUser?.id) {
            toast.error("Ação negada: Você não pode alterar seu próprio nível de acesso.");
            return;
        }

        try {
            setUpdatingId(userId);
            await usersService.updateUserRole(userId, newRole);
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast.success("Cargo atualizado com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar cargo:", error);
            toast.error("Falha ao atualizar o cargo do usuário.");
        } finally {
            setUpdatingId(null);
        }
    };

    /**
     * Filtra a lista de usuários renderizada com base nos inputs de busca e seleção.
     * A filtragem ocorre em tempo de execução (client-side).
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
        USER: 'bg-brand-background text-brand-muted border-brand-border'
    };

    const roleLabels = {
        ADMIN: 'Administrador',
        MANAGER: 'Gestor',
        COMERCIAL: 'Comercial',
        USER: 'Usuário'
    };

    const roleOptions = [
        { value: 'USER', label: 'Usuário' },
        { value: 'COMERCIAL', label: 'Comercial' },
        { value: 'MANAGER', label: 'Gestor' },
        { value: 'ADMIN', label: 'Administrador Geral' }
    ];

    const filterOptions = [
        { value: '', label: 'Todos os Cargos' },
        ...roleOptions
    ];

    return (
        <div className="w-full h-full flex flex-col gap-6">
            
            {/* ========================================================= */}
            {/* DESKTOP LAYOUT (PADRÃO CORPORATIVO B2B)                     */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col h-full max-w-7xl mx-auto w-full gap-6">
                
                {/* HEADER */}
                <div className="flex-shrink-0">
                    <h1 className="text-2xl font-bold text-brand-text tracking-tight mb-1 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-brand-neon" />
                        Gestão de Acessos
                    </h1>
                    <p className="text-sm text-brand-muted font-medium">Gerencie os usuários do sistema e defina seus níveis de permissão.</p>
                </div>

                {/* FILTROS E BUSCA */}
                <div className="bg-brand-surface p-4 rounded-md flex flex-col sm:flex-row gap-4 items-center justify-between flex-shrink-0 border border-brand-border relative z-20 transition-colors">
                    <div className="w-full sm:w-[450px] relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input
                            placeholder="Buscar por nome ou e-mail..."
                            className="w-full bg-brand-background border border-brand-border rounded-md pl-11 pr-4 py-3 text-sm text-brand-text focus:outline-none focus:border-brand-neon transition-colors shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="w-full sm:w-72 relative">
                        <CustomSelect
                            options={filterOptions}
                            value={roleFilter}
                            onChange={setRoleFilter}
                            placeholder="Todos Os Cargos"
                        />
                    </div>
                </div>

                {/* TABELA DE USUÁRIOS */}
                <div className="flex-1 min-h-0 bg-brand-surface rounded-md overflow-hidden flex flex-col relative border border-brand-border z-10 transition-colors">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-brand-background/80">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
                        </div>
                    )}

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead className="sticky top-0 bg-brand-background z-40">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest border-b border-brand-border">Usuário</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest border-b border-brand-border">Cargo Atual</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest border-b border-brand-border">Ação / Alterar Cargo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border relative z-0">
                                {!isLoading && filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-16 text-center text-sm text-brand-muted">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <User className="w-8 h-8 opacity-50 mb-2" />
                                                <span className="font-medium">Nenhum usuário encontrado.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-brand-background/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-sm bg-brand-background border border-brand-border flex items-center justify-center text-brand-text font-bold shrink-0">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="font-bold text-sm text-brand-text mb-0.5 flex items-center gap-2">
                                                            <span className="truncate">{user.name}</span>
                                                            {user.id === currentUser?.id && (
                                                                <span className="text-[9px] bg-brand-neon/10 text-brand-neon border border-brand-neon/20 px-2 py-0.5 rounded-sm uppercase font-bold tracking-widest shrink-0">Você</span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-brand-muted font-medium truncate">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-bold uppercase tracking-wider border ${roleColors[user.role]}`}>
                                                    {user.role === 'ADMIN' && <ShieldAlert className="w-3.5 h-3.5" />}
                                                    {user.role === 'MANAGER' && <Shield className="w-3.5 h-3.5" />}
                                                    {user.role === 'USER' && <User className="w-3.5 h-3.5" />}
                                                    {user.role === 'COMERCIAL' && <ReceiptText className="w-3.5 h-3.5" />}
                                                    {roleLabels[user.role]}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                {updatingId === user.id ? (
                                                    <div className="flex items-center gap-2 text-xs font-bold text-brand-neon bg-brand-neon/10 px-4 py-2.5 rounded-md border border-brand-neon/20 w-52 justify-center">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Atualizando...
                                                    </div>
                                                ) : user.id === currentUser?.id ? (
                                                    /* Solução do Erro TypeScript: Mostra um bloqueio visual ao invés de passar disabled para o componente */
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-brand-muted uppercase tracking-widest px-4 py-3 bg-brand-background border border-brand-border rounded-md w-52 justify-center cursor-not-allowed">
                                                        Acesso Bloqueado
                                                    </div>
                                                ) : (
                                                    <div className="w-52">
                                                        <CustomSelect
                                                            options={roleOptions}
                                                            value={user.role}
                                                            onChange={(value: string) => handleRoleChange(user.id, value as 'USER' | 'ADMIN' | 'MANAGER' | 'COMERCIAL')}
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
            {/* MOBILE LAYOUT (APP PATTERN)                               */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full relative gap-4 pb-[100px]">
                
                {/* Header Compacto Mobile */}
                <div className="flex items-center justify-between mt-2 px-4">
                    <div>
                        <h1 className="text-xl font-bold text-brand-text tracking-tight flex items-center gap-2">
                            <Shield className="w-5 h-5 text-brand-neon" /> Acessos
                        </h1>
                        <p className="text-[11px] text-brand-muted mt-0.5 font-medium">Gerencie os usuários do sistema</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 px-4 relative z-50">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted z-10" />
                        <input
                            placeholder="Buscar usuário..."
                            className="w-full bg-brand-surface border border-brand-border rounded-md pl-11 pr-4 py-3.5 text-[13px] text-brand-text focus:outline-none focus:border-brand-neon transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full bg-brand-surface rounded-md border border-brand-border">
                        <CustomSelect
                            options={filterOptions}
                            value={roleFilter}
                            onChange={setRoleFilter}
                            placeholder="Filtrar por Cargo"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-4 px-4 mt-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-3" />
                            <span className="text-xs text-brand-muted uppercase font-bold tracking-widest">Carregando...</span>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="bg-brand-surface border border-brand-border rounded-md p-8 flex flex-col items-center text-center">
                            <User className="w-10 h-10 text-brand-muted mb-3 opacity-50" />
                            <h3 className="text-sm font-bold text-brand-text mb-1">Nenhum usuário</h3>
                            <p className="text-xs text-brand-muted">Não encontramos registros com estes filtros.</p>
                        </div>
                    ) : (
                        filteredUsers.map((user, index) => (
                            <div 
                                key={user.id} 
                                style={{ zIndex: filteredUsers.length - index }} 
                                className="bg-brand-surface border border-brand-border rounded-md p-5 flex flex-col relative transition-colors"
                            >
                                <div className="flex justify-between items-start border-b border-brand-border pb-4 mb-4">
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="w-12 h-12 rounded-sm bg-brand-background border border-brand-border flex items-center justify-center text-brand-text font-bold shrink-0 text-lg">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-brand-text text-[15px] truncate">{user.name}</span>
                                                {user.id === currentUser?.id && (
                                                    <span className="text-[9px] bg-brand-neon/10 text-brand-neon border border-brand-neon/20 px-2 py-0.5 rounded-sm font-bold uppercase tracking-widest shrink-0">Você</span>
                                                )}
                                            </div>
                                            <span className="text-xs text-brand-muted font-medium truncate">{user.email}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4 flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Cargo Atual</span>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${roleColors[user.role]}`}>
                                        {roleLabels[user.role]}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-2 relative">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted ml-1">Alterar Nível de Acesso</label>
                                    {updatingId === user.id ? (
                                        <div className="flex items-center justify-center gap-2 h-12 text-[13px] font-bold text-brand-neon bg-brand-neon/10 rounded-md border border-brand-neon/20">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Atualizando...
                                        </div>
                                    ) : user.id === currentUser?.id ? (
                                        <div className="flex items-center justify-center h-12 text-[10px] font-bold text-brand-muted uppercase tracking-widest bg-brand-background border border-brand-border rounded-md cursor-not-allowed">
                                            Acesso Bloqueado
                                        </div>
                                    ) : (
                                        <div className="bg-brand-background rounded-md border border-brand-border">
                                            <CustomSelect
                                                options={roleOptions}
                                                value={user.role}
                                                onChange={(value: string) => handleRoleChange(user.id, value as 'USER' | 'ADMIN' | 'MANAGER' | 'COMERCIAL')}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                {/* Espaçador invisível (Spacer) */}
                <div className="h-[50px] w-full shrink-0 pointer-events-none" aria-hidden="true" />
            </div>

        </div>
    );
}