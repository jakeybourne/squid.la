'use client';

import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { GlobalSettings } from '@/types';

type EquitySectionProps = {
  settings: GlobalSettings;
  onUpdate: (updates: Partial<GlobalSettings>) => void;
};

export default function EquitySection({ settings, onUpdate }: EquitySectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm">Seed Equity (€)</label>
          <Input 
            type="number" 
            value={settings.seedEquity}
            onChange={(e) => onUpdate({ seedEquity: Number(e.target.value) })}
          />
        </div>
        
        <div>
          <label className="text-sm">Annual Injection (€)</label>
          <Input 
            type="number" 
            value={settings.annualInjection}
            onChange={(e) => onUpdate({ annualInjection: Number(e.target.value) })}
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm block mb-2">Injection Years: {settings.injectionYears}</label>
        <Slider 
          min={0} 
          max={20} 
          step={1} 
          value={[settings.injectionYears]}
          onValueChange={(value) => onUpdate({ injectionYears: value[0] })}
        />
      </div>
    </div>
  );
} 