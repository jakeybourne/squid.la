'use client';

import { formatNumber } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

type ChartData = {
  year: string;
  taxWithoutDepreciation: number;
  taxWithDepreciation: number;
  taxSavings: number;
};

type TaxShieldChartProps = {
  data: ChartData[];
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}

export default function TaxShieldChart({ data }: TaxShieldChartProps) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Tax Shield from Depreciation</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(value) => `€${formatNumber(value)}`} />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `Year ${label.replace('Y', '')}`}
            />
            <Legend />
            <Bar 
              dataKey="taxWithoutDepreciation" 
              fill="#ff8c00" 
              name="Tax Without Depreciation"
            />
            <Bar 
              dataKey="taxWithDepreciation" 
              fill="#82ca9d" 
              name="Tax With Depreciation"
            />
            <Bar 
              dataKey="taxSavings" 
              fill="#8884d8" 
              name="Tax Savings"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 