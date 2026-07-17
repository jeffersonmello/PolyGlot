import axios from 'axios';
import type { ApiResponse, TranslationOptions, TranslationRecord, LanguageMap } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({ baseURL: BASE_URL });

export async function fetchLanguages(): Promise<LanguageMap> {
  const { data } = await api.get<ApiResponse<LanguageMap>>('/languages');
  return data.data ?? {};
}

export async function uploadAndTranslate(
  file: File,
  sourceLang: string,
  targetLang: string,
  options: TranslationOptions,
  onProgress?: (pct: number) => void
): Promise<{ jobId: string }> {
  const formData = new FormData();
  formData.append('pdf', file);
  formData.append('sourceLang', sourceLang);
  formData.append('targetLang', targetLang);
  formData.append('options', JSON.stringify(options));

  const { data } = await api.post<ApiResponse<{ jobId: string; status: string }>>(
    '/translate',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (evt.total && onProgress) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    }
  );

  if (!data.success || !data.data?.jobId) {
    throw new Error(data.error ?? 'Unknown error from server');
  }
  return { jobId: data.data.jobId };
}

export async function uploadBatch(
  files: File[],
  sourceLang: string,
  targetLang: string,
  options: TranslationOptions
): Promise<{ jobIds: string[] }> {
  const formData = new FormData();
  files.forEach((f) => formData.append('pdfs', f));
  formData.append('sourceLang', sourceLang);
  formData.append('targetLang', targetLang);
  formData.append('options', JSON.stringify(options));

  const { data } = await api.post<ApiResponse<{ jobIds: string[]; count: number }>>(
    '/translate/batch',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  if (!data.success || !data.data?.jobIds) {
    throw new Error(data.error ?? 'Batch upload failed');
  }
  return { jobIds: data.data.jobIds };
}

export async function getJobStatus(jobId: string): Promise<TranslationRecord> {
  const { data } = await api.get<ApiResponse<TranslationRecord>>(`/translate/status/${jobId}`);
  if (!data.success || !data.data) {
    throw new Error(data.error ?? 'Failed to fetch job status');
  }
  return data.data;
}

export async function fetchHistory(): Promise<TranslationRecord[]> {
  const { data } = await api.get<ApiResponse<TranslationRecord[]>>('/translate/history');
  return data.data ?? [];
}

export async function deleteJob(jobId: string): Promise<void> {
  await api.delete(`/translate/${jobId}`);
}

export function getDownloadUrl(jobId: string): string {
  return `${BASE_URL}/translate/download/${jobId}`;
}
