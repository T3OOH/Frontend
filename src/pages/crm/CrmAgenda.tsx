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
    Loader2
} from 'lucide-react';

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

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

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

    const selectedDateString = selectedDate.toISOString().split('T')[0];
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => t.date.startsWith(selectedDateString));
    }, [tasks, selectedDateString]);

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

    const getIconForType = (type: string) => {
        switch(type) {
            case 'call': return <PhoneCall className="w-4 h-4 text-blue-500" />;
            case 'meeting': return <Users className="w-4 h-4 text-purple-500" />;
            case 'message': return <MessageSquare className="w-4 h-4 text-[#25D366]" />;
            default: return <Clock className="w-4 h-4 text-brand-muted" />;
        }
    };

    return (
        <div className="w-full h-full flex flex-col relative animate-fade-in gap-6">
            
            {/* ========================================================= */}
            {/* VIEWPORT: DESKTOP                                         */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-col h-full max-w-7xl mx-auto w-full gap-6">
                
                {/* CABEÇALHO */}
                <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-text tracking-tight flex items-center gap-2">
                            <CalendarIcon className="w-6 h-6 text-brand-neon" />
                            Agenda & Tarefas
                        </h1>
                        <p className="text-sm text-brand-muted mt-1 font-medium">Acompanhe seus compromissos e follow-ups comerciais.</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-brand-neon text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-neonHover transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Compromisso
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 h-[calc(100%-5rem)] min-h-[600px] pb-8">
                    
                    {/* COLUNA ESQUERDA: CALENDÁRIO */}
                    <div className="w-full lg:w-[340px] flex-shrink-0 flex flex-col gap-6">
                        <div className="bg-brand-surface p-6 rounded-[24px] border border-brand-border shadow-sm transition-colors">
                            
                            <div className="flex items-center justify-between mb-6 border-b border-brand-border pb-4">
                                <h2 className="text-brand-text font-bold tracking-tight capitalize text-lg">{months[month]} {year}</h2>
                                <div className="flex gap-2">
                                    <button onClick={handlePrevMonth} className="p-1.5 text-brand-muted hover:text-brand-text transition-colors rounded-lg hover:bg-brand-background border border-transparent hover:border-brand-border"><ChevronLeft className="w-4 h-4" /></button>
                                    <button onClick={handleNextMonth} className="p-1.5 text-brand-muted hover:text-brand-text transition-colors rounded-lg hover:bg-brand-background border border-transparent hover:border-brand-border"><ChevronRight className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {weekDays.map(day => (
                                    <div key={day} className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-3">
                                        {day.substring(0, 3)}
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
                                            className={`p-2 rounded-xl text-sm font-bold transition-all relative flex flex-col items-center justify-center h-10 w-full
                                                ${isSelected 
                                                    ? 'bg-brand-neon text-white shadow-md' 
                                                    : isToday 
                                                        ? 'border border-brand-neon text-brand-neon bg-brand-neon/5' 
                                                        : 'text-brand-text hover:bg-brand-background hover:border-brand-border border border-transparent'}
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
                    <div className="flex-1 bg-brand-surface rounded-[24px] border border-brand-border p-6 md:p-8 flex flex-col relative overflow-hidden shadow-sm transition-colors">
                        
                        <div className="flex items-center justify-between mb-6 border-b border-brand-border pb-5 shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-brand-text capitalize tracking-tight">
                                    {weekDays[selectedDate.getDay()]}-feira, {selectedDate.getDate()} de {months[selectedDate.getMonth()]}
                                </h2>
                                <p className="text-sm text-brand-muted font-medium mt-1">
                                    {filteredTasks.filter(t => t.status === 'pending').length} tarefas pendentes para hoje
                                </p>
                            </div>
                            <div className="bg-brand-background p-3 rounded-[16px] border border-brand-border shadow-sm">
                                <CalendarIcon className="w-6 h-6 text-brand-neon" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 relative">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="w-8 h-8 text-brand-neon animate-spin mb-4" />
                                </div>
                            ) : filteredTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-brand-background/50 border-2 border-dashed border-brand-border rounded-[24px]">
                                    <CalendarIcon className="w-10 h-10 text-brand-muted opacity-50 mb-3" />
                                    <p className="text-brand-muted font-bold">Nenhuma tarefa para este dia.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Linha do tempo visual (opcional/decorativa) */}
                                    <div className="absolute left-[39px] top-4 bottom-4 w-px bg-brand-border z-0 hidden sm:block"></div>
                                    
                                    <div className="flex flex-col gap-5 relative z-10">
                                        {filteredTasks.map((task) => (
                                            <div key={task.id} className="flex gap-4 sm:gap-6 group">
                                                
                                                <div className="flex flex-col items-end w-12 sm:w-16 flex-shrink-0 pt-3">
                                                    <span className={`text-sm font-black tracking-tight ${task.status === 'completed' ? 'text-brand-muted line-through' : 'text-brand-text'}`}>
                                                        {task.time}
                                                    </span>
                                                </div>

                                                <div className="relative flex-shrink-0 w-8 justify-center mt-3 hidden sm:flex">
                                                    <div className={`w-3 h-3 rounded-full border-2 ${
                                                        task.status === 'completed' ? 'bg-brand-surface border-brand-border' : 'bg-brand-background border-brand-neon shadow-[0_0_8px_rgba(255,94,0,0.4)]'
                                                    } z-10`}></div>
                                                </div>

                                                <div className={`flex-1 p-5 rounded-[20px] border shadow-sm transition-all ${
                                                    task.status === 'completed' 
                                                        ? 'bg-brand-background/50 border-brand-border/50 opacity-70' 
                                                        : 'bg-brand-background border-brand-border hover:border-brand-neon/40'
                                                }`}>
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex flex-col">
                                                            <h3 className={`text-base font-bold mb-1.5 leading-tight ${task.status === 'completed' ? 'text-brand-muted' : 'text-brand-text'}`}>
                                                                {task.title}
                                                            </h3>
                                                            <div className="flex items-center gap-3 text-sm text-brand-muted font-medium">
                                                                <span className="flex items-center gap-1.5 bg-brand-surface border border-brand-border px-2 py-1 rounded-md">
                                                                    {getIconForType(task.type)}
                                                                    {task.client}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <button 
                                                            onClick={() => toggleTaskStatus(task.id, task.status)}
                                                            className={`p-2.5 rounded-full transition-all border ${
                                                                task.status === 'completed' 
                                                                    ? 'text-[#25D366] bg-[#25D366]/10 border-[#25D366]/20' 
                                                                    : 'text-brand-muted hover:text-brand-neon hover:bg-brand-neon/10 border-transparent hover:border-brand-neon/20 bg-brand-surface shadow-sm'
                                                            }`} 
                                                            title={task.status === 'completed' ? "Marcar como pendente" : "Concluir tarefa"}
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
            <div className="flex lg:hidden flex-col w-full gap-4 pb-[100px]">
                
                {/* Cabeçalho Mobile */}
                <div className="flex items-center justify-between mt-2 px-4">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-text tracking-tight flex items-center gap-2">
                            Agenda
                        </h1>
                        <p className="text-[11px] font-medium text-brand-muted mt-0.5">Seus compromissos</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-12 h-12 bg-brand-neon text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                {/* Calendário Mobile */}
                <div className="bg-brand-surface p-5 rounded-[24px] border border-brand-border shadow-sm mx-4 transition-colors">
                    <div className="flex items-center justify-between mb-5 border-b border-brand-border pb-3">
                        <h2 className="text-brand-text font-bold tracking-tight capitalize text-[15px]">{months[month]} {year}</h2>
                        <div className="flex gap-2">
                            <button onClick={handlePrevMonth} className="p-1.5 text-brand-muted hover:text-brand-text transition-colors rounded-lg bg-brand-background border border-brand-border"><ChevronLeft className="w-4 h-4" /></button>
                            <button onClick={handleNextMonth} className="p-1.5 text-brand-muted hover:text-brand-text transition-colors rounded-lg bg-brand-background border border-brand-border"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {weekDays.map(day => (
                            <div key={day} className="text-[9px] font-bold text-brand-muted uppercase tracking-widest mb-2">
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
                                    className={`p-1.5 rounded-xl text-[13px] font-bold transition-all relative flex flex-col items-center justify-center h-10 w-full
                                        ${isSelected 
                                            ? 'bg-brand-neon text-white shadow-md' 
                                            : isToday 
                                                ? 'border border-brand-neon text-brand-neon bg-brand-neon/5' 
                                                : 'text-brand-text bg-brand-background border border-transparent'
                                        }
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
                <div className="flex flex-col px-4">
                    <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-3">
                        <h2 className="text-[15px] font-bold text-brand-text capitalize tracking-tight">
                            {weekDays[selectedDate.getDay()]}, {selectedDate.getDate()} de {months[selectedDate.getMonth()].substring(0, 3)}
                        </h2>
                        <span className="text-[10px] font-bold text-brand-muted bg-brand-surface border border-brand-border px-2.5 py-1 rounded-md shadow-sm">
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
                            <div className="bg-brand-surface border border-brand-border rounded-[24px] p-6 flex flex-col items-center text-center shadow-sm">
                                <CalendarIcon className="w-8 h-8 text-brand-muted opacity-50 mb-2" />
                                <h3 className="text-[13px] font-bold text-brand-text mb-1">Dia livre</h3>
                                <p className="text-[11px] text-brand-muted font-medium">Sem compromissos nesta data.</p>
                            </div>
                        ) : (
                            filteredTasks.map((task) => (
                                <div key={task.id} className={`bg-brand-surface border rounded-[20px] p-4 flex gap-3 shadow-sm transition-all ${
                                    task.status === 'completed' ? 'border-brand-border/50 opacity-70 bg-brand-background/50' : 'border-brand-border'
                                }`}>
                                    <div className="flex flex-col items-center min-w-[45px] shrink-0 pt-0.5">
                                        <span className={`text-[13px] font-black ${task.status === 'completed' ? 'text-brand-muted line-through' : 'text-brand-text'}`}>
                                            {task.time}
                                        </span>
                                        <div className="mt-2 flex items-center justify-center w-8 h-8 rounded-full bg-brand-background border border-brand-border shadow-sm">
                                            {getIconForType(task.type)}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col flex-1 justify-center border-l border-brand-border pl-4">
                                        <h3 className={`text-[14px] font-bold leading-tight mb-1.5 ${task.status === 'completed' ? 'text-brand-muted' : 'text-brand-text'}`}>
                                            {task.title}
                                        </h3>
                                        <span className="text-[11px] font-bold text-brand-muted bg-brand-background w-fit px-2 py-1 rounded border border-brand-border shadow-sm">
                                            {task.client}
                                        </span>
                                    </div>

                                    <div className="shrink-0 flex items-center">
                                        <button 
                                            onClick={() => toggleTaskStatus(task.id, task.status)}
                                            className={`p-2.5 rounded-full transition-colors border shadow-sm ${
                                                task.status === 'completed' 
                                                    ? 'text-[#25D366] bg-[#25D366]/10 border-[#25D366]/20' 
                                                    : 'text-brand-muted bg-brand-background border-brand-border active:scale-95'
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
            </div>

            {/* ========================================================= */}
            {/* MODAL GLOBAL (CRIAÇÃO DE TAREFA)                            */}
            {/* ========================================================= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-brand-background/80 backdrop-blur-md p-4">
                    <div className="bg-brand-surface border border-brand-border rounded-[24px] p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden transition-colors">
                        <div className="flex items-center justify-between mb-6 relative z-10 border-b border-brand-border pb-4">
                            <h3 className="text-lg font-bold text-brand-text tracking-tight flex items-center gap-2">
                                <Plus className="w-5 h-5 text-brand-neon" /> Novo Compromisso
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-brand-background rounded-full border border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-neon/50 transition-colors shadow-sm">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateTask} className="flex flex-col gap-4 relative z-10">
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 block ml-1">Título</label>
                                <input required type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-brand-background border border-brand-border rounded-xl p-3.5 text-[13px] text-brand-text outline-none focus:border-brand-neon transition-colors shadow-sm" placeholder="Ex: Apresentação de Proposta" />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 block ml-1">Cliente</label>
                                <input required type="text" value={newTask.client} onChange={e => setNewTask({...newTask, client: e.target.value})} className="w-full bg-brand-background border border-brand-border rounded-xl p-3.5 text-[13px] text-brand-text outline-none focus:border-brand-neon transition-colors shadow-sm" placeholder="Ex: Construtora Apex" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 block ml-1">Horário</label>
                                    <input required type="time" value={newTask.time} onChange={e => setNewTask({...newTask, time: e.target.value})} className="w-full bg-brand-background border border-brand-border rounded-xl p-3.5 text-[13px] text-brand-text outline-none focus:border-brand-neon transition-colors shadow-sm" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 block ml-1">Tipo</label>
                                    <select value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value as any})} className="w-full bg-brand-background border border-brand-border rounded-xl p-3.5 text-[13px] text-brand-text outline-none focus:border-brand-neon transition-colors shadow-sm">
                                        <option value="meeting">Reunião</option>
                                        <option value="call">Ligação</option>
                                        <option value="message">Mensagem</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="mt-6 w-full bg-brand-neon text-white font-bold uppercase tracking-widest text-[13px] py-4 rounded-xl hover:bg-brand-neonHover transition-all shadow-md active:scale-[0.98]">
                                Confirmar Agendamento
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}