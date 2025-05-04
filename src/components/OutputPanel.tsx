'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ModelResult, ScenarioRange } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import components
import KpiCards from './KpiCards';
import WarningMessages from './WarningMessages';
import PortfolioValueChart from './charts/PortfolioValueChart';
import CashFlowChart from './charts/CashFlowChart';
import CashReserveChart from './charts/CashReserveChart';
import IncomeChart from './charts/IncomeChart';
import TaxComponentsChart from './charts/TaxComponentsChart';
import ResultsTable from './tables/ResultsTable';
import TaxAnalysisTable from './tax/TaxAnalysisTable';
import TaxShieldChart from './tax/TaxShieldChart';
import SankeyChart from './charts/SankeyChart';

// Define the structure for our result ranges
interface ResultRange {
  id: string;
  label: string;
  results: ModelResult;
}

// Define our updated results structure
interface ExtendedResults extends ScenarioRange {
  ranges: ResultRange[];
  warnings?: {
    isUnderfunded: boolean;
    highLtv: boolean;
  };
}

// Define our version of chart data that will be compatible with all charts
interface ChartDataItem {
  year: string;
  value: number;
  debt: number;
  equity: number;
  cashflow: number;
  dividends: number;
  cashReserve: number;
  buildingDepreciation: number;
  IMI: number;
  AIMI: number;
  taxes: number;
  taxWithoutDepreciation: number;
  taxWithDepreciation: number;
  taxSavings: number;
  // Any other properties needed by other charts
  minValue?: number;
  maxValue?: number;
  minDebt?: number;
  maxDebt?: number;
  minCashflow?: number;
  maxCashflow?: number;
  minDividends?: number;
  maxDividends?: number;
  compareValue?: number;
  compareDebt?: number;
  compareCashflow?: number;
  compareDividends?: number;
}

