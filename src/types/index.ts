export type Purchase = {
  year: number;          // e.g. 0, 2, 4
  price: number;
  ltv: number;           // 0.65
  loanAmount: number;
  loanRate: number;      // decimal e.g. 0.04
  termYears: number;     // 30
};

export type RangeValue = {
  value: number;
  min?: number;
  max?: number;
  shockStartYear?: number;
  shockDuration?: number;
  _originalValue?: number; // Store the original value before a shock was applied
};

export type PropertyConfig = {
  price?: number;        // Override the default price for this specific property
  ltv?: number;          // Override the default LTV for this specific property
  loanRate?: number;     // Override the default loan rate for this specific property
  termYears?: number;    // Override the default term years for this specific property
  purchaseYear?: number; // Allow changing the year this property is purchased
};

export type StressTestInfo = {
  id: string;
  name: string;
  startYear: number;
  duration: number;
  applyDate?: number; // timestamp of when the test was applied
  instanceId?: string; // unique identifier for this specific instance of the test
};

export type GlobalSettings = {
  seedEquity: number;
  annualInjection: number;            // 100_000
  injectionYears: number;             // 5
  unitPrice: number;                  // 600_000
  priceGrowth: RangeValue;            // {value: 3, min: 2, max: 4} (%)
  grossYield: RangeValue;             // {value: 5, min: 4, max: 6} (%)
  rentGrowth: RangeValue;             // {value: 2, min: 1, max: 3} (%)
  opexFactor: RangeValue;             // {value: 12, min: 10, max: 15} (%)
  corpTaxRate: number;                // 0.20
  payoutRatio: number;                // 0.80 - Default payout ratio
  payoutSchedule: { [year: number]: number }; // Year-specific payout ratios (as decimal)
  startPayoutsYear: number;           // Year to start taking dividend payments (default: 0)
  forecastPeriod: number;             // Number of years to forecast beyond retirement (default: 10)
  dividendWHT: number;                // 0.28
  extraPrepaySchedule: { [year: number]: number }; // {11:20000,...}
  retirementYear: number;             // 20
  purchaseYears: number[];            // [0,2,4]
  showAfterTax: boolean;              // true
  ltv: number;                        // 65 (percentage)
  loanRate: RangeValue;               // {value: 4, min: 3.5, max: 4.5} (%)
  termYears: number;                  // 30
  bufferMonths: number;               // Number of months of debt service to keep as safety buffer (default: 6)
  propertySettings?: { [year: number]: PropertyConfig }; // Property-specific overrides
  taxShockStartYear?: number;         // Year to start tax shock for tax-related stress tests
  taxShockDuration?: number;          // Duration of tax shock for tax-related stress tests
  dividendWHTShockStartYear?: number; // Year to start dividend WHT shock
  dividendWHTShockDuration?: number;  // Duration of dividend WHT shock
  activeStressTests?: StressTestInfo[]; // Track which stress tests are currently active
  
  // Original values for stress tests
  _originalTaxRate?: number;
  _originalDividendWHT?: number;
  
  // Scenarios for stress tests
  scenarios?: {
    [key: string]: {
      startYear: number;   // first year the hit is felt
      duration: number;    // count of "flat" years **after** the drop
      drop?: number;       // expressed as *percent*, e.g. 25 = –25 %
      occupancyDrop?: number; // for rent shock, percentage drop in occupancy
      rentGrowth?: number; // for stagflation, reduced rent growth rate in percent
      bumpBps?: number;    // for rate spikes, basis points increase (300 = +3.00%)
      bumpPctPts?: number; // for opex inflation, percentage points increase (5 = +5%)
      newRate?: number;    // for tax scenarios, new tax rate in percent (28 = 28%)
      aimiMultiplier?: number; // for tax scenarios, multiplier for AIMI (2.0 = doubled)
    };
  };
};

export type ModelResult = {
  years: number;
  debt: number[];
  value: number[];
  rent: number[];
  cashflow: number[];
  equity: number[];
  dividends: number[];
  ltv: number[];
  cashReserve: number[];
  buildingDepreciation: number[]; // 2% of building value
  IMI: number[];                  // Regular property tax
  AIMI: number[];                 // Additional property tax/wealth tax
  warnings?: {
    isUnderfunded: boolean;
    highLtv: boolean;
  };
};

export type ScenarioRange = {
  base: ModelResult;
  min?: ModelResult;
  max?: ModelResult;
};

export type Scenario = {
  name: string;
  timestamp: number;
  settings: GlobalSettings;
  results?: ScenarioRange;
}; 