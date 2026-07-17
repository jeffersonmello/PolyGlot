// Supported languages
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  auto: 'Auto-detect',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  'pt-BR': 'Portuguese (Brazil)',
  ru: 'Russian',
  zh: 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  nl: 'Dutch',
  pl: 'Polish',
  sv: 'Swedish',
  da: 'Danish',
  fi: 'Finnish',
  no: 'Norwegian',
  tr: 'Turkish',
  cs: 'Czech',
  hu: 'Hungarian',
  ro: 'Romanian',
  bg: 'Bulgarian',
  hr: 'Croatian',
  sk: 'Slovak',
  sl: 'Slovenian',
  uk: 'Ukrainian',
  he: 'Hebrew',
  th: 'Thai',
  vi: 'Vietnamese',
  id: 'Indonesian',
  ms: 'Malay',
  la: 'Latin',
};

// Translation options
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

// Translation job status
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Translation history entry
export interface TranslationRecord {
  id: string;
  originalFileName: string;
  /** Server-generated output filename (basename only, stored after successful PDF generation). */
  outputFileName?: string;
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

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Extracted text block from PDF
export interface TextBlock {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName?: string;
  pageIndex: number;
  language?: string;
}

// PDF extraction result
export interface PdfExtractionResult {
  textBlocks: TextBlock[];
  pageCount: number;
  metadata: Record<string, string>;
  detectedLanguage?: string;
  mixedLanguages?: string[];
}

// Batch translation request
export interface BatchTranslationRequest {
  files: Express.Multer.File[];
  sourceLang: string;
  targetLang: string;
  options: TranslationOptions;
}
