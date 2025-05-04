'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';
import { GlobalSettings, StressTestInfo } from '@/types';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StressTest {
  id: string;
  name: string;
  description: string;
  explanation: string;
  keyMetric: string;
  apply: (settings: GlobalSettings, startYear: number, duration: number, instanceId: string, customParams?: Record<string, unknown>) => Partial<GlobalSettings>;
  revert: (settings: GlobalSettings, instanceId: string) => Partial<GlobalSettings>;
  defaultStartYear?: number;
  defaultDuration?: number;
  allowMultiple?: boolean; // Flag to indicate if multiple instances are allowed
}

type StressTestSectionProps = {
  settings: GlobalSettings;
  onUpdate: (settings: Partial<GlobalSettings>) => void;
};

// Define stress test scenarios
const stressTests: StressTest[] = [
  {
    id: 'rate-spike',
    name: 'Rate Spike',
    description: '+300 bps instant jump in loan rates',
    explanation: 'Mirrors Fed & EBA bank stress tests that assume a sharp tightening cycle.',
    keyMetric: 'DSCR < 1.25 or cash-reserve < 0',
    defaultStartYear: 1,
    defaultDuration: 3,
    apply: (
      settings: GlobalSettings, 
      startYear: number, 
      duration: number, 
      instanceId: string,
      customParams?: Record<string, unknown>
    ): Partial<GlobalSettings> => {
      // Create unique key for this instance of rate spike
      const spikeKey = `rateSpike_${instanceId}`;
      
      const bumpBps = typeof customParams?.bumpBps === 'number' ? customParams.bumpBps : 300;
      
      // Add this instance to scenarios
      return {
        scenarios: {
          ...(settings.scenarios || {}),
          [spikeKey]: {
            startYear,
            duration,
            bumpBps // Default to 300 basis points = +3.00%
          }
        }
      };
    },
    revert: (settings: GlobalSettings, instanceId: string): Partial<GlobalSettings> => {
      if (!settings.scenarios) return {};
      
      // Create key to remove
      const spikeKey = `rateSpike_${instanceId}`;
      
      // Clone the existing scenarios without the one we're removing
      const updatedScenarios = { ...settings.scenarios };
      delete updatedScenarios[spikeKey];
      
      // Return undefined if no scenarios left
      const hasScenarios = Object.keys(updatedScenarios).length > 0;
      
      return {
        scenarios: hasScenarios ? updatedScenarios : undefined
      };
    }
  },
  {
    id: 'property-crash',
    name: 'Property Price Crash',
    description: '–25% shock, flat for growth for several years',
    explanation: 'EBA "severely adverse" scenario drops euro residential properties by ≈26%.',
    keyMetric: 'LTV > 80% / equity < 0',
    defaultStartYear: 1,
    defaultDuration: 3,
    allowMultiple: true, // Allow multiple property crashes at different times
    apply: (settings: GlobalSettings, startYear: number, duration: number, instanceId: string): Partial<GlobalSettings> => {
      // Create unique key for this instance of property price crash
      const crashKey = `propertyPriceCrash_${instanceId}`;
      
      // Add this instance to scenarios
      return {
        scenarios: {
          ...(settings.scenarios || {}),
          [crashKey]: {
            startYear,
            duration,
            drop: 25 // 25% drop in prices
          }
        }
      };
    },
    revert: (settings: GlobalSettings, instanceId: string): Partial<GlobalSettings> => {
      if (!settings.scenarios) return {};
      
      // Create crash key to remove
      const crashKey = `propertyPriceCrash_${instanceId}`;
      
      // Clone the existing scenarios without the one we're removing
      const updatedScenarios = { ...settings.scenarios };
      delete updatedScenarios[crashKey];
      
      // Return undefined if no scenarios left
      const hasScenarios = Object.keys(updatedScenarios).length > 0;
      
      return {
        scenarios: hasScenarios ? updatedScenarios : undefined
      };
    }
  },
  {
    id: 'rent-shock',
    name: 'Rent-Roll Shock',
    description: '–10% lease-level rent, increased vacancy',
    explanation: 'Simulates a pandemic or remote-work impact on rental income.',
    keyMetric: 'NOI shrinks > interest cover',
    defaultStartYear: 1,
    defaultDuration: 2,
    allowMultiple: true, // Allow multiple rent shocks at different times
    apply: (
      settings: GlobalSettings, 
      startYear: number, 
      duration: number, 
      instanceId: string
    ): Partial<GlobalSettings> => {
      // Create unique key for this instance of rent shock
      const shockKey = `rentShock_${instanceId}`;
      
      // Add this instance to scenarios
      return {
        scenarios: {
          ...(settings.scenarios || {}),
          [shockKey]: {
            startYear,
            duration,
            drop: 10, // 10% drop in rent rates
            occupancyDrop: 10 // 10% drop in occupancy
          }
        }
      };
    },
    revert: (settings: GlobalSettings, instanceId: string): Partial<GlobalSettings> => {
      if (!settings.scenarios) return {};
      
      // Create shock key to remove
      const shockKey = `rentShock_${instanceId}`;
      
      // Clone the existing scenarios without the one we're removing
      const updatedScenarios = { ...settings.scenarios };
      delete updatedScenarios[shockKey];
      
      // Return undefined if no scenarios left
      const hasScenarios = Object.keys(updatedScenarios).length > 0;
      
      return {
        scenarios: hasScenarios ? updatedScenarios : undefined
      };
    }
  },
  {
    id: 'opex-inflation',
    name: 'Opex Inflation',
    description: '+5 pp permanent increase in operating expenses',
    explanation: 'Insurance & repair costs outpace CPI.',
    keyMetric: 'Net margin %, dividend cut',
    defaultStartYear: 1,
    defaultDuration: 99, // Long duration to effectively make it permanent
    allowMultiple: true, // Allow multiple opex inflation scenarios
    apply: (
      settings: GlobalSettings, 
      startYear: number, 
      duration: number, 
      instanceId: string,
      customParams?: Record<string, unknown>
    ): Partial<GlobalSettings> => {
      // Create unique key for this instance
      const inflationKey = `opexInflation_${instanceId}`;
      
      const bumpPctPts = typeof customParams?.bumpPctPts === 'number' ? customParams.bumpPctPts : 5;
      
      // Add this instance to scenarios
      return {
        scenarios: {
          ...(settings.scenarios || {}),
          [inflationKey]: {
            startYear,
            duration,
            bumpPctPts // Default to 5 percentage points if not specified
          }
        }
      };
    },
    revert: (settings: GlobalSettings, instanceId: string): Partial<GlobalSettings> => {
      if (!settings.scenarios) return {};
      
      // Create key to remove
      const inflationKey = `opexInflation_${instanceId}`;
      
      // Clone the existing scenarios without the one we're removing
      const updatedScenarios = { ...settings.scenarios };
      delete updatedScenarios[inflationKey];
      
      // Return undefined if no scenarios left
      const hasScenarios = Object.keys(updatedScenarios).length > 0;
      
      return {
        scenarios: hasScenarios ? updatedScenarios : undefined
      };
    }
  },
  {
    id: 'tax-hike',
    name: 'Tax Hike Double-Whammy',
    description: 'Corp tax 20→28%; AIMI doubled',
    explanation: 'Government plugs deficit with landlord levies.',
    keyMetric: 'Post-tax CF < target; dividends 0',
    defaultStartYear: 2,
    defaultDuration: 10,
    apply: (settings: GlobalSettings, startYear: number, duration: number, instanceId: string): Partial<GlobalSettings> => {
      // Create unique key for this instance of tax hike
      const taxHikeKey = `taxHike_${instanceId}`;
      
      // Add this instance to scenarios
      return {
        scenarios: {
          ...(settings.scenarios || {}),
          [taxHikeKey]: {
            startYear,
            duration,
            newRate: 28, // 28% corporate tax rate
            aimiMultiplier: 2.0 // Double the AIMI
          }
        }
      };
    },
    revert: (settings: GlobalSettings, instanceId: string): Partial<GlobalSettings> => {
      if (!settings.scenarios) return {};
      
      // Create key to remove
      const taxHikeKey = `taxHike_${instanceId}`;
      
      // Clone the existing scenarios without the one we're removing
      const updatedScenarios = { ...settings.scenarios };
      delete updatedScenarios[taxHikeKey];
      
      // Return undefined if no scenarios left
      const hasScenarios = Object.keys(updatedScenarios).length > 0;
      
      return {
        scenarios: hasScenarios ? updatedScenarios : undefined
      };
    }
  },
  {
    id: 'dividend-tax',
    name: 'Dividend Clamp-Down',
    description: 'WHT 28→35%',
    explanation: 'Reflects post-election tax reform.',
    keyMetric: 'Shareholder net income < "livable"',
    defaultStartYear: 2,
    defaultDuration: 10,
    apply: (settings: GlobalSettings, startYear: number, duration: number, instanceId: string): Partial<GlobalSettings> => {
      // Create unique key for this instance of dividend tax increase
      const dividendTaxKey = `dividendTax_${instanceId}`;
      
      // Add this instance to scenarios
      return {
        scenarios: {
          ...(settings.scenarios || {}),
          [dividendTaxKey]: {
            startYear,
            duration,
            newRate: 35 // 35% dividend withholding tax
          }
        }
      };
    },
    revert: (settings: GlobalSettings, instanceId: string): Partial<GlobalSettings> => {
      if (!settings.scenarios) return {};
      
      // Create key to remove
      const dividendTaxKey = `dividendTax_${instanceId}`;
      
      // Clone the existing scenarios without the one we're removing
      const updatedScenarios = { ...settings.scenarios };
      delete updatedScenarios[dividendTaxKey];
      
      // Return undefined if no scenarios left
      const hasScenarios = Object.keys(updatedScenarios).length > 0;
      
      return {
        scenarios: hasScenarios ? updatedScenarios : undefined
      };
    }
  },
  {
    id: 'stagflation',
    name: 'Slow Burn Stagflation',
    description: 'Price 0%, rent +0.5% for 5 years',
    explanation: '1970s-style stagnation: equity returns evaporate.',
    keyMetric: 'IRR over 35yr < hurdle (6%)',
    defaultStartYear: 1,
    defaultDuration: 5,
    allowMultiple: true, // Allow multiple stagflation periods
    apply: (
      settings: GlobalSettings, 
      startYear: number, 
      duration: number, 
      instanceId: string
    ): Partial<GlobalSettings> => {
      // Create unique key for this instance of stagflation
      const stagflationKey = `stagflation_${instanceId}`;
      
      // Add this instance to scenarios
      return {
        scenarios: {
          ...(settings.scenarios || {}),
          [stagflationKey]: {
            startYear,
            duration,
            rentGrowth: 0.5 // 0.5% rent growth during stagflation
          }
        }
      };
    },
    revert: (settings: GlobalSettings, instanceId: string): Partial<GlobalSettings> => {
      if (!settings.scenarios) return {};
      
      // Create key to remove
      const stagflationKey = `stagflation_${instanceId}`;
      
      // Clone the existing scenarios without the one we're removing
      const updatedScenarios = { ...settings.scenarios };
      delete updatedScenarios[stagflationKey];
      
      // Return undefined if no scenarios left
      const hasScenarios = Object.keys(updatedScenarios).length > 0;
      
      return {
        scenarios: hasScenarios ? updatedScenarios : undefined
      };
    }
  },
  {
    id: 'super-adverse',
    name: 'Multi-shock "Super Adverse"',
    description: 'Combines rate spike, property crash, and rent shock',
    explanation: 'Your catch-all capital-plan killer.',
    keyMetric: 'LTV > 90%, negative equity, reserve < 0',
    defaultStartYear: 1,
    defaultDuration: 3,
    apply: (
      settings: GlobalSettings, 
      startYear: number, 
      duration: number, 
      instanceId: string
    ): Partial<GlobalSettings> => {
      // Generate unique scenario keys for this super-adverse instance
      const crashKey = `propertyPriceCrash_${instanceId}`;
      const rentShockKey = `rentShock_${instanceId}`;
      const rateSpikeKey = `rateSpike_${instanceId}`;
      
      return {
        // Use the scenarios approach for all components
        scenarios: {
          ...(settings.scenarios || {}),
          [crashKey]: {
            startYear,
            duration,
            drop: 25 // 25% drop in prices
          },
          [rentShockKey]: {
            startYear,
            duration,
            drop: 10, // 10% drop in rents
            occupancyDrop: 10 // 10% drop in occupancy
          },
          [rateSpikeKey]: {
            startYear,
            duration,
            bumpBps: 300 // 300 basis points = +3.00%
          }
        }
      };
    },
    revert: (settings: GlobalSettings, instanceId: string): Partial<GlobalSettings> => {
      if (!settings.scenarios) return {};
      
      // Generate the scenario keys for this specific instance
      const crashKey = `propertyPriceCrash_${instanceId}`;
      const rentShockKey = `rentShock_${instanceId}`;
      const rateSpikeKey = `rateSpike_${instanceId}`;
      
      // Clone existing scenarios and remove these specific ones
      const updatedScenarios = { ...settings.scenarios };
      delete updatedScenarios[crashKey];
      delete updatedScenarios[rentShockKey];
      delete updatedScenarios[rateSpikeKey];
      
      const hasScenarios = Object.keys(updatedScenarios).length > 0;
      
      return {
        scenarios: hasScenarios ? updatedScenarios : undefined
      };
    }
  }
];

