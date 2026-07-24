import { useState, useEffect, useCallback, useRef } from 'react';
import { 
    User as UserIcon, 
    Mail, 
    ShoppingBag, 
    MapPin, 
    Edit2, 
    Check, 
    Loader2, 
    Calendar, 
    Clock, 
    ArrowRight,
    ArrowLeft,
    Send,
    MessageSquare,
    FileText,
    Paperclip
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { profileService } from '@/services/profile.service';
import { crmService } from '@/services/crm.service'; 
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/axios';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';
const socket: Socket = io(SOCKET_URL, { autoConnect: false });

interface ChatMessage {
    id: string;
    chatId: string;
    text?: string;
    time: string | Date;
    isSender: boolean;
    mediaUrl?: string;
    mediaType?: string;
}

export function UserProfile() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState<'data' | 'orders'>('data');
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [myOrders, setMyOrders] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', company: '',
    });

    const [activeOrder, setActiveOrder] = useState<any | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchProfileData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [profileData, ordersData] = await Promise.all([
                profileService.getProfile(),
                profileService.getMyOrders()
            ]);
            setFormData({
                name: profileData.name || '', email: profileData.email || '',
                phone: profileData.phone || '', company: profileData.company || '',
            });
            setMyOrders(ordersData);
        } catch (error) {
            console.error("Profile data fetch failed:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    useEffect(() => {
        if (!activeOrder) return;

        async function fetchMessages() {
            try {
                const history = await crmService.getChatHistory(activeOrder.id);
                const formattedMessages: ChatMessage[] = history.map((msg: any) => ({
                    id: msg.id,
                    chatId: msg.dealId,
                    text: msg.content,
                    time: msg.createdAt,
                    isSender: msg.senderId === user?.id,
                    mediaUrl: msg.mediaUrl,
                    mediaType: msg.mediaType
                }));
                setMessages(formattedMessages);
            } catch (error) {
                console.error("Message history fetch failed:", error);
            }
        }

        fetchMessages();
        socket.connect();
        socket.emit('join_chat', activeOrder.id);

        const handleReceiveMessage = (incomingMsg: any) => {
            if (incomingMsg.isInternal) return;
            setMessages(prev => [
                ...prev, 
                {
                    id: incomingMsg.id || Math.random().toString(),
                    chatId: incomingMsg.chatId,
                    text: incomingMsg.text,
                    time: incomingMsg.time || new Date(),
                    isSender: incomingMsg.senderId === user?.id,
                    mediaUrl: incomingMsg.mediaUrl,
                    mediaType: incomingMsg.mediaType
                }
            ]);
        };

        socket.on('receive_message', handleReceiveMessage);
        return () => {
            socket.emit('leave_chat', activeOrder.id);
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [activeOrder, user?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeOrder]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await profileService.updateProfile({
                name: formData.name, phone: formData.phone, company: formData.company
            });
            addToast('Perfil atualizado com sucesso!', 'success');
            setIsEditing(false);
        } catch (error) {
            addToast('Erro ao atualizar o perfil.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendMessage = (overridePayload?: any) => {
        if ((!chatInput.trim() && !overridePayload?.mediaUrl) || !activeOrder) return;

        const msgPayload = overridePayload || {
            chatId: activeOrder.id,
            text: chatInput.trim(),
            senderId: user?.id,
            isInternal: false
        };

        socket.emit('send_message', msgPayload);

        setMessages(prev => [
            ...prev,
            { 
                id: Math.random().toString(), 
                chatId: activeOrder.id, 
                text: msgPayload.text, 
                isSender: true, 
                time: new Date(),
                mediaUrl: msgPayload.mediaUrl,
                mediaType: msgPayload.mediaType
            }
        ]);

        setChatInput('');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeOrder) return;

        setIsUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const response = await api.post('/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            handleSendMessage({
                chatId: activeOrder.id,
                senderId: user?.id,
                isInternal: false,
                mediaUrl: response.data.url, 
                mediaType: file.type
            });
        } catch (error) {
            console.error('File upload failed', error);
            addToast('Falha ao enviar arquivo.', 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatTime = (dateInput: string | Date) => new Date(dateInput).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const translateStatus = (status: string) => {
        if (status === 'WON') return { text: 'Aprovado', color: 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20' };
        if (status === 'LOST') return { text: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
        return { text: 'Em Análise', color: 'bg-brand-neon/10 text-brand-neon border-brand-neon/20' };
    };

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-[#0A0A0B]">
                <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-5rem)] bg-[#0A0A0B] py-8 px-4 sm:px-6 mt-20">
            <div className="max-w-5xl mx-auto w-full animate-fade-in">
                
                {/* Profile Header */}
                <div className="glass-panel border-brand-border/40 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden mb-6">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-neon/5 rounded-full blur-[80px] pointer-events-none"></div>
                    <div className="w-24 h-24 rounded-full bg-[#111113] border-2 border-brand-neon/30 flex items-center justify-center text-3xl font-black text-brand-neon shadow-[0_0_20px_rgba(255,94,0,0.15)] flex-shrink-0 z-10">
                        {formData.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 text-center sm:text-left z-10 min-w-0">
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-1 truncate">{formData.name}</h1>
                        <p className="text-brand-neon text-sm font-medium uppercase tracking-widest mb-4">Cliente T3 OOH</p>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-brand-muted">
                            <span className="flex items-center gap-1.5 truncate"><Mail className="w-4 h-4 flex-shrink-0" /> {formData.email}</span>
                            <span className="flex items-center gap-1.5 flex-shrink-0"><Clock className="w-4 h-4" /> Conta Ativa</span>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center gap-2 mb-6 border-b border-brand-border/40 pb-px overflow-x-auto custom-scrollbar">
                    <button 
                        onClick={() => { setActiveTab('data'); setActiveOrder(null); }}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === 'data' ? 'text-brand-neon' : 'text-brand-muted hover:text-white'}`}
                    >
                        <UserIcon className="w-4 h-4" /> Meus Dados
                        {activeTab === 'data' && <motion.div layoutId="profileTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-neon rounded-t-full shadow-[0_-2px_10px_rgba(255,94,0,0.5)]" />}
                    </button>
                    <button 
                        onClick={() => setActiveTab('orders')}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === 'orders' ? 'text-brand-neon' : 'text-brand-muted hover:text-white'}`}
                    >
                        <ShoppingBag className="w-4 h-4" /> Meus Orçamentos
                        {activeTab === 'orders' && <motion.div layoutId="profileTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-neon rounded-t-full shadow-[0_-2px_10px_rgba(255,94,0,0.5)]" />}
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'data' && (
                        <motion.div 
                            key="data"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="glass-panel border-brand-border/40 rounded-2xl p-6 sm:p-8 relative"
                        >
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-border/30">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Informações Pessoais</h2>
                                    <p className="text-sm text-brand-muted mt-1">Gerencie seus dados de contato e acesso.</p>
                                </div>
                                <Button variant={isEditing ? 'primary' : 'secondary'} size="sm" onClick={() => !isEditing ? setIsEditing(true) : handleSaveProfile(new Event('submit') as any)} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? <><Check className="w-4 h-4 mr-2" /> Salvar</> : <><Edit2 className="w-4 h-4 mr-2" /> Editar</>}
                                </Button>
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[11px] font-bold text-brand-muted mb-2 uppercase tracking-widest">Nome Completo</label>
                                        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={!isEditing} className={!isEditing ? 'opacity-70 bg-transparent border-brand-border/30' : ''} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-brand-muted mb-2 uppercase tracking-widest">Email (Login)</label>
                                        <Input type="email" value={formData.email} disabled={true} className="opacity-50 cursor-not-allowed bg-transparent border-brand-border/30" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-brand-muted mb-2 uppercase tracking-widest">WhatsApp / Celular</label>
                                        <Input placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={!isEditing} className={!isEditing ? 'opacity-70 bg-transparent border-brand-border/30' : ''} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-brand-muted mb-2 uppercase tracking-widest">Empresa / Agência</label>
                                        <Input placeholder="Sua empresa" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} disabled={!isEditing} className={!isEditing ? 'opacity-70 bg-transparent border-brand-border/30' : ''} />
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="pt-6 border-t border-brand-border/30 flex justify-end gap-3 mt-8">
                                        <Button variant="ghost" onClick={() => { setIsEditing(false); fetchProfileData(); }}>Cancelar</Button>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? 'Salvando...' : 'Confirmar Alterações'}
                                        </Button>
                                    </div>
                                )}
                            </form>
                        </motion.div>
                    )}

                    {activeTab === 'orders' && (
                        <motion.div 
                            key="orders"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="glass-panel border-brand-border/40 rounded-2xl overflow-hidden flex flex-col"
                        >
                            {/* ACTIVE CHAT VIEWPORT */}
                            {activeOrder ? (
                                <div className="flex flex-col h-[60vh] min-h-[400px] max-h-[800px] w-full bg-[#0A0A0B]/80">
                                    <div className="p-3 sm:p-4 border-b border-brand-border/40 bg-[#0A0A0B] flex items-center justify-between">
                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                            <button onClick={() => setActiveOrder(null)} className="p-1.5 sm:p-2 hover:bg-brand-surface rounded-lg text-brand-muted hover:text-white transition-colors flex-shrink-0">
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                            <div className="min-w-0">
                                                <h2 className="font-bold text-white text-xs sm:text-sm truncate">Orçamento #{activeOrder.id.substring(0,6).toUpperCase()}</h2>
                                                <p className="text-[9px] sm:text-[10px] text-brand-muted uppercase tracking-widest mt-0.5 truncate">Comercial T3 OOH</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
                                        {messages.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-brand-muted opacity-50 px-4 text-center">
                                                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mb-4" />
                                                <p className="text-sm">O atendimento será iniciado em breve.</p>
                                            </div>
                                        ) : (
                                            messages.map((msg, idx) => (
                                                <div key={idx} className={`flex ${msg.isSender ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 break-words ${
                                                        msg.isSender ? 'bg-brand-neon/10 text-brand-text border border-brand-neon/20 rounded-tr-sm' : 'bg-[#111113] border border-brand-border/50 text-white rounded-tl-sm'
                                                    }`}>
                                                        {msg.mediaUrl && (
                                                            <div className="mb-2 mt-1">
                                                                {msg.mediaType?.includes('image') ? (
                                                                    <img src={msg.mediaUrl} alt="Upload" className="max-w-xs w-full rounded-lg border border-brand-border/50 object-cover" />
                                                                ) : (
                                                                    <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#0A0A0B]/50 p-2.5 rounded-lg border border-brand-border/50 hover:border-brand-neon/50 overflow-hidden">
                                                                        <FileText className="w-4 h-4 text-brand-neon flex-shrink-0" />
                                                                        <span className="text-xs underline text-blue-400 truncate">Ver Anexo</span>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                        {msg.text && <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                                                        <span className="text-[9px] mt-1.5 block font-bold text-brand-muted text-right">
                                                            {formatTime(msg.time)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    <div className="p-3 sm:p-4 bg-[#0A0A0B] border-t border-brand-border/40 flex-shrink-0">
                                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="p-2 sm:p-3 bg-brand-surface rounded-xl text-brand-muted hover:text-white transition-colors disabled:opacity-50 flex-shrink-0">
                                                {isUploading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />}
                                            </button>
                                            <input
                                                type="text"
                                                value={chatInput}
                                                onChange={(e) => setChatInput(e.target.value)}
                                                placeholder="Responda ao vendedor..."
                                                className="flex-1 bg-brand-surface border border-brand-border/50 rounded-xl px-3 sm:px-4 text-xs sm:text-sm text-white focus:outline-none focus:border-brand-neon transition-colors w-full"
                                            />
                                            <button type="submit" disabled={!chatInput.trim() && !isUploading} className="p-2 sm:p-3 bg-brand-neon hover:bg-[#e05300] disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl transition-all shadow-[0_0_15px_rgba(255,94,0,0.2)] flex-shrink-0">
                                                <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ) : (
                                /* DEALS LIST VIEWPORT */
                                <div className="p-4 sm:p-8">
                                    <div className="mb-8">
                                        <h2 className="text-xl font-bold text-white">Histórico de Orçamentos</h2>
                                        <p className="text-sm text-brand-muted mt-1">Acompanhe o status das suas solicitações feitas no Mapa.</p>
                                    </div>

                                    {myOrders.length === 0 ? (
                                        <div className="py-16 flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 rounded-full bg-brand-surface border border-brand-border/50 flex items-center justify-center mb-4">
                                                <ShoppingBag className="w-8 h-8 text-brand-muted" />
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-2">Nenhum orçamento solicitado</h3>
                                            <p className="text-sm text-brand-muted max-w-md mb-6">Você ainda não solicitou nenhum orçamento.</p>
                                            <Button onClick={() => navigate('/mapa')} rightIcon={<ArrowRight className="w-4 h-4" />}>
                                                Acessar Mapa de Painéis
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {myOrders.map(order => {
                                                const statusBadge = translateStatus(order.status);
                                                return (
                                                    <div key={order.id} className="bg-[#111113] border border-brand-border/50 rounded-xl p-4 sm:p-5 hover:border-brand-neon/30 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 group">
                                                        <div className="flex flex-col gap-1 min-w-0">
                                                            <div className="flex items-center gap-3">
                                                                <h4 className="font-bold text-white text-sm truncate">Ticket #{order.id.substring(0, 6).toUpperCase()}</h4>
                                                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border flex-shrink-0 ${statusBadge.color}`}>
                                                                    {statusBadge.text}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-xs text-brand-muted mt-2">
                                                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                                                                <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {order.items?.length || 0} Painéis</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 sm:gap-6 justify-between lg:justify-end border-t lg:border-t-0 border-brand-border/30 pt-4 lg:pt-0 mt-2 lg:mt-0">
                                                            <div className="flex flex-col lg:items-end">
                                                                <span className="text-[9px] sm:text-[10px] text-brand-muted uppercase tracking-widest font-bold">Investimento</span>
                                                                <span className="text-base sm:text-lg font-black text-white">{formatCurrency(order.expectedValue || 0)}</span>
                                                            </div>
                                                            <button onClick={() => setActiveOrder(order)} className="text-brand-neon hover:text-white transition-colors text-xs sm:text-sm font-bold flex items-center gap-1 bg-brand-neon/5 hover:bg-brand-neon/10 px-3 sm:px-4 py-2 rounded-lg border border-brand-neon/20 flex-shrink-0">
                                                                Acompanhar <ArrowRight className="w-4 h-4 ml-1" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}