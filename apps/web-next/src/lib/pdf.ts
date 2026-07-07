// Helpers communs à la génération PDF jsPDF (reçu de virement, relevé de compte)

export type PdfRgb = [number, number, number];

export const PDF_COLORS = {
  teal: [13, 158, 143] as PdfRgb,
  dark: [26, 28, 33] as PdfRgb,
  gray: [115, 120, 133] as PdfRgb,
  red: [220, 68, 68] as PdfRgb,
  line: [217, 222, 230] as PdfRgb,
};

// Les polices standard Helvetica ne couvrent ni la flèche « → » ni les
// espaces fines insérées par les formats fr-FR
export const cleanPdfText = (s: string) =>
  s.replace(/→/g, '->').replace(/[  ]/g, ' ');

export const pdfMoney = (n: number, currency = 'EUR') =>
  cleanPdfText(n.toLocaleString('fr-FR', { style: 'currency', currency }));
