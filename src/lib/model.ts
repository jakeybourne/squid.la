import { GlobalSettings, ModelResult, Purchase } from "../types";

// ===================================================================
// Amortization functions
// ===================================================================

/**
 * Generate amortization table for a loan
 */
export const amortTable = (
  loanAmount: number,
  rate: number,
  termYears: number
): { principal: number; interest: number }[] => {
  const result: { principal: number; interest: number }[] = [];
  const monthlyRate = rate / 12;
  const numPayments = termYears * 12;
  
  // Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const monthlyPayment = loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  let balance = loanAmount;
  
  // Group by year
  for (let year = 0; year < termYears; year++) {
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;
    
    for (let month = 0; month < 12; month++) {
      const interest = balance * monthlyRate;
      const principal = monthlyPayment - interest;
      
      yearlyPrincipal += principal;
      yearlyInterest += interest;
      
      balance -= principal;
      if (balance < 0) balance = 0;
    }
    
    result.push({
      principal: yearlyPrincipal,
      interest: yearlyInterest
    });
  }
  
  return result;
};

// Cache for amortization tables to avoid recalculating
const amortCache = new Map<string, { principal: number; interest: number }[]>();

/**
 * Get cached amortization table or generate a new one
 */
const getCachedAmortTable = (
  loanAmount: number,
  rate: number,
  termYears: number
): { principal: number; interest: number }[] => {
  const key = `${loanAmount}-${rate}-${termYears}`;
  if (!amortCache.has(key)) {
    amortCache.set(key, amortTable(loanAmount, rate, termYears));
  }
  return amortCache.get(key)!;
};

// ===================================================================
// Scenario helper functions
// ===================================================================

/**
 * Return the year-by-year growth rate for a property's price,
 * considering all applicable scenarios
 */
function priceGrowthForYear(
  year: number,
  scenarios: GlobalSettings['scenarios'] | undefined,
  normalGrowth: number
): number {
  if (!scenarios) return normalGrowth;
  
  // Check all property crash scenarios (can have multiple with different instance IDs)
  for (const [key, scenario] of Object.entries(scenarios)) {
    // Only process property price crash scenarios (they all start with 'propertyPriceCrash')
    if (!key.startsWith('propertyPriceCrash')) continue;
    
    const { startYear, duration, drop } = scenario;
    if (drop === undefined) continue; // Skip if drop is not defined
    
    const endFlatYear = startYear + duration - 1;

    // If this is the drop year for any crash scenario, return the drop percentage
    if (year === startYear) return -(drop / 100); // e.g. –0.25
    
    // If we're in the flat period after any crash, return 0
    if (year > startYear && year <= endFlatYear) return 0;
  }
  
  // Check for stagflation scenarios
  for (const [key, scenario] of Object.entries(scenarios)) {
    // Only process stagflation scenarios
    if (!key.startsWith('stagflation')) continue;
    
    const { startYear, duration } = scenario;
    const endYear = startYear + duration - 1;

    // During stagflation period, price growth is 0%
    if (year >= startYear && year <= endYear) return 0;
  }
  
  // If no scenarios affected this year, use normal growth
  return normalGrowth;
}

/**
 * Return the year-by-year growth rate for rent,
 * considering all applicable scenarios
 */
function rentGrowthForYear(
  year: number,
  scenarios: GlobalSettings['scenarios'] | undefined,
  normalGrowth: number
): number {
  if (!scenarios) return normalGrowth;
  
  // Check for rent shock scenarios
  for (const [key, scenario] of Object.entries(scenarios)) {
    // Only process rent shock scenarios
    if (!key.startsWith('rentShock')) continue;
    
    const { startYear, duration, drop } = scenario;
    if (drop === undefined) continue; // Skip if drop is not defined
    
    const endYear = startYear + duration - 1;

    // During rent shock period, apply negative growth
    if (year === startYear) return -(drop / 100);
    if (year > startYear && year <= endYear) return 0;
  }
  
  // Check for stagflation scenarios
  for (const [key, scenario] of Object.entries(scenarios)) {
    // Only process stagflation scenarios
    if (!key.startsWith('stagflation')) continue;
    
    const { startYear, duration, rentGrowth } = scenario;
    const effectiveRentGrowth = rentGrowth !== undefined ? rentGrowth : 0.5;
    const endYear = startYear + duration - 1;

    // During stagflation period, rent growth is reduced (default 0.5%)
    if (year >= startYear && year <= endYear) return effectiveRentGrowth / 100;
  }
  
  // If no scenarios affected this year, use normal growth
  return normalGrowth;
}

