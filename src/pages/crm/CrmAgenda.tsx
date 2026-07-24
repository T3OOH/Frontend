import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
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
    X
} from 'lucide-react';

interface Task {
    id: string;
    title: string;
    client: string;
    time: string;
    date: string;
    type: 'call' | 'meeting' | 'message' | 'task';
    status: 'pending' | 'completed' | 'overdue';
}

export function CrmAgenda() {
    // Estados do Calendário
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    // Estados dos Dados
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Estado do Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '', client: '', time: '09:00', type: 'meeting'
    });

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    // Lógica do Calendário
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);
    const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Navegação de Meses
    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // Buscar tarefas na API
    const fetchTasks = async () => {
        try {
            const response = await axios.get('http://localhost:3333/agenda');
            setTasks(response.data);
        } catch (error) {
            console.error("Erro ao buscar tarefas", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    // Filtrar tarefas pelo dia selecionado
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => t.date.startsWith(selectedDateString));
    }, [tasks, selectedDateString]);

    // Alternar Status da Tarefa
    const toggleTaskStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        
        // Atualiza a UI imediatamente para sensação de tempo real
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));

        try {
            await axios.patch(`http://localhost:3333/agenda/${id}/toggle`, { status: newStatus });
        } catch (error) {
            console.error("Erro ao atualizar status", error);
            fetchTasks(); // Reverte em caso de erro
        }
    };

    // Criar Nova Tarefa
    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3333/agenda', {
                ...newTask,
                date: selectedDate.toISOString()
            });
            setTasks([...tasks, response.data]);
            setIsModalOpen(false);
            setNewTask({ title: '', client: '', time: '09:00', type: 'meeting' });
        } catch (error) {
            console.error("Erro ao criar tarefa", error);
        }
    };

    const getIconForType = (type: string) => {
        switch(type) {
            case 'call': return <PhoneCall className="w-4 h-4 text-blue-400" />;
            case 'meeting': return <Users className="w-4 h-4 text-purple-400" />;
            case 'message': return <MessageSquare className="w-4 h-4 text-green-400" />;
            default: return <Clock className="w-4 h-4 text-brand-muted" />;
        }
    };

    return (
        <div className="flex flex-col h-full max-w-7xl mx-auto w-full animate-fade-in relative">
            
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
                        {/* Mês/Ano Controles */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-white font-bold tracking-wide capitalize">{months[month]} {year}</h2>
                            <div className="flex gap-1">
                                <button onClick={handlePrevMonth} className="p-1 text-brand-muted hover:text-white transition-colors rounded-lg hover:bg-brand-surface"><ChevronLeft className="w-5 h-5" /></button>
                                <button onClick={handleNextMonth} className="p-1 text-brand-muted hover:text-white transition-colors rounded-lg hover:bg-brand-surface"><ChevronRight className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Grid do Calendário */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {weekDays.map(day => (
                                <div key={day} className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-2">
                                    {day}
                                </div>
                            ))}
                            
                            {/* Espaços vazios iniciais */}
                            {blanks.map((blank) => (
                                <div key={`blank-${blank}`} className="p-2"></div>
                            ))}
                            
                            {/* Dias do Mês */}
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

            {/* MODAL NOVO COMPROMISSO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#121214] border border-brand-border/40 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Novo Compromisso</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-brand-muted hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
                            <div>
                                <label className="text-sm text-brand-muted mb-1 block">Título</label>
                                <input required type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-lg p-2 text-white outline-none focus:border-brand-neon" placeholder="Ex: Apresentação de Proposta" />
                            </div>
                            <div>
                                <label className="text-sm text-brand-muted mb-1 block">Cliente</label>
                                <input required type="text" value={newTask.client} onChange={e => setNewTask({...newTask, client: e.target.value})} className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-lg p-2 text-white outline-none focus:border-brand-neon" placeholder="Ex: Construtora Apex" />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-sm text-brand-muted mb-1 block">Horário</label>
                                    <input required type="time" value={newTask.time} onChange={e => setNewTask({...newTask, time: e.target.value})} className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-lg p-2 text-white outline-none focus:border-brand-neon" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-sm text-brand-muted mb-1 block">Tipo</label>
                                    <select value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value as any})} className="w-full bg-[#0A0A0B] border border-brand-border/40 rounded-lg p-2 text-white outline-none focus:border-brand-neon">
                                        <option value="meeting">Reunião</option>
                                        <option value="call">Ligação</option>
                                        <option value="message">Mensagem</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="mt-2 w-full bg-brand-neon text-[#0A0A0B] font-bold py-2.5 rounded-xl hover:bg-brand-neon/90 transition-colors">
                                Salvar Compromisso
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}