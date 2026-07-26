import { useState, useEffect, useMemo } from 'react';
import { agendaService, Task } from '@/services/agenda.service';
import { 
    Calendar as CalendarIcon, 
    Clock, 
    PhoneCall, 
    Users, 
    MessageSquare,
    CheckCircle, 
    Plus, 
    ChevronLeft, 
    ChevronRight,
    Circle,
    X,
    Loader2 // CORREÇÃO: Ícone de carregamento importado com sucesso
} from 'lucide-react';

/**
 * Componente principal de Agenda e Tarefas (CRM).
 * Implementa arquitetura responsiva separando a interface em dois viewports:
 * - Desktop: Layout lado a lado (Calendario à esquerda, Lista à direita) com rolagem interna.
 * - Mobile: Layout em pilha (Stack) com rolagem fluida e espacador fantasma para evitar
 *   colisao com a Bottom Navigation Global.
 */
export function CrmAgenda() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '', client: '', time: '09:00', type: 'meeting'
    });

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);
    const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    /**
     * Navega para o mes anterior no calendario.
     */
    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    
    /**
     * Navega para o proximo mes no calendario.
     */
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    /**
     * Busca a lista completa de tarefas cadastradas na base de dados.
     */
    const fetchTasks = async () => {
        try {
            setLoading(true);
            const data = await agendaService.getTasks();
            setTasks(data);
        } catch (error) {
            console.error("Erro ao buscar tarefas", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    /**
     * Memoriza a lista de tarefas filtrada apenas para o dia selecionado atualmente.
     */
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => t.date.startsWith(selectedDateString));
    }, [tasks, selectedDateString]);

    /**
     * Alterna o status de uma tarefa entre pendente e concluida.
     * Atualiza o estado local imediatamente para resposta visual instantanea (Optimistic UI Update)
     * e reverte caso a chamada a API falhe.
     * 
     * @param id - Identificador unico da tarefa.
     * @param currentStatus - Status atual da tarefa.
     */
    const toggleTaskStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus as any } : t));

        try {
            await agendaService.toggleTaskStatus(id, newStatus);
        } catch (error) {
            console.error("Erro ao atualizar status", error);
            fetchTasks(); 
        }
    };

    /**
     * Processa a submissao do formulario de nova tarefa.
     */
    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const createdTask = await agendaService.createTask({
                ...newTask,
                date: selectedDate.toISOString()
            });
            setTasks([...tasks, createdTask]);
            setIsModalOpen(false);
            setNewTask({ title: '', client: '', time: '09:00', type: 'meeting' });
        } catch (error) {
            console.error("Erro ao criar tarefa", error);
        }
    };

    /**
     * Retorna o componente de icone correspondente ao tipo de tarefa.
     * 
     * @param type - O tipo da tarefa (meeting, call, message).
     * @returns JSX.Element
     */
    const getIconForType = (type: string) => {
        switch(type) {
            case 'call': return <PhoneCall className="w-4 h-4 text-blue-400" />;
            case 'meeting': return <Users className="w-4 h-4 text-purple-400" />;
            case 'message': return <MessageSquare className="w-4 h-4 text-green-400" />;
            default: return <Clock className="w-4 h-4 text-brand-muted" />;
        }
    };

    return (
        <div className="w-full h-full flex flex-col relative animate-fade-in">
            
            {/* ========================================================= */}
            {/* VIEWPORT: DESKTOP                                           */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col h-full max-w-7xl mx-auto w-full">
                
                {/* CABEÇALHO */}
                <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-wide">Agenda & Tarefas</h1>
                        <p className="text-sm text-brand-muted mt-1">Acompanhe seus compromissos e follow-ups comerciais.</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-brand-neon text-[#0A0A0B] px-5 py-2.5 rounded-xl font-bold hover:bg-brand-neon/90 transition-colors shadow-[0_0_15px_rgba(255,94,0,0.2)]"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Compromisso
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 h-[calc(100%-5rem)] min-h-[600px]">
                    
                    {/* COLUNA ESQUERDA: CALENDÁRIO */}
                    <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
                        <div className="glass-panel p-5 rounded-2xl border-brand-border/40">
                            
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-white font-bold tracking-wide capitalize">{months[month]} {year}</h2>
                                <div className="flex gap-1">
                                    <button onClick={handlePrevMonth} className="p-1 text-brand-muted hover:text-white transition-colors rounded-lg hover:bg-brand-surface"><ChevronLeft className="w-5 h-5" /></button>
                                    <button onClick={handleNextMonth} className="p-1 text-brand-muted hover:text-white transition-colors rounded-lg hover:bg-brand-surface"><ChevronRight className="w-5 h-5" /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {weekDays.map(day => (
                                    <div key={day} className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-2">
                                        {day}
                                    </div>
                                ))}
                                
                                {blanks.map((blank) => (
                                    <div key={`blank-${blank}`} className="p-2"></div>
                                ))}
                                
                                {calendarDays.map(day => {
                                    const loopDate = new Date(year, month, day);
                                    const isSelected = loopDate.toDateString() === selectedDate.toDateString();
                                    const isToday = loopDate.toDateString() === new Date().toDateString();
                                    const dateString = loopDate.toISOString().split('T')[0];
                                    const hasEvent = tasks.some(t => t.date.startsWith(dateString));

                                    return (
                                        <button 
                                            key={day}
                                            onClick={() => setSelectedDate(loopDate)}
                                            className={`p-2 rounded-lg text-sm font-medium transition-all relative flex flex-col items-center justify-center
                                                ${isSelected ? 'bg-brand-neon text-[#0A0A0B]' : isToday ? 'border border-brand-neon text-white' : 'text-brand-text hover:bg-brand-surface'}
                                            `}
                                        >
                                            {day}
                                            {hasEvent && !isSelected && (
                                                <div className="w-1 h-1 bg-brand-neon rounded-full absolute bottom-1"></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* COLUNA DIREITA: LISTA DE TAREFAS */}
                    <div className="flex-1 glass-panel rounded-2xl border-brand-border/40 p-6 flex flex-col relative overflow-hidden">
                        
                        <div className="flex items-center justify-between mb-6 border-b border-brand-border/40 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white capitalize">
                                    {weekDays[selectedDate.getDay()]}-feira, {selectedDate.getDate()} de {months[selectedDate.getMonth()]}
                                </h2>
                                <p className="text-sm text-brand-muted">Você tem {filteredTasks.filter(t => t.status === 'pending').length} tarefas pendentes hoje.</p>
                            </div>
                            <CalendarIcon className="w-6 h-6 text-brand-neon/50" />
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
                            {loading ? (
                                <p className="text-brand-muted text-center mt-10">Carregando tarefas...</p>
                            ) : filteredTasks.length === 0 ? (
                                <p className="text-brand-muted text-center mt-10">Nenhuma tarefa para este dia.</p>
                            ) : (
                                <>
                                    <div className="absolute left-[39px] top-4 bottom-4 w-px bg-brand-border/40 z-0"></div>
                                    <div className="flex flex-col gap-6 relative z-10">
                                        {filteredTasks.map((task) => (
                                            <div key={task.id} className="flex gap-4 group">
                                                <div className="flex flex-col items-end w-16 flex-shrink-0 pt-1">
                                                    <span className={`text-sm font-bold ${task.status === 'completed' ? 'text-brand-muted line-through' : 'text-white'}`}>
                                                        {task.time}
                                                    </span>
                                                </div>

                                                <div className="relative flex-shrink-0 w-8 flex justify-center mt-1.5">
                                                    <div className={`w-3 h-3 rounded-full border-2 ${
                                                        task.status === 'completed' ? 'bg-brand-surface border-brand-muted' : 'bg-[#0A0A0B] border-brand-neon shadow-[0_0_8px_rgba(255,94,0,0.5)]'
                                                    } z-10`}></div>
                                                </div>

                                                <div className={`flex-1 p-4 rounded-xl border transition-all ${
                                                    task.status === 'completed' 
                                                        ? 'bg-brand-surface/20 border-brand-border/20 opacity-60' 
                                                        : 'bg-[#0A0A0B] border-brand-border/60 hover:border-brand-neon/40'
                                                }`}>
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex flex-col">
                                                            <h3 className={`text-base font-semibold mb-1 ${task.status === 'completed' ? 'text-brand-muted' : 'text-white'}`}>
                                                                {task.title}
                                                            </h3>
                                                            <div className="flex items-center gap-3 text-sm text-brand-muted">
                                                                <span className="flex items-center gap-1.5 font-medium">
                                                                    {getIconForType(task.type)}
                                                                    {task.client}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <button 
                                                            onClick={() => toggleTaskStatus(task.id, task.status)}
                                                            className={`p-2 rounded-lg transition-colors ${
                                                                task.status === 'completed' 
                                                                    ? 'text-green-500 bg-green-500/10' 
                                                                    : 'text-brand-muted hover:text-brand-neon hover:bg-brand-neon/10'
                                                            }`} 
                                                        >
                                                            {task.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* VIEWPORT: MOBILE (APP PATTERN NATIVO)                       */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full pb-2">
                
                {/* Cabeçalho Mobile */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-brand-neon" /> Agenda
                        </h1>
                        <p className="text-[11px] text-brand-muted mt-0.5">Seus compromissos</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-10 h-10 bg-brand-neon text-[#0A0A0B] rounded-full flex items-center justify-center shadow-lg shadow-brand-neon/20 active:scale-95 transition-transform"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Calendário Mobile */}
                <div className="glass-panel p-4 rounded-2xl border-brand-border/40 mb-6 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white font-bold tracking-wide capitalize text-sm">{months[month]} {year}</h2>
                        <div className="flex gap-1">
                            <button onClick={handlePrevMonth} className="p-1 text-brand-muted hover:text-white transition-colors rounded-lg bg-brand-surface/30"><ChevronLeft className="w-4 h-4" /></button>
                            <button onClick={handleNextMonth} className="p-1 text-brand-muted hover:text-white transition-colors rounded-lg bg-brand-surface/30"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {weekDays.map(day => (
                            <div key={day} className="text-[9px] font-bold text-brand-muted uppercase tracking-wider mb-2">
                                {day.substring(0, 3)}
                            </div>
                        ))}
                        
                        {blanks.map((blank) => (
                            <div key={`blank-${blank}`} className="p-1.5"></div>
                        ))}
                        
                        {calendarDays.map(day => {
                            const loopDate = new Date(year, month, day);
                            const isSelected = loopDate.toDateString() === selectedDate.toDateString();
                            const isToday = loopDate.toDateString() === new Date().toDateString();
                            const dateString = loopDate.toISOString().split('T')[0];
                            const hasEvent = tasks.some(t => t.date.startsWith(dateString));

                            return (
                                <button 
                                    key={day}
                                    onClick={() => setSelectedDate(loopDate)}
                                    className={`p-1.5 rounded-lg text-[13px] font-bold transition-all relative flex flex-col items-center justify-center h-10
                                        ${isSelected ? 'bg-brand-neon text-[#0A0A0B] shadow-md' : isToday ? 'border border-brand-neon text-white' : 'text-brand-text bg-brand-surface/20'}
                                    `}
                                >
                                    {day}
                                    {hasEvent && !isSelected && (
                                        <div className="w-1 h-1 bg-brand-neon rounded-full absolute bottom-1"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Lista de Tarefas Mobile */}
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b border-brand-border/20 pb-3">
                        <h2 className="text-[15px] font-bold text-white capitalize">
                            {weekDays[selectedDate.getDay()]}, {selectedDate.getDate()} de {months[selectedDate.getMonth()].substring(0, 3)}
                        </h2>
                        <span className="text-[11px] font-medium text-brand-muted bg-brand-surface/50 px-2 py-1 rounded-md">
                            {filteredTasks.filter(t => t.status === 'pending').length} pendentes
                        </span>
                    </div>

                    <div className="flex flex-col gap-3 relative min-h-[150px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-6">
                                <Loader2 className="w-6 h-6 text-brand-neon animate-spin mb-2" />
                                <span className="text-[10px] text-brand-muted uppercase font-bold tracking-widest">Carregando...</span>
                            </div>
                        ) : filteredTasks.length === 0 ? (
                            <div className="bg-[#111113]/50 border border-brand-border/20 rounded-2xl p-6 flex flex-col items-center text-center">
                                <CalendarIcon className="w-8 h-8 text-brand-border mb-2" />
                                <h3 className="text-[13px] font-bold text-white mb-1">Dia livre</h3>
                                <p className="text-[11px] text-brand-muted">Sem compromissos nesta data.</p>
                            </div>
                        ) : (
                            filteredTasks.map((task) => (
                                <div key={task.id} className={`bg-[#111113] border rounded-[16px] p-4 flex gap-3 shadow-md transition-all ${
                                    task.status === 'completed' ? 'border-white/5 opacity-60' : 'border-brand-border/40'
                                }`}>
                                    <div className="flex flex-col items-center min-w-[45px] shrink-0 pt-0.5">
                                        <span className={`text-[13px] font-black ${task.status === 'completed' ? 'text-brand-muted line-through' : 'text-brand-neon'}`}>
                                            {task.time}
                                        </span>
                                        <div className="mt-2 flex items-center justify-center w-8 h-8 rounded-full bg-[#0A0A0B] border border-white/5">
                                            {getIconForType(task.type)}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col flex-1 justify-center border-l border-white/5 pl-3">
                                        <h3 className={`text-[14px] font-bold leading-tight mb-1 ${task.status === 'completed' ? 'text-brand-muted' : 'text-white'}`}>
                                            {task.title}
                                        </h3>
                                        <span className="text-[11px] font-medium text-brand-muted">{task.client}</span>
                                    </div>

                                    <div className="shrink-0 flex items-center">
                                        <button 
                                            onClick={() => toggleTaskStatus(task.id, task.status)}
                                            className={`p-2.5 rounded-full transition-colors ${
                                                task.status === 'completed' 
                                                    ? 'text-green-500 bg-green-500/10' 
                                                    : 'text-brand-muted bg-[#0A0A0B] border border-white/5 shadow-inner active:scale-95'
                                            }`} 
                                        >
                                            {task.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 
                  Espaçador fantasma (Spacer) para garantir que a rolagem alcance o final da página
                  sem que o último card fique escondido pela barra de navegação global.
                */}
                <div className="h-[200px] w-full shrink-0 pointer-events-none" aria-hidden="true" />
            </div>

            {/* ========================================================= */}
            {/* MODAL GLOBAL (CRIAÇÃO DE TAREFA)                            */}
            {/* ========================================================= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0B]/80 backdrop-blur-md p-4">
                    <div className="bg-[#121214] border border-brand-border/40 rounded-[24px] p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-5 relative z-10">
                            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                <Plus className="w-5 h-5 text-brand-neon" /> Novo Compromisso
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-[#0A0A0B] rounded-full border border-white/5 text-brand-muted hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateTask} className="flex flex-col gap-4 relative z-10">
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 block ml-1">Título</label>
                                <input required type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl p-3 text-[13px] text-white outline-none focus:border-brand-neon transition-colors shadow-inner" placeholder="Ex: Apresentação de Proposta" />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 block ml-1">Cliente</label>
                                <input required type="text" value={newTask.client} onChange={e => setNewTask({...newTask, client: e.target.value})} className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl p-3 text-[13px] text-white outline-none focus:border-brand-neon transition-colors shadow-inner" placeholder="Ex: Construtora Apex" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 block ml-1">Horário</label>
                                    <input required type="time" value={newTask.time} onChange={e => setNewTask({...newTask, time: e.target.value})} className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl p-3 text-[13px] text-white outline-none focus:border-brand-neon transition-colors shadow-inner" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 block ml-1">Tipo</label>
                                    <select value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value as any})} className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-xl p-3 text-[13px] text-white outline-none focus:border-brand-neon transition-colors shadow-inner appearance-none">
                                        <option value="meeting">Reunião</option>
                                        <option value="call">Ligação</option>
                                        <option value="message">Mensagem</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="mt-4 w-full bg-brand-neon text-[#0A0A0B] font-black uppercase tracking-widest text-[13px] py-4 rounded-xl hover:bg-[#FF5E00]/90 transition-all shadow-[0_10px_25px_rgba(255,94,0,0.3)] active:scale-[0.98]">
                                Confirmar Agendamento
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}