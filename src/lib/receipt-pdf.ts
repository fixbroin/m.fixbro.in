export interface ReceiptPdfInput {
  orderId: string;
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  customerName: string;
  customerEmail: string;
  planTitle: string;
  amount: number;
  currencySymbol: string;
  paymentMethod: string;
  status: string;
  dateStr: string;
}

function pdfSafeText(value: string): string {
  return value
    .replace(/₹/g, 'Rs. ')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\s+/g, ' ')
    .trim();
}

function wrapText(text: string, maxChars: number): string[] {
  const words = pdfSafeText(text).split(' ');
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if (!current) {
      current = w;
    } else if (current.length + 1 + w.length <= maxChars) {
      current += ' ' + w;
    } else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

/**
 * Generates a valid single-page PDF 1.4 receipt Buffer with zero external dependencies.
 */
export function generateOrderReceiptPdf(input: ReceiptPdfInput): Buffer {
  const commands: string[] = [];

  const drawText = (x: number, y: number, text: string, size = 11, bold = false) => {
    const font = bold ? '/F2' : '/F1';
    commands.push(`BT ${font} ${size} Tf ${x} ${y} Td (${pdfSafeText(text)}) Tj ET`);
  };

  const drawLine = (x1: number, y1: number, x2: number, y2: number, gray = 0.8) => {
    commands.push(`${gray} G 0.75 w ${x1} ${y1} m ${x2} ${y2} l S`);
  };

  // Header band
  commands.push('0.02 0.25 0.32 rg 40 725 515 75 re f');
  commands.push('1 1 1 rg');
  drawText(60, 768, input.companyName || 'FixBro Interiors', 20, true);
  drawText(60, 745, 'OFFICIAL PAYMENT & BOOKING RECEIPT', 10, false);

  // Reset text color to dark slate
  commands.push('0.12 0.16 0.22 rg');

  let y = 695;
  drawText(60, y, `Receipt / Order ID: ${input.orderId}`, 10, true);
  drawText(380, y, `Date: ${input.dateStr}`, 10, false);
  y -= 18;
  drawLine(60, y, 535, y, 0.85);

  y -= 28;
  drawText(60, y, 'BILLED TO', 9, true);
  drawText(330, y, 'PAYMENT DETAILS', 9, true);
  y -= 18;
  drawText(60, y, input.customerName, 11, true);
  drawText(330, y, `Method: ${input.paymentMethod}`, 10, false);
  y -= 16;
  drawText(60, y, input.customerEmail, 10, false);
  drawText(330, y, `Status: ${input.status.toUpperCase()}`, 10, true);

  y -= 26;
  drawLine(60, y, 535, y, 0.85);

  // Table Header
  y -= 24;
  commands.push('0.95 0.96 0.97 rg 60 ' + (y - 6) + ' 475 24 re f');
  commands.push('0.12 0.16 0.22 rg');
  drawText(70, y + 2, 'PLAN / SERVICE DESCRIPTION', 9, true);
  drawText(440, y + 2, 'AMOUNT', 9, true);

  y -= 28;
  const planLines = wrapText(input.planTitle, 52);
  const amountFormatted = `${input.currencySymbol}${Number(input.amount).toLocaleString('en-IN')}`;

  planLines.forEach((line, idx) => {
    drawText(70, y, line, 11, idx === 0);
    if (idx === 0) {
      drawText(440, y, amountFormatted, 11, true);
    }
    y -= 16;
  });

  y -= 12;
  drawLine(60, y, 535, y, 0.85);

  // Total box
  y -= 28;
  drawText(340, y, 'TOTAL AMOUNT:', 12, true);
  drawText(440, y, amountFormatted, 13, true);

  y -= 22;
  drawLine(60, y, 535, y, 0.85);

  // Footer
  y -= 36;
  drawText(60, y, 'Thank you for choosing ' + (input.companyName || 'FixBro Interiors') + '.', 10, true);
  y -= 16;
  if (input.companyEmail || input.companyPhone) {
    drawText(
      60,
      y,
      `Support: ${[input.companyEmail, input.companyPhone].filter(Boolean).join(' | ')}`,
      9,
      false
    );
    y -= 14;
  }
  if (input.companyAddress) {
    wrapText(input.companyAddress, 85).forEach((line) => {
      drawText(60, y, line, 8.5, false);
      y -= 12;
    });
  }

  const streamContent = commands.join('\n');
  const streamLength = Buffer.byteLength(streamContent, 'utf8');

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}
