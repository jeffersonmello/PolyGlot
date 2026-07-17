import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import { PdfExtractionResult, TextBlock } from '../types';
import { logger } from '../utils/logger';
import { assertWithinDirectory } from '../utils/pathGuard';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'));

/**
 * Detects the probable language of a text string using simple heuristics.
 * In production, replace with a proper language detection library.
 */
function detectLanguageHeuristic(text: string): string {
  const sample = text.slice(0, 500).toLowerCase();

  const patterns: Array<[RegExp, string]> = [
    [/\b(the|and|is|in|to|of|a|that|it|for)\b/g, 'en'],
    [/\b(el|la|los|las|que|de|en|un|una|es)\b/g, 'es'],
    [/\b(le|la|les|de|et|en|un|une|est|pour)\b/g, 'fr'],
    [/\b(der|die|das|und|ist|in|von|zu|den|mit)\b/g, 'de'],
    [/\b(il|la|i|le|di|e|in|che|un|una)\b/g, 'it'],
    [/\b(o|a|os|as|de|e|em|que|um|uma)\b/g, 'pt'],
    [/[\u0400-\u04FF]/g, 'ru'],
    [/[\u4E00-\u9FFF]/g, 'zh'],
    [/[\u3040-\u309F\u30A0-\u30FF]/g, 'ja'],
    [/[\uAC00-\uD7AF]/g, 'ko'],
    [/[\u0600-\u06FF]/g, 'ar'],
    [/[\u0900-\u097F]/g, 'hi'],
  ];

  let bestLang = 'en';
  let bestCount = 0;

  for (const [pattern, lang] of patterns) {
    const matches = sample.match(pattern);
    const count = matches ? matches.length : 0;
    if (count > bestCount) {
      bestCount = count;
      bestLang = lang;
    }
  }

  return bestLang;
}

/**
 * Extracts text and metadata from a PDF file.
 */
export async function extractPdfContent(filePath: string): Promise<PdfExtractionResult> {
  logger.info(`Extracting content from PDF: ${filePath}`);

  // Guard: ensure filePath is within the designated uploads directory
  assertWithinDirectory(UPLOAD_DIR, filePath);

  const dataBuffer = fs.readFileSync(filePath);

  try {
    const data = await pdfParse(dataBuffer);

    const fullText = data.text || '';
    const lines = fullText.split('\n').filter((line) => line.trim().length > 0);

    // Build text blocks by grouping lines into paragraphs
    const textBlocks: TextBlock[] = [];
    let pageIndex = 0;
    let yOffset = 0;
    const lineHeight = 14;
    const pageHeight = 792; // standard letter page in points

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Simulate page breaks based on accumulated height
      if (yOffset + lineHeight > pageHeight) {
        pageIndex++;
        yOffset = 50;
      }

      textBlocks.push({
        text: line.trim(),
        x: 72,
        y: yOffset + 50,
        width: 468,
        height: lineHeight,
        fontSize: 12,
        fontName: 'Helvetica',
        pageIndex,
        language: undefined,
      });

      yOffset += lineHeight + 2;
    }

    const detectedLanguage = detectLanguageHeuristic(fullText);

    const metadata: Record<string, string> = {};
    if (data.info) {
      const info = data.info as Record<string, unknown>;
      if (info.Title) metadata['Title'] = String(info.Title);
      if (info.Author) metadata['Author'] = String(info.Author);
      if (info.Subject) metadata['Subject'] = String(info.Subject);
      if (info.Creator) metadata['Creator'] = String(info.Creator);
      if (info.Producer) metadata['Producer'] = String(info.Producer);
    }

    logger.info(
      `Extracted ${textBlocks.length} text blocks from ${data.numpages} pages. ` +
        `Detected language: ${detectedLanguage}`
    );

    return {
      textBlocks,
      pageCount: data.numpages,
      metadata,
      detectedLanguage,
    };
  } catch (error) {
    logger.error(`PDF extraction failed: ${(error as Error).message}`);
    throw new Error(`Failed to extract PDF content: ${(error as Error).message}`);
  }
}
