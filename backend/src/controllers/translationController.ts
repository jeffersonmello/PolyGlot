import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { TranslationOptions, ApiResponse, TranslationRecord } from '../types';
import { extractPdfContent } from '../services/pdfExtractor';
import { translationService } from '../services/translationService';
import { generateTranslatedPdf, OUTPUT_DIR_PATH } from '../services/pdfGenerator';
import { translationStore } from '../services/translationStore';
import { logger } from '../utils/logger';
import { SUPPORTED_LANGUAGES } from '../types';

const DEFAULT_OPTIONS: TranslationOptions = {
  preserveFormatting: true,
  preserveImages: true,
  preserveTables: true,
  translateImagesText: false,
  maintainCharacterStyles: true,
  translateProperNames: false,
  keepProperNamesUntranslated: false,
  detectMixedLanguage: true,
  preserveCitations: false,
};

function parseOptions(raw: unknown): TranslationOptions {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_OPTIONS };
  const r = raw as Record<string, unknown>;
  const parseBool = (val: unknown, def: boolean): boolean => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val === 'true';
    return def;
  };
  return {
    preserveFormatting: parseBool(r.preserveFormatting, DEFAULT_OPTIONS.preserveFormatting),
    preserveImages: parseBool(r.preserveImages, DEFAULT_OPTIONS.preserveImages),
    preserveTables: parseBool(r.preserveTables, DEFAULT_OPTIONS.preserveTables),
    translateImagesText: parseBool(r.translateImagesText, DEFAULT_OPTIONS.translateImagesText),
    maintainCharacterStyles: parseBool(r.maintainCharacterStyles, DEFAULT_OPTIONS.maintainCharacterStyles),
    translateProperNames: parseBool(r.translateProperNames, DEFAULT_OPTIONS.translateProperNames),
    keepProperNamesUntranslated: parseBool(r.keepProperNamesUntranslated, DEFAULT_OPTIONS.keepProperNamesUntranslated),
    detectMixedLanguage: parseBool(r.detectMixedLanguage, DEFAULT_OPTIONS.detectMixedLanguage),
    preserveCitations: parseBool(r.preserveCitations, DEFAULT_OPTIONS.preserveCitations),
  };
}

// POST /api/translate
export const translatePdf = async (req: Request, res: Response): Promise<void> => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, error: 'No PDF file uploaded' } as ApiResponse);
    return;
  }

  const { sourceLang = 'auto', targetLang } = req.body as { sourceLang?: string; targetLang?: string };

  if (!targetLang || !SUPPORTED_LANGUAGES[targetLang]) {
    res.status(400).json({ success: false, error: 'Invalid or missing target language' } as ApiResponse);
    return;
  }

  const options = parseOptions(
    typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options
  );

  const jobId = uuidv4();
  const record: TranslationRecord = {
    id: jobId,
    originalFileName: file.originalname,
    sourceLang,
    targetLang,
    status: 'pending',
    createdAt: new Date().toISOString(),
    fileSize: file.size,
    options,
  };

  translationStore.add(record);

  // Return immediately with job ID for status polling
  res.status(202).json({
    success: true,
    data: { jobId, status: 'pending' },
    message: 'Translation job queued',
  } as ApiResponse);

  // Process asynchronously
  setImmediate(async () => {
    try {
      translationStore.updateStatus(jobId, 'processing');
      logger.info(`Starting translation job ${jobId}`);

      // 1. Extract text from PDF
      const extraction = await extractPdfContent(file.path);

      // Resolve source language
      const resolvedSource =
        sourceLang === 'auto' ? extraction.detectedLanguage || 'en' : sourceLang;

      translationStore.update(jobId, { pageCount: extraction.pageCount });

      // 2. Translate text blocks
      const translatedBlocks = await translationService.translateBlocks(
        extraction.textBlocks,
        resolvedSource,
        targetLang,
        options
      );

      // 3. Generate new PDF
      const outputFileName = `${jobId}-translated.pdf`;
      const outputPath = await generateTranslatedPdf(
        translatedBlocks,
        extraction.pageCount,
        outputFileName,
        extraction.metadata
      );

      translationStore.update(jobId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        downloadUrl: `/api/translate/download/${jobId}`,
        pageCount: extraction.pageCount,
      });

      logger.info(`Translation job ${jobId} completed. Output: ${outputPath}`);
    } catch (error) {
      const msg = (error as Error).message;
      logger.error(`Translation job ${jobId} failed: ${msg}`);
      translationStore.update(jobId, {
        status: 'failed',
        completedAt: new Date().toISOString(),
        error: msg,
      });
    } finally {
      // Clean up uploaded file
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }
  });
};

