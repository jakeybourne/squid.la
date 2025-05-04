'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
// import Image from 'next/image';

// Import sections
import EquitySection from './input/EquitySection';
import PropertiesSection from './input/PropertiesSection';
import FinancingSection from './input/FinancingSection';
import PayoutSection from './input/PayoutSection';
import TaxSettingsSection from './input/TaxSettingsSection';
import StressTestSection from './input/StressTestSection';
import ScenariosPanel from './input/ScenariosPanel';
import { cn } from '@/lib/utils';

export default function InputPanel({ onCalculate, inDrawer = false }: { onCalculate?: () => void, inDrawer?: boolean }) {
  const { settings, updateSettings, runCalculation } = useAppStore();

  // Wrap the updateSettings function to also trigger calculation
  const handleUpdate = useCallback((updates: Partial<typeof settings>) => {
    updateSettings(updates);
    
    // Run calculation immediately after updating settings
    if (onCalculate) {
      onCalculate();
    } else {
      runCalculation();
    }
  }, [updateSettings, runCalculation, onCalculate]);

  return (
    <div className={cn("space-y-6", inDrawer && "space-y-0")}>
      <Card className={cn(inDrawer && 'border-0 shadow-none py-0 my-0')}>
        {/* Only show header when not in drawer */}
        {!inDrawer && (
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              {/* <Image 
                src="/logo.svg" 
                alt="Squid Egg Logo" 
                width={120} 
                height={40}
                className="object-contain"
              /> */}
              <CardTitle>Model Settings</CardTitle>
            </div>
          </CardHeader>
        )}
        <CardContent className={cn(inDrawer && "p-0")}>
          <Accordion 
            type="multiple" 
            defaultValue={[]} 
            className={cn("space-y-2", inDrawer && "space-y-0")}
          >
            <AccordionItem value="equity" className={cn("rounded", inDrawer && "border-b px-3")}>
              <AccordionTrigger className={cn(inDrawer && "py-4")}>Equity</AccordionTrigger>
              <AccordionContent className={cn(inDrawer && "pb-4 px-2")}>
                <EquitySection 
                  settings={settings} 
                  onUpdate={handleUpdate} 
                />
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="properties" className={cn("rounded", inDrawer && "border-b px-3")}>
              <AccordionTrigger className={cn(inDrawer && "py-4")}>Properties</AccordionTrigger>
              <AccordionContent className={cn(inDrawer && "pb-4 px-2")}>
                <PropertiesSection 
                  settings={settings} 
                  onUpdate={handleUpdate} 
                />
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="financing" className={cn("rounded", inDrawer && "border-b px-3")}>
              <AccordionTrigger className={cn(inDrawer && "py-4")}>Financing</AccordionTrigger>
              <AccordionContent className={cn(inDrawer && "pb-4 px-2")}>
                <FinancingSection 
                  settings={settings} 
                  onUpdate={handleUpdate} 
                />
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="payout" className={cn("rounded", inDrawer && "border-b px-3")}>
              <AccordionTrigger className={cn(inDrawer && "py-4")}>Dividend Payouts</AccordionTrigger>
              <AccordionContent className={cn(inDrawer && "pb-4 px-2")}>
                <PayoutSection 
                  settings={settings} 
                  onUpdate={handleUpdate} 
                />
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="tax" className={cn("rounded", inDrawer && "border-b px-3")}>
              <AccordionTrigger className={cn(inDrawer && "py-4")}>Tax & Other Settings</AccordionTrigger>
              <AccordionContent className={cn(inDrawer && "pb-4 px-2")}>
                <TaxSettingsSection 
                  settings={settings} 
                  onUpdate={handleUpdate} 
                />
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="stress-tests" className={cn("rounded", inDrawer && "border-b px-3")}>
              <AccordionTrigger className={cn(inDrawer && "py-4")}>Stress Testing</AccordionTrigger>
              <AccordionContent className={cn(inDrawer && "pb-4 px-2")}>
                <StressTestSection 
                  settings={settings} 
                  onUpdate={handleUpdate} 
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
      
      {/* Scenario Management with margin when in drawer */}
      <div className={cn(inDrawer && "mt-8")}>
        <ScenariosPanel />
      </div>
    </div>
  );
} 