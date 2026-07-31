import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
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
    X,
    FileDown,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/Button';

// Dependências de exportação de documentos
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

// Função utilitária para converter imagens da web (Supabase) em Base64 para o PDF
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string | null> => {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Erro ao converter imagem para base64:", error);
        return null;
    }
};

export function CrmChat() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate(); // Hook para redirecionamento
    
    const [searchParams] = useSearchParams();
    const urlDealId = searchParams.get('dealId'); 
    
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
    const [showContextPopup, setShowContextPopup] = useState(false); 
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

    const currentContact = contacts.find(c => c.id === activeChat);

    useEffect(() => {
        async function fetchContacts() {
            try {
                setIsLoading(true);
                const deals = await crmService.getDeals();
                
                const formattedContacts: ChatContact[] = deals.map(deal => ({
                    id: deal.id,
                    name: deal.client?.name || 'Cliente',
                    company: (deal.client as any)?.company || '',
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
                } else {
                    // Seleciona o primeiro contato que NÃO esteja fechado
                    const firstActive = formattedContacts.find(c => c.status !== 'WON' && c.status !== 'LOST');
                    if (firstActive) setActiveChat(firstActive.id);
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

    useEffect(() => {
        if (!activeChat) return;
        setShowContextPopup(false); 

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
        messagesEndRefDesktop.current?.scrollIntoView({ behavior: 'smooth' });
        messagesEndRefMobile.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // =========================================================
    // LÓGICA DE FECHAMENTO DE NEGOCIAÇÃO E REDIRECIONAMENTO
    // =========================================================
    const handleCloseDeal = async (dealId: string) => {
        try {
            await crmService.updateDealStatus(dealId, 'WON');
            addToast('Negociação fechada! Redirecionando para a carteira...', 'success');
            
            // Tira o chat da tela
            setContacts(prev => prev.filter(c => c.id !== dealId));
            setActiveChat('');
            setShowContextPopup(false);
            
            // Redireciona para a página "Minha Carteira" com o ID do Deal
            navigate(`/crm/carteira?dealId=${dealId}`);
        } catch (err) {
            addToast('Erro ao fechar a negociação.', 'error');
        }
    };

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
            if (fileInputRefDesktop.current) fileInputRefDesktop.current.value = '';
            if (fileInputRefMobile.current) fileInputRefMobile.current.value = '';
        }
    };

    // =========================================================
    // GERADOR DA PROPOSTA
    // =========================================================
    const generateProposalPDF = async (contact: ChatContact) => {
        try {
            setIsGeneratingPdf(contact.id);
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const marginLeft = 20; 
            const marginRight = 20;
            const contentWidth = pageWidth - marginLeft - marginRight;
            let currentY = 20;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(28);
            doc.setTextColor(255, 94, 0); 
            doc.text("t3", pageWidth / 2, currentY, { align: "center" });

            currentY += 10;
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text("Proposta Comercial T3 LED", pageWidth / 2, currentY, { align: "center" });
            
            currentY += 6;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            const currentDate = new Date().toLocaleDateString('pt-BR');
            doc.text(`Data: ${currentDate}`, pageWidth / 2, currentY, { align: "center" });

            currentY += 15;

            doc.setTextColor(0, 0, 0);
            const introText = "A T3 Comunicação, atua há 15 anos no mercado, possuindo alguns canais de publicidade. Os painéis T3 LED OUTDOOR OOH, vem se destacando entre eles. O segmento já é consolidado mundo afora, sendo explorado inicialmente por grandes marcas nas grandes capitais. Hoje a T3 está posicionada comunicando milhares de pessoas em locais estratégicos com alta definição visual.\n\nNossa agência é uma empresa de comunicação que busca oferecer aos seus clientes, serviços de marketing com resultados efetivos, sempre comprometidos com a criatividade, inovação e satisfação do cliente. Contamos com uma equipe especializada que tem um lema: 'As boas ideias podem transformar a comunicação', sendo combustível essencial para que a publicidade e a propaganda cumpram o papel de alcançar consumidores, influenciar pessoas, fixar marcas e converter a publicidade em bons negócios.";
            
            const lines = doc.splitTextToSize(introText, contentWidth);
            doc.text(lines, marginLeft, currentY, { align: "justify", maxWidth: contentWidth });
            currentY += (lines.length * 5) + 15;

            const tableRows = contact.dealItems.map((item: any) => {
                const p = item.panel || {};
                const city = p.city ? String(p.city).toUpperCase() : 'CIDADE NÃO INFORMADA';
                const name = p.name ? p.name.toUpperCase() : 'PAINEL NÃO IDENTIFICADO';
                const format = p.size || 'FORMATO 1920px X 1080px (HORIZONTAL)';
                const audience = p.impacts ? `Média de ${formatImpacts(p.impacts)} pessoas\nimpactadas diariamente` : 'Audiência Elevada';
                const price = formatCurrency(item.priceSnapshot || 0);

                return [
                    `${city}\n${name}\n${format}`,
                    audience,
                    `${price}\nmensais`
                ];
            });

            const totalValue = contact.dealItems.reduce((acc: number, item: any) => acc + (Number(item.priceSnapshot) || 0), 0);

            autoTable(doc, {
                startY: currentY,
                head: [['PAINÉIS LED\nVÍDEO 15 SEGUNDOS', 'AUDIÊNCIA', 'INVESTIMENTO']],
                body: [
                    ...tableRows,
                    [
                        { content: 'VALOR PROMOCIONAL', styles: { fontStyle: 'bold', halign: 'center' } },
                        { content: 'Pacote Selecionado', styles: { fontStyle: 'bold', halign: 'center' } },
                        { content: `${formatCurrency(totalValue)}\nmensais`, styles: { fontStyle: 'bold', halign: 'center', fillColor: [255, 94, 0], textColor: [255, 255, 255] } }
                    ]
                ],
                theme: 'grid',
                headStyles: { fillColor: [17, 17, 19], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
                bodyStyles: { valign: 'middle' },
                styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
                columnStyles: {
                    0: { cellWidth: 80 },
                    1: { cellWidth: 50, halign: 'center' },
                    2: { cellWidth: 'auto', halign: 'center' }
                }
            });

            currentY = (doc as any).lastAutoTable.finalY + 15;

            if (currentY > pageHeight - 60) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("ESPECIFICAÇÕES", marginLeft, currentY);
            currentY += 8;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            const specs = [
                "• Média de 420 inserções diárias em cada painel.",
                "• Painéis com localização estratégica ligados das 06:00h às 02:00h.",
                "• Público alvo: A, B, C e D.",
                "• PRAZO DE PAGAMENTO: 30/60/90 DIAS"
            ];
            
            specs.forEach(spec => {
                doc.text(spec, marginLeft, currentY);
                currentY += 6;
            });

            currentY += 15;
            doc.setFont("helvetica", "bold");
            doc.text("MÍDIA OOH EM GOIÁS E REGIÃO", marginLeft, currentY);
            currentY += 6;
            doc.setFont("helvetica", "normal");
            doc.text(`Vendedor(a): ${user?.name || 'Comercial T3 Mídia'}`, marginLeft, currentY);

            const panelsWithImages = contact.dealItems.filter((item: any) => item.panel?.images && item.panel?.images.length > 0);

            if (panelsWithImages.length > 0) {
                doc.addPage();
                currentY = 20;
                doc.setFont("helvetica", "bold");
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text("SEGUE FOTOS ABAIXO:", marginLeft, currentY);
                currentY += 15;

                for (const item of panelsWithImages) {
                    const imgUrl = item.panel.images[0];
                    const base64Img = await getBase64ImageFromUrl(imgUrl);
                    
                    if (base64Img) {
                        if (currentY + 120 > pageHeight) { 
                            doc.addPage();
                            currentY = 20;
                        }
                        
                        doc.setFontSize(12);
                        doc.setTextColor(255, 94, 0); 
                        const title = `${item.panel.city || 'CIDADE'} - ${item.panel.name || 'PAINEL'}`.toUpperCase();
                        doc.text(title, marginLeft, currentY);
                        currentY += 6;
                        
                        doc.addImage(base64Img, 'JPEG', marginLeft, currentY, 170, 95);
                        currentY += 105; 
                    }
                }
            }

            const pageCount = (doc.internal as any).getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                
                const footerY = pageHeight - 15;
                doc.setDrawColor(200, 200, 200);
                doc.line(marginLeft, footerY - 5, pageWidth - marginRight, footerY - 5);
                
                doc.text("T3 LED Mídia e Tecnologia • CNPJ: 00.000.000/0000-00", pageWidth / 2, footerY, { align: "center" });
                doc.text(`Página ${i} de ${pageCount}`, pageWidth - marginRight, footerY, { align: "right" });
            }

            doc.save(`Proposta_T3_${contact.name.replace(/\s+/g, '_')}.pdf`);
            addToast("Proposta gerada com sucesso!", "success");

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            addToast("Ocorreu um erro ao formatar o documento com as imagens.", "error");
        } finally {
            setIsGeneratingPdf(null);
        }
    };

    const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : '??';
    const formatTime = (dateInput: string | Date) => new Date(dateInput).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatImpacts = (rawImpacts: string | number) => {
        if (!rawImpacts) return '0';
        const strVal = String(rawImpacts).toLowerCase();
        let n = Number(strVal.replace(/\D/g, ''));
        if (strVal.includes('mil') && !strVal.includes('milh')) n *= 1000;
        else if (strVal.includes('mi') || strVal.includes('milh')) n *= 1000000;
        else if (strVal.includes('bi')) n *= 1000000000;
        if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + ' milhões';
        if (n >= 1000) return (n / 1000).toFixed(0) + ' mil';
        return n.toLocaleString('pt-BR');
    };

    // Componente Reutilizável do Menu Popup do Contexto de Negociação
    const ContextPopup = () => (
        <AnimatePresence>
            {showContextPopup && currentContact && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full left-4 lg:left-0 mb-4 w-[340px] max-h-[60vh] flex flex-col bg-[#121214] border border-brand-border/40 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-[100]"
                >
                    <div className="p-4 border-b border-brand-border/30 flex items-center justify-between bg-[#0A0A0B]/50 shrink-0">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-brand-neon" /> Painéis em Negociação
                        </h3>
                        <button onClick={() => setShowContextPopup(false)} className="text-brand-muted hover:text-white p-1 rounded-md active:bg-brand-surface">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                        {currentContact.dealItems?.length > 0 ? (
                            <>
                                {currentContact.dealItems.map((item: any, i: number) => (
                                    <div key={i} className="mb-3 bg-[#0A0A0B] p-3 rounded-xl border border-white/5 shadow-inner">
                                        <p className="text-xs font-bold text-white mb-2 line-clamp-2">{item.panel?.name || 'Painel não identificado'}</p>
                                        <div className="flex justify-between items-center text-[10px] text-brand-muted border-t border-white/5 pt-2">
                                            <span className="uppercase font-bold tracking-widest">Val. Ref:</span>
                                            <span className="text-[#25D366] font-black">{formatCurrency(item.priceSnapshot)}</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="mt-3 p-3 bg-brand-neon/5 rounded-xl border border-brand-neon/20 flex items-center justify-between shadow-md">
                                    <span className="text-[10px] font-black text-brand-neon uppercase tracking-widest">Total Base:</span>
                                    <span className="text-sm font-black text-[#25D366]">
                                        {formatCurrency(currentContact.dealItems.reduce((acc: number, item: any) => acc + (item.priceSnapshot || 0), 0))}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <p className="text-xs text-brand-muted text-center py-4">Nenhum painel atrelado a este deal.</p>
                        )}
                    </div>

                    <div className="p-4 border-t border-brand-border/30 bg-[#0A0A0B]/50 shrink-0 flex flex-col gap-2">
                        <Button 
                            variant="secondary" 
                            className="w-full justify-center text-xs bg-brand-surface text-brand-neon hover:bg-brand-neon/10 border-brand-neon/20"
                            onClick={() => generateProposalPDF(currentContact)}
                            disabled={isGeneratingPdf === currentContact.id}
                        >
                            {isGeneratingPdf === currentContact.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                            Gerar Proposta PDF
                        </Button>
                        <Button variant="secondary" className="w-full justify-center text-xs">
                            <Tag className="w-4 h-4 mr-2" /> Gerar Cupom
                        </Button>
                        <Button 
                            className="w-full justify-center text-xs bg-[#25D366] text-black font-bold"
                            disabled={currentContact.status === 'WON' || currentContact.status === 'LOST'}
                            onClick={() => handleCloseDeal(currentContact.id)}
                        >
                            <Check className="w-4 h-4 mr-2" /> Fechar Negociação
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <div className="w-8 h-8 border-4 border-brand-neon border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Apenas renderizamos na lateral os chats ativos (ignora WON/LOST)
    const activeContactsDisplay = contacts.filter(c => c.status !== 'WON' && c.status !== 'LOST' || c.id === urlDealId);

    return (
        <div className="w-full h-full flex flex-col relative overflow-hidden">

            {/* ========================================================= */}
            {/* DESKTOP LAYOUT (2 Colunas)                                */}
            {/* ========================================================= */}
            <div className="hidden lg:flex flex-row h-full gap-4 max-w-[1400px] mx-auto w-full animate-fade-in pb-4">
                
                {/* Coluna 1: Lista de Tickets */}
                <div className="w-[320px] flex-shrink-0 flex-col glass-panel rounded-2xl border-brand-border/40 overflow-hidden flex">
                    <div className="p-4 border-b border-brand-border/40 bg-[#0A0A0B]/50 shrink-0">
                        <h2 className="text-lg font-bold text-white mb-4">Tickets Ativos</h2>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                            <input placeholder="Buscar oportunidade..." className="w-full bg-[#0A0A0B] border border-brand-border/60 rounded-xl pl-9 pr-4 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-neon" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        {activeContactsDisplay.length === 0 ? (
                            <div className="text-center text-sm text-brand-muted mt-10">Inbox limpo. Não há tickets ativos.</div>
                        ) : (
                            activeContactsDisplay.map((contact) => (
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

                {/* Coluna 2: Área de Mensagens */}
                <div className="flex-1 flex-col glass-panel rounded-2xl border-brand-border/40 overflow-hidden flex min-w-0">
                    {currentContact ? (
                        <>
                            <div className="p-4 border-b border-brand-border/40 bg-[#0A0A0B]/80 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-xs font-bold text-brand-text">
                                        {getInitials(currentContact.name)}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-sm font-bold text-white truncate">{currentContact.name}</h2>
                                        <p className="text-xs text-brand-muted truncate">Lead via Plataforma</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[#0A0A0B]/30 custom-scrollbar relative">
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
                                                        <img src={msg.mediaUrl} alt="Upload" className="max-w-sm w-full rounded-lg border border-brand-border/50 object-cover" />
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

                            {/* Área de Input (Some se estiver fechado) */}
                            {currentContact.status === 'WON' || currentContact.status === 'LOST' ? (
                                <div className="p-4 border-t border-brand-border/40 bg-[#0A0A0B]/80 flex items-center justify-center text-brand-muted text-sm gap-2">
                                    <Lock className="w-4 h-4" />
                                    Este atendimento foi encerrado e não pode receber novas mensagens.
                                </div>
                            ) : (
                                <div className="p-4 border-t border-brand-border/40 bg-[#0A0A0B]/80 relative shrink-0">
                                    <ContextPopup />

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

                                        <button onClick={() => setShowContextPopup(!showContextPopup)} className={`p-2 transition-colors flex-shrink-0 ${showContextPopup ? 'text-brand-neon' : 'text-brand-muted hover:text-brand-neon'}`}>
                                            <ShoppingBag className="w-5 h-5" />
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
                                        <button onClick={() => handleSendMessage()} disabled={!messageInput.trim() && !isUploading} className={`p-2.5 rounded-lg transition-colors flex-shrink-0 ${messageInput.trim() ? (isInternalMode ? 'bg-amber-500 text-black' : 'bg-brand-neon text-[#0A0A0B]') : 'bg-brand-surface text-brand-muted'}`}>
                                            <Send className="w-5 h-5 ml-0.5" />
                                        </button>
                                    </div>
                                </div>
                            )}
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
            </div>

            {/* ========================================================= */}
            {/* MOBILE LAYOUT (App Pattern)                               */}
            {/* ========================================================= */}
            <div className="flex lg:hidden flex-col w-full h-[calc(100vh-64px)] relative bg-[#0A0A0B]">
                
                {/* Visualização 1: Lista de Contatos */}
                {!activeChat && (
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-brand-border/20 bg-[#0A0A0B]/80 shrink-0 pt-[env(safe-area-inset-top,12px)]">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-brand-neon" /> Inbox Comercial
                            </h2>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                                <input placeholder="Buscar oportunidade..." className="w-full bg-[#111113] border border-brand-border/40 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-brand-text focus:outline-none focus:border-brand-neon shadow-inner" />
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 p-4">
                            {activeContactsDisplay.length === 0 ? (
                                <div className="text-center text-sm text-brand-muted mt-10">Nenhum ticket encontrado.</div>
                            ) : (
                                activeContactsDisplay.map((contact) => (
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
                        </div>
                    </div>
                )}

                {/* Visualização 2: Área do Chat Ativo */}
                {activeChat && currentContact && (
                    <div className="flex flex-col h-full w-full bg-[#0A0A0B] z-40">
                        <div className="p-3 border-b border-brand-border/20 bg-[#0A0A0B]/95 flex items-center justify-between shrink-0 pt-[env(safe-area-inset-top,12px)]">
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
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#0A0A0B]/30 custom-scrollbar">
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

                        {currentContact.status === 'WON' || currentContact.status === 'LOST' ? (
                            <div className="p-4 border-t border-brand-border/20 bg-[#0A0A0B]/95 flex items-center justify-center text-brand-muted text-xs gap-2 pb-safe">
                                <Lock className="w-4 h-4" />
                                Atendimento encerrado.
                            </div>
                        ) : (
                            <div className="p-3 border-t border-brand-border/20 bg-[#0A0A0B]/95 shrink-0 relative pb-safe">
                                <ContextPopup />
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
                                    
                                    <button onClick={() => setShowContextPopup(!showContextPopup)} className={`p-2 transition-colors flex-shrink-0 ${showContextPopup ? 'text-brand-neon' : 'text-brand-muted hover:text-brand-neon'}`}>
                                        <ShoppingBag className="w-5 h-5" />
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
                                        <button onClick={() => handleSendMessage()} disabled={!messageInput.trim() && !isUploading} className={`p-2.5 rounded-full transition-transform flex-shrink-0 shadow-md ${messageInput.trim() ? (isInternalMode ? 'bg-amber-500 text-black active:scale-95' : 'bg-brand-neon text-[#0A0A0B] active:scale-95') : 'bg-[#0A0A0B] text-brand-muted border border-white/5'}`}>
                                            <Send className="w-4 h-4 ml-0.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}