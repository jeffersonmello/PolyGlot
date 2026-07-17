import { MockTranslationProvider, TranslationService } from '../services/translationService';
import { TranslationOptions, TextBlock } from '../types';

const defaultOptions: TranslationOptions = {
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

describe('MockTranslationProvider', () => {
  const provider = new MockTranslationProvider();

  it('is always available', async () => {
    expect(await provider.isAvailable()).toBe(true);
  });

  it('translates texts with language prefix', async () => {
    const result = await provider.translate(['Hello', 'World'], 'en', 'es');
    expect(result).toHaveLength(2);
    expect(result[0]).toContain('[ES]');
    expect(result[1]).toContain('[ES]');
    expect(result[0]).toContain('Hello');
  });

  it('uses uppercase language code for unknown languages', async () => {
    const result = await provider.translate(['Test'], 'en', 'xx');
    expect(result[0]).toContain('[XX]');
  });
});

describe('TranslationService', () => {
  let service: TranslationService;

  beforeEach(() => {
    service = new TranslationService();
    // Override env to ensure mock provider is used
    delete process.env.DEEPL_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  const makeBlock = (text: string, pageIndex = 0): TextBlock => ({
    text,
    x: 72,
    y: 100,
    width: 468,
    height: 14,
    fontSize: 12,
    pageIndex,
  });

  it('returns same blocks when source === target language', async () => {
    const blocks = [makeBlock('Hello')];
    const result = await service.translateBlocks(blocks, 'en', 'en', defaultOptions);
    expect(result[0].text).toBe('Hello');
    expect(result[0].language).toBeUndefined();
  });

  it('translates blocks to target language', async () => {
    const blocks = [makeBlock('Hello'), makeBlock('World')];
    const result = await service.translateBlocks(blocks, 'en', 'fr', defaultOptions);
    expect(result).toHaveLength(2);
    expect(result[0].language).toBe('fr');
    expect(result[0].text).toContain('[FR]');
  });

  it('preserves citations when option is enabled', async () => {
    const citationBlock = makeBlock('"This is a citation"');
    const normalBlock = makeBlock('Normal text');
    const options = { ...defaultOptions, preserveCitations: true };
    const result = await service.translateBlocks(
      [citationBlock, normalBlock],
      'en',
      'de',
      options
    );
    // Citation should NOT be translated
    expect(result[0].text).toBe('"This is a citation"');
    // Normal text should be translated
    expect(result[1].text).toContain('[DE]');
  });

  it('keeps proper names untranslated when option is enabled', async () => {
    const nameBlock = makeBlock('John Smith');
    const normalBlock = makeBlock('Hello world text here');
    const options = { ...defaultOptions, keepProperNamesUntranslated: true };
    const result = await service.translateBlocks(
      [nameBlock, normalBlock],
      'en',
      'es',
      options
    );
    expect(result[0].text).toBe('John Smith');
    expect(result[1].text).toContain('[ES]');
  });

  it('translateText delegates to provider', async () => {
    const result = await service.translateText('Hello', 'en', 'it');
    expect(result).toContain('[IT]');
  });
});
