import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface Props {
  files: File[];
  onFilesChange: (files: File[]) => void;
  multiple?: boolean;
  maxSizeMb?: number;
}

const FileUploadZone: React.FC<Props> = ({
  files,
  onFilesChange,
  multiple = false,
  maxSizeMb = 50,
}) => {
  const maxSize = maxSizeMb * 1024 * 1024;

  const onDrop = useCallback(
    (accepted: File[]) => {
      onFilesChange(multiple ? [...files, ...accepted] : accepted.slice(0, 1));
    },
    [files, onFilesChange, multiple]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple,
    maxSize,
  });

  const removeFile = (idx: number) => {
    onFilesChange(files.filter((_, i) => i !== idx));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-all cursor-pointer group',
          isDragActive
            ? 'border-primary bg-primary/5 shadow-[0_0_0_4px_rgba(99,102,241,0.1)]'
            : 'border-border/60 bg-slate-50/50 hover:border-primary/50 hover:bg-primary/[0.02]',
          files.length > 0 && !isDragActive && 'border-indigo-200 bg-indigo-50/30'
        )}
      >
        <input {...getInputProps()} />
        <div className={cn(
          'flex items-center justify-center w-14 h-14 rounded-2xl transition-colors',
          isDragActive ? 'bg-primary/15' : 'bg-white shadow-sm border border-border/40 group-hover:border-primary/30'
        )}>
          <UploadCloud className={cn(
            'w-7 h-7 transition-colors',
            isDragActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary/70'
          )} />
        </div>

        {isDragActive ? (
          <p className="text-sm font-semibold text-primary">
            Drop your PDF{multiple ? 's' : ''} here…
          </p>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Drag & drop your PDF{multiple ? 's' : ''} here
            </p>
            <p className="text-xs text-muted-foreground">
              or <span className="text-primary font-medium underline underline-offset-2">click to browse</span>
            </p>
            <p className="text-xs text-muted-foreground/70 pt-1">
              Max file size: {maxSizeMb} MB{multiple ? ' · Batch mode supported' : ''}
            </p>
          </div>
        )}
      </div>

      {fileRejections.length > 0 && (
        <div className="space-y-1.5">
          {fileRejections.map(({ file, errors }) => (
            <div
              key={file.name}
              className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2"
            >
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive">
                <span className="font-medium">{file.name}</span>:{' '}
                {errors.map((e) => e.message).join(', ')}
              </p>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-white px-3 py-2.5 shadow-sm"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 shrink-0">
                <FileText className="w-4 h-4 text-red-500" />
              </div>
              <span className="flex-1 text-sm font-medium truncate font-mono text-foreground/80">
                {file.name}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">{formatSize(file.size)}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive shrink-0"
                onClick={() => removeFile(idx)}
                title="Remove file"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;