/**
 * Calculate gross yield adjustment factor based on scenarios
 */
function grossYieldAdjustmentFactor(
  year: number,
  scenarios: GlobalSettings['scenarios'] | undefined
): number {
  if (!scenarios) return 1.0; // No adjustment
  
  // Check for rent shock scenarios
  for (const [key, scenario] of Object.entries(scenarios)) {
    // Only process rent shock scenarios
    if (!key.startsWith('rentShock')) continue;
    
    const { startYear, duration, occupancyDrop } = scenario;
    if (occupancyDrop === undefined) continue; // Skip if occupancyDrop is not defined
    
    const endYear = startYear + duration - 1;

    // During rent shock period, reduce gross yield by occupancy drop
    if (year >= startYear && year <= endYear) return 1.0 - (occupancyDrop / 100);
  }
  
  return 1.0; // No adjustment if no scenarios apply
}

/**
 * Calculate effective interest rate for a given year
 */
function loanRateForYear(
  year: number,
  baseRate: number,                    // decimal, e.g. 0.04
  scenarios: GlobalSettings['scenarios'] | undefined
): number {
  if (!scenarios) return baseRate;
  
  // Check for rate spike scenarios
  for (const [key, scenario] of Object.entries(scenarios)) {
    // Only process rate spike scenarios
    if (!key.startsWith('rateSpike')) continue;
    
    const { startYear, duration, bumpBps } = scenario;
    if (bumpBps === undefined) continue; // Skip if bumpBps is not defined
    
    const spikeEnd = startYear + duration - 1;

    // During rate spike period, increase the interest rate
    if (year >= startYear && year <= spikeEnd) {
      return baseRate + bumpBps / 10_000;  // 300 → +0.03
    }
  }
  
  return baseRate;
}

/**
 * Calculate effective opexFactor (as decimal) for a given year
 */
function opexRateForYear(
  year: number,
  baseOpexPct: number,                 // decimal, e.g. 0.12
  scenarios: GlobalSettings['scenarios'] | undefined
): number {
  if (!scenarios) return baseOpexPct;
  
  // Check for opex inflation scenarios
  for (const [key, scenario] of Object.entries(scenarios)) {
    // Only process opex inflation scenarios
    if (!key.startsWith('opexInflation')) continue;
    
    const { startYear, duration, bumpPctPts } = scenario;
    if (bumpPctPts === undefined) continue; // Skip if bumpPctPts is not defined
    
    const infEnd = startYear + duration - 1;

    // During opex inflation period, increase the opex factor
    if (year >= startYear && year <= infEnd) {
      return baseOpexPct + bumpPctPts / 100;  // 5 → +0.05
    }
  }
  
  return baseOpexPct;
}

/**
 * Calculate effective corporate tax rate for a given year
 */
function corpTaxRateForYear(
  year: number,
  baseTaxRate: number,                // decimal, e.g. 0.20
  scenarios?: GlobalSettings['scenarios']
): number {
  if (!scenarios) return baseTaxRate;
  
  // Check for tax hike scenarios
  for (const [key, scenario] of Object.entries(scenarios)) {
    // Only process tax hike scenarios
    if (!key.startsWith('taxHike')) continue;
    
    const { startYear, duration, newRate } = scenario;
    if (newRate === undefined) continue; // Skip if newRate is not defined
    
    const endYear = startYear + duration - 1;

    // During tax hike period, use the increased tax rate
    if (year >= startYear && year <= endYear) {
      return newRate / 100; // Convert percentage to decimal
    }
  }
  
  return baseTaxRate;
}

/**
 * Calculate AIMI multiplier for a given year (wealth tax)
 */
function aimiMultiplierForYear(
  year: number,
  scenarios?: GlobalSettings['scenarios']
): number {
  if (!scenarios) return 1.0; // Default multiplier
  
  // Check for tax hike scenarios that affect AIMI
  for (const [key, scenario] of Object.entries(scenarios)) {
    // Only process tax hike scenarios
    if (!key.startsWith('taxHike')) continue;
    
    const { startYear, duration, aimiMultiplier } = scenario;
    if (aimiMultiplier === undefined) continue; // Skip if aimiMultiplier is not defined
    
    const endYear = startYear + duration - 1;

    // During tax hike period, multiply AIMI by the specified factor
    if (year >= startYear && year <= endYear) {
      return aimiMultiplier;
    }
  }
  
  return 1.0; // Default multiplier if no scenario applies
}

