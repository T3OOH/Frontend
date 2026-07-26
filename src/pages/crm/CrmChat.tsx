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
    Download,
    X
} from 'lucide-react';
import { Button } from '@/components/Button';

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

/**
 * Componente principal de Chat do CRM.
 * Gerencia a comunicação em tempo real via WebSockets (Socket.io), 
 * o envio de anexos e a visualização do contexto da negociação (Deal).
 * Implementa a arquitetura de viewports separados para Desktop e Mobile.
 */
export function CrmChat() {
    const { user } = useAuth();
    const { addToast } = useToast();
    
    const [searchParams] = useSearchParams();
    const urlDealId = searchParams.get('dealId'); 
    
    // Referências duplicadas para atender à separação de viewports (Desktop e Mobile)
    const messagesEndRefDesktop = useRef<HTMLDivElement>(null);
    const messagesEndRefMobile = useRef<HTMLDivElement>(null);
    const fileInputRefDesktop = useRef<HTMLInputElement>(null);
    const fileInputRefMobile = useRef<HTMLInputElement>(null);

    const [contacts, setContacts] = useState<ChatContact[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [activeChat, setActiveChat] = useState<string>('');
    const [messageInput, setMessageInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isInternalMode, setIsInternalMode] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showDealDetails, setShowDealDetails] = useState(false);

    const currentContact = contacts.find(c => c.id === activeChat);

    /**
     * Efeito de inicialização: Busca os tickets/deals do usuário logado
     * e os converte no formato de contatos do chat.
     */
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

    /**
     * Efeito de conexão WebSocket e sincronização de histórico.
     * Conecta à sala específica do ticket selecionado e registra
     * os listeners de recebimento de novas mensagens.
     */
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

    /**
     * Efeito para auto-rolagem.
     * Garante que a interface role até a última mensagem sempre que
     * a lista de mensagens for atualizada, em ambos os viewports.
     */
    useEffect(() => {
        messagesEndRefDesktop.current?.scrollIntoView({ behavior: 'smooth' });
        messagesEndRefMobile.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    /**
     * Lida com o download forçado de arquivos utilizando a API de Blob,
     * evitando bloqueios de CORS e downloads embutidos no navegador.
     * 
     * @param fileUrl - URL de origem do arquivo.
     * @param defaultName - Nome sugerido para o arquivo ao salvar.
     */
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

    /**
     * Despacha uma nova mensagem para o servidor via Socket.io.
     * Permite sobrepor o payload para envio direto de anexos pós-upload.
     * 
     * @param overridePayload - Opcional. Dados estruturados da mensagem para envio automático.
     */
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

    /**
     * Gerencia o upload de arquivos para a API antes do envio da mensagem.
     */
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
            if (fileInputRefDesktop.current) fileInputRefDesktop.current.value = '';
            if (fileInputRefMobile.current) fileInputRefMobile.current.value = '';
        }
    };

    const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : '??';
    const formatTime = (dateInput: string | Date) => new Date(dateInput).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <div className="w-8 h-8 border-4 border-brand-neon border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col relative">

            {/* ========================================================= */}
            {/* DESKTOP LAYOUT (Table / 3 Colunas)                          */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-row h-full gap-4 max-w-[1600px] mx-auto w-full animate-fade-in">
                
                {/* Coluna 1: Lista de Tickets (Contatos) */}
                <div className="w-80 flex-shrink-0 flex-col glass-panel rounded-2xl border-brand-border/40 overflow-hidden flex">
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

                {/* Coluna 2: Área de Mensagens (Chat Principal) */}
                <div className="flex-1 flex-col glass-panel rounded-2xl border-brand-border/40 overflow-hidden flex min-w-0">
                    {currentContact ? (
                        <>
                            <div className="p-4 border-b border-brand-border/40 bg-[#0A0A0B]/80 flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-xs font-bold text-brand-text">
                                        {getInitials(currentContact.name)}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-sm font-bold text-white truncate">{currentContact.name}</h2>
                                        <p className="text-xs text-brand-muted truncate">Lead via Plataforma</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="secondary" size="sm" onClick={() => setShowDealDetails(!showDealDetails)} className="text-xs px-3">
                                        <ShoppingBag className="w-4 h-4 mr-2" /> Contexto
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[#0A0A0B]/30 custom-scrollbar">
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-brand-muted opacity-60">
                                        <MessageSquare className="w-12 h-12 mb-3" />
                                        <p className="text-center text-sm px-4">Nenhuma mensagem neste chat ainda.</p>
                                    </div>
                                )}
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.isSender ? 'justify-end' : 'justify-start'} ${msg.isInternal ? 'w-full justify-center my-2' : ''}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 break-words ${msg.isInternal ? 'bg-amber-500/10 border border-amber-500/30 text-amber-50 rounded-2xl' : msg.isSender ? 'bg-brand-neon/10 border border-brand-neon/20 text-brand-text rounded-tr-sm' : 'bg-brand-surface border border-brand-border/50 text-brand-text rounded-tl-sm'}`}>
                                            
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
                                                            <div className="relative w-56 h-64 rounded-lg overflow-hidden border border-brand-border/50 bg-[#111113]">
                                                                <object data={`${msg.mediaUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} type="application/pdf" className="w-full h-full pointer-events-none opacity-90">
                                                                    <div className="flex items-center justify-center h-full bg-brand-surface text-brand-muted text-xs p-4 text-center">Prévia indisponível.<br/>Faça o download.</div>
                                                                </object>
                                                                <div className="absolute inset-0 z-10 bg-transparent"></div>
                                                            </div>
                                                            <button onClick={(e) => { e.preventDefault(); handleDownload(msg.mediaUrl!, `Documento-${msg.id}.pdf`); }} className="flex items-center justify-center gap-2 bg-[#0A0A0B]/80 p-2 rounded-lg border border-brand-border/50 hover:border-brand-neon/50 text-brand-neon text-sm transition-colors w-full">
                                                                <Download className="w-4 h-4 flex-shrink-0" /> <span>Baixar PDF</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={(e) => { e.preventDefault(); handleDownload(msg.mediaUrl!, `Anexo-${msg.id}`); }} className="flex items-center gap-2 bg-[#0A0A0B]/50 p-3 rounded-lg border border-brand-border/50 hover:border-brand-neon/50 overflow-hidden text-left w-full">
                                                            <FileText className="w-5 h-5 text-brand-neon flex-shrink-0" />
                                                            <span className="text-sm underline text-blue-400 truncate">Baixar Anexo</span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {msg.text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                                            <div className="flex items-center justify-end gap-1 mt-1 text-brand-muted">
                                                <span className="text-[10px]">{formatTime(msg.time)}</span>
                                                {msg.isSender && !msg.isInternal && (msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-brand-neon" /> : <Check className="w-3 h-3" />)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRefDesktop} />
                            </div>

                            <div className="p-4 border-t border-brand-border/40 bg-[#0A0A0B]/80 relative flex-shrink-0">
                                {isInternalMode && (
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-amber-500/20 border border-amber-500/40 text-amber-500 text-xs font-bold px-3 py-1 rounded-t-lg flex items-center gap-1.5 whitespace-nowrap">
                                        <Lock className="w-3 h-3" /> Modo Nota Interna
                                    </div>
                                )}
                                <div className={`flex items-end gap-2 bg-[#0A0A0B] border rounded-xl p-2 transition-colors ${isInternalMode ? 'border-amber-500/50' : 'border-brand-border/60 focus-within:border-brand-neon/50'}`}>
                                    <input type="file" ref={fileInputRefDesktop} onChange={handleFileUpload} accept="image/*,.pdf" className="hidden" />
                                    <button onClick={() => fileInputRefDesktop.current?.click()} disabled={isUploading} className={`p-2 transition-colors flex-shrink-0 ${isUploading ? 'text-brand-neon animate-pulse' : 'text-brand-muted hover:text-brand-neon'}`}>
                                        <Paperclip className="w-5 h-5" />
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
                                    <button onClick={() => handleSendMessage()} disabled={!messageInput.trim()} className={`p-2.5 rounded-lg transition-colors flex-shrink-0 ${messageInput.trim() ? (isInternalMode ? 'bg-amber-500 text-black' : 'bg-brand-neon text-[#0A0A0B]') : 'bg-brand-surface text-brand-muted'}`}>
                                        <Send className="w-5 h-5 ml-0.5" />
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

                {/* Coluna 3: Contexto de Negociação */}
                {showDealDetails && currentContact && (
                    <div className="w-72 flex-shrink-0 flex-col glass-panel rounded-2xl border-brand-border/40 overflow-hidden bg-[#0A0A0B]/95 flex">
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

            {/* ========================================================= */}
            {/* MOBILE LAYOUT (App Pattern)                                 */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full h-full relative">
                
                {/* Visualização 1: Lista de Contatos (Quando não há chat selecionado) */}
                {!activeChat && (
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-brand-border/20 bg-[#0A0A0B]/80 sticky top-0 z-10 pt-[env(safe-area-inset-top,12px)]">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-brand-neon" /> Inbox Comercial
                            </h2>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                                <input placeholder="Buscar oportunidade..." className="w-full bg-[#111113] border border-brand-border/40 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-brand-text focus:outline-none focus:border-brand-neon shadow-inner" />
                            </div>
                        </div>
                        
                        <div className="flex-1 flex flex-col gap-2 p-4">
                            {contacts.length === 0 ? (
                                <div className="text-center text-sm text-brand-muted mt-10">Nenhum ticket encontrado.</div>
                            ) : (
                                contacts.map((contact) => (
                                    <div key={contact.id} onClick={() => setActiveChat(contact.id)} className="bg-[#111113] border border-brand-border/30 rounded-2xl p-4 flex items-center gap-3 shadow-sm active:scale-95 transition-transform">
                                        <div className="w-12 h-12 flex-shrink-0 rounded-full bg-brand-surface border border-brand-border/40 flex items-center justify-center text-sm font-bold text-brand-text shadow-inner">
                                            {getInitials(contact.name)}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h3 className="text-[15px] font-bold text-white truncate">{contact.name}</h3>
                                            <p className="text-[11px] text-brand-muted truncate mt-0.5">ID: {contact.id.substring(0, 6).toUpperCase()}</p>
                                        </div>
                                        <div className="shrink-0">
                                            <div className="w-8 h-8 rounded-full bg-brand-neon/10 text-brand-neon flex items-center justify-center">
                                                <ArrowLeft className="w-4 h-4 rotate-180" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            
                            {/* Bloco Espaçador Fantasma para Mobile */}
                            <div className="h-[200px] w-full shrink-0 pointer-events-none" aria-hidden="true" />
                        </div>
                    </div>
                )}

                {/* Visualização 2: Área do Chat Ativo */}
                {activeChat && currentContact && (
                    <div className="flex flex-col h-[calc(100vh-72px)] w-full fixed top-0 left-0 right-0 bottom-[72px] bg-[#0A0A0B] z-40">
                        {/* Header do Chat Mobile */}
                        <div className="p-3 border-b border-brand-border/20 bg-[#0A0A0B]/95 backdrop-blur-xl flex items-center justify-between sticky top-0 z-50 pt-[env(safe-area-inset-top,12px)]">
                            <div className="flex items-center gap-3 min-w-0">
                                <button className="p-2 bg-[#111113] rounded-full border border-brand-border/40 text-brand-muted hover:text-white" onClick={() => setActiveChat('')}>
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-sm font-bold text-brand-text">
                                    {getInitials(currentContact.name)}
                                </div>
                                <div className="min-w-0 flex flex-col">
                                    <h2 className="text-[15px] font-bold text-white truncate">{currentContact.name}</h2>
                                    <p className="text-[10px] text-brand-muted truncate uppercase tracking-wider">Lead Ativo</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDealDetails(true)} className="w-10 h-10 bg-brand-neon/10 rounded-full border border-brand-neon/20 flex items-center justify-center text-brand-neon shrink-0">
                                <ShoppingBag className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Área de Mensagens Mobile */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#0A0A0B]/30 custom-scrollbar pb-[120px]">
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-brand-muted opacity-60">
                                    <MessageSquare className="w-10 h-10 mb-3" />
                                    <p className="text-center text-xs px-4">Nenhuma mensagem neste chat ainda.</p>
                                </div>
                            )}
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.isSender ? 'justify-end' : 'justify-start'} ${msg.isInternal ? 'w-full justify-center my-2' : ''}`}>
                                    <div className={`max-w-[85%] rounded-[20px] px-4 py-3 break-words shadow-sm ${msg.isInternal ? 'bg-amber-500/10 border border-amber-500/30 text-amber-50' : msg.isSender ? 'bg-brand-neon/10 border border-brand-neon/20 text-brand-text rounded-tr-sm' : 'bg-[#111113] border border-brand-border/40 text-brand-text rounded-tl-sm'}`}>
                                        
                                        {msg.isInternal && (
                                            <div className="flex items-center gap-1.5 text-amber-500 mb-2 border-b border-amber-500/20 pb-1.5">
                                                <Lock className="w-3 h-3" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Nota Interna</span>
                                            </div>
                                        )}

                                        {msg.mediaUrl && (
                                            <div className="mb-2 mt-1">
                                                {msg.mediaType?.includes('image') ? (
                                                    <img src={msg.mediaUrl} alt="Upload" className="max-w-xs w-full rounded-xl border border-brand-border/50 object-cover" />
                                                ) : msg.mediaType?.includes('pdf') ? (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-brand-border/50 bg-[#0A0A0B]">
                                                            <object data={`${msg.mediaUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} type="application/pdf" className="w-full h-full pointer-events-none opacity-90">
                                                                <div className="flex items-center justify-center h-full bg-brand-surface text-brand-muted text-[10px] p-4 text-center uppercase font-bold tracking-widest">Baixe para ler</div>
                                                            </object>
                                                            <div className="absolute inset-0 z-10 bg-transparent"></div>
                                                        </div>
                                                        <button onClick={(e) => { e.preventDefault(); handleDownload(msg.mediaUrl!, `Documento-${msg.id}.pdf`); }} className="flex items-center justify-center gap-2 bg-brand-neon/10 p-3 rounded-xl border border-brand-neon/20 text-brand-neon text-xs font-bold uppercase tracking-wider transition-colors w-full active:bg-brand-neon/20">
                                                            <Download className="w-4 h-4 flex-shrink-0" /> <span>Baixar PDF</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button onClick={(e) => { e.preventDefault(); handleDownload(msg.mediaUrl!, `Anexo-${msg.id}`); }} className="flex items-center gap-2 bg-[#111113] p-3 rounded-xl border border-white/5 overflow-hidden text-left w-full active:bg-[#0A0A0B]">
                                                        <FileText className="w-5 h-5 text-brand-neon flex-shrink-0" />
                                                        <span className="text-[11px] font-medium underline text-blue-400 truncate">Baixar Anexo</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {msg.text && <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                                        <div className="flex items-center justify-end gap-1 mt-1.5 text-brand-muted">
                                            <span className="text-[9px] font-medium">{formatTime(msg.time)}</span>
                                            {msg.isSender && !msg.isInternal && (msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-brand-neon" /> : <Check className="w-3 h-3" />)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRefMobile} />
                        </div>

                        {/* Input Area Mobile (Fixado logo acima da HUD Global) */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-brand-border/20 bg-[#0A0A0B]/95 backdrop-blur-xl z-20 pb-safe">
                            {isInternalMode && (
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-amber-500/20 border border-amber-500/40 text-amber-500 text-[9px] uppercase tracking-widest font-black px-3 py-1 rounded-t-lg flex items-center gap-1.5">
                                    <Lock className="w-3 h-3" /> Nota Interna
                                </div>
                            )}
                            <div className={`flex items-end gap-2 bg-[#111113] border rounded-[18px] p-1.5 transition-colors shadow-inner ${isInternalMode ? 'border-amber-500/50' : 'border-white/10'}`}>
                                <input type="file" ref={fileInputRefMobile} onChange={handleFileUpload} accept="image/*,.pdf" className="hidden" />
                                <button onClick={() => fileInputRefMobile.current?.click()} disabled={isUploading} className={`p-2 rounded-full transition-colors flex-shrink-0 ${isUploading ? 'text-brand-neon animate-pulse' : 'text-brand-muted bg-[#0A0A0B] border border-white/5 active:scale-95'}`}>
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <textarea 
                                    placeholder={isInternalMode ? "Nota interna..." : "Mensagem..."}
                                    className="flex-1 bg-transparent border-none focus:outline-none text-[13px] text-white resize-none max-h-24 min-h-[40px] py-2.5 custom-scrollbar w-full"
                                    rows={1} value={messageInput} onChange={(e) => setMessageInput(e.target.value)}
                                />
                                <div className="flex flex-col gap-1 shrink-0 pb-0.5">
                                    <button onClick={() => setIsInternalMode(!isInternalMode)} className={`p-1.5 rounded-full transition-all flex-shrink-0 ${isInternalMode ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40' : 'bg-transparent text-brand-muted active:text-amber-500'}`}>
                                        {isInternalMode ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => handleSendMessage()} disabled={!messageInput.trim()} className={`p-2.5 rounded-full transition-transform flex-shrink-0 shadow-md ${messageInput.trim() ? (isInternalMode ? 'bg-amber-500 text-black active:scale-95' : 'bg-brand-neon text-[#0A0A0B] active:scale-95') : 'bg-[#0A0A0B] text-brand-muted border border-white/5'}`}>
                                        <Send className="w-4 h-4 ml-0.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* MOBILE MODAL: CONTEXTO DA NEGOCIAÇÃO (CARRINHO)             */}
            {/* ========================================================= */}
            {showDealDetails && activeChat && currentContact && (
                <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#0A0A0B]/80 backdrop-blur-md lg:hidden">
                    <div className="bg-[#121214] border border-brand-border/30 rounded-t-[32px] p-5 w-full max-h-[85vh] overflow-y-auto custom-scrollbar shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative animate-slide-up pb-safe">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-brand-neon" /> Painéis em Negociação
                            </h3>
                            <button onClick={() => setShowDealDetails(false)} className="p-2 bg-[#0A0A0B] rounded-full border border-white/5 text-brand-muted hover:text-white transition-colors active:scale-95">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            {currentContact.dealItems?.length > 0 ? (
                                <>
                                    {currentContact.dealItems.map((item: any, i: number) => (
                                        <div key={i} className="bg-[#0A0A0B] p-4 rounded-[20px] border border-white/5 shadow-inner">
                                            <p className="text-[13px] font-bold text-white mb-2 line-clamp-2">{item.panel?.name || 'Painel não identificado'}</p>
                                            <div className="flex justify-between items-center text-[11px] text-brand-muted mt-2 border-t border-white/5 pt-2">
                                                <span className="uppercase font-bold tracking-widest">Val. Ref:</span>
                                                <span className="text-[#25D366] font-black">{formatCurrency(item.priceSnapshot)}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="mt-2 p-4 bg-brand-neon/5 rounded-[20px] border border-brand-neon/20 flex items-center justify-between shadow-md">
                                        <span className="text-[11px] font-black text-brand-neon uppercase tracking-widest">Total Base:</span>
                                        <span className="text-base font-black text-[#25D366]">
                                            {formatCurrency(currentContact.dealItems.reduce((acc: number, item: any) => acc + (item.priceSnapshot || 0), 0))}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="p-6 bg-[#0A0A0B] rounded-[20px] border border-white/5 text-center">
                                    <p className="text-[13px] text-brand-muted font-medium">Nenhum painel atrelado a este ticket.</p>
                                </div>
                            )}
                            
                            <div className="border-t border-brand-border/20 my-2 pt-5 flex flex-col gap-3">
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-brand-muted mb-1 ml-1">Ações Comerciais</h3>
                                <button className="w-full flex items-center justify-center gap-2 bg-[#111113] border border-brand-border/30 text-white font-bold py-3.5 rounded-[16px] active:bg-[#0A0A0B] transition-colors text-[13px]">
                                    <Tag className="w-4 h-4" /> Gerar Cupom de Desconto
                                </button>
                                <button 
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
                                    className="w-full flex items-center justify-center gap-2 bg-brand-neon text-[#0A0A0B] font-black uppercase tracking-widest py-4 rounded-[16px] hover:bg-[#FF5E00]/90 transition-all shadow-[0_10px_25px_rgba(255,94,0,0.3)] active:scale-[0.98] text-[13px] disabled:opacity-50 disabled:shadow-none"
                                >
                                    {currentContact.status === 'WON' ? (
                                        <><CheckCheck className="w-5 h-5" /> Venda Concluída</>
                                    ) : (
                                        <><Check className="w-5 h-5" /> Fechar Negociação (Won)</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Bloco Espaçador Fantasma Interno ao Modal */}
                        <div className="h-[40px] w-full shrink-0 pointer-events-none" aria-hidden="true" />
                    </div>
                </div>
            )}
        </div>
    );
}