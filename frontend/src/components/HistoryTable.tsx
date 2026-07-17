import React from 'react';
import type { TranslationRecord } from '../types';
import { getDownloadUrl, deleteJob } from '../services/api';
import { toast } from 'react-toastify';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Download, Trash2, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  records: TranslationRecord[];
  onDelete: (id: string) => void;
}

const statusConfig: Record<string, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'processing';
}> = {
  pending:    { label: 'Queued',      variant: 'warning' },
  processing: { label: 'Processing',  variant: 'processing' },
  completed:  { label: 'Completed',   variant: 'success' },
  failed:     { label: 'Failed',      variant: 'destructive' },
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/50 bg-white py-16 px-8 text-center shadow-sm">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100">
          <FileText className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm text-muted-foreground">No translations yet. Upload a PDF to get started!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="rounded-xl border border-border/50 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40 bg-slate-50/50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Document
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Languages
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
              Pages
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">
              Size
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((rec, i) => {
            const config = statusConfig[rec.status] ?? { label: rec.status, variant: 'secondary' as const };
            return (
              <tr
                key={rec.id}
                className={cn(
                  'border-b border-border/30 transition-colors hover:bg-slate-50/50',
                  i === records.length - 1 && 'border-b-0'
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-slate-100 shrink-0">
                      <FileText className="w-4 h-4 text-slate-500" />
                    </div>
                    <span
                      className="font-mono text-xs font-medium text-foreground/80 max-w-[120px] sm:max-w-[200px] truncate"
                      title={rec.originalFileName}
                    >
                      {rec.originalFileName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium whitespace-nowrap">
                    <span>{rec.sourceLang === 'auto' ? 'Auto' : rec.sourceLang.toUpperCase()}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                    <span>{rec.targetLang.toUpperCase()}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                  {rec.pageCount ?? '—'}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                  {formatSize(rec.fileSize)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                  {new Date(rec.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={config.variant} className="text-xs whitespace-nowrap">
                    {config.label}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {rec.status === 'completed' && (
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-success hover:bg-success/10"
                        title="Download"
                      >
                        <a href={getDownloadUrl(rec.id)} download>
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(rec.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollArea>
  );
};

export default HistoryTable;

