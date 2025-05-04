'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { GlobalSettings, RangeValue } from '@/types';
import { formatPercentage } from '@/lib/formatters';

interface RangeSliderProps {
  label: string;
  field: keyof GlobalSettings;
  settings: GlobalSettings;
  onUpdate: (updates: Partial<GlobalSettings>) => void;
  min: number;
  max: number;
  step: number;
}

export default function RangeSlider({
  label,
  field, 
  settings,
  onUpdate,
  min,
  max,
  step,
}: RangeSliderProps) {
  const value = settings[field] as RangeValue;
  const [rangesEnabled, setRangesEnabled] = useState(value.min !== undefined || value.max !== undefined);
  
  const handleValueChange = (newValues: number[]) => {
    if (!rangesEnabled) {
      // Only update single value
      const rangeValue: RangeValue = {
        value: newValues[0],
        min: undefined,
        max: undefined
      };
      
      onUpdate({ [field]: rangeValue } as Partial<GlobalSettings>);
      return;
    }
    
    // Range mode - only min and max
    const rangeValue: RangeValue = {
      // Use average of min and max as the main value
      value: (newValues[0] + newValues[1]) / 2,
      min: newValues[0],
      max: newValues[1]
    };
    
    onUpdate({ [field]: rangeValue } as Partial<GlobalSettings>);
  };
  
  const toggleRanges = (enabled: boolean) => {
    setRangesEnabled(enabled);
    
    if (!enabled) {
      // Remove min/max values
      const rangeValue: RangeValue = {
        value: value.value,
        min: undefined,
        max: undefined
      };
      
      onUpdate({ [field]: rangeValue } as Partial<GlobalSettings>);
    } else {
      // Set default min/max values around the current value
      const buffer = (max - min) * 0.1;
      const minValue = Math.max(min, value.value - buffer);
      const maxValue = Math.min(max, value.value + buffer);
      
      const rangeValue: RangeValue = {
        value: value.value,
        min: minValue,
        max: maxValue
      };
      
      onUpdate({ [field]: rangeValue } as Partial<GlobalSettings>);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm">
          {label}: {rangesEnabled 
            ? `${formatPercentage(value.min ?? 0)} - ${formatPercentage(value.max ?? 0)}` 
            : formatPercentage(value.value)}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Enable range</span>
          <Switch 
            checked={rangesEnabled} 
            onCheckedChange={toggleRanges} 
          />
        </div>
      </div>
      
      <Slider 
        min={min} 
        max={max} 
        step={step} 
        value={rangesEnabled 
          ? [value.min || value.value - 1, value.max || value.value + 1]
          : [value.value]
        }
        onValueChange={handleValueChange}
      />
    </div>
  );
} 