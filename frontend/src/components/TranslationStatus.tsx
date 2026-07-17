import React from 'react';
import type { TranslationRecord } from '../types';
import { getDownloadUrl } from '../services/api';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Download, FileText, Clock } from 'lucide-react';

interface Props {
  job: TranslationRecord;
}

const statusConfig: Record<string, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'processing';
}> = {
  pending:    { label: 'Queued',       variant: 'warning' },
  processing: { label: 'Translating…', variant: 'processing' },
  completed:  { label: 'Completed',    variant: 'success' },
  failed:     { label: 'Failed',       variant: 'destructive' },
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const TranslationStatus: React.FC<Props> = ({ job }) => {
  const config = statusConfig[job.status] ?? { label: job.status, variant: 'secondary' as const };
  const isProcessing = job.status === 'pending' || job.status === 'processing';
  const downloadUrl = getDownloadUrl(job.id);
  const progress = job.progress ?? 0;
  const hasProgress = isProcessing && job.pageCount != null && job.pageCount > 0;

  const borderColor = {
    pending: 'border-l-warning',
    processing: 'border-l-blue-500',
    completed: 'border-l-success',
    failed: 'border-l-destructive',
  }[job.status] ?? 'border-l-border';

  return (
    <Card className={`border-l-4 ${borderColor} shadow-sm hover:shadow-md transition-shadow`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 shrink-0">
              <FileText className="w-4 h-4 text-slate-500" />
            </div>
            <span
              className="font-semibold text-sm font-mono truncate text-foreground/90"
              title={job.originalFileName}
            >
              {job.originalFileName}
            </span>
          </div>
          <Badge variant={config.variant} className="shrink-0 text-xs">
            {config.label}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium">
            {job.sourceLang === 'auto' ? 'Auto-detect' : job.sourceLang.toUpperCase()}
            {' → '}
            {job.targetLang.toUpperCase()}
          </span>
          {job.pageCount != null && (
            <span>
              {isProcessing && job.translatedPageCount != null
                ? `${job.translatedPageCount} / ${job.pageCount} pages`
                : `${job.pageCount} pages`}
            </span>
          )}
          <span>{formatSize(job.fileSize)}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(job.createdAt).toLocaleTimeString()}
          </span>
        </div>

        {isProcessing && (
          <div className="space-y-1.5">
            {hasProgress ? (
              <div className="flex items-center gap-2">
                <Progress value={progress} className="flex-1 h-2" />
                <span className="text-xs font-semibold text-primary w-10 text-right">{progress}%</span>
              </div>
            ) : (
              <Progress value={undefined} className="h-2 animate-pulse" />
            )}
          </div>
        )}

        {job.status === 'failed' && job.error && (
          <p className="text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">
            Error: {job.error}
          </p>
        )}

        {job.status === 'completed' && (
          <div className="flex items-center gap-3 pt-1">
            <Button asChild size="sm" className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground">
              <a href={downloadUrl} download>
                <Download className="w-3.5 h-3.5" />
                Download Translated PDF
              </a>
            </Button>
            {job.completedAt && (
              <span className="text-xs text-muted-foreground">
                Completed at {new Date(job.completedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TranslationStatus;

