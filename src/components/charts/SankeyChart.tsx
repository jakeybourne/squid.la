'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GlobalSettings, ModelResult } from '@/types';
import { ResponsiveSankey } from '@nivo/sankey';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SankeyChartProps = {
  results: ModelResult;
  settings: GlobalSettings;
};

// Custom node type with color property
type SankeyNode = {
  id: string;
  label: string;
  value: number;
  color: string;
};

// Custom link type
type SankeyLink = {
  source: string;
  target: string;
  value: number;
};

// Data type for the sankey chart
type SankeyData = {
  nodes: SankeyNode[];
  links: SankeyLink[];
};

// Type for nodes passed to color/tooltip handlers
type NivoNodeData = {
  id: string | number;
  [key: string]: unknown;
};

const nodeColors = {
  income: '#22c55e', // Green
  expenses: '#ef4444', // Red
  taxes: '#9333ea', // Purple
  principal: '#0ea5e9', // Blue
  netCashflow: '#f59e0b', // Amber
  dividend: '#f97316', // Orange
  reserve: '#3b82f6', // Light blue
  equity: '#8b5cf6', // Purple
  purchase: '#ec4899'  // Pink
};

// Dark mode-specific colors with higher saturation
const darkModeNodeColors = {
  income: '#2ded6d', // Brighter Green
  expenses: '#ff5a5a', // Brighter Red
  taxes: '#a855f7', // Brighter Purple
  principal: '#38bdf8', // Brighter Blue
  netCashflow: '#fbbf24', // Brighter Amber
  dividend: '#fb923c', // Brighter Orange
  reserve: '#60a5fa', // Brighter Blue
  equity: '#a78bfa', // Brighter Purple
  purchase: '#f472b6'  // Brighter Pink
};

