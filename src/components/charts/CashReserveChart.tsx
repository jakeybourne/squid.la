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
  cashReserve: number;
  minCashReserve?: number;
  maxCashReserve?: number;
  compareCashReserve?: number;
};

type CashReserveChartProps = {
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

export default function CashReserveChart({ data, compareScenarioName }: CashReserveChartProps) {
  const hasRanges = data.some(d => 
    d.minCashReserve !== undefined || 
    d.maxCashReserve !== undefined
  );
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Cash Reserve</h3>
      {hasRanges && (
        <div className="mb-2 text-sm text-muted-foreground">
          <span className="inline-block w-3 h-3 mr-1 bg-amber-200 border border-amber-400"></span> Min-Max ranges for cash reserve based on growth scenarios
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
              if (value === 'Cash Reserve Range') return 'Cash Reserve (Min-Max Range)';
              if (value === 'Cash Reserve') return 'Expected Cash Reserve';
              return value;
            }} />
            
            {/* Cash Reserve Range */}
            {hasRanges && (
              <Area
                type="monotone"
                dataKey="minCashReserve"
                stackId="cashreserve-range"
                fill="#f59e0b"
                fillOpacity={0.2}
                stroke="#f59e0b"
                strokeWidth={1}
                name="Cash Reserve Range"
                dot={false}
              />
            )}
            
            {hasRanges && (
              <Area
                type="monotone"
                dataKey="maxCashReserve"
                stackId="cashreserve-range"
                fill="#f59e0b"
                fillOpacity={0.2}
                stroke="#f59e0b"
                strokeWidth={1}
                name="Cash Reserve Range"
                dot={false}
                legendType="none"
              />
            )}
            
            {/* Base values */}
            <Line 
              type="monotone" 
              dataKey="cashReserve" 
              stroke="#d97706" 
              name="Cash Reserve"
              strokeWidth={2}
              dot={true}
            />
            
            {/* Compare scenario values */}
            {compareScenarioName && (
              <Line 
                type="monotone" 
                dataKey="compareCashReserve" 
                stroke="#a16207" 
                strokeDasharray="5 5"
                name={`${compareScenarioName} Cash Reserve`}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 