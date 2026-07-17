import React from 'react';
import type { TranslationRecord } from '../types';
import { getDownloadUrl } from '../services/api';

interface Props {
  job: TranslationRecord;
}

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  completed: '#10b981',
  failed: '#ef4444',
};

const statusLabels: Record<string, string> = {
  pending: '⏳ Queued',
  processing: '⚙️ Translating…',
  completed: '✅ Completed',
  failed: '❌ Failed',
};

const TranslationStatus: React.FC<Props> = ({ job }) => {
  const color = statusColors[job.status] ?? '#6b7280';
  const label = statusLabels[job.status] ?? job.status;

  const isProcessing = job.status === 'pending' || job.status === 'processing';
  const downloadUrl = getDownloadUrl(job.id);

  const progress = job.progress ?? 0;
  const hasProgress = isProcessing && job.pageCount != null && job.pageCount > 0;

  return (
    <div className="status-card" style={{ borderLeftColor: color }}>
      <div className="status-header">
        <span className="status-filename" title={job.originalFileName}>
          {job.originalFileName}
        </span>
        <span className="status-badge" style={{ backgroundColor: color }}>
          {label}
        </span>
      </div>

      <div className="status-meta">
        <span>
          {job.sourceLang === 'auto' ? 'Auto-detect' : job.sourceLang.toUpperCase()} →{' '}
          {job.targetLang.toUpperCase()}
        </span>
        {job.pageCount != null && (
          <span>
            {isProcessing && job.translatedPageCount != null
              ? `${job.translatedPageCount} / ${job.pageCount} pages`
              : `${job.pageCount} pages`}
          </span>
        )}
        <span>{(job.fileSize / 1024).toFixed(1)} KB</span>
        <span>{new Date(job.createdAt).toLocaleTimeString()}</span>
      </div>

      {isProcessing && (
        <div className="progress-section">
          {hasProgress ? (
            <>
              <div className="progress-bar-wrapper">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="progress-label-inline">{progress}%</span>
            </>
          ) : (
            <div className="progress-bar-wrapper">
              <div className="progress-bar-indeterminate" />
            </div>
          )}
        </div>
      )}

      {job.status === 'failed' && job.error && (
        <p className="status-error">Error: {job.error}</p>
      )}

      {job.status === 'completed' && (
        <div className="status-actions">
          <a
            href={downloadUrl}
            download
            className="btn btn-primary"
          >
            ⬇ Download Translated PDF
          </a>
          {job.completedAt && (
            <span className="status-completed-time">
              Completed at {new Date(job.completedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TranslationStatus;
