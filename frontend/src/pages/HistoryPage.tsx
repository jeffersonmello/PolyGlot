import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import HistoryTable from '../components/HistoryTable';
import { fetchHistory } from '../services/api';
import type { TranslationRecord } from '../types';

const HistoryPage: React.FC = () => {
  const [records, setRecords] = useState<TranslationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await fetchHistory();
      setRecords(data);
    } catch {
      toast.error('Failed to load translation history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Auto-refresh every 5 seconds while any job is active
    const interval = setInterval(() => {
      const hasActive = records.some(
        (r) => r.status === 'pending' || r.status === 'processing'
      );
      if (hasActive) load();
    }, 5000);
    return () => clearInterval(interval);
  }, [records.length]);

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) {
    return (
      <div className="page-content center">
        <p>Loading history…</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="history-header">
        <h2>Translation History</h2>
        <button type="button" className="btn btn-secondary" onClick={load}>
          🔄 Refresh
        </button>
      </div>
      <HistoryTable records={records} onDelete={handleDelete} />
    </div>
  );
};

export default HistoryPage;
