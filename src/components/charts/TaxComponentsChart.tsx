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
  IMI: number;
  AIMI: number;
  taxes: number;
  buildingDepreciation: number;
};

type TaxComponentsChartProps = {
  data: ChartData[];
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}

export default function TaxComponentsChart({ data }: TaxComponentsChartProps) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Tax Components & Depreciation Shield</h3>
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
              dataKey="IMI" 
              stackId="taxes"
              fill="#82ca9d" 
              name="Property Tax (IMI)"
            />
            <Bar 
              dataKey="AIMI" 
              stackId="taxes"
              fill="#ff8c00" 
              name="Wealth Tax (AIMI)"
            />
            <Bar 
              dataKey="taxes" 
              stackId="taxes"
              fill="#8884d8" 
              name="Corporate Income Tax"
            />
            <Bar 
              dataKey="buildingDepreciation" 
              fill="#00bfff"
              fillOpacity={0.3} 
              name="Depreciation Shield"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 