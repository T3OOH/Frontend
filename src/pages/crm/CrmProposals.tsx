import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { pdf, PDFViewer } from '@react-pdf/renderer';
import { ArrowLeft, Download, Eye, Search, Send } from 'lucide-react';

import { api } from '@/lib/axios';
import { panelsService } from '@/services/panels.service';
import { crmService, CrmClient } from '@/services/crm.service';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { CalculatedPanel, PanelWithPrice, ProposalClient, ProposalDocument } from '@/components/crm/ProposalDocument';
import { Badge, CrmPage, EmptyState, Field, Panel, Sheet, Skeleton } from '@/components/app/ui';
import { crmBtn, crmInput, formatBRL, whatsappUrl } from '@/components/app/tokens';

interface LoadedOrder {
    id: string;
    status: string;
    totalValue: number;
    startDate?: string;
    endDate?: string;
    items?: { panelId: string }[];
    user?: { name?: string; email?: string; phone?: string; document?: string; companyName?: string; company?: { corporateName?: string } | null } | null;
}

/** Mesma regra do backend (pricing.service): 3, 6 e 12 meses. */
const termDiscountFor = (months: number) => (months >= 12 ? 0.3 : months >= 6 ? 0.2 : months >= 3 ? 0.15 : 0);
const MONTHS = [1, 2, 3, 4, 5, 6, 9, 12, 18, 24, 36];
const PANEL_DISCOUNTS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

const monthsFromOrder = (order: LoadedOrder) => {
    if (!order.startDate || !order.endDate) return 1;
    const days = Math.abs(new Date(order.endDate).getTime() - new Date(order.startDate).getTime()) / 86_400_000;
    return Math.min(36, Math.max(1, Math.round(days / 30)));
};

