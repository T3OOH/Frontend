import { api } from '@/lib/axios';

// Exportamos a interface para poder usá-la nos componentes
export interface Task {
    id: string;
    title: string;
    client: string;
    time: string;
    date: string;
    type: 'call' | 'meeting' | 'message' | 'task';
    status: 'pending' | 'completed' | 'overdue';
}

export interface CreateTaskDTO {
    title: string;
    client: string;
    time: string;
    date: string;
    type: string;
}

export const agendaService = {
    // Busca todas as tarefas
    async getTasks(): Promise<Task[]> {
        const response = await api.get('/agenda');
        return response.data;
    },

    // Cria uma nova tarefa
    async createTask(data: CreateTaskDTO): Promise<Task> {
        const response = await api.post('/agenda', data);
        return response.data;
    },

    // Alterna o status da tarefa
    async toggleTaskStatus(id: string, status: string): Promise<Task> {
        const response = await api.patch(`/agenda/${id}/toggle`, { status });
        return response.data;
    }
};