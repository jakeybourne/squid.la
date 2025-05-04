'use client';

import { formatNumber } from '@/lib/utils';
import {
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Area
} from 'recharts';

type ChartData = {
  year: string;
  dividends: number;
  minDividends?: number;
  maxDividends?: number;
  compareDividends?: number;
};

type IncomeChartProps = {
  data: ChartData[];
  compareScenarioName?: string;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}

export default function IncomeChart({ data, compareScenarioName }: IncomeChartProps) {
  const hasRanges = data.some(d => 
    d.minDividends !== undefined && d.maxDividends !== undefined
  );
  
  // Find retirement year to highlight post-retirement income
  const retirementYear = data.length - 11; // Assuming 10 year forecast period + the retirement year itself
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Annual After-Tax Income</h3>
      {hasRanges && (
        <div className="mb-2 text-sm text-muted-foreground">
          <span className="inline-block w-3 h-3 mr-1 bg-purple-200 border border-purple-400"></span> Min-Max income range based on different growth scenarios
        </div>
      )}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="year" 
              // Add custom label for retirement year
              label={{ 
                value: 'Retirement', 
                position: 'insideBottomRight', 
                offset: -5,
                fill: '#888888'
              }}
            />
            <YAxis tickFormatter={(value) => `€${formatNumber(value)}`} />
            <Tooltip 
              formatter={(value: number, name: string) => {
                // Show both annual and monthly income
                const monthlyValue = value / 12;
                const annualFormatted = formatCurrency(value);
                const monthlyFormatted = formatCurrency(monthlyValue);
                
                return [`${annualFormatted}/year (${monthlyFormatted}/month)`, name];
              }}
              labelFormatter={(label) => {
                const yearNum = parseInt(label.replace('Y', ''));
                if (yearNum > retirementYear) {
                  return `Year ${yearNum} (Retirement income)`;
                }
                return `Year ${label.replace('Y', '')}`;
              }}
            />
            <Legend formatter={(value) => {
              if (value === 'Income Range') return 'Income (Min-Max Range)';
              if (value === 'After-Tax Income') return 'Expected After-Tax Income';
              return value;
            }} />
            
            {/* Income Range */}
            {hasRanges && (
              <Area
                type="monotone"
                dataKey="minDividends"
                stackId="income-range"
                fill="#7c3aed"
                fillOpacity={0.2}
                stroke="#7c3aed"
                strokeWidth={1}
                name="Income Range"
                dot={false}
              />
            )}
            
            {hasRanges && (
              <Area
                type="monotone"
                dataKey="maxDividends"
                stackId="income-range"
                fill="#7c3aed"
                fillOpacity={0.2}
                stroke="#7c3aed"
                strokeWidth={1}
                name="Income Range"
                dot={false}
                legendType="none"
              />
            )}
            
            {/* Base values */}
            <Bar 
              dataKey="dividends" 
              fill="#5b21b6" 
              name="After-Tax Income"
            />
            
            {compareScenarioName && (
              <Bar 
                dataKey="compareDividends" 
                fill="#059669" 
                name={`${compareScenarioName} After-Tax Income`}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 