export default function OutputPanel() {
  const { results, scenarios = [], compareScenario } = useAppStore();
  // Define useState hooks before any conditional returns
  const [selectedRangeId, setSelectedRangeId] = useState<string>('default');
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  
  // Process results when they change
  useEffect(() => {
    if (!results) return;
    
    // Create our extended results structure if it doesn't exist
    const extendedResults = 'ranges' in results ? 
      results as ExtendedResults : 
      {
        ...results,
        ranges: [
          { id: 'default', label: 'Default', results: results.base }
        ],
        warnings: results.base.warnings
      } as ExtendedResults;
    
    // Update selectedRangeId if needed
    if (selectedRangeId === 'default' && extendedResults.ranges[0]?.id) {
      setSelectedRangeId(extendedResults.ranges[0].id);
    }
    
    // Find the selected range
    const selectedRange = extendedResults.ranges.find(
      (range: ResultRange) => range.id === selectedRangeId
    ) || extendedResults.ranges[0];
    
    if (selectedRange) {
      setChartData(prepareChartData(selectedRange.results));
    }
  }, [results, selectedRangeId]);
  
  if (!results) {
    return (
      <div className="md:p-6 p-2">
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Run calculation to see results</p>
        </div>
      </div>
    );
  }
  
  // Create our extended results structure if it doesn't exist
  const extendedResults = 'ranges' in results ? 
    results as ExtendedResults : 
    {
      ...results,
      ranges: [
        { id: 'default', label: 'Default', results: results.base }
      ],
      warnings: results.base.warnings
    } as ExtendedResults;

  // Find the selected range
  const selectedRange = extendedResults.ranges.find(
    (range: ResultRange) => range.id === selectedRangeId
  ) || extendedResults.ranges[0];
  
  // Create a formatted selection of all scenarios plus the current one
  const allScenarios = (() => {
    // Add ID field to scenarios if needed
    const scenariosWithId = scenarios.map(s => ({
      ...s,
      id: s.name
    }));
    
    const currentResult = { 
      id: 'current', 
      name: 'Current Model', 
      description: 'Current model in editor',
      date: new Date(),
      results: extendedResults
    };
    
    // If the current model is saved as a scenario, don't duplicate it
    const currentSaved = scenariosWithId.some(s => s.id === compareScenario);
    
    if (currentSaved) {
      return [...scenariosWithId];
    } else {
      return [currentResult, ...scenariosWithId];
    }
  })();

  // Convert selectedRange.results to KpiData format for KpiCards component
  const kpiData = selectedRange ? {
    equityAtRetirement: selectedRange.results.equity[selectedRange.results.years],
    ltvAtRetirement: selectedRange.results.ltv[selectedRange.results.years],
    annualAfterTaxIncome: selectedRange.results.dividends[selectedRange.results.years],
    cumulativeTaxes: selectedRange.results.IMI.reduce((sum, val) => sum + val, 0) + 
                     selectedRange.results.AIMI.reduce((sum, val) => sum + val, 0),
    depreciationShield: selectedRange.results.buildingDepreciation.reduce((sum, val) => sum + val, 0) * 
                        (useAppStore.getState().settings.corpTaxRate / 100),
    totalPropertiesValue: selectedRange.results.value[selectedRange.results.years],
    averageGrossYield: selectedRange.results.rent[selectedRange.results.years] / 
                      selectedRange.results.value[selectedRange.results.years] * 100,
  } : {
    equityAtRetirement: 0,
    ltvAtRetirement: 0,
    annualAfterTaxIncome: 0,
    cumulativeTaxes: 0,
    depreciationShield: 0,
  };

  // Prepare chart data for all charts
  function prepareChartData(results: ModelResult): ChartDataItem[] {
    return Array.from({ length: results.years + 1 }, (_, i) => {
      // Calculate the corporate tax component
      const settings = useAppStore.getState().settings;
      const rent = results.rent[i];
      const opex = (rent * 0.12) + results.IMI[i];
      const interest = i > 0 ? results.debt[i-1] * (settings.loanRate.value / 100) : 0;
      
      // Calculate profit before tax without depreciation
      const profitBeforeTaxNoDep = rent - opex - interest - results.AIMI[i];
      const taxNoDep = Math.max(0, profitBeforeTaxNoDep) * (settings.corpTaxRate / 100);
      
      // Calculate profit before tax with depreciation
      const profitBeforeTaxWithDep = profitBeforeTaxNoDep - results.buildingDepreciation[i];
      const taxWithDep = Math.max(0, profitBeforeTaxWithDep) * (settings.corpTaxRate / 100);
      
      return {
        year: `Y${i}`,
        value: results.value[i],
        debt: results.debt[i],
        equity: results.equity[i],
        cashflow: results.cashflow[i],
        dividends: results.dividends[i],
        cashReserve: results.cashReserve[i],
        buildingDepreciation: results.buildingDepreciation[i],
        IMI: results.IMI[i],
        AIMI: results.AIMI[i],
        taxes: taxWithDep,
        taxWithoutDepreciation: taxNoDep,
        taxWithDepreciation: taxWithDep,
        taxSavings: taxNoDep - taxWithDep
      };
    });
  }

  // Component for the mobile results selector
  const MobileTabsSelector = () => (
    <Select 
      value={selectedTab} 
      onValueChange={setSelectedTab}
    >
      <SelectTrigger className="w-full mb-4">
        <SelectValue placeholder="Select view" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="overview">Overview</SelectItem>
        <SelectItem value="flows">Cash Flows</SelectItem>
        <SelectItem value="income">Income</SelectItem>
        <SelectItem value="tax">Tax Analysis</SelectItem>
        <SelectItem value="sankey">Money Flow</SelectItem>
        <SelectItem value="table">Data Table</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">
      {/* For desktop: Card with header and tabs */}
      <div className="hidden md:block">
        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between">
              <CardTitle>Model Results</CardTitle>
              
              {scenarios.length > 0 && (
                <select 
                  className="h-8 rounded-md border border-input bg-background px-3 text-xs"
                  value={compareScenario || 'current'}
                  onChange={(e) => {
                    const selectValue = e.target.value;
                    if (selectValue === 'current') {
                      useAppStore.getState().compareWithScenario(null);
                    } else {
                      useAppStore.getState().compareWithScenario(selectValue);
                    }
                  }}
                >
                  {allScenarios.map(scenario => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-1 sm:p-6">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <div className="justify-start mb-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <TabsList className="justify-start w-full md:w-auto">
                  <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
                  <TabsTrigger value="flows" className="text-xs md:text-sm">Cash Flows</TabsTrigger>
                  <TabsTrigger value="income" className="text-xs md:text-sm">Income</TabsTrigger>
                  <TabsTrigger value="tax" className="text-xs md:text-sm">Tax Analysis</TabsTrigger>
                  <TabsTrigger value="sankey" className="text-xs md:text-sm">Money Flow</TabsTrigger>
                  <TabsTrigger value="table" className="text-xs md:text-sm">Data Table</TabsTrigger>
                </TabsList>
              </div>
              
              {renderTabContents()}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* For mobile: No card, full-width content, dropdown instead of tabs */}
      <div className="md:hidden px-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Model Results</h3>
          
          {scenarios.length > 0 && (
            <select 
              className="h-8 rounded-md border border-input bg-background px-3 text-xs"
              value={compareScenario || 'current'}
              onChange={(e) => {
                const selectValue = e.target.value;
                if (selectValue === 'current') {
                  useAppStore.getState().compareWithScenario(null);
                } else {
                  useAppStore.getState().compareWithScenario(selectValue);
                }
              }}
            >
              {allScenarios.map(scenario => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
          )}
        </div>
        
        <MobileTabsSelector />
          
        {extendedResults.ranges.length > 1 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">
              Showing results for period: 
            </p>
            <div className="flex flex-wrap gap-2">
              {extendedResults.ranges.map((range: ResultRange) => (
                <Button
                  key={range.id}
                  variant={range.id === selectedRangeId ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRangeId(range.id)}
                  className="text-xs"
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        )}
          
        <div className="space-y-4">
          <Tabs value={selectedTab} className="w-full">
            {renderTabContents()}
          </Tabs>
        </div>
      </div>
    </div>
  );

  // Helper function to render tab contents to avoid code duplication
  function renderTabContents() {
    return (
      <>
        {selectedRange && selectedRange.results.warnings && (
          <div className="md:mb-4 mb-2">
            <div className="text-xs opacity-80 md:opacity-100 md:text-sm">
              <WarningMessages 
                results={selectedRange.results}
              />
            </div>
          </div>
        )}
        
        {extendedResults.ranges.length > 1 && (
          <div className="mb-4 hidden md:block">
            <p className="text-xs text-muted-foreground mb-2">
              Showing results for period: 
            </p>
            <div className="flex flex-wrap gap-2">
              {extendedResults.ranges.map((range: ResultRange) => (
                <Button
                  key={range.id}
                  variant={range.id === selectedRangeId ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRangeId(range.id)}
                  className="text-xs"
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Tab Content */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <KpiCards data={kpiData} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PortfolioValueChart 
              data={chartData} 
            />
            <CashFlowChart 
              data={chartData}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CashReserveChart 
              data={chartData}
            />
            <IncomeChart 
              data={chartData}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="flows" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4">
            <CashFlowChart 
              data={chartData}
            />
            <CashReserveChart 
              data={chartData}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="income" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4">
            <IncomeChart 
              data={chartData}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="tax" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4">
            <TaxComponentsChart 
              data={chartData}
            />
            <TaxShieldChart
              data={chartData}
            />
            {selectedRange && (
              <TaxAnalysisTable 
                results={selectedRange.results}
                settings={useAppStore.getState().settings}
              />
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="sankey" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="h-[500px]">
              {selectedRange && (
                <SankeyChart
                  results={selectedRange.results}
                  settings={useAppStore.getState().settings}
                />
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="table" className="space-y-4 mt-4">
          {results && (
            <ResultsTable 
              results={results}
              onDownloadCsv={() => {}}
              onExportJson={() => {}}
            />
          )}
        </TabsContent>
      </>
    );
  }
} 