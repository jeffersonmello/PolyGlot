import React from 'react';
import type { TranslationOptions } from '../types';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { Settings2, ChevronDown, ChevronUp } from 'lucide-react';

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
  {
    key: 'preserveFormatting',
    label: 'Preserve formatting',
    description: 'Maintain fonts, sizes, colors, and layout',
    group: 'basic',
  },
  {
    key: 'preserveTables',
    label: 'Keep tables & charts',
    description: 'Maintain table structure and chart layout',
    group: 'basic',
  },
  {
    key: 'maintainCharacterStyles',
    label: 'Character styles',
    description: 'Preserve bold, italic, and underline formatting',
    group: 'basic',
  },
  {
    key: 'detectMixedLanguage',
    label: 'Mixed-language content',
    description: 'Identify sections in different languages',
    group: 'basic',
  },
  {
    key: 'preserveImages',
    label: 'Image positions',
    description: 'Keep images in their original locations',
    group: 'basic',
  },
  {
    key: 'keepProperNamesUntranslated',
    label: 'Keep proper names',
    description: 'Preserve original proper names (people, places, brands)',
    group: 'basic',
  },
  {
    key: 'preserveCitations',
    label: 'Preserve citations',
    description: 'Keep quoted text and citations untranslated',
    group: 'basic',
  },
  {
    key: 'translateProperNames',
    label: 'Translate proper names',
    description: 'Attempt to translate people, places, and brand names',
    group: 'advanced',
  },
  {
    key: 'translateImagesText',
    label: 'OCR for images',
    description: 'Extract and translate text found within images',
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

  const allBasicChecked = basicOptions.every((c) => options[c.key]);

  const selectAll = () => {
    const next = { ...options };
    const val = !allBasicChecked;
    basicOptions.forEach((c) => { next[c.key] = val as TranslationOptions[typeof c.key]; });
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-border/50 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Options
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground h-7 px-2 hover:text-foreground"
          onClick={selectAll}
        >
          {allBasicChecked ? 'Deselect all' : 'Select all'}
        </Button>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {basicOptions.map((def) => (
          <label
            key={def.key}
            className="flex items-start gap-2.5 cursor-pointer group rounded-lg p-2 hover:bg-slate-50 transition-colors"
          >
            <Checkbox
              id={def.key}
              checked={options[def.key] as boolean}
              onCheckedChange={() => toggle(def.key)}
              className="mt-0.5 shrink-0"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium leading-none text-foreground">{def.label}</span>
              <span className="text-xs text-muted-foreground">{def.description}</span>
            </div>
          </label>
        ))}
      </div>

      {advancedOptions.length > 0 && (
        <>
          <Separator className="mx-4 w-auto" />
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground rounded-none rounded-b-xl h-auto"
              >
                <span className="font-medium">⚙️ Advanced Settings</span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {advancedOptions.map((def) => (
                  <label
                    key={def.key}
                    className="flex items-start gap-2.5 cursor-pointer group rounded-lg p-2 hover:bg-slate-50 transition-colors"
                  >
                    <Checkbox
                      id={def.key}
                      checked={options[def.key] as boolean}
                      onCheckedChange={() => toggle(def.key)}
                      className="mt-0.5 shrink-0"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium leading-none text-foreground">{def.label}</span>
                      <span className="text-xs text-muted-foreground">{def.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </div>
  );
};

export default TranslationOptionsPanel;

