import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { TranslationOptions, ApiResponse, TranslationRecord, TextBlock } from '../types';
import { extractPdfContent } from '../services/pdfExtractor';
import { translationService } from '../services/translationService';
import { generateTranslatedPdf, OUTPUT_DIR_PATH } from '../services/pdfGenerator';
import { translationStore } from '../services/translationStore';
import { wsManager } from '../services/wsManager';
import { logger } from '../utils/logger';
import { SUPPORTED_LANGUAGES } from '../types';
import { isValidUuid, safeResolvePath } from '../utils/pathGuard';
import { UPLOAD_DIR_PATH } from '../middleware/upload';

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

/**
 * Returns a safe path for an uploaded file by constructing it from the
 * trusted UPLOAD_DIR_PATH base and the basename of the multer-assigned filename.
 * This avoids using the potentially-tainted file.path directly in FS operations.
 */
function safeUploadPath(multerFilename: string): string {
  return path.join(UPLOAD_DIR_PATH, path.basename(multerFilename));
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
  // Construct the upload path from the trusted base dir + multer-assigned basename
  const uploadPath = safeUploadPath(file.filename);

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
      wsManager.broadcast(jobId, translationStore.get(jobId)!);
      logger.info(`Starting translation job ${jobId}`);

      // 1. Read PDF into memory from the server-constructed safe path, then delete
      const pdfBuffer = fs.readFileSync(uploadPath);
      if (fs.existsSync(uploadPath)) fs.unlinkSync(uploadPath);

      // 2. Extract text from buffer (no file-path FS operations in extractor)
      const extraction = await extractPdfContent(pdfBuffer);

      // Resolve source language
      const resolvedSource =
        sourceLang === 'auto' ? extraction.detectedLanguage || 'en' : sourceLang;

      translationStore.update(jobId, { pageCount: extraction.pageCount, translatedPageCount: 0, progress: 0 });
      wsManager.broadcast(jobId, translationStore.get(jobId)!);

      // 3. Group blocks by page and translate page-by-page to track progress.
      // Determine the number of pages from both the extraction result and the
      // actual block indices so out-of-range pageIndex values are never dropped.
      const maxPageIndex = extraction.textBlocks.reduce(
        (max, b) => Math.max(max, b.pageIndex ?? 0),
        0
      );
      const totalPages = Math.max(extraction.pageCount, maxPageIndex + 1, 1);

      const blocksByPage: TextBlock[][] = Array.from({ length: totalPages }, () => []);
      for (const block of extraction.textBlocks) {
        const idx = block.pageIndex ?? 0;
        blocksByPage[idx].push(block);
      }

      const allTranslatedBlocks: TextBlock[] = [];

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        const pageBlocks = blocksByPage[pageIdx];
        const translatedPage = await translationService.translateBlocks(
          pageBlocks,
          resolvedSource,
          targetLang,
          options
        );
        allTranslatedBlocks.push(...translatedPage);

        const translatedPageCount = pageIdx + 1;
        const progress = Math.round((translatedPageCount / totalPages) * 100);
        translationStore.update(jobId, { translatedPageCount, progress });
        wsManager.broadcast(jobId, translationStore.get(jobId)!);
      }

      // 4. Generate new PDF — outputFileName is server-generated (not from user input)
      const outputFileName = `${jobId}-translated.pdf`;
      const outputPath = await generateTranslatedPdf(
        allTranslatedBlocks,
        extraction.pageCount,
        outputFileName,
        extraction.metadata
      );

      translationStore.update(jobId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        downloadUrl: `/api/translate/download/${jobId}`,
        pageCount: extraction.pageCount,
        translatedPageCount: extraction.pageCount,
        progress: 100,
        outputFileName,  // stored server-side for safe path construction
      });
      wsManager.broadcast(jobId, translationStore.get(jobId)!);

      logger.info(`Translation job ${jobId} completed. Output: ${outputPath}`);
    } catch (error) {
      const msg = (error as Error).message;
      logger.error(`Translation job ${jobId} failed: ${msg}`);
      translationStore.update(jobId, {
        status: 'failed',
        completedAt: new Date().toISOString(),
        error: msg,
      });
      wsManager.broadcast(jobId, translationStore.get(jobId)!);
    } finally {
      // Ensure cleanup even if extraction/translation failed after we read the buffer
      if (fs.existsSync(uploadPath)) fs.unlinkSync(uploadPath);
    }
  });
};

// GET /api/translate/status/:jobId
export const getJobStatus = async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params;

  if (!isValidUuid(jobId)) {
    res.status(400).json({ success: false, error: 'Invalid job ID' } as ApiResponse);
    return;
  }

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

  if (!isValidUuid(jobId)) {
    res.status(400).json({ success: false, error: 'Invalid job ID' } as ApiResponse);
    return;
  }

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

  // Use the server-stored outputFileName (not user-provided jobId) to build the path
  const outputFileName = record.outputFileName;
  if (!outputFileName) {
    res.status(404).json({ success: false, error: 'Translated file not found' } as ApiResponse);
    return;
  }

  // safeResolvePath confines the resolved path within OUTPUT_DIR_PATH
  const filePath = safeResolvePath(OUTPUT_DIR_PATH, path.basename(outputFileName));
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ success: false, error: 'Translated file not found' } as ApiResponse);
    return;
  }

  // Sanitize the download name using only the original file's basename
  const safeDownloadName = `translated-${path.basename(record.originalFileName)}`;
  res.download(filePath, safeDownloadName, (err) => {
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

  if (!isValidUuid(jobId)) {
    res.status(400).json({ success: false, error: 'Invalid job ID' } as ApiResponse);
    return;
  }

  const record = translationStore.get(jobId);

  if (!record) {
    res.status(404).json({ success: false, error: 'Job not found' } as ApiResponse);
    return;
  }

  // Use the server-stored outputFileName to build the path — not user-provided jobId
  if (record.outputFileName) {
    const filePath = safeResolvePath(OUTPUT_DIR_PATH, path.basename(record.outputFileName));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

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
    // Construct upload path from trusted base + multer-assigned basename
    const uploadPath = safeUploadPath(file.filename);

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
    const capturedUploadPath = uploadPath;
    const capturedJobId = jobId;
    setImmediate(async () => {
      try {
        translationStore.updateStatus(capturedJobId, 'processing');
        // Read PDF into memory first, then delete the upload
        const pdfBuffer = fs.readFileSync(capturedUploadPath);
        if (fs.existsSync(capturedUploadPath)) fs.unlinkSync(capturedUploadPath);

        const extraction = await extractPdfContent(pdfBuffer);
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
          outputFileName,
        });
      } catch (error) {
        const msg = (error as Error).message;
        translationStore.update(capturedJobId, {
          status: 'failed',
          completedAt: new Date().toISOString(),
          error: msg,
        });
      } finally {
        // Ensure cleanup even on unexpected failure
        if (fs.existsSync(capturedUploadPath)) fs.unlinkSync(capturedUploadPath);
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
