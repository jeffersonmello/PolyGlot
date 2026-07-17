import React from 'react';
import type { LanguageMap } from '../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { ArrowLeftRight } from 'lucide-react';

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
    <div className="flex items-end gap-3">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="source-lang" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Source Language
        </Label>
        <Select value={sourceLang} onValueChange={onSourceChange} disabled={disabled}>
          <SelectTrigger id="source-lang" className="h-10 bg-white border-border/60 focus:ring-primary/20">
            <SelectValue placeholder="Select source language" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(languages).map(([code, name]) => (
              <SelectItem key={code} value={code}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={swapLanguages}
        disabled={disabled || sourceLang === 'auto'}
        title="Swap languages"
        aria-label="Swap source and target languages"
        className="h-10 w-10 rounded-full border-border/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all mb-0"
      >
        <ArrowLeftRight className="h-4 w-4" />
      </Button>

      <div className="flex-1 space-y-1.5">
        <Label htmlFor="target-lang" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Target Language
        </Label>
        <Select value={targetLang} onValueChange={onTargetChange} disabled={disabled}>
          <SelectTrigger id="target-lang" className="h-10 bg-white border-border/60 focus:ring-primary/20">
            <SelectValue placeholder="Select target language" />
          </SelectTrigger>
          <SelectContent>
            {targetOptions.map(([code, name]) => (
              <SelectItem key={code} value={code}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LanguageSelector;

