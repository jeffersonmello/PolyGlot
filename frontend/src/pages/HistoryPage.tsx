import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import HistoryTable from '../components/HistoryTable';
import { fetchHistory } from '../services/api';
import type { TranslationRecord } from '../types';
import { Button } from '../components/ui/button';
import { RefreshCw, History } from 'lucide-react';

const HistoryPage: React.FC = () => {
  const [records, setRecords] = useState<TranslationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const recordsRef = useRef<TranslationRecord[]>(records);
  recordsRef.current = records;

  const load = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await fetchHistory();
      setRecords(data);
    } catch {
      toast.error('Failed to load translation history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      const hasActive = recordsRef.current.some(
        (r) => r.status === 'pending' || r.status === 'processing'
      );
      if (hasActive) load(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Loading history…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Translation History</h2>
          {records.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
              {records.length}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => load()}
          disabled={refreshing}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <HistoryTable records={records} onDelete={handleDelete} />
    </div>
  );
};

export default HistoryPage;

