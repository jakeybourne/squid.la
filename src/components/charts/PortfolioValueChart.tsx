'use client';

import { formatNumber } from '@/lib/utils';
import {
  ResponsiveContainer,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart
} from 'recharts';

type ChartData = {
  year: string;
  value: number;
  debt: number;
  minValue?: number;
  maxValue?: number;
  minDebt?: number;
  maxDebt?: number;
  compareValue?: number;
  compareDebt?: number;
};

type PortfolioValueChartProps = {
  data: ChartData[];
  compareScenarioName?: string;
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

export default function PortfolioValueChart({ data, compareScenarioName }: PortfolioValueChartProps) {
  const hasRanges = data.some(d => d.minValue !== undefined || d.maxValue !== undefined);
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Portfolio Value Based on Price Growth</h3>
      {hasRanges && (
        <div className="mb-2 text-sm text-muted-foreground">
          <span className="inline-block w-3 h-3 mr-1 bg-blue-200 border border-blue-400"></span> Min-Max portfolio value range based on price growth scenarios ({data[0]?.minValue !== undefined ? formatCurrency(data[0].minValue) : '€0'} to {data[0]?.maxValue !== undefined ? formatCurrency(data[0].maxValue) : '€0'} in Year 0)
        </div>
      )}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(value) => `€${formatNumber(value)}`} />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'minValue' || name.includes('Min')) return ['Min Value: ' + formatCurrency(value), 'Minimum'];
                if (name === 'maxValue' || name.includes('Max')) return ['Max Value: ' + formatCurrency(value), 'Maximum']; 
                return formatCurrency(value);
              }}
              labelFormatter={(label) => `Year ${label.replace('Y', '')}`}
            />
            <Legend formatter={(value) => {
              if (value === 'Range') return 'Portfolio Value (Min-Max Range)';
              if (value === 'Portfolio Value') return 'Expected Portfolio Value';
              if (value === 'Debt') return 'Expected Debt';
              return value;
            }} />
            
            {/* Min/Max Value Range */}
            {hasRanges && (
              <>
                <Area 
                  type="monotone"
                  dataKey="maxValue"
                  stroke="#4286f4"
                  strokeWidth={1}
                  fill="#4286f4"
                  fillOpacity={0.2}
                  stackId="a"
                  name="Range"
                  dot={false}
                />
                <Area 
                  type="monotone"
                  dataKey="minValue"
                  stroke="#4286f4"
                  strokeWidth={1}
                  stackId="a"
                  fill="transparent"
                  name="Range"
                  dot={false}
                  legendType="none"
                />
              </>
            )}
            
            {/* Base Value */}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#1e3a8a" 
              name="Portfolio Value"
              strokeWidth={2}
              dot={true}
            />
            
            {/* Debt */}
            <Line 
              type="monotone" 
              dataKey="debt" 
              stroke="#14532d" 
              name="Debt"
              strokeWidth={2}
              dot={true}
            />
            
            {/* Compare scenario if available */}
            {compareScenarioName && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="compareValue" 
                  stroke="#7c3aed" 
                  strokeDasharray="5 5"
                  name={`${compareScenarioName} Value`}
                />
                <Line 
                  type="monotone" 
                  dataKey="compareDebt" 
                  stroke="#059669" 
                  strokeDasharray="5 5"
                  name={`${compareScenarioName} Debt`}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 