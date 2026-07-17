import { translationStore } from '../services/translationStore';
import { TranslationRecord } from '../types';

const defaultOptions = {
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

const makeRecord = (id: string): TranslationRecord => ({
  id,
  originalFileName: 'test.pdf',
  sourceLang: 'en',
  targetLang: 'fr',
  status: 'pending',
  createdAt: new Date().toISOString(),
  fileSize: 1024,
  options: defaultOptions,
});

describe('TranslationStore', () => {
  beforeEach(() => {
    translationStore.clear();
  });

  it('adds and retrieves records', () => {
    const record = makeRecord('abc');
    translationStore.add(record);
    expect(translationStore.get('abc')).toEqual(record);
  });

  it('returns undefined for unknown ids', () => {
    expect(translationStore.get('unknown')).toBeUndefined();
  });

  it('updates record status', () => {
    translationStore.add(makeRecord('job1'));
    translationStore.updateStatus('job1', 'processing');
    expect(translationStore.get('job1')?.status).toBe('processing');
  });

  it('returns all records sorted by date (newest first)', () => {
    const r1 = { ...makeRecord('first'), createdAt: '2024-01-01T00:00:00.000Z' };
    const r2 = { ...makeRecord('second'), createdAt: '2024-06-01T00:00:00.000Z' };
    translationStore.add(r1);
    translationStore.add(r2);
    const all = translationStore.getAll();
    expect(all[0].id).toBe('second');
    expect(all[1].id).toBe('first');
  });

  it('deletes a record', () => {
    translationStore.add(makeRecord('del1'));
    expect(translationStore.delete('del1')).toBe(true);
    expect(translationStore.get('del1')).toBeUndefined();
  });

  it('reports correct size', () => {
    translationStore.add(makeRecord('a'));
    translationStore.add(makeRecord('b'));
    expect(translationStore.size()).toBe(2);
  });
});