function StressTestPanel({ test, settings, onUpdate }: { 
  test: StressTest, 
  settings: GlobalSettings, 
  onUpdate: (settings: Partial<GlobalSettings>) => void 
}) {
  const [startYear, setStartYear] = useState<number>(test.defaultStartYear || 1);
  const [duration, setDuration] = useState<number>(test.defaultDuration || 3);
  
  // For opex inflation, add rate control
  const [opexBumpPctPts, setOpexBumpPctPts] = useState<number>(5);
  
  // For rate spike, add basis points control
  const [rateBumpBps, setRateBumpBps] = useState<number>(300);
  
  // Check if this test is already applied (only matters for non-multiple tests)
  const isMultipleAllowed = test.allowMultiple === true;
  const isTestApplied = !isMultipleAllowed && settings.activeStressTests?.some(activeTest => activeTest.id === test.id) || false;

  const handleApplyTest = () => {
    // Generate a unique instance ID for this test application
    const instanceId = `${Date.now()}`;
    
    // Create updated settings with the stress test applied
    let updatedSettings;
    
    // Handle special cases with custom parameters
    if (test.id === 'opex-inflation') {
      updatedSettings = test.apply(settings, startYear, duration, instanceId, { bumpPctPts: opexBumpPctPts });
    } else if (test.id === 'rate-spike') {
      updatedSettings = test.apply(settings, startYear, duration, instanceId, { bumpBps: rateBumpBps });
    } else {
      updatedSettings = test.apply(settings, startYear, duration, instanceId);
    }
    
    // Create or update activeStressTests array
    const currentTests = settings.activeStressTests || [];
    
    // For multiple-instance tests, don't filter out previous instances
    // For single-instance tests, remove any existing instance
    const newActiveTests = isMultipleAllowed 
      ? [...currentTests] 
      : currentTests.filter(t => t.id !== test.id);
    
    // Add the current test with custom parameters if needed
    const testInfo: StressTestInfo = {
      id: test.id,
      name: test.name,
      startYear,
      duration,
      applyDate: Date.now(),
      instanceId
    };
    
    // Add extra info for specific test types
    if (test.id === 'opex-inflation') {
      testInfo.name = `${test.name} (+${opexBumpPctPts}%)`;
    } else if (test.id === 'rate-spike') {
      testInfo.name = `${test.name} (+${rateBumpBps/100}%, ${duration}yr)`;
    }
    
    newActiveTests.push(testInfo);
    
    // Update the settings with both the test effects and the active tests list
    onUpdate({
      ...updatedSettings,
      activeStressTests: newActiveTests
    });
    
    toast.success("Stress Test Applied", {
      description: `Applied "${testInfo.name}" starting at year ${startYear}, lasting for ${duration} year${duration !== 1 ? 's' : ''}.`,
    });
  };
  
  const handleRevertTest = () => {
    // For non-multiple tests, revert the single instance
    const activeTest = settings.activeStressTests?.find(t => t.id === test.id);
    if (!activeTest) return;
    
    const instanceId = activeTest.instanceId || '';
    
    // Get the reverted settings
    const revertedSettings = test.revert(settings, instanceId);
    
    // Remove this test from activeStressTests
    const newActiveTests = (settings.activeStressTests || []).filter(t => t.id !== test.id);
    
    // Update the settings with both reverted values and updated activeTests list
    onUpdate({
      ...revertedSettings,
      activeStressTests: newActiveTests.length > 0 ? newActiveTests : undefined
    });
    
    toast("Stress Test Reverted", {
      description: `Reverted changes from "${test.name}" scenario.`,
    });
  };

  return (
    <div className="space-y-2">
      <TooltipProvider>
        <Card className="overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Description row */}
            <div>
              <div className="flex flex-col items-left gap-2 mb-4">
                <h3 className="text-xl font-semibold">{test.name}</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="cursor-help">
                      {test.description}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{test.explanation}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
       
              
              <div className="bg-muted rounded-md p-3 inline-block">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">Key Metric:</span>
                  <span className="text-sm">{test.keyMetric}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">This is the key financial metric that will be most affected by this stress test.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
            
            {/* Parameters row */}
            <div className="w-full border-t pt-5">
              <div className="flex flex-col gap-6">
                <div>
                  <h4 className="font-medium mb-4">Test Parameters</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center">
                        <Label htmlFor={`start-year-${test.id}`} className="text-sm">Start Year</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>The year when the shock begins</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id={`start-year-${test.id}`}
                        type="number"
                        min="1"
                        max="30"
                        value={startYear}
                        onChange={(e) => setStartYear(parseInt(e.target.value) || 1)}
                        disabled={isTestApplied}
                        className="mt-1"
                      />
                    </div>
                    
                    {/* Conditional controls based on test type */}
                    {test.id === 'opex-inflation' ? (
                      <div>
                        <div className="flex justify-between items-center">
                          <Label htmlFor={`opex-bump-${test.id}`} className="text-sm">Percentage Points (%)</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>How many percentage points to increase operating expenses</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id={`opex-bump-${test.id}`}
                          type="number"
                          min="1"
                          max="20"
                          value={opexBumpPctPts}
                          onChange={(e) => setOpexBumpPctPts(parseInt(e.target.value) || 5)}
                          disabled={isTestApplied}
                          className="mt-1"
                        />
                      </div>
                    ) : test.id === 'rate-spike' ? (
                      <div>
                        <div className="flex justify-between items-center">
                          <Label htmlFor={`rate-bump-${test.id}`} className="text-sm">Basis Points (bps)</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>How many basis points to increase interest rates (100bps = 1%)</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id={`rate-bump-${test.id}`}
                          type="number"
                          min="50"
                          max="1000"
                          step="25"
                          value={rateBumpBps}
                          onChange={(e) => setRateBumpBps(parseInt(e.target.value) || 300)}
                          disabled={isTestApplied}
                          className="mt-1"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-center">
                          <Label htmlFor={`duration-${test.id}`} className="text-sm">Duration (Years)</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Number of years the shock lasts</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id={`duration-${test.id}`}
                          type="number"
                          min="1"
                          max="30"
                          value={duration}
                          onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                          disabled={isTestApplied}
                          className="mt-1"
                        />
                      </div>
                    )}

                    {/* Duration control for rate spike */}
                    {test.id === 'rate-spike' && (
                      <div>
                        <div className="flex justify-between items-center">
                          <Label htmlFor={`duration-${test.id}`} className="text-sm">Duration (Years)</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Number of years the rate spike lasts</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id={`duration-${test.id}`}
                          type="number"
                          min="1"
                          max="30"
                          value={duration}
                          onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                          disabled={isTestApplied}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Buttons row - separate from parameters */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleApplyTest} 
                    disabled={isTestApplied}
                    variant="destructive"
                    className="whitespace-nowrap"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Apply {test.name}
                  </Button>
                  
                  {isTestApplied && (
                    <Button 
                      onClick={handleRevertTest}
                      variant="outline"
                      className="whitespace-nowrap"
                    >
                      Revert Changes
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </TooltipProvider>
    </div>
  );
}

export default function StressTestSection({ settings, onUpdate }: StressTestSectionProps) {
  const [activeTestId, setActiveTestId] = useState(stressTests[0].id);
  const activeTest = stressTests.find(test => test.id === activeTestId);

  // Group stress tests into logical categories
  const marketShocks = stressTests.filter(test => 
    ['property-crash', 'rent-shock', 'stagflation'].includes(test.id)
  );
  
  const financialShocks = stressTests.filter(test => 
    ['rate-spike', 'opex-inflation'].includes(test.id)
  );
  
  const regulatoryShocks = stressTests.filter(test => 
    ['tax-hike', 'dividend-tax'].includes(test.id)
  );
  
  const combinedShocks = stressTests.filter(test => 
    ['super-adverse'].includes(test.id)
  );

  const handleScenarioChange = (value: string) => {
    setActiveTestId(value);
  };
  
  // This shows which tests are currently applied to the model
  const activeTests: StressTestInfo[] = settings.activeStressTests || [];
  
  // Function to handle removing a test by ID
  const handleRemoveTest = (testInfo: StressTestInfo) => {
    // Find the test definition
    const testToRemove = stressTests.find(test => test.id === testInfo.id);
    if (!testToRemove) return;
    
    // Get the instance ID (or use empty string if unavailable)
    const instanceId = testInfo.instanceId || '';
    
    // Get the reverted settings
    const revertedSettings = testToRemove.revert(settings, instanceId);
    
    // Remove this specific test instance from activeStressTests
    const newActiveTests = (settings.activeStressTests || []).filter(t => {
      // For tests with instanceId, filter by both id and instanceId
      if (t.instanceId && testInfo.instanceId) {
        return !(t.id === testInfo.id && t.instanceId === testInfo.instanceId);
      }
      // For old tests without instanceId, filter by id
      return t.id !== testInfo.id;
    });
    
    // Update the settings with both reverted values and updated activeTests list
    onUpdate({
      ...revertedSettings,
      activeStressTests: newActiveTests.length > 0 ? newActiveTests : undefined
    });
    
    toast("Stress Test Removed", {
      description: `Removed "${testToRemove.name}" scenario.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Select a scenario to model economic shocks and evaluate portfolio resilience.
        </p>
      </div>
      
      {activeTests.length > 0 && (
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">Active Stress Tests</h3>
          <div className="flex flex-wrap gap-2">
            {activeTests.map((test, index) => (
              <Badge 
                key={test.instanceId || `${test.id}-${index}`} 
                variant="outline" 
                className="px-2 py-1 pr-1 flex items-center gap-1"
              >
                <span>
                  {test.name} 
                  {test.id === 'opex-inflation' 
                    ? `(Y${test.startYear})` 
                    : `(Y${test.startYear}-${test.startYear + test.duration - 1})`}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 rounded-full hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemoveTest(test)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove</span>
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      <div className="max-w-md mb-6">
        <Label htmlFor="scenario-select" className="mb-2 block">Select Scenario</Label>
        <Select value={activeTestId} onValueChange={handleScenarioChange}>
          <SelectTrigger id="scenario-select" className="w-full">
            <SelectValue placeholder="Select a stress test scenario" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Market Shocks</SelectLabel>
              {marketShocks.map(test => (
                <SelectItem key={test.id} value={test.id}>
                  {test.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Financial Shocks</SelectLabel>
              {financialShocks.map(test => (
                <SelectItem key={test.id} value={test.id}>
                  {test.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Regulatory Shocks</SelectLabel>
              {regulatoryShocks.map(test => (
                <SelectItem key={test.id} value={test.id}>
                  {test.name}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Combined Scenarios</SelectLabel>
              {combinedShocks.map(test => (
                <SelectItem key={test.id} value={test.id}>
                  {test.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      {activeTest && <StressTestPanel test={activeTest} settings={settings} onUpdate={onUpdate} />}
    </div>
  );
} 