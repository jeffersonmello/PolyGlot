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
import { useJobWebSocket } from '../hooks/useJobWebSocket';
import type { TranslationOptions, LanguageMap } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { ArrowRight, Layers, Zap } from 'lucide-react';

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

  const { job, error: wsError } = useJobWebSocket(activeJobId);

  useEffect(() => {
    fetchLanguages()
      .then(setLanguages)
      .catch(() => toast.error('Failed to load language list'));
  }, []);

  useEffect(() => {
    if (wsError) toast.error(`Status update error: ${wsError}`);
  }, [wsError]);

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

  // Keyboard shortcut: Cmd/Ctrl + Enter to translate
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isProcessing && files.length > 0) {
        handleTranslate();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div className="space-y-6">
      {/* Main translation card */}
      <Card className="shadow-md border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base text-foreground/90">
            <Zap className="w-4 h-4 text-primary" />
            Translation Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Language selection */}
          <LanguageSelector
            languages={languages}
            sourceLang={sourceLang}
            targetLang={targetLang}
            onSourceChange={setSourceLang}
            onTargetChange={setTargetLang}
            disabled={!!isProcessing}
          />

          <Separator />

          {/* File upload */}
          <FileUploadZone
            files={files}
            onFilesChange={setFiles}
            multiple={batchMode}
          />

          {/* Upload progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="flex items-center gap-3">
              <Progress value={uploadProgress} className="flex-1 h-2" />
              <span className="text-xs font-semibold text-primary w-10 text-right">{uploadProgress}%</span>
            </div>
          )}

          <Separator />

          {/* Batch mode toggle */}
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="batch-mode"
              checked={batchMode}
              onCheckedChange={(checked) => setBatchMode(checked === true)}
              disabled={!!isProcessing}
            />
            <Label htmlFor="batch-mode" className="flex items-center gap-1.5 cursor-pointer text-sm font-medium">
              <Layers className="w-3.5 h-3.5 text-muted-foreground" />
              Batch mode
              <span className="text-xs text-muted-foreground font-normal">(translate multiple PDFs at once)</span>
            </Label>
          </div>

          {/* Options */}
          <TranslationOptionsPanel options={options} onChange={setOptions} />

          {/* Translate button */}
          <Button
            type="button"
            size="lg"
            className="w-full gap-2 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
            onClick={handleTranslate}
            disabled={!!isProcessing || files.length === 0}
          >
            {isProcessing ? (
              <>
                <span className="animate-spin">⚙️</span> Translating…
              </>
            ) : (
              <>
                Translate Now
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
          {files.length > 0 && !isProcessing && (
            <p className="text-center text-xs text-muted-foreground">
              Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">⌘ Enter</kbd> to translate
            </p>
          )}
        </CardContent>
      </Card>

      {/* Active single job status */}
      {job && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Active Translation
          </h3>
          <TranslationStatus job={job} />
        </div>
      )}

      {/* Batch job IDs list */}
      {batchJobIds.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">
              Batch Jobs Queued ({batchJobIds.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {batchJobIds.map((id) => (
                <li key={id} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                  Job{' '}
                  <code className="font-mono text-xs bg-muted rounded px-1.5 py-0.5">
                    {id.slice(0, 8)}…
                  </code>{' '}
                  — check History tab for status
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TranslatorPage;

