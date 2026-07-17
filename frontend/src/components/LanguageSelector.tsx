import React from 'react';
import type { LanguageMap } from '../types';

interface Props {
  languages: LanguageMap;
  sourceLang: string;
  targetLang: string;
  onSourceChange: (lang: string) => void;
  onTargetChange: (lang: string) => void;
  disabled?: boolean;
}

const LanguageSelector: React.FC<Props> = ({
  languages,
  sourceLang,
  targetLang,
  onSourceChange,
  onTargetChange,
  disabled = false,
}) => {
  const swapLanguages = () => {
    if (sourceLang === 'auto') return;
    onSourceChange(targetLang);
    onTargetChange(sourceLang);
  };

  const targetOptions = Object.entries(languages).filter(([code]) => code !== 'auto');

  return (
    <div className="language-selector">
      <div className="lang-group">
        <label htmlFor="source-lang">Source Language</label>
        <select
          id="source-lang"
          value={sourceLang}
          onChange={(e) => onSourceChange(e.target.value)}
          disabled={disabled}
        >
          {Object.entries(languages).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="swap-btn"
        onClick={swapLanguages}
        disabled={disabled || sourceLang === 'auto'}
        title="Swap languages"
        aria-label="Swap source and target languages"
      >
        ⇄
      </button>

      <div className="lang-group">
        <label htmlFor="target-lang">Target Language</label>
        <select
          id="target-lang"
          value={targetLang}
          onChange={(e) => onTargetChange(e.target.value)}
          disabled={disabled}
        >
          {targetOptions.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LanguageSelector;
