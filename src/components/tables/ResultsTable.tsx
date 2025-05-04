'use client';

import { ScenarioRange } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

type ResultsTableProps = {
  results: ScenarioRange;
  onDownloadCsv: () => void;
  onExportJson: () => void;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}

export default function ResultsTable({ results, onDownloadCsv, onExportJson }: ResultsTableProps) {
  const baseResults = results.base;
  const minResults = results.min;
  const maxResults = results.max;
  const hasRanges = minResults !== undefined && maxResults !== undefined;
  
  return (
    <div className="overflow-x-auto">
      <div className="text-right mb-2">
        <Button variant="outline" onClick={onDownloadCsv} className="mr-2">
          Download CSV
        </Button>
        <Button variant="outline" onClick={onExportJson}>
          Export JSON
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Year</TableHead>
            {hasRanges && <TableHead>Min Value</TableHead>}
            <TableHead>Portfolio Value</TableHead>
            {hasRanges && <TableHead>Max Value</TableHead>}
            <TableHead>Debt</TableHead>
            <TableHead>LTV (%)</TableHead>
            <TableHead>Rent</TableHead>
            <TableHead>Cash Flow</TableHead>
            <TableHead>Cash Reserve</TableHead>
            <TableHead>Equity</TableHead>
            <TableHead>Dividends</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: baseResults.years + 1 }, (_, i) => (
            <TableRow key={i}>
              <TableCell>Y{i}</TableCell>
              {hasRanges && <TableCell>{formatCurrency(minResults!.value[i])}</TableCell>}
              <TableCell>{formatCurrency(baseResults.value[i])}</TableCell>
              {hasRanges && <TableCell>{formatCurrency(maxResults!.value[i])}</TableCell>}
              <TableCell>{formatCurrency(baseResults.debt[i])}</TableCell>
              <TableCell>{baseResults.ltv[i].toFixed(1)}%</TableCell>
              <TableCell>{formatCurrency(baseResults.rent[i])}</TableCell>
              <TableCell>{formatCurrency(baseResults.cashflow[i])}</TableCell>
              <TableCell>{formatCurrency(baseResults.cashReserve[i])}</TableCell>
              <TableCell>{formatCurrency(baseResults.equity[i])}</TableCell>
              <TableCell>{formatCurrency(baseResults.dividends[i])}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 