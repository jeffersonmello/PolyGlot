import { TranslationRecord, JobStatus } from '../types';

/**
 * In-memory store for translation history and job status.
 * In production, replace with a proper database (PostgreSQL, MongoDB, etc.).
 */
class TranslationStore {
  private records: Map<string, TranslationRecord> = new Map();

  add(record: TranslationRecord): void {
    this.records.set(record.id, record);
  }

  get(id: string): TranslationRecord | undefined {
    return this.records.get(id);
  }

  update(id: string, updates: Partial<TranslationRecord>): TranslationRecord | undefined {
    const record = this.records.get(id);
    if (!record) return undefined;
    const updated = { ...record, ...updates };
    this.records.set(id, updated);
    return updated;
  }

  updateStatus(id: string, status: JobStatus, extra?: Partial<TranslationRecord>): void {
    this.update(id, { status, ...extra });
  }

  getAll(): TranslationRecord[] {
    return Array.from(this.records.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  delete(id: string): boolean {
    return this.records.delete(id);
  }

  clear(): void {
    this.records.clear();
  }

  size(): number {
    return this.records.size;
  }
}

export const translationStore = new TranslationStore();
