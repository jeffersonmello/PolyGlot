// Translation option flags
export interface TranslationOptions {
  preserveFormatting: boolean;
  preserveImages: boolean;
  preserveTables: boolean;
  translateImagesText: boolean;
  maintainCharacterStyles: boolean;
  translateProperNames: boolean;
  keepProperNamesUntranslated: boolean;
  detectMixedLanguage: boolean;
  preserveCitations: boolean;
}

// Job status
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Translation history entry
export interface TranslationRecord {
  id: string;
  originalFileName: string;
  sourceLang: string;
  targetLang: string;
  status: JobStatus;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  error?: string;
  fileSize: number;
  pageCount?: number;
  translatedPageCount?: number;
  progress?: number;
  options: TranslationOptions;
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Language map
export type LanguageMap = Record<string, string>;
