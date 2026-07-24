import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { api } from '@/lib/axios';
import { crmService } from '@/services/crm.service';
import { 
    Search, 
    Paperclip,
    Send, 
    Check, 
    CheckCheck, 
    Lock, 
    LockOpen, 
    FileText, 
    ShoppingCart, 
    Tag, 
    ShoppingBag,
    MessageSquare,
    ArrowLeft,
    Download
} from 'lucide-react';
import { Button } from '@/components/Button';

// Setup Socket Connection
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';
const socket: Socket = io(SOCKET_URL, { autoConnect: false });

interface ChatContact {
    id: string; 
    name: string;
    company: string;
    lastMessage: string;
    time: string | Date;
    unread: number;
    online: boolean;
    status: string; 
    dealItems: any[]; 
}

interface ChatMessage {
    id: string;
    chatId: string;
    text?: string;
    time: string | Date;
    isSender: boolean;
    status: 'sent' | 'delivered' | 'read';
    isInternal: boolean;
    mediaUrl?: string;
    mediaType?: string;
}

export function CrmChat() {
    const { user } = useAuth();
    const { addToast } = useToast();
    
    const [searchParams] = useSearchParams();
    const urlDealId = searchParams.get('dealId'); 
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [contacts, setContacts] = useState<ChatContact[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [activeChat, setActiveChat] = useState<string>('');
    const [messageInput, setMessageInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isInternalMode, setIsInternalMode] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showDealDetails, setShowDealDetails] = useState(true);

    const currentContact = contacts.find(c => c.id === activeChat);

    // Initial structure fetch
    useEffect(() => {
        async function fetchContacts() {
            try {
                setIsLoading(true);
                const deals = await crmService.getDeals();
                
                const formattedContacts: ChatContact[] = deals.map(deal => ({
                    id: deal.id,
                    name: deal.client?.name || 'Cliente',
                    company: '',
                    lastMessage: '', 
                    time: deal.updatedAt,
                    unread: 0,
                    online: true,
                    status: deal.status,
                    dealItems: (deal as any).items || [] 
                }));

                setContacts(formattedContacts);
                
                if (urlDealId && formattedContacts.some(c => c.id === urlDealId)) {
                    setActiveChat(urlDealId);
                } else if (formattedContacts.length > 0) {
                    setActiveChat(formattedContacts[0].id);
                }
            } catch (error) {
                console.error("Deal fetch failed:", error);
                addToast('Erro ao carregar tickets.', 'error');
            } finally {
                setIsLoading(false);
            }
        }
        fetchContacts();
    }, [urlDealId, addToast]);

    // WebSocket & History sync
    useEffect(() => {
        if (!activeChat) return;

        async function fetchMessages() {
            try {
                const history = await crmService.getChatHistory(activeChat);
                const formattedMessages: ChatMessage[] = history.map((msg: any) => ({
                    id: msg.id,
                    chatId: msg.dealId,
                    text: msg.content,
                    time: msg.createdAt,
                    isSender: msg.senderId === user?.id,
                    status: msg.isRead ? 'read' : 'delivered',
                    isInternal: msg.isInternal,
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
        socket.emit('join_chat', activeChat);

        const handleReceiveMessage = (incomingMsg: any) => {
            setMessages(prev => [
                ...prev, 
                {
                    id: incomingMsg.id || Math.random().toString(),
                    chatId: incomingMsg.chatId,
                    text: incomingMsg.text,
                    time: incomingMsg.time || new Date(),
                    isSender: incomingMsg.senderId === user?.id,
                    status: 'delivered',
                    isInternal: incomingMsg.isInternal || false,
                    mediaUrl: incomingMsg.mediaUrl,
                    mediaType: incomingMsg.mediaType
                }
            ]);
        };

        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.emit('leave_chat', activeChat);
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [activeChat, user?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Função para forçar o Download do Arquivo via Blob
    const handleDownload = async (fileUrl: string, defaultName: string) => {
        try {
            const urlName = fileUrl.split('/').pop() || defaultName;
            
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = urlName; 
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erro ao baixar arquivo', error);
            addToast('Erro ao realizar o download. Tente novamente.', 'error');
        }
    };

    // Dispatch messages
    const handleSendMessage = (overridePayload?: any) => {
        if ((!messageInput.trim() && !overridePayload?.mediaUrl) || !activeChat) return;

        const msgPayload = overridePayload || {
            chatId: activeChat,
            text: messageInput.trim(),
            senderId: user?.id || 'me',
            isInternal: isInternalMode
        };

        socket.emit('send_message', msgPayload);

        setMessages(prev => [
            ...prev,
            { 
                id: Math.random().toString(), 
                chatId: activeChat, 
                text: msgPayload.text, 
                isSender: true, 
                time: new Date(),
                status: 'sent',
                isInternal: msgPayload.isInternal || false,
                mediaUrl: msgPayload.mediaUrl,
                mediaType: msgPayload.mediaType
            }
        ]);

        setMessageInput('');
        if (!overridePayload) setIsInternalMode(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeChat) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            handleSendMessage({
                chatId: activeChat,
                senderId: user?.id || 'me',
                isInternal: false,
                mediaUrl: response.data.url, 
                mediaType: file.type
            });
        } catch (error) {
            console.error('Upload failed', error);
            addToast('Falha ao enviar arquivo.', 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : '??';
    const formatTime = (dateInput: string | Date) => new Date(dateInput).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div className="w-8 h-8 border-4 border-brand-neon border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-6rem)] min-h-[500px] gap-4 animate-fade-in w-full max-w-[1600px] mx-auto">
            {/* Context Sidebar: Tickets List */}
            <div className={`w-full lg:w-80 flex-shrink-0 flex-col glass-panel rounded-2xl border-brand-border/40 overflow-hidden ${activeChat ? 'hidden lg:flex' : 'flex'}`}>
                <div className="p-4 border-b border-brand-border/40 bg-[#0A0A0B]/50">
                    <h2 className="text-lg font-bold text-white mb-4">Tickets Comerciais</h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input placeholder="Buscar oportunidade..." className="w-full bg-[#0A0A0B] border border-brand-border/60 rounded-xl pl-9 pr-4 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-neon" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {contacts.length === 0 ? (
                        <div className="text-center text-sm text-brand-muted mt-10">Nenhum ticket encontrado.</div>
                    ) : (
                        contacts.map((contact) => (
                            <div key={contact.id} onClick={() => setActiveChat(contact.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-1 transition-all ${activeChat === contact.id ? 'bg-brand-neon/10 border border-brand-neon/20' : 'hover:bg-brand-surface/40 border border-transparent'}`}>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-sm font-semibold truncate ${activeChat === contact.id ? 'text-brand-neon' : 'text-white'}`}>{contact.name}</h3>
                                    <p className="text-xs text-brand-muted truncate">ID: {contact.id.substring(0, 6).toUpperCase()}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Viewport: Chat Area */}
            <div className={`flex-1 flex-col glass-panel rounded-2xl border-brand-border/40 overflow-hidden relative min-w-0 ${!activeChat ? 'hidden lg:flex' : 'flex'}`}>
                {currentContact ? (
                    <>
                        <div className="p-3 sm:p-4 border-b border-brand-border/40 bg-[#0A0A0B]/80 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <button className="lg:hidden p-2 text-brand-muted hover:text-white" onClick={() => setActiveChat('')}>
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-xs font-bold text-brand-text">
                                    {getInitials(currentContact.name)}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm font-bold text-white truncate">{currentContact.name}</h2>
                                    <p className="text-xs text-brand-muted truncate">Lead via Plataforma</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                                <Button variant="secondary" size="sm" onClick={() => setShowDealDetails(!showDealDetails)} className="text-xs px-2 sm:px-3">
                                    <ShoppingBag className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Contexto</span>
                                </Button>
                            </div>
                        </div>

                        {/* Messages Canvas */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 bg-[#0A0A0B]/30 custom-scrollbar">
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-brand-muted opacity-60">
                                    <MessageSquare className="w-12 h-12 mb-3" />
                                    <p className="text-center text-sm px-4">Nenhuma mensagem neste chat ainda.</p>
                                </div>
                            )}
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.isSender ? 'justify-end' : 'justify-start'} ${msg.isInternal ? 'w-full justify-center my-2' : ''}`}>
                                    <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 break-words ${msg.isInternal ? 'bg-amber-500/10 border border-amber-500/30 text-amber-50 rounded-2xl' : msg.isSender ? 'bg-brand-neon/10 border border-brand-neon/20 text-brand-text rounded-tr-sm' : 'bg-brand-surface border border-brand-border/50 text-brand-text rounded-tl-sm'}`}>
                                        
                                        {msg.isInternal && (
                                            <div className="flex items-center gap-1.5 text-amber-500 mb-1 border-b border-amber-500/20 pb-1">
                                                <Lock className="w-3 h-3" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Nota Interna</span>
                                            </div>
                                        )}

                                        {msg.mediaUrl && (
                                            <div className="mb-2 mt-1">
                                                {msg.mediaType?.includes('image') ? (
                                                    <img src={msg.mediaUrl} alt="Upload" className="max-w-xs w-full rounded-lg border border-brand-border/50 object-cover" />
                                                ) : msg.mediaType?.includes('pdf') ? (
                                                    <div className="flex flex-col gap-2">
                                                        {/* Preview do PDF via object em vez de iframe */}
                                                        <div className="relative w-48 sm:w-56 h-64 rounded-lg overflow-hidden border border-brand-border/50 bg-[#111113]">
                                                            <object 
                                                                data={`${msg.mediaUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
                                                                type="application/pdf"
                                                                className="w-full h-full pointer-events-none opacity-90" 
                                                            >
                                                                <div className="flex items-center justify-center h-full bg-brand-surface text-brand-muted text-xs p-4 text-center">
                                                                    Prévia indisponível.<br/>Faça o download.
                                                                </div>
                                                            </object>
                                                            <div className="absolute inset-0 z-10 bg-transparent"></div>
                                                        </div>
                                                        {/* Botão de Download */}
                                                        <button 
                                                            onClick={(e) => { e.preventDefault(); handleDownload(msg.mediaUrl!, `Documento-${msg.id}.pdf`); }}
                                                            className="flex items-center justify-center gap-2 bg-[#0A0A0B]/80 p-2 rounded-lg border border-brand-border/50 hover:border-brand-neon/50 text-brand-neon text-xs sm:text-sm transition-colors w-full"
                                                        >
                                                            <Download className="w-4 h-4 flex-shrink-0" />
                                                            <span>Baixar PDF</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={(e) => { e.preventDefault(); handleDownload(msg.mediaUrl!, `Anexo-${msg.id}`); }}
                                                        className="flex items-center gap-2 bg-[#0A0A0B]/50 p-2 sm:p-3 rounded-lg border border-brand-border/50 hover:border-brand-neon/50 overflow-hidden text-left w-full"
                                                    >
                                                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-brand-neon flex-shrink-0" />
                                                        <span className="text-xs sm:text-sm underline text-blue-400 truncate">Baixar Anexo</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {msg.text && <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                                        <div className="flex items-center justify-end gap-1 mt-1 text-brand-muted">
                                            <span className="text-[10px]">{formatTime(msg.time)}</span>
                                            {msg.isSender && !msg.isInternal && (msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-brand-neon" /> : <Check className="w-3 h-3" />)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 sm:p-4 border-t border-brand-border/40 bg-[#0A0A0B]/80 relative flex-shrink-0">
                            {isInternalMode && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-amber-500/20 border border-amber-500/40 text-amber-500 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-t-lg flex items-center gap-1.5 whitespace-nowrap">
                                    <Lock className="w-3 h-3" /> Modo Nota Interna
                                </div>
                            )}
                            <div className={`flex items-end gap-1 sm:gap-2 bg-[#0A0A0B] border rounded-xl p-1.5 sm:p-2 transition-colors ${isInternalMode ? 'border-amber-500/50' : 'border-brand-border/60 focus-within:border-brand-neon/50'}`}>
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,.pdf" className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className={`p-2 transition-colors flex-shrink-0 ${isUploading ? 'text-brand-neon animate-pulse' : 'text-brand-muted hover:text-brand-neon'}`}>
                                    <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <textarea 
                                    placeholder={isInternalMode ? "Nota interna..." : "Sua mensagem..."}
                                    className="flex-1 bg-transparent border-none focus:outline-none text-sm text-white resize-none max-h-32 min-h-[40px] py-2 custom-scrollbar w-full"
                                    rows={1} value={messageInput} onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                />
                                <button onClick={() => setIsInternalMode(!isInternalMode)} className={`p-2 rounded-lg transition-all flex-shrink-0 ${isInternalMode ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40' : 'bg-brand-surface text-brand-muted hover:text-amber-500'}`}>
                                    {isInternalMode ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                                </button>
                                <button onClick={() => handleSendMessage()} disabled={!messageInput.trim()} className={`p-2 sm:p-2.5 rounded-lg transition-colors flex-shrink-0 ${messageInput.trim() ? (isInternalMode ? 'bg-amber-500 text-black' : 'bg-brand-neon text-[#0A0A0B]') : 'bg-brand-surface text-brand-muted'}`}>
                                    <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-brand-muted p-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-brand-surface flex items-center justify-center mb-4 border border-brand-border/40">
                            <Send className="w-8 h-8 text-brand-border" />
                        </div>
                        <p>Selecione uma conversa para iniciar o atendimento.</p>
                    </div>
                )}
            </div>

            {/* Deal Context Panel */}
            {showDealDetails && currentContact && (
                <div className="hidden xl:flex w-72 flex-shrink-0 flex-col glass-panel rounded-2xl border-brand-border/40 overflow-hidden bg-[#0A0A0B]/95">
                    <div className="p-4 border-b border-brand-border/40">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-brand-neon" /> Painéis em Negociação
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                        {currentContact.dealItems?.length > 0 ? (
                            <>
                                {currentContact.dealItems.map((item: any, i: number) => (
                                    <div key={i} className="mb-4 bg-brand-surface/30 p-3 rounded-xl border border-brand-border/20">
                                        <p className="text-xs font-bold text-white mb-1 line-clamp-2">{item.panel?.name || 'Painel não identificado'}</p>
                                        <div className="flex justify-between items-center text-[10px] text-brand-muted mt-2">
                                            <span>Val. Ref:</span>
                                            <span className="text-[#25D366] font-bold">{formatCurrency(item.priceSnapshot)}</span>
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Resumo de Valores */}
                                <div className="mt-4 p-3 bg-brand-surface/50 rounded-xl border border-brand-border/40 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Total Base:</span>
                                    <span className="text-sm font-black text-[#25D366]">
                                        {formatCurrency(currentContact.dealItems.reduce((acc: number, item: any) => acc + (item.priceSnapshot || 0), 0))}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <p className="text-xs text-brand-muted text-center mt-4">Nenhum painel atrelado a este deal.</p>
                        )}
                        
                        <div className="border-t border-brand-border/40 my-4 pt-4">
                            <h3 className="text-xs font-bold text-white mb-3">Ações Comerciais</h3>
                            <Button variant="secondary" className="w-full mb-2 justify-start text-xs">
                                <Tag className="w-4 h-4 mr-2" /> Gerar Cupom
                            </Button>
                            
                            <Button 
                                className="w-full justify-start text-xs bg-brand-neon text-black font-bold"
                                disabled={currentContact.status === 'WON'}
                                onClick={async () => {
                                    try {
                                        await crmService.updateDealStatus(currentContact.id, 'WON');
                                        addToast('Negociação fechada com sucesso!', 'success');
                                        setContacts(prev => prev.map(c => c.id === currentContact.id ? { ...c, status: 'WON' } : c));
                                    } catch (err) {
                                        addToast('Erro ao fechar a negociação.', 'error');
                                    }
                                }}
                            >
                                {currentContact.status === 'WON' ? (
                                    <><CheckCheck className="w-4 h-4 mr-2" /> Venda Concluída</>
                                ) : (
                                    <><Check className="w-4 h-4 mr-2" /> Fechar Negociação (Won)</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}