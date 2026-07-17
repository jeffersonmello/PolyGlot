import { Router } from 'express';
import { upload } from '../middleware/upload';
import {
  translatePdf,
  getJobStatus,
  downloadTranslatedPdf,
  getHistory,
  deleteJob,
  translateBatch,
  getLanguages,
} from '../controllers/translationController';

const router = Router();

// Language list
router.get('/languages', getLanguages);

// History
router.get('/translate/history', getHistory);

// Single file translation
router.post('/translate', upload.single('pdf'), translatePdf);

// Batch translation
router.post('/translate/batch', upload.array('pdfs', 10), translateBatch);

// Job status
router.get('/translate/status/:jobId', getJobStatus);

// Download translated PDF
router.get('/translate/download/:jobId', downloadTranslatedPdf);

// Delete job
router.delete('/translate/:jobId', deleteJob);

export default router;
