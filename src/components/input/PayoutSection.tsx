'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { GlobalSettings } from '@/types';

type PayoutSectionProps = {
  settings: GlobalSettings;
  onUpdate: (updates: Partial<GlobalSettings>) => void;
};

export default function PayoutSection({ settings, onUpdate }: PayoutSectionProps) {
  const [newPayoutYear, setNewPayoutYear] = useState<number>(0);
  const [newPayoutRatio, setNewPayoutRatio] = useState<number>(0);

  // Initialize payoutSchedule if it doesn't exist yet
  if (!settings.payoutSchedule) {
    onUpdate({ payoutSchedule: {} });
  }

  // Initialize startPayoutsYear and forecastPeriod if they don't exist
  if (settings.startPayoutsYear === undefined) {
    onUpdate({ startPayoutsYear: 0 });
  }
  
  if (settings.forecastPeriod === undefined) {
    onUpdate({ forecastPeriod: 10 });
  }

  // Get existing payout years sorted in ascending order
  const payoutYears = Object.keys(settings.payoutSchedule || {})
    .map(Number)
    .sort((a, b) => a - b);

  // Add a new year-specific payout
  const handleAddPayout = () => {
    if (newPayoutYear > 0 && newPayoutRatio >= 0 && newPayoutRatio <= 1) {
      onUpdate({
        payoutSchedule: {
          ...(settings.payoutSchedule || {}),
          [newPayoutYear]: newPayoutRatio
        }
      });
      // Reset the input fields
      setNewPayoutYear(0);
      setNewPayoutRatio(0);
    }
  };

  // Remove a year-specific payout
  const handleRemovePayout = (year: number) => {
    const updatedSchedule = { ...(settings.payoutSchedule || {}) };
    delete updatedSchedule[year];
    
    onUpdate({
      payoutSchedule: updatedSchedule
    });
  };

  return (
    <div className="space-y-4">
      {/* Dividend Start Year */}
      <div>
        <label className="text-sm font-medium">Start Taking Dividends from Year</label>
        <div className="flex items-center gap-4 mt-2">
          <Input
            type="number"
            min="0"
            max="50"
            value={settings.startPayoutsYear}
            onChange={(e) => onUpdate({ startPayoutsYear: parseInt(e.target.value) || 0 })}
            className="w-24"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Don&apos;t take any dividends before this year (reinvest everything)
        </p>
      </div>

      {/* Forecast Period */}
      <div>
        <label className="text-sm font-medium">Forecast Years After Retirement</label>
        <div className="flex items-center gap-4 mt-2">
          <Input
            type="number"
            min="0"
            max="30" 
            value={settings.forecastPeriod}
            onChange={(e) => onUpdate({ forecastPeriod: parseInt(e.target.value) || 10 })}
            className="w-24"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Number of years to forecast retirement income beyond the investment period
        </p>
      </div>

      <div>
        <label className="text-sm block mb-2">Default Dividend Payout Ratio: {Math.round(settings.payoutRatio * 100)}%</label>
        <Slider 
          min={0} 
          max={100} 
          step={1} 
          value={[Math.round(settings.payoutRatio * 100)]}
          onValueChange={(value) => onUpdate({ payoutRatio: value[0] / 100 })}
        />
        <p className="text-xs text-muted-foreground mt-1">
          This is the default percentage of profits paid out as dividends each year.
          The remaining will be retained as cash reserve.
        </p>
      </div>
      
      <div className="mt-6">
        <label className="text-sm font-medium">Year-Specific Payout Ratios</label>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Override the default payout ratio for specific years
        </p>
        
        {/* Add new year-specific payout controls */}
        <div className="flex items-end gap-2 mt-2 mb-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <label className="text-sm">Year</label>
            <Input
              type="number"
              min="1"
              value={newPayoutYear === 0 ? '' : newPayoutYear}
              onChange={(e) => setNewPayoutYear(e.target.value ? parseInt(e.target.value) : 0)}
              placeholder="Year"
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <label className="text-sm">Payout Ratio (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={newPayoutRatio === 0 ? '' : Math.round(newPayoutRatio * 100)}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : 0;
                setNewPayoutRatio(value / 100);
              }}
              placeholder="Payout %"
            />
          </div>
          <Button 
            size="sm"
            onClick={handleAddPayout}
            disabled={newPayoutYear <= 0 || newPayoutRatio < 0 || newPayoutRatio > 1}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        
        {/* Display year-specific payouts table */}
        {payoutYears.length > 0 ? (
          <Table className="mt-2">
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Payout Ratio (%)</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payoutYears.map((year) => (
                <TableRow key={year}>
                  <TableCell>{year}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      min="0"
                      max="100"
                      value={Math.round((settings.payoutSchedule?.[year] || 0) * 100)}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        onUpdate({
                          payoutSchedule: {
                            ...(settings.payoutSchedule || {}),
                            [year]: value / 100
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
                        onClick={() => handleRemovePayout(year)}
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
            No year-specific payout ratios defined. Add one above to override the default.
          </div>
        )}
      </div>
    </div>
  );
} 