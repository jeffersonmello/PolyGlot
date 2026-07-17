import { PDFDocument, StandardFonts, rgb, PDFPage } from 'pdf-lib';
import path from 'path';
import fs from 'fs';
import { TextBlock } from '../types';
import { logger } from '../utils/logger';

const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(__dirname, '../../outputs');

/**
 * Replaces characters that cannot be encoded in WinAnsi (Windows-1252) with a space.
 * Standard PDF fonts (e.g. Helvetica) only support code points up to U+00FF.
 */
function sanitizeForWinAnsi(text: string): string {
  return Array.from(text)
    .map((ch) => {
      const cp = ch.codePointAt(0) ?? 0;
      return cp > 0xff ? ' ' : ch;
    })
    .join('');
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generates a translated PDF from extracted text blocks.
 * Preserves approximate layout, font sizes, and page structure.
 */
export async function generateTranslatedPdf(
  translatedBlocks: TextBlock[],
  pageCount: number,
  outputFileName: string,
  metadata: Record<string, string> = {}
): Promise<string> {
  logger.info(`Generating translated PDF: ${outputFileName} (${pageCount} pages)`);

  const pdfDoc = await PDFDocument.create();

  // Set metadata
  if (metadata['Title']) pdfDoc.setTitle(metadata['Title'] + ' (Translated)');
  if (metadata['Author']) pdfDoc.setAuthor(metadata['Author']);
  pdfDoc.setCreator('PolyGlot PDF Translation System');
  pdfDoc.setProducer('PolyGlot v1.0');
  pdfDoc.setCreationDate(new Date());
  pdfDoc.setModificationDate(new Date());

  // Embed fonts
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_WIDTH = 612;  // US Letter width in points
  const PAGE_HEIGHT = 792; // US Letter height in points
  const MARGIN = 72;       // 1 inch margins
  const LINE_HEIGHT = 16;

  // Group blocks by page
  const blocksByPage: Map<number, TextBlock[]> = new Map();
  for (const block of translatedBlocks) {
    const pageIdx = block.pageIndex;
    if (!blocksByPage.has(pageIdx)) blocksByPage.set(pageIdx, []);
    blocksByPage.get(pageIdx)!.push(block);
  }

  const totalPages = Math.max(pageCount, blocksByPage.size, 1);

  // Create pages
  const pages: PDFPage[] = [];
  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);
  }

  // Draw text blocks
  for (const [pageIdx, blocks] of blocksByPage) {
    const page = pages[pageIdx];
    if (!page) continue;

    let cursorY = PAGE_HEIGHT - MARGIN;

    for (const block of blocks) {
      const fontSize = Math.min(Math.max(block.fontSize || 12, 8), 24);
      const font = block.text.startsWith('##') ? boldFont : regularFont;
      const text = sanitizeForWinAnsi(block.text.replace(/^#+\s*/, '')); // strip markdown headings + sanitize encoding

      if (cursorY < MARGIN) {
        cursorY = PAGE_HEIGHT - MARGIN;
      }

      // Wrap long lines
      const maxWidth = PAGE_WIDTH - 2 * MARGIN;
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const lineWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (lineWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      for (const line of lines) {
        if (cursorY < MARGIN) break;
        page.drawText(line, {
          x: MARGIN,
          y: cursorY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
          maxWidth,
        });
        cursorY -= LINE_HEIGHT;
      }

      cursorY -= 4; // paragraph spacing
    }

    // Page number footer
    page.drawText(`Page ${pageIdx + 1} of ${totalPages}`, {
      x: PAGE_WIDTH / 2 - 30,
      y: MARGIN / 2,
      size: 9,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // "PolyGlot" watermark header
    page.drawText('Translated by PolyGlot', {
      x: MARGIN,
      y: PAGE_HEIGHT - MARGIN / 2,
      size: 8,
      font: regularFont,
      color: rgb(0.7, 0.7, 0.7),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(OUTPUT_DIR, outputFileName);
  fs.writeFileSync(outputPath, pdfBytes);

  logger.info(`PDF saved to: ${outputPath}`);
  return outputPath;
}

export const OUTPUT_DIR_PATH = OUTPUT_DIR;