/**
 * Calculate effective dividend withholding tax rate for a given year
 */
function dividendWHTForYear(
  year: number,
  baseWHTRate: number,               // decimal, e.g. 0.28
  scenarios?: GlobalSettings['scenarios']
): number {
  if (!scenarios) return baseWHTRate;
  
  // Check for dividend tax scenarios
  for (const [key, scenario] of Object.entries(scenarios)) {
    // Only process dividend tax scenarios
    if (!key.startsWith('dividendTax')) continue;
    
    const { startYear, duration, newRate } = scenario;
    if (newRate === undefined) continue; // Skip if newRate is not defined
    
    const endYear = startYear + duration - 1;

    // During dividend tax hike period, use the increased rate
    if (year >= startYear && year <= endYear) {
      return newRate / 100; // Convert percentage to decimal
    }
  }
  
  return baseWHTRate;
}

// ===================================================================
// Purchase & Property Functions
// ===================================================================

/**
 * Create purchase with pre-calculated amortization schedule
 * FIX #4: Pre-calculate amortization tables for each purchase
 */
function createPurchase(
  year: number,
  price: number,
  ltv: number,
  loanRate: number,
  termYears: number
): Purchase & { amortSchedule: { principal: number; interest: number }[] } {
  const loanAmount = price * ltv;
  
  return {
    year,
    price,
    ltv,
    loanAmount,
    loanRate,
    termYears,
    amortSchedule: getCachedAmortTable(loanAmount, loanRate, termYears)
  };
}

/**
 * Calculate property value at given year with scenario consideration
 */
function calculatePropertyValue(
  basePrice: number, 
  purchaseYear: number, 
  currentYear: number, 
  normalGrowth: number,
  scenarios?: GlobalSettings['scenarios']
): number {
  let price = basePrice;
  
  for (let y = purchaseYear + 1; y <= currentYear; y++) {
    const g = priceGrowthForYear(y, scenarios, normalGrowth);
    price *= 1 + g;
  }
  
  return price;
}

/**
 * Calculate rent for a property at given year with scenario consideration
 */
function calculateRent(
  basePrice: number,
  purchaseYear: number,
  currentYear: number,
  grossYieldBase: number,
  rentGrowthBase: number,
  scenarios?: GlobalSettings['scenarios']
): number {
  // Calculate initial rent 
  const initialRent = basePrice * grossYieldBase;
  
  let currentRent = initialRent;
  
  // Calculate rent growth year by year to account for scenarios
  for (let year = purchaseYear + 1; year <= currentYear; year++) {
    // Get the growth rate for this year considering all scenarios
    const yearlyRentGrowthRate = rentGrowthForYear(year, scenarios, rentGrowthBase);
    
    // Apply the growth rate for this year
    currentRent *= (1 + yearlyRentGrowthRate);
    
    // Apply occupancy adjustment for this year
    const adjustment = grossYieldAdjustmentFactor(year, scenarios);
    if (adjustment < 1.0) {
      currentRent *= adjustment;
    }
  }
  
  return currentRent;
}

/**
 * Calculate monthly debt service for a given year
 */
function calculateMonthlyDebtService(
  purchases: Array<Purchase & { amortSchedule: { principal: number; interest: number }[] }>,
  year: number
): number {
  // Sum up the monthly debt service for all active loans
  let monthlyDebtService = 0;
  
  purchases.forEach(p => {
    if (year >= p.year) {
      const age = year - p.year;
      if (age < p.termYears) { // Only if the loan is still active
        // Get annual payments and divide by 12 to get monthly average
        const annualPrincipal = p.amortSchedule[age].principal;
        const annualInterest = p.amortSchedule[age].interest;
        monthlyDebtService += (annualPrincipal + annualInterest) / 12;
      }
    }
  });
  
  return monthlyDebtService;
}

// ===================================================================
// Main Model Function
// ===================================================================

/**
 * Run the financial model with given settings
 */
