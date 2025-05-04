'use client';

import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { GlobalSettings } from '@/types';
import RangeSlider from './RangeSlider';
import { useState } from 'react';

type FinancingSectionProps = {
  settings: GlobalSettings;
  onUpdate: (updates: Partial<GlobalSettings>) => void;
};

export default function FinancingSection({ settings, onUpdate }: FinancingSectionProps) {
  const [newPrepayYear, setNewPrepayYear] = useState<number>(0);
  const [newPrepayAmount, setNewPrepayAmount] = useState<number>(0);

  // Get existing prepayment years sorted in ascending order
  const prepaymentYears = Object.keys(settings.extraPrepaySchedule)
    .map(Number)
    .sort((a, b) => a - b);

  // Add a new prepayment
  const handleAddPrepayment = () => {
    if (newPrepayYear > 0 && newPrepayAmount > 0) {
      onUpdate({
        extraPrepaySchedule: {
          ...settings.extraPrepaySchedule,
          [newPrepayYear]: newPrepayAmount
        }
      });
      // Reset the input fields
      setNewPrepayYear(0);
      setNewPrepayAmount(0);
    }
  };

  // Remove a prepayment
  const handleRemovePrepayment = (year: number) => {
    const updatedSchedule = { ...settings.extraPrepaySchedule };
    delete updatedSchedule[year];
    
    onUpdate({
      extraPrepaySchedule: updatedSchedule
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm block mb-2">LTV: {settings.ltv}%</label>
        <Slider 
          min={50} 
          max={80} 
          step={1} 
          value={[settings.ltv]}
          onValueChange={(value) => onUpdate({ ltv: value[0] })}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <RangeSlider
          label="Loan Rate"
          field="loanRate"
          settings={settings}
          onUpdate={onUpdate}
          min={1}
          max={8}
          step={0.1}
        />
        
        <div>
          <label className="text-sm block mb-2">Term: {settings.termYears} years</label>
          <Slider 
            min={10} 
            max={35} 
            step={1} 
            value={[settings.termYears]}
            onValueChange={(value) => onUpdate({ termYears: value[0] })}
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium">Extra Prepayments</label>
        
        {/* Add new prepayment controls */}
        <div className="flex items-end gap-2 mt-2 mb-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <label className="text-sm">Year</label>
            <Input
              type="number"
              min="1"
              value={newPrepayYear === 0 ? '' : newPrepayYear}
              onChange={(e) => setNewPrepayYear(e.target.value ? parseInt(e.target.value) : 0)}
              placeholder="Year"
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <label className="text-sm">Amount (€)</label>
            <Input
              type="number"
              min="0"
              value={newPrepayAmount === 0 ? '' : newPrepayAmount}
              onChange={(e) => setNewPrepayAmount(e.target.value ? parseInt(e.target.value) : 0)}
              placeholder="Amount"
            />
          </div>
          <Button 
            size="sm"
            onClick={handleAddPrepayment}
            disabled={newPrepayYear <= 0 || newPrepayAmount <= 0}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        
        {/* Display prepayments table */}
        {prepaymentYears.length > 0 ? (
          <Table className="mt-2">
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Amount (€)</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prepaymentYears.map((year) => (
                <TableRow key={year}>
                  <TableCell>{year}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={settings.extraPrepaySchedule[year] || 0}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        onUpdate({
                          extraPrepaySchedule: {
                            ...settings.extraPrepaySchedule,
                            [year]: value
                          }
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={() => handleRemovePrepayment(year)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-sm text-muted-foreground mt-2">
            No prepayments scheduled. Add one above.
          </div>
        )}
      </div>
    </div>
  );
} 