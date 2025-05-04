'use client';

import { ModelResult } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GlobalSettings } from '@/types';

type TaxAnalysisTableProps = {
  results: ModelResult;
  settings: GlobalSettings;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}

export default function TaxAnalysisTable({ results, settings }: TaxAnalysisTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Year</TableHead>
            <TableHead>Property Value</TableHead>
            <TableHead>Building Depreciation</TableHead>
            <TableHead>Property Tax (IMI)</TableHead>
            <TableHead>Wealth Tax (AIMI)</TableHead>
            <TableHead>Corporate Tax</TableHead>
            <TableHead>Tax Saving from Depreciation</TableHead>
            <TableHead>Effective Tax Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: results.years + 1 }, (_, i) => {
            // Calculate corporate income tax and tax savings
            const rent = results.rent[i];
            const opex = (rent * 0.12) + results.IMI[i];
            const interest = i > 0 ? results.debt[i-1] * (settings.loanRate.value / 100) : 0;
            
            // Calculate profit before tax without depreciation
            const profitBeforeTaxNoDep = rent - opex - interest - results.AIMI[i];
            const taxNoDep = Math.max(0, profitBeforeTaxNoDep) * (settings.corpTaxRate / 100);
            
            // Calculate profit before tax with depreciation
            const profitBeforeTaxWithDep = profitBeforeTaxNoDep - results.buildingDepreciation[i];
            const taxWithDep = Math.max(0, profitBeforeTaxWithDep) * (settings.corpTaxRate / 100);
            
            // Calculate tax savings
            const taxSavings = taxNoDep - taxWithDep;
            
            // Calculate effective tax rate (total taxes / rent)
            const totalTaxes = results.IMI[i] + results.AIMI[i] + taxWithDep;
            const effectiveTaxRate = rent > 0 ? (totalTaxes / rent) * 100 : 0;
            
            return (
              <TableRow key={i}>
                <TableCell>Y{i}</TableCell>
                <TableCell>{formatCurrency(results.value[i])}</TableCell>
                <TableCell>{formatCurrency(results.buildingDepreciation[i])}</TableCell>
                <TableCell>{formatCurrency(results.IMI[i])}</TableCell>
                <TableCell>{formatCurrency(results.AIMI[i])}</TableCell>
                <TableCell>{formatCurrency(taxWithDep)}</TableCell>
                <TableCell>{formatCurrency(taxSavings)}</TableCell>
                <TableCell>{effectiveTaxRate.toFixed(1)}%</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
} 