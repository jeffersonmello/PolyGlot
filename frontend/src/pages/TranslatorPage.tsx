import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import FileUploadZone from '../components/FileUploadZone';
import LanguageSelector from '../components/LanguageSelector';
import TranslationOptionsPanel from '../components/TranslationOptionsPanel';
import TranslationStatus from '../components/TranslationStatus';
import {
  fetchLanguages,
  uploadAndTranslate,
  uploadBatch,
} from '../services/api';
import { useJobPolling } from '../hooks/useJobPolling';
import type { TranslationOptions, LanguageMap } from '../types';

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

const TranslatorPage: React.FC = () => {
  const [languages, setLanguages] = useState<LanguageMap>({});
  const [files, setFiles] = useState<File[]>([]);
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [options, setOptions] = useState<TranslationOptions>(DEFAULT_OPTIONS);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [batchJobIds, setBatchJobIds] = useState<string[]>([]);

  const { job, error: pollError } = useJobPolling(activeJobId);

  // Load language list on mount
  useEffect(() => {
    fetchLanguages()
      .then(setLanguages)
      .catch(() => toast.error('Failed to load language list'));
  }, []);

  // Show poll errors
  useEffect(() => {
    if (pollError) toast.error(`Status polling error: ${pollError}`);
  }, [pollError]);

  const handleTranslate = async () => {
    if (files.length === 0) {
      toast.warn('Please select at least one PDF file');
      return;
    }
    if (!targetLang) {
      toast.warn('Please select a target language');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setBatchJobIds([]);
    setActiveJobId(null);

    try {
      if (batchMode || files.length > 1) {
        const { jobIds } = await uploadBatch(files, sourceLang, targetLang, options);
        setBatchJobIds(jobIds);
        toast.success(`${jobIds.length} translation job(s) queued!`);
      } else {
        const { jobId } = await uploadAndTranslate(
          files[0],
          sourceLang,
          targetLang,
          options,
          setUploadProgress
        );
        setActiveJobId(jobId);
        toast.success('Translation job started!');
      }

      setFiles([]);
    } catch (err) {
      toast.error(`Upload failed: ${(err as Error).message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isProcessing = isUploading || (job && (job.status === 'pending' || job.status === 'processing'));

  return (
    <div className="page-content">
      <div className="translator-card">
        {/* Language selection */}
        <LanguageSelector
          languages={languages}
          sourceLang={sourceLang}
          targetLang={targetLang}
          onSourceChange={setSourceLang}
          onTargetChange={setTargetLang}
          disabled={!!isProcessing}
        />

        {/* Batch toggle */}
        <div className="batch-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={batchMode}
              onChange={(e) => setBatchMode(e.target.checked)}
              disabled={!!isProcessing}
            />
            <span>Batch mode (translate multiple PDFs at once)</span>
          </label>
        </div>

        {/* File upload */}
        <FileUploadZone
          files={files}
          onFilesChange={setFiles}
          multiple={batchMode}
        />

        {/* Upload progress */}
        {isUploading && uploadProgress > 0 && (
          <div className="progress-bar-wrapper">
            <div
              className="progress-bar-fill"
              style={{ width: `${uploadProgress}%` }}
            />
            <span className="progress-label">{uploadProgress}%</span>
          </div>
        )}

        {/* Options */}
        <TranslationOptionsPanel options={options} onChange={setOptions} />

        {/* Translate button */}
        <button
          type="button"
          className="btn btn-primary btn-large translate-btn"
          onClick={handleTranslate}
          disabled={!!isProcessing || files.length === 0}
        >
          {isProcessing ? '⚙️ Translating…' : '🌐 Translate PDF'}
        </button>
      </div>

      {/* Active single job status */}
      {job && (
        <div className="status-section">
          <h3>Current Translation</h3>
          <TranslationStatus job={job} />
        </div>
      )}

      {/* Batch job IDs list */}
      {batchJobIds.length > 0 && (
        <div className="status-section">
          <h3>Batch Jobs Queued ({batchJobIds.length})</h3>
          <ul className="batch-ids">
            {batchJobIds.map((id) => (
              <li key={id}>
                Job <code>{id.slice(0, 8)}…</code> — check History tab for status
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TranslatorPage;