export default function SankeyChart({ results, settings }: SankeyChartProps) {
  // Load previously selected year from localStorage or default to year 0
  const [selectedYear, setSelectedYear] = useState(() => {
    // Try to get saved year from localStorage
    const savedYear = localStorage.getItem('sankeySelectedYear');
    if (savedYear !== null) {
      const parsedYear = parseInt(savedYear, 10);
      // Make sure saved year is valid for current results
      if (!isNaN(parsedYear) && parsedYear >= 0 && parsedYear <= results.years) {
        return parsedYear;
      }
    }
    // Default to year 0 if no saved value or invalid value
    return 0;
  });
  
  const isDark = document.documentElement.classList.contains('dark');
  
  // Use dark mode colors if in dark mode
  const colors = isDark ? darkModeNodeColors : nodeColors;

  // Save selected year to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sankeySelectedYear', selectedYear.toString());
  }, [selectedYear]);

  const sankeySeries = useMemo<SankeyData>(() => {
    // Get data for the selected year
    const rent = results.rent[selectedYear];
    const opex = (rent * settings.opexFactor.value / 100);
    const IMI = results.IMI[selectedYear];
    const AIMI = results.AIMI[selectedYear];
    
    // Get opening reserve (previous year's ending balance)
    let openingReserve = 0;
    if (selectedYear > 0) {
      openingReserve = results.cashReserve[selectedYear - 1];
    } else if (selectedYear === 0) {
      // For year 0, the opening reserve is the seed equity
      openingReserve = settings.seedEquity;
    }
    
    // Interest and principal payments
    let interest = 0;
    let principal = 0;
    if (selectedYear > 0) {
      // Estimate interest based on debt from previous year and loan rate
      interest = results.debt[selectedYear - 1] * (settings.loanRate.value / 100);
      
      // Principal is the debt reduction not including extra prepayments
      const totalDebtReduction = results.debt[selectedYear - 1] - results.debt[selectedYear];
      
      // Extra principal prepayment for this year
      const extraPrepay = settings.extraPrepaySchedule[selectedYear] ?? 0;
      
      // Regular principal payment is total reduction minus extra prepayment
      principal = Math.max(0, totalDebtReduction - extraPrepay);
    }
    
    // Calculate corporate tax
    const rent_after_opex = rent - opex - IMI;
    const profit_before_tax = rent_after_opex - interest - results.buildingDepreciation[selectedYear] - AIMI;
    const corporate_tax = Math.max(0, profit_before_tax) * (settings.corpTaxRate / 100);
    
    // Cash flow after regular expenses and debt service
    const cashflow_before_extra = rent - opex - IMI - interest - principal - corporate_tax - AIMI;
    
    // Extra principal prepayment
    const extraPrepay = settings.extraPrepaySchedule[selectedYear] ?? 0;
    
    // Cash flow after extra prepayment
    const cash_after_prepay = cashflow_before_extra - extraPrepay;
    
    // Check if we have negative cashflow
    const isNegativeCashflow = cash_after_prepay < 0;
    const cashDeficit = isNegativeCashflow ? Math.abs(cash_after_prepay) : 0;
    const positiveAvailableCash = isNegativeCashflow ? 0 : cash_after_prepay;
    
    // Get payout ratio for this year
    const yearPayoutRatio = settings.payoutSchedule?.[selectedYear] !== undefined 
      ? (settings.payoutSchedule[selectedYear] <= 1 
        ? settings.payoutSchedule[selectedYear] 
        : settings.payoutSchedule[selectedYear] / 100)
      : (settings.payoutRatio <= 1 
        ? settings.payoutRatio 
        : settings.payoutRatio / 100);
    
    // Calculate minimum buffer (based on settings)
    const bufferMonths = settings.bufferMonths || 6;
    // Simplified buffer calculation for chart visualization
    const estimatedMonthlyDebtService = Math.max(0, rent * 0.4 / 12); // Rough estimate of monthly debt service
    const buffer_requirement = (estimatedMonthlyDebtService * bufferMonths) + IMI; 
    
    // Gross dividend - calculate based on actual available cash while maintaining buffer
    const max_potential_dividend = Math.max(0, positiveAvailableCash) * yearPayoutRatio;
    const available_for_dividend = Math.max(0, (openingReserve + positiveAvailableCash - cashDeficit) - buffer_requirement);
    const gross_dividend = Math.min(max_potential_dividend, available_for_dividend);
    
    // Dividend tax (withholding tax)
    const dividend_tax_rate = settings.dividendWHT <= 1 ? settings.dividendWHT : settings.dividendWHT / 100;
    const dividend_tax = gross_dividend * dividend_tax_rate;
    
    // Net dividend (after tax)
    const net_dividend = gross_dividend - dividend_tax;
    
    // Amount retained in cash reserve
    const to_reserve = positiveAvailableCash - gross_dividend;
    
    // Ending reserve for this year (can be positive or negative)
    const endingReserve = results.cashReserve[selectedYear];
    
    // For visualization purposes, split ending reserve into positive and negative components
    const positiveEndingReserve = Math.max(0, endingReserve);
    const negativeEndingReserve = Math.abs(Math.min(0, endingReserve));
    
    // Similarly, split opening reserve for visualization
    const positiveOpeningReserve = Math.max(0, openingReserve);
    const negativeOpeningReserve = Math.abs(Math.min(0, openingReserve));
    
    // Capital flows - Equity Injections
    let seedEquity = 0;
    let annualInjection = 0;

    // Only show seed equity in year 0 (and only if not already counted in openingReserve)
    if (selectedYear === 0) {
      // We already count seedEquity as part of openingReserve for year 0
      seedEquity = 0;
    }
    
    // Annual equity injections in years 1-5 (or whatever injectionYears is set to)
    if (selectedYear > 0 && selectedYear <= settings.injectionYears) {
      annualInjection = settings.annualInjection;
    }

    // Property purchases in the current year
    const purchases = settings.purchaseYears.filter(yr => {
      // Get property-specific settings if available
      const propertyConfig = settings.propertySettings?.[yr] || {};
      
      // Check the actual purchase year (may be overridden)
      const actualPurchaseYear = propertyConfig.purchaseYear !== undefined ? propertyConfig.purchaseYear : yr;
      
      // Only include if the actual purchase year matches the selected year
      return actualPurchaseYear === selectedYear;
    });
    
    let totalPurchaseValue = 0;
    let totalEquityNeeded = 0;
    let totalLoanAmount = 0;
    let totalPurchaseFees = 0;
    
    if (purchases.length > 0) {
      purchases.forEach(yr => {
        // Get property-specific settings if available
        const propertyConfig = settings.propertySettings?.[yr] || {};
        
        // Use property-specific values if available, otherwise use global settings
        const unitPrice = propertyConfig.price !== undefined 
          ? propertyConfig.price 
          : settings.unitPrice * Math.pow(1 + (settings.priceGrowth.value / 100), selectedYear);
        
        const ltv = propertyConfig.ltv !== undefined 
          ? propertyConfig.ltv / 100 
          : settings.ltv / 100;
        
        // 7% acquisition costs
        const purchaseFees = unitPrice * 0.07;
        const equityNeeded = unitPrice * (1 - ltv) + purchaseFees;
        const loanAmount = unitPrice * ltv;
        
        totalPurchaseValue += unitPrice;
        totalEquityNeeded += equityNeeded;
        totalLoanAmount += loanAmount;
        totalPurchaseFees += purchaseFees;
      });
    }

    // Prepare data for Sankey diagram with non-zero values only
    const MINIMUM_VALUE = 0.01;
    
    // Define all nodes
    const allNodes: SankeyNode[] = [
      // Equity injections
      { id: 'seedequity', label: 'Seed Equity', value: seedEquity, color: colors.equity },
      { id: 'annualinjection', label: 'Annual Equity Injection', value: annualInjection, color: colors.equity },
      
      // Opening reserve - now split into positive and negative components
      { id: 'openingreserve', label: 'Opening Cash Reserve', value: positiveOpeningReserve, color: colors.reserve },
      { id: 'openingdeficit', label: 'Opening Cash Deficit', value: negativeOpeningReserve, color: colors.expenses },
      
      // Property purchases
      { id: 'propertyvalue', label: 'Property Purchase', value: totalPurchaseValue, color: colors.purchase },
      { id: 'purchasefees', label: 'Purchase Fees', value: totalPurchaseFees, color: colors.expenses },
      { id: 'equityinvested', label: 'Equity Investment', value: totalEquityNeeded, color: colors.equity },
      { id: 'newdebt', label: 'New Mortgage Debt', value: totalLoanAmount, color: colors.principal },
      
      // Rental income & expenses
      { id: 'income', label: 'Rental Income', value: rent, color: colors.income },
      { id: 'opex', label: 'Operating Expenses', value: opex, color: colors.expenses },
      { id: 'imi', label: 'Property Taxes (IMI)', value: IMI, color: colors.taxes },
      { id: 'aimi', label: 'Wealth Tax (AIMI)', value: AIMI, color: colors.taxes },
      { id: 'interest', label: 'Interest', value: interest, color: colors.expenses },
      { id: 'principal', label: 'Principal Payments', value: principal, color: colors.principal },
      { id: 'corptax', label: 'Corporate Tax', value: corporate_tax, color: colors.taxes },
      { id: 'extraprepay', label: 'Extra Principal Prepay', value: extraPrepay, color: colors.principal },
      
      // Cash flow nodes - now handling negative cashflow
      { id: 'availablecash', label: 'Available Cash', value: positiveAvailableCash, color: colors.netCashflow },
      { id: 'cashdeficit', label: 'Cash Deficit', value: cashDeficit, color: colors.expenses },
      
      // Dividends
      { id: 'grossdiv', label: 'Dividends (Before Tax)', value: gross_dividend, color: colors.dividend },
      { id: 'divtax', label: 'Dividend Tax', value: dividend_tax, color: colors.taxes },
      { id: 'netdiv', label: 'Net Dividends', value: net_dividend, color: colors.dividend },
      
      // Ending reserve - now split into positive and negative components
      { id: 'endingreserve', label: 'Ending Cash Reserve', value: positiveEndingReserve, color: colors.reserve },
      { id: 'endingdeficit', label: 'Ending Cash Deficit', value: negativeEndingReserve, color: colors.expenses }
    ].filter(node => node.value > MINIMUM_VALUE);

    // Define all links
    const allLinks: SankeyLink[] = [
      // Seed and annual equity injections go to ending reserve
      ...(positiveEndingReserve > 0 ? [
        { source: 'seedequity', target: 'endingreserve', value: Math.min(seedEquity, positiveEndingReserve) },
        { source: 'annualinjection', target: 'endingreserve', value: Math.min(annualInjection, positiveEndingReserve) }
      ] : []),
      
      // If we have negative ending reserve, equity injections help offset it
      ...(negativeEndingReserve > 0 ? [
        { source: 'seedequity', target: 'endingdeficit', value: Math.min(seedEquity, negativeEndingReserve) },
        { source: 'annualinjection', target: 'endingdeficit', value: Math.min(annualInjection, negativeEndingReserve) }
      ] : []),
      
      // Opening reserve flows - only if positive
      ...(positiveOpeningReserve > 0 ? [
        // If we have property purchases, some of the opening reserve goes there
        ...(totalEquityNeeded > 0 ? [
          { source: 'openingreserve', target: 'equityinvested', value: Math.min(positiveOpeningReserve, totalEquityNeeded) }
        ] : []),
        
        // If we have cash deficit, some opening reserve covers that
        ...(cashDeficit > 0 ? [
          { 
            source: 'openingreserve', 
            target: 'cashdeficit', 
            value: Math.min(
              positiveOpeningReserve - Math.min(positiveOpeningReserve, totalEquityNeeded), 
              cashDeficit
            ) 
          }
        ] : []),
        
        // Any remaining positive opening reserve flows to ending reserve or helps offset ending deficit
        ...(positiveEndingReserve > 0 ? [
          { 
            source: 'openingreserve', 
            target: 'endingreserve', 
            value: Math.max(0, 
              positiveOpeningReserve 
              - Math.min(positiveOpeningReserve, totalEquityNeeded) 
              - (cashDeficit > 0 ? Math.min(positiveOpeningReserve - Math.min(positiveOpeningReserve, totalEquityNeeded), cashDeficit) : 0)
            )
          }
        ] : []),
        
        ...(negativeEndingReserve > 0 ? [
          { 
            source: 'openingreserve', 
            target: 'endingdeficit', 
            value: Math.min(
              positiveOpeningReserve 
              - Math.min(positiveOpeningReserve, totalEquityNeeded) 
              - (cashDeficit > 0 ? Math.min(positiveOpeningReserve - Math.min(positiveOpeningReserve, totalEquityNeeded), cashDeficit) : 0),
              negativeEndingReserve
            )
          }
        ] : [])
      ] : []),
      
      // Opening deficit requires funds to resolve it (from income or injections)
      ...(negativeOpeningReserve > 0 ? [
        // If we have positive available cash, some goes to resolving the opening deficit
        ...(positiveAvailableCash > 0 ? [
          { 
            source: 'availablecash', 
            target: 'openingdeficit', 
            value: Math.min(positiveAvailableCash, negativeOpeningReserve) 
          }
        ] : []),
        
        // If we still have negative ending reserve, show connection between opening and ending deficits
        ...(negativeEndingReserve > 0 ? [
          { 
            source: 'openingdeficit', 
            target: 'endingdeficit', 
            value: Math.min(negativeOpeningReserve, negativeEndingReserve) 
          }
        ] : [])
      ] : []),
      
      // Property purchase flows
      { source: 'equityinvested', target: 'propertyvalue', value: totalEquityNeeded - totalPurchaseFees },
      { source: 'equityinvested', target: 'purchasefees', value: totalPurchaseFees },
      { source: 'newdebt', target: 'propertyvalue', value: totalLoanAmount },
      
      // Rental income flows to operational expenses
      { source: 'income', target: 'opex', value: opex },
      { source: 'income', target: 'imi', value: IMI },
      { source: 'income', target: 'aimi', value: AIMI },
      { source: 'income', target: 'interest', value: interest },
      { source: 'income', target: 'principal', value: principal },
      { source: 'income', target: 'corptax', value: corporate_tax },
      { source: 'income', target: 'extraprepay', value: extraPrepay },
      
      // Positive cashflow goes to availablecash node
      ...(positiveAvailableCash > 0 ? [
        { source: 'income', target: 'availablecash', value: positiveAvailableCash }
      ] : []),
      
      // If cashflow is negative, create a flow from income to cash deficit
      ...(cash_after_prepay < 0 ? [
        { source: 'cashdeficit', target: 'endingdeficit', value: Math.min(cashDeficit, negativeEndingReserve) }
      ] : []),
      
      // From available cash, after potentially covering opening deficit (handled above)
      // Dividends are paid out
      { 
        source: 'availablecash', 
        target: 'grossdiv', 
        value: gross_dividend 
      },
      
      // Remaining available cash goes to positive ending reserve or helps offset deficit
      ...(positiveEndingReserve > 0 ? [
        { 
          source: 'availablecash', 
          target: 'endingreserve', 
          value: Math.min(
            to_reserve, 
            positiveEndingReserve
          ) 
        }
      ] : []),
      
      ...(negativeEndingReserve > 0 && to_reserve > 0 ? [
        { 
          source: 'availablecash', 
          target: 'endingdeficit', 
          value: Math.min(to_reserve, negativeEndingReserve) 
        }
      ] : []),
      
      // Dividend flows
      { source: 'grossdiv', target: 'divtax', value: dividend_tax },
      { source: 'grossdiv', target: 'netdiv', value: net_dividend }
    ].filter(link => link.value > MINIMUM_VALUE);

    // Filter links to ensure both source and target nodes exist
    const nodeIds = new Set(allNodes.map(node => node.id));
    const links = allLinks.filter(link => 
      nodeIds.has(link.source) && nodeIds.has(link.target)
    );

    return { nodes: allNodes, links };
  }, [selectedYear, results, settings, colors.dividend, colors.equity, colors.expenses, 
      colors.income, colors.netCashflow, colors.principal, colors.purchase, 
      colors.reserve, colors.taxes]);

  const incrementYear = () => {
    if (selectedYear < results.years) {
      setSelectedYear(selectedYear + 1);
    }
  };

  const decrementYear = () => {
    if (selectedYear > 0) {
      setSelectedYear(selectedYear - 1);
    }
  };

  // Handler for direct year selection
  const handleYearChange = (value: string) => {
    setSelectedYear(parseInt(value, 10));
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Helper function to safely get node data
  const getNodeData = (node: NivoNodeData) => {
    const data = {
      id: String(node.id),
      label: '',
      value: 0,
      color: '#888888'
    };
    
    // Add the custom fields from our data
    const originalNode = sankeySeries.nodes.find(n => n.id === data.id);
    if (originalNode) {
      data.label = originalNode.label;
      data.value = originalNode.value;
      data.color = originalNode.color;
    }
    return data;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Financial Flows</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={decrementYear} 
              disabled={selectedYear === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: results.years + 1 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    Year {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={incrementYear} 
              disabled={selectedYear === results.years}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sankeySeries.nodes.length > 0 && sankeySeries.links.length > 0 ? (
          <div className={`h-[600px] mt-4 p-4 rounded-lg`}>
            <ResponsiveSankey
              data={sankeySeries}
              margin={{ top: 10, right: 160, bottom: 10, left: 120 }}
              align="justify"
              colors={(node) => {
                const nodeData = getNodeData(node);
                return nodeData.color;
              }}
              theme={{
                text: {
                  fontSize: 12,
                  fill: isDark ? '#e2e8f0' : '#374151',
                  fontWeight: 500
                },
                tooltip: {
                  container: {
                    background: isDark ? '#1f2937' : '#ffffff',
                    color: isDark ? '#ffffff' : '#374151',
                    fontSize: 13,
                    borderRadius: 8,
                    boxShadow: isDark ? 
                      '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.24)' : 
                      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }
                }
              }}
              nodeOpacity={isDark ? 0.95 : 0.9}
              nodeHoverOpacity={1}
              nodeThickness={10}
              nodeSpacing={18}
              nodeBorderRadius={2}
              nodeBorderWidth={1}
              nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.5]] }}
              nodeInnerPadding={3}
              linkOpacity={isDark ? 0.25 : 0.2}
              linkHoverOpacity={0.6}
              linkContract={1}
              enableLinkGradient={true}
              linkBlendMode={isDark ? "lighten" : "multiply"}
              labelPosition="outside"
              labelOrientation="horizontal"
              labelPadding={18}
              labelTextColor={isDark ? '#ffffff' : { from: 'color', modifiers: [['darker', 1]] }}
              nodeTooltip={({ node }) => {
                const nodeData = getNodeData(node);
                return (
                  <div style={{ 
                    background: isDark ? 'rgba(31, 41, 55, 0.95)' : '#ffffff', 
                    padding: '12px 16px',
                    border: '1px solid',
                    borderColor: isDark ? '#4b5563' : '#e5e7eb',
                    borderRadius: '8px',
                    boxShadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.24)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    color: isDark ? '#ffffff' : '#374151',
                    fontSize: '13px'
                  }}>
                    <strong style={{ color: nodeData.color }}>{nodeData.label}</strong>: {formatValue(nodeData.value)}
                  </div>
                );
              }}
              linkTooltip={({ link }) => {
                const sourceNode = getNodeData(link.source);
                const targetNode = getNodeData(link.target);
                return (
                  <div style={{ 
                    background: isDark ? 'rgba(31, 41, 55, 0.95)' : '#ffffff', 
                    padding: '12px 16px',
                    border: '1px solid',
                    borderColor: isDark ? '#4b5563' : '#e5e7eb',
                    borderRadius: '8px',
                    boxShadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.24)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    color: isDark ? '#ffffff' : '#374151',
                    fontSize: '13px'
                  }}>
                    <span>
                      <strong style={{ color: sourceNode.color }}>{sourceNode.label}</strong>
                      <span> → </span>
                      <strong style={{ color: targetNode.color }}>{targetNode.label}</strong>
                    </span>
                    <div className="mt-1">{formatValue(link.value)}</div>
                  </div>
                );
              }}
            />
          </div>
        ) : (
          <div className="h-[100px] flex items-center justify-center">
            <p className="text-muted-foreground">No significant flows to display for this year</p>
          </div>
        )}
        <div className="text-center text-sm text-muted-foreground mt-4">
          Chart shows financial flows for Year {selectedYear}. Use the controls to navigate between years.
        </div>
      </CardContent>
    </Card>
  );
} 