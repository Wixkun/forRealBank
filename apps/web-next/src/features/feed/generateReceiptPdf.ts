import { cleanPdfText, PDF_COLORS } from '@/lib/pdf';

export interface ReceiptPdfInput {
  title: string; // ex : « Virement émis » / « Virement reçu »
  amount: string; // montant signé déjà formaté, ex : « - 200,00 $ »
  rows: [string, string][];
  generatedAt: string; // date d'édition déjà formatée
  fileName: string;
}

// Reçu de virement / transaction : une page A4 avec en-tête, montant et
// lignes label/valeur.
export async function generateReceiptPdf(input: ReceiptPdfInput): Promise<void> {
  // Import dynamique pour ne pas alourdir le bundle initial
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;

  let y = 70;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...PDF_COLORS.teal);
  doc.text('ForReal Bank', margin, y);
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.gray);
  doc.text(cleanPdfText(input.title), margin, y);
  y += 16;
  doc.setDrawColor(...PDF_COLORS.line);
  doc.line(margin, y, pageWidth - margin, y);
  y += 44;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...PDF_COLORS.dark);
  doc.text(cleanPdfText(input.amount), margin, y);
  y += 30;
  doc.line(margin, y, pageWidth - margin, y);
  y += 28;

  for (const [label, value] of input.rows) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COLORS.gray);
    doc.text(cleanPdfText(label), margin, y);
    doc.setFontSize(10);
    doc.setTextColor(...PDF_COLORS.dark);
    doc.text(cleanPdfText(value), margin + 175, y);
    y += 24;
  }

  doc.line(margin, pageHeight - 64, pageWidth - margin, pageHeight - 64);
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.gray);
  doc.text(cleanPdfText(`ForReal Bank — ${input.generatedAt}`), margin, pageHeight - 48);

  doc.save(input.fileName);
}
