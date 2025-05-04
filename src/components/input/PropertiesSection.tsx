'use client';

import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { GlobalSettings, PropertyConfig } from '@/types';
import RangeSlider from './RangeSlider';
import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

type PropertiesSectionProps = {
  settings: GlobalSettings;
  onUpdate: (updates: Partial<GlobalSettings>) => void;
};

export default function PropertiesSection({ settings, onUpdate }: PropertiesSectionProps) {
  const [activePropertyYear, setActivePropertyYear] = useState<number | null>(null);
  
  const handleUpdatePurchaseYears = (year: number, checked: boolean) => {
    let newYears = [...settings.purchaseYears];
    
    if (checked && !newYears.includes(year)) {
      newYears.push(year);
      newYears.sort((a, b) => a - b);
    } else if (!checked && newYears.includes(year)) {
      newYears = newYears.filter(y => y !== year);
      // Also remove property-specific settings if they exist
      if (settings.propertySettings?.[year]) {
        const newPropertySettings = { ...settings.propertySettings };
        delete newPropertySettings[year];
        onUpdate({ 
          purchaseYears: newYears,
          propertySettings: newPropertySettings
        });
        return;
      }
    }
    
    onUpdate({ purchaseYears: newYears });
  };
  
  const handleUpdatePropertySettings = (year: number, config: Partial<PropertyConfig>) => {
    const newPropertySettings = { 
      ...settings.propertySettings,
      [year]: {
        ...settings.propertySettings?.[year],
        ...config
      }
    };
    
    // If purchase year is being updated, handle property move
    if (config.purchaseYear !== undefined && config.purchaseYear !== year) {
      // Create entry for the new year with same settings
      newPropertySettings[config.purchaseYear] = {
        ...newPropertySettings[year]
      };
      // Remove the old year entry
      delete newPropertySettings[year];
      
      // Update purchaseYears array
      let newPurchaseYears = [...settings.purchaseYears];
      newPurchaseYears = newPurchaseYears.filter(y => y !== year);
      if (!newPurchaseYears.includes(config.purchaseYear)) {
        newPurchaseYears.push(config.purchaseYear);
        newPurchaseYears.sort((a, b) => a - b);
      }
      
      onUpdate({ 
        propertySettings: newPropertySettings,
        purchaseYears: newPurchaseYears
      });
      
      // Update active property year
      setActivePropertyYear(config.purchaseYear);
      return;
    }
    
    onUpdate({ propertySettings: newPropertySettings });
  };

  const resetPropertySettings = (year: number) => {
    const newPropertySettings = { ...settings.propertySettings };
    delete newPropertySettings[year];
    onUpdate({ propertySettings: newPropertySettings });
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm">Purchase Years</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {Array.from({ length: 20 }, (_, i) => i).map((year) => (
            <Toggle 
              key={year} 
              pressed={settings.purchaseYears.includes(year)}
              onPressedChange={(pressed) => handleUpdatePurchaseYears(year, pressed)}
              variant={settings.propertySettings?.[year] ? "outline" : "default"}
            >
              Y{year}
            </Toggle>
          ))}
        </div>
      </div>
      
      {/* Global Property Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm">Unit Price (€)</label>
          <Input 
            type="number" 
            value={settings.unitPrice}
            onChange={(e) => onUpdate({ unitPrice: Number(e.target.value) })}
          />
        </div>
        
        <RangeSlider
          label="Price Growth"
          field="priceGrowth"
          settings={settings}
          onUpdate={onUpdate}
          min={0}
          max={10}
          step={0.1}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <RangeSlider
          label="Gross Yield"
          field="grossYield"
          settings={settings}
          onUpdate={onUpdate}
          min={3}
          max={8}
          step={0.1}
        />
        
        <RangeSlider
          label="Rent Growth"
          field="rentGrowth"
          settings={settings}
          onUpdate={onUpdate}
          min={0}
          max={5}
          step={0.1}
        />
      </div>
      
      <RangeSlider
        label="Opex % of Rent"
        field="opexFactor"
        settings={settings}
        onUpdate={onUpdate}
        min={5}
        max={25}
        step={0.5}
      />
      
      {/* Property-Specific Settings */}
      {settings.purchaseYears.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Property-Specific Settings</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Configure specific settings for individual properties that override the global settings.
          </p>
          
          <Accordion 
            type="multiple" 
            value={activePropertyYear !== null ? [`property-${activePropertyYear}`] : []}
            onValueChange={(value) => {
              // If empty array, set to null, otherwise take the last opened item
              const lastItem = value.length > 0 ? value[value.length - 1] : undefined;
              const year = lastItem ? parseInt(lastItem.replace('property-', ''), 10) : null;
              setActivePropertyYear(year);
            }}
          >
            {settings.purchaseYears.map((year) => (
              <AccordionItem key={year} value={`property-${year}`} className="border rounded-md p-2 mb-2">
                <AccordionTrigger className="py-2">
                  <div className="flex items-center">
                    <span>Property Y{year}</span>
                    {settings.propertySettings?.[year] && (
                      <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                        Custom
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm">Price (€)</label>
                        <Input 
                          type="number" 
                          value={settings.propertySettings?.[year]?.price ?? ''}
                          placeholder={`Default: ${settings.unitPrice}`}
                          onChange={(e) => handleUpdatePropertySettings(year, { 
                            price: e.target.value ? Number(e.target.value) : undefined 
                          })}
                        />
                      </div>
                      <div>
                        <label className="text-sm">LTV (%)</label>
                        <Input 
                          type="number" 
                          value={settings.propertySettings?.[year]?.ltv ?? ''}
                          placeholder={`Default: ${settings.ltv}`}
                          onChange={(e) => handleUpdatePropertySettings(year, { 
                            ltv: e.target.value ? Number(e.target.value) : undefined 
                          })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm">Purchase Year</label>
                        <Input 
                          type="number" 
                          value={settings.propertySettings?.[year]?.purchaseYear ?? year}
                          onChange={(e) => {
                            const newYear = e.target.value ? Number(e.target.value) : year;
                            if (newYear >= 0 && newYear < 20) {
                              handleUpdatePropertySettings(year, { purchaseYear: newYear });
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-sm">Loan Rate (%)</label>
                        <Input 
                          type="number" 
                          value={settings.propertySettings?.[year]?.loanRate ?? ''}
                          placeholder={`Default: ${settings.loanRate.value}`}
                          onChange={(e) => handleUpdatePropertySettings(year, { 
                            loanRate: e.target.value ? Number(e.target.value) : undefined 
                          })}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm">Loan Term (years)</label>
                      <Input 
                        type="number" 
                        value={settings.propertySettings?.[year]?.termYears ?? ''}
                        placeholder={`Default: ${settings.termYears}`}
                        onChange={(e) => handleUpdatePropertySettings(year, { 
                          termYears: e.target.value ? Number(e.target.value) : undefined 
                        })}
                      />
                    </div>
                    
                    {settings.propertySettings?.[year] && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => resetPropertySettings(year)}
                      >
                        Reset to Global Settings
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
} 