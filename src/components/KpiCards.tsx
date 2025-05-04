'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, BanknotesIcon, HomeIcon, BuildingOffice2Icon, CalculatorIcon, CurrencyEuroIcon, ScaleIcon } from '@heroicons/react/24/outline';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type KpiData = {
  equityAtRetirement: number;
  ltvAtRetirement: number;
  annualAfterTaxIncome: number;
  cumulativeTaxes: number;
  depreciationShield: number;
  // Additional KPIs
  totalPropertiesValue?: number;
  averageGrossYield?: number;
  totalOriginalInvestment?: number;
  equityMultiple?: number;
  cashOnCashReturn?: number;
};

type KpiCardsProps = {
  data: KpiData;
};

function formatCurrency(value: number): string {
  // Format as abbreviation for large numbers
  if (Math.abs(value) >= 1_000_000) {
    return '€' + (value / 1_000_000).toFixed(2) + 'M';
  } else if (Math.abs(value) >= 1_000) {
    return '€' + (value / 1_000).toFixed(1) + 'k';
  } else {
    return '€' + value.toFixed(0);
  }
}

function formatPercentage(value: number): string {
  return value.toFixed(1) + '%';
}

type KpiCardProps = {
  title: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  tooltip?: string;
};

function KpiCard({ title, value, description, icon, trend, tooltip }: KpiCardProps) {
  const content = (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="rounded-full p-2 bg-muted">
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center">
            {trend === 'up' && <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />}
            {trend === 'down' && <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />}
            <span className={`text-xs ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
              {trend === 'up' ? 'Positive' : trend === 'down' ? 'Negative' : 'Neutral'} trend
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

export default function KpiCards({ data }: KpiCardsProps) {
  // Calculate default values for new KPIs if not provided
  const totalPropertiesValue = data.totalPropertiesValue || data.equityAtRetirement + (data.equityAtRetirement * data.ltvAtRetirement / (100 - data.ltvAtRetirement));
  const totalOriginalInvestment = data.totalOriginalInvestment || totalPropertiesValue * 0.4; // Estimated based on LTV
  const equityMultiple = data.equityMultiple || (data.equityAtRetirement / totalOriginalInvestment);
  const cashOnCashReturn = data.cashOnCashReturn || (data.annualAfterTaxIncome / totalOriginalInvestment * 100);
  const averageGrossYield = data.averageGrossYield || 5.0; // Default if not provided

  return (
    <div className="space-y-4">
      {/* First row - financial position */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Portfolio Value" 
          value={formatCurrency(totalPropertiesValue)}
          icon={<BuildingOffice2Icon className="h-5 w-5" />}
          tooltip="Total market value of all properties in the portfolio"
        />
        
        <KpiCard 
          title="Net Equity" 
          value={formatCurrency(data.equityAtRetirement)}
          icon={<HomeIcon className="h-5 w-5" />}
          trend="up"
          tooltip="Total equity in all properties at retirement (value minus debt)"
        />
        
        <KpiCard 
          title="Loan-to-Value" 
          value={formatPercentage(data.ltvAtRetirement)}
          icon={<BanknotesIcon className="h-5 w-5" />}
          trend={data.ltvAtRetirement < 50 ? "up" : data.ltvAtRetirement > 70 ? "down" : "neutral"}
          tooltip="Percentage of property value financed with debt at retirement"
        />
        
        <KpiCard 
          title="Equity Multiple" 
          value={equityMultiple.toFixed(1) + "x"}
          description="Return on invested capital"
          icon={<CalculatorIcon className="h-5 w-5" />}
          trend="up"
          tooltip="How many times your original investment has grown (equity ÷ original investment)"
        />
      </div>

      {/* Second row - income and returns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Annual Passive Income" 
          value={formatCurrency(data.annualAfterTaxIncome)}
          description="After-tax at retirement"
          icon={<CurrencyEuroIcon className="h-5 w-5" />}
          trend="up"
          tooltip="Annual after-tax income from dividends at retirement"
        />
        
        <KpiCard 
          title="Cash-on-Cash Return" 
          value={formatPercentage(cashOnCashReturn)}
          description="Annual yield on original investment"
          icon={<ArrowTrendingUpIcon className="h-5 w-5" />}
          trend={cashOnCashReturn > 5 ? "up" : "neutral"}
          tooltip="Annual cash flow as a percentage of original investment"
        />
        
        <KpiCard 
          title="Tax Benefits" 
          value={formatCurrency(data.depreciationShield)}
          description="Lifetime tax savings from depreciation"
          icon={<ScaleIcon className="h-5 w-5" />}
          trend="up"
          tooltip="Total tax savings from building depreciation over the investment period"
        />
        
        <KpiCard 
          title="Average Gross Yield" 
          value={formatPercentage(averageGrossYield)}
          description="Gross rental income ÷ property value"
          icon={<BuildingOffice2Icon className="h-5 w-5" />}
          trend={averageGrossYield > 5 ? "up" : averageGrossYield < 4 ? "down" : "neutral"}
          tooltip="Annual rental income as a percentage of property value"
        />
      </div>
    </div>
  );
} 