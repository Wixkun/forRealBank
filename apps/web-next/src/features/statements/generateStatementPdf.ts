import type { DisplayTransaction } from '@/features/dashboard/types';
import { cleanPdfText as clean, PDF_COLORS, type PdfRgb } from '@/lib/pdf';

// Traducteur scopé sur « statements.pdf » fourni par l'appelant (next-intl)
export type StatementPdfTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export interface StatementPdfInput {
  clientName: string;
  accountLabel: string; // Checking / Savings / Investment
  accountName: string;
  maskedNumber: string; // ex: Checking (…0123)
  iban?: string | null;
  currency: string;
  currentBalance: number;
  periodStart: Date;
  periodEnd: Date;
  // Transactions de la période, triées par date croissante
  transactions: DisplayTransaction[];
  dateLocale: string; // ex: fr-FR / en-US
  t: StatementPdfTranslator;
}

const PAGE_MARGIN = 48;
const FOOTER_ZONE = 60;

const { teal: TEAL, dark: DARK, gray: GRAY, red: RED, line: LINE } = PDF_COLORS;
const HEADER_FILL: PdfRgb = [240, 243, 246];
const ZEBRA_FILL: PdfRgb = [249, 250, 251];


export async function generateStatementPdf(input: StatementPdfInput): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;

  const t = (key: string, values?: Record<string, string | number>) => clean(input.t(key, values));
  const money = (n: number) =>
    clean(n.toLocaleString(input.dateLocale, { style: 'currency', currency: input.currency }));
  const fmtDate = (d: Date) =>
    d.toLocaleDateString(input.dateLocale, { day: '2-digit', month: '2-digit', year: 'numeric' });

  const totalCredits = input.transactions
    .filter((t) => t.type === 'credit')
    .reduce((s, t) => s + t.amount, 0);
  const totalDebits = input.transactions
    .filter((t) => t.type === 'debit')
    .reduce((s, t) => s + t.amount, 0);

  // Soldes d'ouverture/clôture déduits du « solde après transaction » si présent
  const first = input.transactions[0];
  const last = input.transactions[input.transactions.length - 1];
  const openingBalance =
    first?.balance != null
      ? first.balance - (first.type === 'credit' ? first.amount : -first.amount)
      : undefined;
  const closingBalance = last?.balance != null ? last.balance : undefined;

  // ── En-tête ────────────────────────────────────────────────────────────────
  let y = 64;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...TEAL);
  doc.text('ForRealBank', PAGE_MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(t('editedOn', { date: fmtDate(new Date()) }), pageWidth - PAGE_MARGIN, y, { align: 'right' });
  y += 18;
  doc.setFontSize(11);
  doc.text(t('title'), PAGE_MARGIN, y);
  y += 14;
  doc.setDrawColor(...LINE);
  doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
  y += 24;

  // ── Informations client / compte ───────────────────────────────────────────
  const info: [string, string][] = [
    [t('holder'), input.clientName],
    [t('account'), `${input.accountName} — ${input.maskedNumber}`],
    [t('iban'), input.iban ?? '—'],
    [t('currency'), input.currency],
    [t('currentBalance'), money(input.currentBalance)],
    [t('period'), t('periodValue', { start: fmtDate(input.periodStart), end: fmtDate(input.periodEnd) })],
  ];
  const colWidth = contentWidth / 2;
  info.forEach(([label, value], i) => {
    const x = PAGE_MARGIN + (i % 2) * colWidth;
    const rowY = y + Math.floor(i / 2) * 30;
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(clean(label), x, rowY);
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(clean(value), x, rowY + 12);
  });
  y += Math.ceil(info.length / 2) * 30 + 8;

  // ── Résumé de la période ───────────────────────────────────────────────────
  const summary: { label: string; value: string; color: PdfRgb }[] = [
    { label: t('openingBalance'), value: openingBalance != null ? money(openingBalance) : '—', color: DARK },
    { label: t('totalCredits'), value: `+ ${money(totalCredits)}`, color: TEAL },
    { label: t('totalDebits'), value: `- ${money(totalDebits)}`, color: RED },
    { label: t('closingBalance'), value: closingBalance != null ? money(closingBalance) : '—', color: DARK },
  ];
  const boxHeight = 52;
  doc.setDrawColor(...LINE);
  doc.roundedRect(PAGE_MARGIN, y, contentWidth, boxHeight, 6, 6);
  const cellWidth = contentWidth / summary.length;
  summary.forEach((cell, i) => {
    const x = PAGE_MARGIN + i * cellWidth + 12;
    if (i > 0) doc.line(PAGE_MARGIN + i * cellWidth, y + 8, PAGE_MARGIN + i * cellWidth, y + boxHeight - 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(clean(cell.label), x, y + 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...cell.color);
    doc.text(cell.value, x, y + 36);
  });
  y += boxHeight + 28;

  // ── Tableau des transactions ───────────────────────────────────────────────
  const cols = [
    { header: t('colDate'), width: 64, align: 'left' as const },
    { header: t('colDescription'), width: 197, align: 'left' as const },
    { header: t('colCategory'), width: 60, align: 'left' as const },
    { header: t('colAmount'), width: 90, align: 'right' as const },
    { header: t('colBalance'), width: 88, align: 'right' as const },
  ];
  const colX: number[] = [];
  let acc = PAGE_MARGIN;
  for (const col of cols) {
    colX.push(acc);
    acc += col.width;
  }

  const drawTableHeader = () => {
    doc.setFillColor(...HEADER_FILL);
    doc.rect(PAGE_MARGIN, y, contentWidth, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    cols.forEach((col, i) => {
      const x = col.align === 'right' ? colX[i] + col.width - 8 : colX[i] + 8;
      doc.text(clean(col.header), x, y + 13, { align: col.align });
    });
    y += 20;
  };

  const ensureRoom = (needed: number) => {
    if (y + needed <= pageHeight - FOOTER_ZONE) return;
    doc.addPage();
    y = 56;
    drawTableHeader();
  };

  drawTableHeader();

  if (input.transactions.length === 0) {
    y += 28;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text(t('noTransactions'), pageWidth / 2, y, { align: 'center' });
  } else {
    doc.setFont('helvetica', 'normal');
    input.transactions.forEach((tx, index) => {
      const descLines: string[] = doc
        .setFontSize(8.5)
        .splitTextToSize(clean(tx.description || '—'), cols[1].width - 16);
      const rowHeight = Math.max(20, descLines.length * 10 + 10);
      ensureRoom(rowHeight);

      if (index % 2 === 1) {
        doc.setFillColor(...ZEBRA_FILL);
        doc.rect(PAGE_MARGIN, y, contentWidth, rowHeight, 'F');
      }

      const textY = y + 13;
      doc.setFontSize(8.5);
      doc.setTextColor(...DARK);
      doc.text(fmtDate(new Date(tx.date)), colX[0] + 8, textY);
      doc.text(descLines, colX[1] + 8, textY);
      doc.setTextColor(...GRAY);
      doc.text(tx.type === 'credit' ? t('credit') : t('debit'), colX[2] + 8, textY);
      doc.setTextColor(...(tx.type === 'credit' ? TEAL : RED));
      doc.text(
        `${tx.type === 'credit' ? '+' : '-'} ${money(tx.amount)}`,
        colX[3] + cols[3].width - 8,
        textY,
        { align: 'right' },
      );
      doc.setTextColor(...DARK);
      doc.text(
        tx.balance != null ? money(tx.balance) : '—',
        colX[4] + cols[4].width - 8,
        textY,
        { align: 'right' },
      );

      y += rowHeight;
      doc.setDrawColor(...LINE);
      doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
    });
  }

  // ── Pied de page (toutes les pages) ───────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(t('footer'), PAGE_MARGIN, pageHeight - 32);
    doc.text(t('page', { current: i, total: pageCount }), pageWidth - PAGE_MARGIN, pageHeight - 32, { align: 'right' });
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  doc.save(
    `releve-${input.accountLabel.toLowerCase()}-${stamp(input.periodStart)}-${stamp(input.periodEnd)}.pdf`,
  );
}