export const runModel = (settings: GlobalSettings): ModelResult => {
  // Convert all percentage values to decimals
  // FIX #5 & #6: Always convert ALL percentages to decimals before calculations
  const priceGrowthDecimal = settings.priceGrowth.value / 100;
  const grossYieldDecimal = settings.grossYield.value / 100;
  const rentGrowthDecimal = settings.rentGrowth.value / 100;
  const opexFactorDecimal = settings.opexFactor.value / 100;
  const corpTaxRateDecimal = settings.corpTaxRate / 100;
  
  // For payoutRatio and related values, check if they are already in decimal form
  const payoutRatioDecimal = settings.payoutRatio <= 1 ? settings.payoutRatio : settings.payoutRatio / 100;
  const dividendWHTDecimal = settings.dividendWHT <= 1 ? settings.dividendWHT : settings.dividendWHT / 100;
  
  const ltvDecimal = settings.ltv / 100;
  const loanRateDecimal = settings.loanRate.value / 100;

  // 1) build purchase schedule with pre-calculated amortization tables
  // FIX #5: Ensure amortization tables are cached with each purchase
  const purchases = settings.purchaseYears.map(yr => {
    // Check for property-specific settings
    const propertyConfig = settings.propertySettings?.[yr] || {};
    
    // Determine the actual purchase year (may be overridden in propertySettings)
    const purchaseYear = propertyConfig.purchaseYear !== undefined ? propertyConfig.purchaseYear : yr;
    
    // Use property-specific values if available, otherwise fallback to global settings
    const unitPrice = propertyConfig.price !== undefined ? propertyConfig.price : settings.unitPrice;
    const ltv = propertyConfig.ltv !== undefined ? propertyConfig.ltv / 100 : ltvDecimal;
    const loanRate = propertyConfig.loanRate !== undefined ? propertyConfig.loanRate / 100 : loanRateDecimal;
    const termYears = propertyConfig.termYears !== undefined ? propertyConfig.termYears : settings.termYears;
    
    // Calculate price with growth if no override price is specified
    const price = unitPrice * Math.pow(1 + priceGrowthDecimal, purchaseYear);
    
    return createPurchase(
      purchaseYear, // Use potentially overridden purchase year
      price,
      ltv,
      loanRate,
      termYears
    );
  });

  // 2) timeline arrays - extend them to cover forecast period
  const modelYears = settings.retirementYear;
  const totalYears = modelYears + settings.forecastPeriod;
  const debt: number[] = Array(totalYears + 1).fill(0);
  const value: number[] = Array(totalYears + 1).fill(0);
  const rent: number[] = Array(totalYears + 1).fill(0);
  const cashflow: number[] = Array(totalYears + 1).fill(0);
  const equity: number[] = Array(totalYears + 1).fill(0);
  const dividends: number[] = Array(totalYears + 1).fill(0);
  const ltv: number[] = Array(totalYears + 1).fill(0);
  const cashReserve: number[] = Array(totalYears + 1).fill(0);
  
  // New arrays for additional features
  const buildingDepreciation: number[] = Array(totalYears + 1).fill(0);
  const AIMI: number[] = Array(totalYears + 1).fill(0);
  const IMI: number[] = Array(totalYears + 1).fill(0);

  // 3) loop year by year ------------------------------------
  let currentCashReserve = settings.seedEquity;

  for (let y = 0; y <= totalYears; y++) {
    // equity injections (Y1..Y5) - only during investment period
    if (y > 0 && y <= settings.injectionYears && y <= modelYears) {
      currentCashReserve += settings.annualInjection;
    }

    // each purchase event - only during investment period
    if (y <= modelYears) {
      purchases.filter(p => p.year === y).forEach(p => {
        const purchaseFees = p.price * 0.07; // 7% acquisition costs
        const equityNeeded = p.price * (1 - p.ltv) + purchaseFees;
        currentCashReserve -= equityNeeded;
        debt[y] += p.loanAmount;
      });
    }

    // roll forward previous loan balances
    if (y > 0) {
      debt[y] += debt[y - 1]; // start with last year's balance
    }
    
    // Get effective loan rate for the current year using the helper function
    const effectiveLoanRate = loanRateForYear(y, loanRateDecimal, settings.scenarios);
    
    // Process amortization for all active loans
    let totalInterestYr = 0;
    let totalPrincipalYr = 0;
    
    purchases.forEach(p => {
      if (y >= p.year) {
        const age = y - p.year;
        if (age < p.termYears) { // Only apply if the loan is still active
          // Use pre-calculated amortization schedule
          const principalYr = p.amortSchedule[age].principal;
          
          // If effective rate differs from original rate due to shock, recalculate interest
          let interestYr = p.amortSchedule[age].interest;
          
          if (effectiveLoanRate !== p.loanRate) {
            // Calculate remaining loan balance at start of year
            const remainingBalance = age > 0 
              ? p.loanAmount - p.amortSchedule.slice(0, age).reduce((sum, payment) => sum + payment.principal, 0)
              : p.loanAmount;
              
            // Recalculate interest using the effective rate instead
            interestYr = remainingBalance * effectiveLoanRate;
          }
          
          totalPrincipalYr += principalYr;
          totalInterestYr += interestYr;
          
          debt[y] -= principalYr; // paydown debt
        }
      }
    });
    
    // Calculate property values with scenario consideration
    value[y] = purchases
      .filter(p => y >= p.year)
      .reduce((sum, p) => 
        sum + calculatePropertyValue(
          p.price, 
          p.year, 
          y, 
          priceGrowthDecimal,
          settings.scenarios
        ), 0);

    // Calculate building depreciation (on 80% of property value at 2% per year)
    const buildingValue = value[y] * 0.8; // 80% of property value is building
    buildingDepreciation[y] = buildingValue * 0.02; // 2% annual depreciation

    // Calculate IMI (property tax) and AIMI (wealth tax)
    // Assume that the VPT (tax value) is 80% of market value
    const vpt = value[y] * 0.8;
    IMI[y] = vpt * 0.003; // Regular property tax (0.3%)
    
    // Get AIMI multiplier for the current year (default 1.0, doubled for tax hike scenario)
    const aimiMultiplier = aimiMultiplierForYear(y, settings.scenarios);
    AIMI[y] = vpt * 0.004 * aimiMultiplier; // Additional property tax with multiplier

    // Calculate rent with all scenario considerations
    rent[y] = purchases
      .filter(p => y >= p.year)
      .reduce((sum, p) => 
        sum + calculateRent(
          p.price, 
          p.year, 
          y, 
          grossYieldDecimal, 
          rentGrowthDecimal,
          settings.scenarios
        ), 0);

    // Get effective opex rate for the current year using the helper function
    const effectiveOpexRate = opexRateForYear(y, opexFactorDecimal, settings.scenarios);

    // Operating expenses (includes IMI but not AIMI) with effective opex rate
    const opex = (rent[y] * effectiveOpexRate) + IMI[y];
    
    // Get effective corporate tax rate for the current year
    const effectiveTaxRate = corpTaxRateForYear(y, corpTaxRateDecimal, settings.scenarios);
    
    // Calculate profit before tax for tax purposes
    // Principal payments are not tax-deductible expenses
    // But depreciation, interest, opex, and AIMI are tax-deductible
    const profitBT = rent[y] - opex - totalInterestYr - buildingDepreciation[y] - AIMI[y];
    const tax = Math.max(profitBT, 0) * effectiveTaxRate;
    
    // Calculate cash flow - now separate from tax calculation
    // All cash expenses are included: opex, interest, principal, taxes, AIMI
    const cashFlowForYear = rent[y] - opex - totalInterestYr - totalPrincipalYr - tax - AIMI[y];
    cashflow[y] = cashFlowForYear;
    
    // Extra principal pre-pay (only during investment period and if we have the cash for it)
    // Note: Large prepayments in years when dividends are expected will reduce distributable cash
    const extraPrepay = (y <= modelYears) ? (settings.extraPrepaySchedule[y] ?? 0) : 0;
    if (extraPrepay > 0 && currentCashReserve >= extraPrepay) {
      debt[y] -= extraPrepay;
      cashflow[y] -= extraPrepay;
      currentCashReserve -= extraPrepay;
    }

    // Calculate minimum buffer based on settings 
    // Use the bufferMonths setting if provided, otherwise default to 6
    const bufferMonths = settings.bufferMonths || 6;
    const monthlyDebtService = calculateMonthlyDebtService(purchases, y);
    const requiredBuffer = (monthlyDebtService * bufferMonths) + IMI[y]; // Buffer covers configured months of debt service + annual IMI
    
    // Get the payout ratio for this year (use year-specific if available, otherwise default)
    const yearPayoutRatio = settings.payoutSchedule?.[y] !== undefined 
      ? (settings.payoutSchedule[y] <= 1 ? settings.payoutSchedule[y] : settings.payoutSchedule[y] / 100)
      : payoutRatioDecimal;
    
    // Calculate potential dividend using the year-specific payout ratio
    // Only pay dividends if we're at or past the startPayoutsYear
    const grossDiv = (y >= settings.startPayoutsYear) 
      ? Math.max(cashflow[y], 0) * yearPayoutRatio
      : 0;
    
    // Calculate how much cash would be available after dividend payout
    const potentialRemainingCash = currentCashReserve + cashflow[y] - grossDiv;
    
    // Get the effective dividend WHT rate for this year
    const effectiveDividendWHTRate = dividendWHTForYear(y, dividendWHTDecimal, settings.scenarios);
    
    if (grossDiv > 0 && currentCashReserve + cashflow[y] >= grossDiv) {
      if (potentialRemainingCash >= requiredBuffer) {
        // If we can pay full dividend and maintain buffer, do so
        dividends[y] = grossDiv * (1 - effectiveDividendWHTRate);
        currentCashReserve += cashflow[y] - grossDiv; // remainder stays in SPV
      } else {
        // If full dividend would reduce buffer below minimum, calculate partial dividend
        // that maintains the required buffer
        const availableForDividend = Math.max(0, (currentCashReserve + cashflow[y]) - requiredBuffer);
        const partialGrossDiv = Math.min(grossDiv, availableForDividend);
        
        dividends[y] = partialGrossDiv * (1 - effectiveDividendWHTRate);
        currentCashReserve += cashflow[y] - partialGrossDiv; // remainder stays in SPV
      }
    } else {
      // Not enough cash for any dividends
      dividends[y] = 0;
      currentCashReserve += cashflow[y]; // Keep all cash flow in reserve
    }

    // Update final arrays for this year
    equity[y] = value[y] - debt[y];
    ltv[y] = value[y] > 0 ? (debt[y] / value[y] * 100) : 0; // Calculate LTV as percentage
    cashReserve[y] = currentCashReserve;
  }

  // Validate that cash reserve is never negative after initial model run
  // Instead of throwing an error, flag the issue in the result
  const isUnderfunded = Math.min(...cashReserve) < 0;
  
  // Warn about high LTV ratios
  const highLtv = Math.max(...ltv) > 80;
  if (highLtv) {
    console.warn('LTV breaches 80% stress cap.');
  }

  return {
    years: totalYears,
    debt,
    value,
    rent,
    cashflow,
    equity,
    dividends,
    ltv,
    cashReserve,
    buildingDepreciation,
    IMI,
    AIMI,
    warnings: {
      isUnderfunded,
      highLtv
    }
  };
};

