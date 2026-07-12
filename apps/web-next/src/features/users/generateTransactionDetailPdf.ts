import { cleanPdfText as clean, PDF_COLORS } from '@/lib/pdf';
import type { ManagedTransaction } from './types';

export type TransactionPdfTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/**
 * Détail PDF d'une transaction (consultation staff, lecture seule). Réutilise
 * la charte des PDF existants (relevés / reçus : helpers de lib/pdf).
 */
export async function generateTransactionDetailPdf(input: {
  ownerName: string;
  accountLabel: string;
  maskedNumber: string;
  transaction: ManagedTransaction;
  currency: string;
  dateLocale: string;
  t: TransactionPdfTranslator;
}): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;

  const { teal: TEAL, dark: DARK, gray: GRAY, red: RED, line: LINE } = PDF_COLORS;
  const t = (key: string, values?: Record<string, string | number>) => clean(input.t(key, values));
  const money = (n: number) =>
    clean(
      Math.abs(n).toLocaleString(input.dateLocale, { style: 'currency', currency: input.currency }),
    );
  const tx = input.transaction;
  const isCredit = tx.amount >= 0;

  let y = 64;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...TEAL);
  doc.text('ForRealBank', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(
    t('editedOn', { date: new Date().toLocaleDateString(input.dateLocale) }),
    pageWidth - margin,
    y,
    { align: 'right' },
  );
  y += 18;
  doc.setFontSize(11);
  doc.text(t('title'), margin, y);
  y += 14;
  doc.setDrawColor(...LINE);
  doc.line(margin, y, pageWidth - margin, y);
  y += 30;

  // Montant en avant, signé et coloré comme dans le relevé.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...(isCredit ? TEAL : RED));
  doc.text(`${isCredit ? '+' : '-'} ${money(tx.amount)}`, margin, y);
  y += 30;

  const rows: [string, string][] = [
    [t('holder'), input.ownerName],
    [t('account'), input.maskedNumber],
    [t('date'), new Date(tx.date).toLocaleString(input.dateLocale)],
    [t('description'), tx.description || '—'],
    [t('type'), isCredit ? t('credit') : t('debit')],
    [t('balanceAfter'), money(tx.balance)],
    [t('reference'), tx.id],
  ];
  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(clean(label), margin, y);
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    const lines: string[] = doc.splitTextToSize(clean(value), pageWidth - margin * 2);
    doc.text(lines, margin, y + 12);
    y += 14 + lines.length * 12;
  }

  y += 10;
  doc.setDrawColor(...LINE);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text(t('footer'), margin, y + 16);

  doc.save(`transaction-${tx.id.slice(0, 8)}.pdf`);
}
