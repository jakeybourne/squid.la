'use client';

import { formatNumber } from '@/lib/utils';
import {
  ResponsiveContainer,
  Line,
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
  cashflow: number;
  dividends: number;
  minCashflow?: number;
  maxCashflow?: number;
  minDividends?: number;
  maxDividends?: number;
  compareCashflow?: number;
  compareDividends?: number;
};

type CashFlowChartProps = {
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

export default function CashFlowChart({ data, compareScenarioName }: CashFlowChartProps) {
  const hasRanges = data.some(d => 
    d.minCashflow !== undefined || 
    d.maxCashflow !== undefined ||
    d.minDividends !== undefined ||
    d.maxDividends !== undefined
  );
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Cash Flow vs Dividends</h3>
      {hasRanges && (
        <div className="mb-2 text-sm text-muted-foreground">
          <span className="inline-block w-3 h-3 mr-1 bg-blue-200 border border-blue-400"></span> Min-Max ranges for cash flow and dividends based on growth scenarios
        </div>
      )}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(value) => `€${formatNumber(value)}`} />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Year ${label.replace('Y', '')}`}
            />
            <Legend formatter={(value) => {
              if (value === 'Cash Flow Range') return 'Cash Flow (Min-Max Range)';
              if (value === 'Dividend Range') return 'Dividends (Min-Max Range)';
              if (value === 'Cash Flow') return 'Expected Cash Flow';
              if (value === 'Dividends') return 'Expected Dividends';
              return value;
            }} />
            
            {/* Cash Flow Range */}
            {hasRanges && (
              <Area
                type="monotone"
                dataKey="minCashflow"
                stackId="cashflow-range"
                fill="#4286f4"
                fillOpacity={0.2}
                stroke="#4286f4"
                strokeWidth={1}
                name="Cash Flow Range"
                dot={false}
              />
            )}
            
            {hasRanges && (
              <Area
                type="monotone"
                dataKey="maxCashflow"
                stackId="cashflow-range"
                fill="#4286f4"
                fillOpacity={0.2}
                stroke="#4286f4"
                strokeWidth={1}
                name="Cash Flow Range"
                dot={false}
                legendType="none"
              />
            )}
            
            {/* Dividend Range */}
            {hasRanges && (
              <Area
                type="monotone"
                dataKey="minDividends"
                stackId="dividend-range"
                fill="#10b981"
                fillOpacity={0.2}
                stroke="#10b981"
                strokeWidth={1}
                name="Dividend Range"
                dot={false}
              />
            )}
            
            {hasRanges && (
              <Area
                type="monotone"
                dataKey="maxDividends"
                stackId="dividend-range"
                fill="#10b981"
                fillOpacity={0.2}
                stroke="#10b981"
                strokeWidth={1}
                name="Dividend Range"
                dot={false}
                legendType="none"
              />
            )}
            
            {/* Base values */}
            <Line 
              type="monotone" 
              dataKey="cashflow" 
              stroke="#1e3a8a" 
              name="Cash Flow"
              strokeWidth={2}
              dot={true}
            />
            <Line 
              type="monotone" 
              dataKey="dividends" 
              stroke="#047857" 
              name="Dividends"
              strokeWidth={2}
              dot={true}
            />
            
            {/* Compare scenario values */}
            {compareScenarioName && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="compareCashflow" 
                  stroke="#7c3aed" 
                  strokeDasharray="5 5"
                  name={`${compareScenarioName} Cash Flow`}
                />
                <Line 
                  type="monotone" 
                  dataKey="compareDividends" 
                  stroke="#059669" 
                  strokeDasharray="5 5"
                  name={`${compareScenarioName} Dividends`}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 