import { useEffect, useRef, useState } from 'react';
import { getJobStatus } from '../services/api';
import type { TranslationRecord } from '../types';

/**
 * Polls the backend for job status every `intervalMs` milliseconds
 * until the job is completed or failed.
 */
export function useJobPolling(
  jobId: string | null,
  intervalMs = 2000
): { job: TranslationRecord | null; error: string | null } {
  const [job, setJob] = useState<TranslationRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setError(null);
      return;
    }

    const poll = async () => {
      try {
        const record = await getJobStatus(jobId);
        setJob(record);
        if (record.status === 'completed' || record.status === 'failed') {
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } catch (err) {
        setError((err as Error).message);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };

    poll();
    timerRef.current = setInterval(poll, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [jobId, intervalMs]);

  return { job, error };
}
