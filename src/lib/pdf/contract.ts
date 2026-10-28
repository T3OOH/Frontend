import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY_FOOTER } from '@/lib/company';
import type { CrmClient, CrmDeal } from '@/services/crm.service';

const brl = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

/**
 * Gera e baixa o contrato de veiculação de um negócio do CRM.
 * Os dados do cliente vêm do negócio; a ficha aberta completa o que faltar.
 */
export function downloadDealContract(deal: CrmDeal, fallbackClient?: CrmClient | null) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const marginLeft = 20;
    const marginRight = 20;
    const contentWidth = pageWidth - marginLeft - marginRight;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(255, 94, 0);
    doc.text('t3', pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('T3 LED MÍDIA E TECNOLOGIA LTDA', pageWidth / 2, 32, { align: 'center' });

    let y = 50;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('CONTRATO DE VEICULAÇÃO OOH', pageWidth / 2, y, { align: 'center' });
    y += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const client = deal.client;
    const clientName = client?.name || fallbackClient?.name || 'Cliente não informado';
    const months = deal.contractMonths || 1;
    const lines = [
        `CONTRATANTE: ${clientName}`,
        `EMPRESA / AGÊNCIA: ${client?.company || fallbackClient?.company || 'Não informada'}`,
        `CPF / CNPJ: ${client?.document || fallbackClient?.document || 'Não informado'}`,
        `E-MAIL: ${client?.email || fallbackClient?.email || 'Não informado'}`,
        `TELEFONE: ${client?.phone || client?.whatsapp || fallbackClient?.phone || 'Não informado'}`,
        `DATA DO PEDIDO: ${new Date(deal.createdAt).toLocaleDateString('pt-BR')}`,
        `PRAZO: ${months} ${months === 1 ? 'mês' : 'meses'}`,
    ];
    lines.forEach((text) => { doc.text(text, marginLeft, y); y += 6; });
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.text('1. ESCOPO DOS SERVIÇOS E INVESTIMENTO', marginLeft, y);
    y += 5;

    const total = Number(deal.expectedValue || 0);
    const rows: string[][] = (deal.items || []).map((item) => {
        const p = item.panel || { name: 'Painel' };
        const place = [p.city, p.state].filter(Boolean).join(' - ').toUpperCase();
        return [`${place ? `(${place}) ` : ''}${p.name}`, `${brl(Number(item.priceSnapshot || 0))}/mês`];
    });
    if (rows.length === 0) rows.push(['Pacote personalizado', brl(total)]);

    autoTable(doc, {
        startY: y,
        head: [['Painéis contratados', 'Valor negociado']],
        body: [
            ...rows,
            [{ content: 'VALOR TOTAL DO CONTRATO:', styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 94, 0], textColor: [255, 255, 255] } }, brl(total)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [17, 17, 19], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: marginLeft, right: marginRight },
        styles: { font: 'helvetica', fontSize: 9 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

    doc.setFont('helvetica', 'bold');
    doc.text('2. TERMOS DE CONTRATAÇÃO', marginLeft, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    [
        'Pelo presente instrumento, a T3 LED MÍDIA compromete-se a realizar a veiculação de mídia digital outdoor (DOOH) nas localizações especificadas na tabela acima.',
        'O presente pedido consolida a intenção de contratação. É de inteira responsabilidade da CONTRATANTE o envio dos arquivos digitais nas especificações técnicas exigidas.',
    ].forEach((text) => {
        const wrapped = doc.splitTextToSize(text, contentWidth);
        if (y + wrapped.length * 5 > pageHeight - 40) { doc.addPage(); y = 20; }
        doc.text(text, marginLeft, y, { align: 'justify', maxWidth: contentWidth });
        y += wrapped.length * 5 + 4;
    });

    y += 20;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, y, marginLeft + 60, y);
    doc.line(pageWidth - marginRight - 60, y, pageWidth - marginRight, y);
    y += 5;
    doc.setFontSize(9);
    doc.text(`T3 LED Mídia / ${deal.seller?.name || 'Comercial'}`, marginLeft, y);
    doc.text(doc.splitTextToSize(clientName, 60), pageWidth - marginRight - 60, y);

    const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(COMPANY_FOOTER, pageWidth / 2, pageHeight - 15, { align: 'center' });
    }

    doc.save(`Contrato_${clientName.replace(/\s+/g, '_')}.pdf`);
}