export function CrmProposals() {
    const { id: orderId } = useParams();
    const { user } = useAuth();
    const { addToast } = useToast();
    const isDesktop = useIsDesktop();

    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<CrmClient[]>([]);
    const [panels, setPanels] = useState<PanelWithPrice[]>([]);
    const [order, setOrder] = useState<LoadedOrder | null>(null);
    const [orderError, setOrderError] = useState(false);

    const [clientId, setClientId] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [months, setMonths] = useState(12);
    const [panelDiscounts, setPanelDiscounts] = useState<Record<string, number>>({});
    const [extraDiscount, setExtraDiscount] = useState('');
    const [panelQuery, setPanelQuery] = useState('');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let active = true;
        (async () => {
            setLoading(true);
            const [c, p, o] = await Promise.allSettled([
                crmService.getClients(),
                panelsService.getAllPanels(),
                orderId ? api.get<LoadedOrder>(`/orders/${orderId}`).then((r) => r.data) : Promise.resolve(null),
            ]);
            if (!active) return;
            if (c.status === 'fulfilled') setClients(c.value);
            const loadedOrder = o.status === 'fulfilled' ? o.value : null;
            if (orderId && !loadedOrder) setOrderError(true);
            // Painéis do pedido continuam na proposta mesmo se já estiverem ocupados
            const orderPanelIds = new Set((loadedOrder?.items ?? []).map((i) => i.panelId));
            if (p.status === 'fulfilled') setPanels(p.value.filter((x) => x.status === 'AVAILABLE' || orderPanelIds.has(x.id)) as PanelWithPrice[]);
            else addToast('Não foi possível carregar os painéis.', 'error');
            if (loadedOrder) {
                setOrder(loadedOrder);
                setMonths(monthsFromOrder(loadedOrder));
                setSelectedIds([...orderPanelIds]);
            }
            setLoading(false);
        })();
        return () => { active = false; };
    }, [orderId, addToast]);

    const client: ProposalClient | null = useMemo(() => {
        if (order) {
            return {
                name: order.user?.name || 'Cliente do site',
                company: order.user?.company?.corporateName || order.user?.companyName,
                document: order.user?.document,
                email: order.user?.email,
                phone: order.user?.phone,
            };
        }
        const c = clients.find((x) => x.id === clientId);
        return c ? { name: c.name, company: c.company, document: c.document, email: c.email, phone: c.whatsapp || c.phone } : null;
    }, [order, clients, clientId]);

    const calculated: CalculatedPanel[] = useMemo(() => panels
        .filter((p) => selectedIds.includes(p.id))
        .map((p) => {
            const basePrice = Number(p.price) || 0;
            const discountPct = panelDiscounts[p.id] || 0;
            return { ...p, basePrice, discountPct, finalPrice: basePrice * (1 - discountPct / 100) };
        }), [panels, selectedIds, panelDiscounts]);

    const totals = useMemo(() => {
        const monthlyAfterIndividual = calculated.reduce((sum, p) => sum + p.finalPrice, 0);
        const termDiscountPercent = termDiscountFor(months);
        const monthlyAfterTerm = monthlyAfterIndividual * (1 - termDiscountPercent);
        const globalDiscountNum = Math.min(100, Math.max(0, Number(extraDiscount) || 0));
        const finalMonthlyValue = monthlyAfterTerm * (1 - globalDiscountNum / 100);
        return { monthlyAfterIndividual, termDiscountPercent, monthlyAfterTerm, globalDiscountNum, finalMonthlyValue };
    }, [calculated, months, extraDiscount]);

    const visiblePanels = useMemo(() => {
        const q = panelQuery.trim().toLowerCase();
        const list = q ? panels.filter((p) => [p.name, p.city, p.state].some((v) => v?.toLowerCase().includes(q))) : panels;
        // Selecionados primeiro
        return [...list].sort((a, b) => Number(selectedIds.includes(b.id)) - Number(selectedIds.includes(a.id)));
    }, [panels, panelQuery, selectedIds]);

    const ready = Boolean(client) && calculated.length > 0;
    const today = new Date().toLocaleDateString('pt-BR');
    const sellerName = user?.name || 'Comercial T3 OOH';

    const toggle = (id: string) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
        setPanelDiscounts((prev) => { const next = { ...prev }; delete next[id]; return next; });
    };

    const document_ = () => <ProposalDocument client={client!} panels={calculated} months={months} totals={totals} date={today} sellerName={sellerName} />;

    const download = async () => {
        if (!ready) return false;
        try {
            const blob = await pdf(document_()).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Proposta_T3_OOH_${client!.name.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            return true;
        } catch {
            addToast('Não foi possível gerar o PDF.', 'error');
            return false;
        }
    };

    const send = async () => {
        if (!client?.phone) {
            addToast('Este cliente não tem WhatsApp cadastrado. Baixe o PDF e envie por outro canal.', 'error');
            return;
        }
        setBusy(true);
        const ok = await download();
        if (ok) {
            const first = client.name.split(' ')[0];
            const text = `Olá, ${first}! Aqui é ${sellerName}, da T3 OOH.\n\nPreparei a proposta da sua campanha com os painéis e valores combinados. Vou anexar o PDF aqui na conversa. Qualquer dúvida, estou à disposição.`;
            if (order && order.status === 'PENDING') {
                // Pedido do site passa para "Proposta enviada"
                await api.patch(`/orders/${order.id}`, { status: 'APPROVED' }).catch(() => addToast('O PDF foi gerado, mas o status do pedido não mudou.', 'error'));
            }
            window.open(whatsappUrl(client.phone, text), '_blank', 'noopener');
            addToast('PDF baixado. Anexe o arquivo na conversa do WhatsApp.', 'success');
        }
        setBusy(false);
    };

    if (loading) {
        return (
            <CrmPage eyebrow="Ferramentas" title="Proposta">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"><Skeleton className="h-96" /><Skeleton className="h-64" /></div>
            </CrmPage>
        );
    }

    return (
        <CrmPage
            eyebrow={order ? 'Pedido do catálogo' : 'Ferramentas'}
            title={order ? `Proposta para ${client?.name}` : 'Nova proposta'}
            description="Escolha cliente, prazo e painéis. O PDF sai com os descontos aplicados e pronto para enviar."
            actions={order ? <Link to="/crm" className={crmBtn.secondary}><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar</Link> : undefined}
        >
            {orderError && (
                <div role="alert" className="border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
                    Não foi possível abrir este pedido (ele pode estar com outro consultor). Você pode montar uma proposta nova abaixo.
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="flex flex-col gap-6">
                    {/* ============================ CLIENTE E PRAZO ============================ */}
                    <Panel title="Cliente e prazo" bodyClassName="grid grid-cols-1 gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_280px]">
                        {order ? (
                            <div className="border border-brand-border p-3.5">
                                <p className="font-medium text-brand-text">{client?.name}</p>
                                <p className="mt-1 text-sm text-brand-muted">{[client?.company, client?.phone, client?.email].filter(Boolean).join(' · ')}</p>
                                <p className="mt-2 text-xs text-brand-muted">Valor do pedido no site: <span className="font-mono text-brand-text">{formatBRL(order.totalValue)}</span></p>
                            </div>
                        ) : (
                            <Field label="Cliente" htmlFor="p-client">
                                <select id="p-client" value={clientId} onChange={(e) => setClientId(e.target.value)} className={crmInput}>
                                    <option value="">Selecione um cliente da carteira</option>
                                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ''}</option>)}
                                </select>
                            </Field>
                        )}
                        <Field label="Prazo" htmlFor="p-months">
                            <select id="p-months" value={months} onChange={(e) => setMonths(Number(e.target.value))} className={crmInput}>
                                {[...new Set([...MONTHS, months])].sort((a, b) => a - b).map((m) => (
                                    <option key={m} value={m}>{m} {m === 1 ? 'mês' : 'meses'}{termDiscountFor(m) ? ` · ${termDiscountFor(m) * 100}% de desconto` : ''}</option>
                                ))}
                            </select>
                        </Field>
                    </Panel>

                    {/* ============================ PAINÉIS ============================ */}
                    <Panel title="Painéis" action={<Badge tone={selectedIds.length ? 'accent' : 'muted'}>{selectedIds.length} na proposta</Badge>}>
                        <div className="border-b border-brand-border p-3">
                            <label htmlFor="p-search" className="sr-only">Buscar painéis</label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" aria-hidden="true" />
                                <input id="p-search" type="search" value={panelQuery} onChange={(e) => setPanelQuery(e.target.value)} placeholder="Nome, cidade ou estado" className={`${crmInput} pl-10`} />
                            </div>
                        </div>
                        {visiblePanels.length === 0 ? (
                            <p className="p-5 text-sm text-brand-muted">Nenhum painel disponível com esse filtro.</p>
                        ) : (
                            <ul className="custom-scrollbar max-h-[560px] divide-y divide-brand-border overflow-y-auto">
                                {visiblePanels.map((panel) => {
                                    const on = selectedIds.includes(panel.id);
                                    const base = Number(panel.price) || 0;
                                    const pct = panelDiscounts[panel.id] || 0;
                                    return (
                                        <li key={panel.id} className={on ? 'bg-brand-neon/5' : ''}>
                                            <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                                                <input type="checkbox" checked={on} onChange={() => toggle(panel.id)} className="h-4 w-4 shrink-0 accent-brand-neon" />
                                                <img src={panel.images?.[0] || '/placeholder.svg'} alt="" className="h-12 w-16 shrink-0 bg-brand-background object-cover" />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm text-brand-text">{panel.name}</span>
                                                    <span className="block truncate text-xs text-brand-muted">{[panel.city, panel.state].filter(Boolean).join(' - ')}{panel.status !== 'AVAILABLE' ? ' · já ocupado' : ''}</span>
                                                </span>
                                                <span className="shrink-0 text-right font-mono text-sm">
                                                    <span className="block text-brand-text">{formatBRL(base * (1 - pct / 100))}</span>
                                                    {pct > 0 && <span className="block text-xs text-brand-muted line-through">{formatBRL(base)}</span>}
                                                </span>
                                            </label>
                                            {on && (
                                                <div className="flex items-center justify-end gap-2 px-4 pb-3">
                                                    <label htmlFor={`d-${panel.id}`} className="text-xs text-brand-muted">Desconto neste painel</label>
                                                    <select id={`d-${panel.id}`} value={pct} onChange={(e) => setPanelDiscounts((prev) => ({ ...prev, [panel.id]: Number(e.target.value) }))} className={`${crmInput} w-28 py-1.5 font-mono`}>
                                                        {PANEL_DISCOUNTS.map((v) => <option key={v} value={v}>{v ? `${v}%` : 'Nenhum'}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Panel>
                </div>

                {/* ============================ RESUMO ============================ */}
                <div className="flex flex-col gap-4 lg:sticky lg:top-8 lg:self-start">
                    <Panel title="Resumo mensal" bodyClassName="flex flex-col gap-3 p-5 text-sm">
                        <div className="flex justify-between text-brand-muted"><span>Painéis ({calculated.length})</span><span className="font-mono text-brand-text">{formatBRL(totals.monthlyAfterIndividual)}</span></div>
                        {totals.termDiscountPercent > 0 && (
                            <div className="flex justify-between text-brand-muted"><span>Prazo de {months} meses ({totals.termDiscountPercent * 100}%)</span><span className="font-mono">− {formatBRL(totals.monthlyAfterIndividual * totals.termDiscountPercent)}</span></div>
                        )}
                        <Field label="Desconto de negociação (%)" htmlFor="p-extra">
                            <input id="p-extra" type="number" inputMode="decimal" min="0" max="100" step="0.5" value={extraDiscount} onChange={(e) => setExtraDiscount(e.target.value)} placeholder="0" className={`${crmInput} font-mono`} />
                        </Field>
                        {totals.globalDiscountNum > 0 && (
                            <div className="flex justify-between text-brand-muted"><span>Negociação ({totals.globalDiscountNum}%)</span><span className="font-mono">− {formatBRL(totals.monthlyAfterTerm * (totals.globalDiscountNum / 100))}</span></div>
                        )}
                        <div className="mt-2 flex items-end justify-between border-t border-brand-border pt-4">
                            <span className="text-brand-text">Investimento mensal</span>
                            <span className="font-mono text-2xl text-brand-neon">{formatBRL(totals.finalMonthlyValue)}</span>
                        </div>
                        <p className="text-xs text-brand-muted">Total do contrato: <span className="font-mono text-brand-text">{formatBRL(totals.finalMonthlyValue * months)}</span></p>
                    </Panel>

                    {!ready && <p className="text-sm text-brand-muted">Escolha o cliente e pelo menos um painel para gerar o PDF.</p>}

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                        <button type="button" onClick={send} disabled={!ready || busy} className={crmBtn.primary}><Send className="h-4 w-4" aria-hidden="true" /> {busy ? 'Gerando…' : 'Enviar pelo WhatsApp'}</button>
                        <button type="button" onClick={download} disabled={!ready} className={crmBtn.secondary}><Download className="h-4 w-4" aria-hidden="true" /> Baixar PDF</button>
                        <button type="button" onClick={() => setPreviewOpen(true)} disabled={!ready} className={`${crmBtn.secondary} sm:col-span-2 lg:col-span-1`}><Eye className="h-4 w-4" aria-hidden="true" /> Ver como fica</button>
                    </div>
                </div>
            </div>

            {!panels.length && <EmptyState title="Nenhum painel disponível" text="Cadastre ou libere painéis no painel administrativo para montar propostas." />}

            <Sheet open={previewOpen && ready} onClose={() => setPreviewOpen(false)} eyebrow="Pré-visualização" title={`Proposta · ${client?.name ?? ''}`} size="lg">
                {ready && (isDesktop
                    ? <div className="h-[70dvh]"><PDFViewer width="100%" height="100%" className="border-0">{document_()}</PDFViewer></div>
                    : <p className="text-sm text-brand-muted">A pré-visualização do PDF não abre em celulares. Use "Baixar PDF" para ver o arquivo.</p>)}
            </Sheet>
        </CrmPage>
    );
}