/**
 * Default model settings based on requirements
 */
export const getDefaultSettings = (): GlobalSettings => ({
  seedEquity: 320000,
  annualInjection: 100000,
  injectionYears: 5,
  unitPrice: 600000,
  priceGrowth: { value: 3, min: 2, max: 4 }, // Percentage values
  grossYield: { value: 5, min: 4, max: 6 },
  rentGrowth: { value: 2, min: 1, max: 3 },
  opexFactor: { value: 12, min: 10, max: 15 },
  corpTaxRate: 20,
  payoutRatio: 80, // Will be converted to 0.8 in the model
  payoutSchedule: {},
  startPayoutsYear: 0, // Start taking dividends from year 0 (immediately)
  forecastPeriod: 10, // Forecast 10 years beyond retirement
  dividendWHT: 28, // Will be converted to 0.28 in the model
  extraPrepaySchedule: {
    11: 20000,
    12: 20000,
    13: 20000,
    14: 20000,
    15: 20000
  },
  retirementYear: 20,
  purchaseYears: [0, 2, 4],
  ltv: 65,
  loanRate: { value: 4, min: 3.5, max: 4.5 },
  termYears: 30,
  showAfterTax: true,
  bufferMonths: 6, // Default to 6 months of debt service as buffer
  propertySettings: {},
  scenarios: undefined
}); 