import React from 'react';
import type { TranslationOptions } from '../types';

interface Props {
  options: TranslationOptions;
  onChange: (options: TranslationOptions) => void;
}

interface CheckboxDef {
  key: keyof TranslationOptions;
  label: string;
  description: string;
  group: 'basic' | 'advanced';
}

const CHECKBOXES: CheckboxDef[] = [
  // Basic options
  {
    key: 'preserveFormatting',
    label: 'Preserve original formatting',
    description: 'Maintain fonts, sizes, colors, and layout',
    group: 'basic',
  },
  {
    key: 'preserveImages',
    label: 'Preserve images & graphics positions',
    description: 'Keep images in their original locations',
    group: 'basic',
  },
  {
    key: 'preserveTables',
    label: 'Keep tables & charts structure',
    description: 'Maintain table structure and chart layout',
    group: 'basic',
  },
  {
    key: 'translateImagesText',
    label: 'Translate text inside images (OCR)',
    description: 'Extract and translate text found within images',
    group: 'basic',
  },
  {
    key: 'maintainCharacterStyles',
    label: 'Maintain character styles',
    description: 'Preserve bold, italic, and underline formatting',
    group: 'basic',
  },
  // Advanced options
  {
    key: 'translateProperNames',
    label: 'Translate proper names',
    description: 'Attempt to translate people, places, and brand names',
    group: 'advanced',
  },
  {
    key: 'keepProperNamesUntranslated',
    label: 'Keep proper names untranslated',
    description: 'Preserve original proper names (people, places, brands)',
    group: 'advanced',
  },
  {
    key: 'detectMixedLanguage',
    label: 'Detect & handle mixed-language content',
    description: 'Identify sections in different languages (e.g. Latin citations in a German document)',
    group: 'advanced',
  },
  {
    key: 'preserveCitations',
    label: 'Preserve citations in original language',
    description: 'Keep quoted text and citations untranslated',
    group: 'advanced',
  },
];

const TranslationOptionsPanel: React.FC<Props> = ({ options, onChange }) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const toggle = (key: keyof TranslationOptions) => {
    onChange({ ...options, [key]: !options[key] });
  };

  const basicOptions = CHECKBOXES.filter((c) => c.group === 'basic');
  const advancedOptions = CHECKBOXES.filter((c) => c.group === 'advanced');

  return (
    <div className="options-panel">
      <h3>Translation Options</h3>

      <div className="options-grid">
        {basicOptions.map((def) => (
          <label key={def.key} className="option-item">
            <input
              type="checkbox"
              checked={options[def.key] as boolean}
              onChange={() => toggle(def.key)}
            />
            <span className="option-content">
              <span className="option-label">{def.label}</span>
              <span className="option-desc">{def.description}</span>
            </span>
          </label>
        ))}
      </div>

      <button
        type="button"
        className="toggle-advanced"
        onClick={() => setShowAdvanced((v) => !v)}
      >
        {showAdvanced ? '▲ Hide' : '▼ Show'} Advanced Settings
      </button>

      {showAdvanced && (
        <div className="options-grid advanced">
          {advancedOptions.map((def) => (
            <label key={def.key} className="option-item">
              <input
                type="checkbox"
                checked={options[def.key] as boolean}
                onChange={() => toggle(def.key)}
              />
              <span className="option-content">
                <span className="option-label">{def.label}</span>
                <span className="option-desc">{def.description}</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default TranslationOptionsPanel;
