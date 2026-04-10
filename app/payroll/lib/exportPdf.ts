import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { MonthlyRecord } from './types';

/**
 * Renders an off-screen printable node to a canvas, then embeds it as a PNG
 * into an A4 PDF. Using a raster bypasses Korean-font embedding concerns.
 *
 * The caller must have a light-themed `<div id={printableId}>` somewhere in
 * the DOM (typically hidden off-screen via `left: -99999px`).
 */
export async function exportMonthToPdf(
  record: MonthlyRecord,
  printableId: string,
): Promise<void> {
  const node = document.getElementById(printableId);
  if (!node) {
    throw new Error(`인쇄 영역(#${printableId})을 찾을 수 없습니다.`);
  }

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
  });
  const dataUrl = canvas.toDataURL('image/png');

  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 36;
  const imgWidth = pageW - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(dataUrl, 'PNG', margin, margin, imgWidth, imgHeight);
  pdf.save(`정산_${record.month}.pdf`);
}