// GET /api/translate/status/:jobId
export const getJobStatus = async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params;
  const record = translationStore.get(jobId);

  if (!record) {
    res.status(404).json({ success: false, error: 'Job not found' } as ApiResponse);
    return;
  }

  res.json({ success: true, data: record } as ApiResponse);
};

// GET /api/translate/download/:jobId
export const downloadTranslatedPdf = async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params;
  const record = translationStore.get(jobId);

  if (!record) {
    res.status(404).json({ success: false, error: 'Job not found' } as ApiResponse);
    return;
  }

  if (record.status !== 'completed') {
    res.status(400).json({
      success: false,
      error: `Job is ${record.status}, not completed`,
    } as ApiResponse);
    return;
  }

  const filePath = path.join(OUTPUT_DIR_PATH, `${jobId}-translated.pdf`);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ success: false, error: 'Translated file not found' } as ApiResponse);
    return;
  }

  const downloadName = `translated-${record.originalFileName}`;
  res.download(filePath, downloadName, (err) => {
    if (err) {
      logger.error(`Download failed for job ${jobId}: ${err.message}`);
    }
  });
};

// GET /api/translate/history
export const getHistory = async (_req: Request, res: Response): Promise<void> => {
  const records = translationStore.getAll();
  res.json({ success: true, data: records } as ApiResponse<TranslationRecord[]>);
};

// DELETE /api/translate/:jobId
export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params;
  const record = translationStore.get(jobId);

  if (!record) {
    res.status(404).json({ success: false, error: 'Job not found' } as ApiResponse);
    return;
  }

  // Remove output file if it exists
  const filePath = path.join(OUTPUT_DIR_PATH, `${jobId}-translated.pdf`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  translationStore.delete(jobId);
  res.json({ success: true, message: 'Job deleted' } as ApiResponse);
};

// POST /api/translate/batch
export const translateBatch = async (req: Request, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    res.status(400).json({ success: false, error: 'No PDF files uploaded' } as ApiResponse);
    return;
  }

  const { sourceLang = 'auto', targetLang } = req.body as { sourceLang?: string; targetLang?: string };

  if (!targetLang || !SUPPORTED_LANGUAGES[targetLang]) {
    res.status(400).json({ success: false, error: 'Invalid or missing target language' } as ApiResponse);
    return;
  }

  const options = parseOptions(
    typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options
  );

  const jobIds: string[] = [];

  for (const file of files) {
    const jobId = uuidv4();
    const record: TranslationRecord = {
      id: jobId,
      originalFileName: file.originalname,
      sourceLang,
      targetLang,
      status: 'pending',
      createdAt: new Date().toISOString(),
      fileSize: file.size,
      options,
    };
    translationStore.add(record);
    jobIds.push(jobId);

    // Schedule async processing for each file
    const capturedFile = file;
    const capturedJobId = jobId;
    setImmediate(async () => {
      try {
        translationStore.updateStatus(capturedJobId, 'processing');
        const extraction = await extractPdfContent(capturedFile.path);
        const resolvedSource =
          sourceLang === 'auto' ? extraction.detectedLanguage || 'en' : sourceLang;
        const translatedBlocks = await translationService.translateBlocks(
          extraction.textBlocks,
          resolvedSource,
          targetLang,
          options
        );
        const outputFileName = `${capturedJobId}-translated.pdf`;
        await generateTranslatedPdf(
          translatedBlocks,
          extraction.pageCount,
          outputFileName,
          extraction.metadata
        );
        translationStore.update(capturedJobId, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          downloadUrl: `/api/translate/download/${capturedJobId}`,
          pageCount: extraction.pageCount,
        });
      } catch (error) {
        const msg = (error as Error).message;
        translationStore.update(capturedJobId, {
          status: 'failed',
          completedAt: new Date().toISOString(),
          error: msg,
        });
      } finally {
        if (fs.existsSync(capturedFile.path)) fs.unlinkSync(capturedFile.path);
      }
    });
  }

  res.status(202).json({
    success: true,
    data: { jobIds, count: jobIds.length },
    message: `${jobIds.length} translation job(s) queued`,
  } as ApiResponse);
};

// GET /api/languages
export const getLanguages = async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, data: SUPPORTED_LANGUAGES } as ApiResponse);
};
