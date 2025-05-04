'use client';

import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { GlobalSettings } from '@/types';

type TaxSettingsSectionProps = {
  settings: GlobalSettings;
  onUpdate: (updates: Partial<GlobalSettings>) => void;
};

export default function TaxSettingsSection({ settings, onUpdate }: TaxSettingsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm">Corporate Tax Rate (%)</label>
          <Input 
            type="number" 
            value={settings.corpTaxRate}
            onChange={(e) => onUpdate({ corpTaxRate: Number(e.target.value) })}
          />
        </div>
        
        <div>
          <label className="text-sm">Dividend WHT (%)</label>
          <Input 
            type="number" 
            value={settings.dividendWHT}
            onChange={(e) => onUpdate({ dividendWHT: Number(e.target.value) })}
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm">Retirement Year</label>
        <Input 
          type="number" 
          value={settings.retirementYear}
          onChange={(e) => onUpdate({ retirementYear: Number(e.target.value) })}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Toggle
          pressed={settings.showAfterTax}
          onPressedChange={(pressed) => onUpdate({ showAfterTax: pressed })}
        />
        <label className="text-sm">Show after-tax to owners</label>
      </div>
    </div>
  );
} 