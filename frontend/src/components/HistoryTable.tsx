import React from 'react';
import type { TranslationRecord } from '../types';
import { getDownloadUrl, deleteJob } from '../services/api';
import { toast } from 'react-toastify';

interface Props {
  records: TranslationRecord[];
  onDelete: (id: string) => void;
}

const statusEmoji: Record<string, string> = {
  pending: '⏳',
  processing: '⚙️',
  completed: '✅',
  failed: '❌',
};

const HistoryTable: React.FC<Props> = ({ records, onDelete }) => {
  const handleDelete = async (id: string) => {
    try {
      await deleteJob(id);
      onDelete(id);
      toast.success('Job removed from history');
    } catch {
      toast.error('Failed to delete job');
    }
  };

  if (records.length === 0) {
    return (
      <div className="history-empty">
        <p>No translations yet. Upload a PDF to get started!</p>
      </div>
    );
  }

  return (
    <div className="history-wrapper">
      <table className="history-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>File Name</th>
            <th>Languages</th>
            <th>Pages</th>
            <th>Size</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec) => (
            <tr key={rec.id} className={`history-row status-${rec.status}`}>
              <td>{statusEmoji[rec.status] ?? rec.status}</td>
              <td className="history-filename" title={rec.originalFileName}>
                {rec.originalFileName}
              </td>
              <td>
                {rec.sourceLang === 'auto' ? 'Auto' : rec.sourceLang.toUpperCase()} →{' '}
                {rec.targetLang.toUpperCase()}
              </td>
              <td>{rec.pageCount ?? '—'}</td>
              <td>{(rec.fileSize / 1024).toFixed(1)} KB</td>
              <td>{new Date(rec.createdAt).toLocaleString()}</td>
              <td className="history-actions">
                {rec.status === 'completed' && (
                  <a
                    href={getDownloadUrl(rec.id)}
                    download
                    className="btn btn-sm btn-primary"
                    title="Download"
                  >
                    ⬇
                  </a>
                )}
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(rec.id)}
                  title="Delete"
                >
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryTable;
