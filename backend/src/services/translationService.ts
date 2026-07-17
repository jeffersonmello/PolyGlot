import { TranslationOptions, TextBlock } from '../types';
import { logger } from '../utils/logger';

// ─── Translation provider interface ───────────────────────────────────────────

export interface TranslationProvider {
  translate(texts: string[], sourceLang: string, targetLang: string): Promise<string[]>;
  isAvailable(): Promise<boolean>;
}

// ─── Mock provider (always available, simulates translation) ──────────────────

export class MockTranslationProvider implements TranslationProvider {
  async isAvailable(): Promise<boolean> {
    return true;
  }

  async translate(texts: string[], sourceLang: string, targetLang: string): Promise<string[]> {
    logger.info(
      `[Mock] Translating ${texts.length} segments from '${sourceLang}' to '${targetLang}'`
    );

    // Simulate a short network delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    return texts.map((text) => this.mockTranslate(text, targetLang));
  }

  private mockTranslate(text: string, targetLang: string): string {
    const prefixes: Record<string, string> = {
      es: '[ES] ',
      fr: '[FR] ',
      de: '[DE] ',
      it: '[IT] ',
      pt: '[PT] ',
      ru: '[RU] ',
      zh: '[ZH] ',
      ja: '[JA] ',
      ko: '[KO] ',
      ar: '[AR] ',
      hi: '[HI] ',
      nl: '[NL] ',
      pl: '[PL] ',
      sv: '[SV] ',
      tr: '[TR] ',
      la: '[LA] ',
    };
    const prefix = prefixes[targetLang] ?? `[${targetLang.toUpperCase()}] `;
    return `${prefix}${text}`;
  }
}

// ─── DeepL provider (requires DEEPL_API_KEY) ──────────────────────────────────

export class DeepLTranslationProvider implements TranslationProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.DEEPL_API_KEY || '';
    this.baseUrl = process.env.DEEPL_API_URL || 'https://api-free.deepl.com/v2';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async translate(texts: string[], sourceLang: string, targetLang: string): Promise<string[]> {
    if (!this.apiKey) throw new Error('DeepL API key not configured');

    const fetch = (await import('node-fetch')).default;

    const body = new URLSearchParams();
    texts.forEach((t) => body.append('text', t));
    body.append('target_lang', targetLang.toUpperCase());
    if (sourceLang !== 'auto') body.append('source_lang', sourceLang.toUpperCase());

    const response = await fetch(`${this.baseUrl}/translate`, {
      method: 'POST',
      headers: {
        Authorization: 'DeepL-Auth-Key ' + this.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as { translations: Array<{ text: string }> };
    return json.translations.map((t) => t.text);
  }
}

// ─── OpenAI provider (requires OPENAI_API_KEY) ────────────────────────────────

export class OpenAITranslationProvider implements TranslationProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async translate(texts: string[], sourceLang: string, targetLang: string): Promise<string[]> {
    if (!this.apiKey) throw new Error('OpenAI API key not configured');

    const fetch = (await import('node-fetch')).default;

    const results: string[] = [];

    // Batch texts to reduce API calls
    const BATCH_SIZE = 20;
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const numberedTexts = batch.map((t, idx) => `${idx + 1}. ${t}`).join('\n');

      const sourceLangLabel = sourceLang === 'auto' ? 'the detected language' : sourceLang;
      const systemPrompt =
        'You are a professional translator. ' +
        `Translate the following numbered texts from ${sourceLangLabel} to ${targetLang}. ` +
        'Return ONLY the translations in the same numbered format. ' +
        'Preserve all formatting, special characters, and technical terms.';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: numberedTexts },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const json = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const content = json.choices[0]?.message?.content ?? '';
      const lines = content.split('\n').filter((l) => l.trim());

      // Parse numbered response
      for (let j = 0; j < batch.length; j++) {
        const line = lines[j] ?? batch[j];
        results.push(line.replace(/^\d+\.\s*/, '').trim());
      }
    }

    return results;
  }
}

// ─── Translation service with provider fallback ───────────────────────────────

export class TranslationService {
  private providers: TranslationProvider[];

  constructor() {
    this.providers = [
      new DeepLTranslationProvider(),
      new OpenAITranslationProvider(),
      new MockTranslationProvider(),
    ];
  }

  /**
   * Returns the first available provider.
   */
  private async getProvider(): Promise<TranslationProvider> {
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        return provider;
      }
    }
    return new MockTranslationProvider();
  }

  /**
   * Translates an array of text blocks, respecting TranslationOptions.
   */
  async translateBlocks(
    blocks: TextBlock[],
    sourceLang: string,
    targetLang: string,
    options: TranslationOptions
  ): Promise<TextBlock[]> {
    if (sourceLang === targetLang) {
      logger.info('Source and target languages are identical – skipping translation');
      return blocks;
    }

    const provider = await this.getProvider();
    logger.info(`Using translation provider: ${provider.constructor.name}`);

    // Determine which blocks to translate
    const blocksToTranslate: TextBlock[] = [];
    const skipIndices = new Set<number>();

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      // Skip citation blocks when preserveCitations is enabled
      if (options.preserveCitations && this.looksLikeCitation(block.text)) {
        skipIndices.add(i);
        continue;
      }

      // Keep proper names untranslated if option is set
      if (options.keepProperNamesUntranslated && this.isProperName(block.text)) {
        skipIndices.add(i);
        continue;
      }

      blocksToTranslate.push(block);
    }

    if (blocksToTranslate.length === 0) {
      return blocks;
    }

    // Translate in batches to avoid oversized requests
    const BATCH = 50;
    const allTranslated: string[] = [];

    for (let i = 0; i < blocksToTranslate.length; i += BATCH) {
      const batch = blocksToTranslate.slice(i, i + BATCH).map((b) => b.text);
      const translated = await provider.translate(batch, sourceLang, targetLang);
      allTranslated.push(...translated);
    }

    // Merge results back
    const result: TextBlock[] = [...blocks];
    let translatedIdx = 0;

    for (let i = 0; i < result.length; i++) {
      if (!skipIndices.has(i)) {
        result[i] = {
          ...result[i],
          text: allTranslated[translatedIdx] ?? result[i].text,
          language: targetLang,
        };
        translatedIdx++;
      }
    }

    return result;
  }

  private looksLikeCitation(text: string): boolean {
    return /^["'"«]|["'"»]$/.test(text.trim()) || /^\[[\d,\s]+\]/.test(text.trim());
  }

  private isProperName(text: string): boolean {
    // Very naive heuristic: short text starting with capital letter
    return /^[A-Z][a-z]+([\s-][A-Z][a-z]+)*$/.test(text.trim()) && text.length < 40;
  }

  async translateText(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> {
    const provider = await this.getProvider();
    const results = await provider.translate([text], sourceLang, targetLang);
    return results[0] ?? text;
  }
}

export const translationService = new TranslationService();
