'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ModelResult } from '@/types';

type WarningMessagesProps = {
  results: ModelResult;
};

export default function WarningMessages({ results }: WarningMessagesProps) {
  // Use the warnings property if available, otherwise fallback to previous logic
  const hasCashReserveWarning = results.warnings?.isUnderfunded || results.cashReserve.some(reserve => reserve < 0);
  
  const hasLiquidityWarning = !hasCashReserveWarning && 
    results.cashReserve.some((reserve, idx) => {
      if (idx < results.years) {
        // Calculate approximate 3 months of mortgage payments
        const monthlyDebtService = idx > 0 
          ? (results.debt[idx-1] - results.debt[idx]) / 4 // 3 months = 1/4 year
          : 0;
        return reserve > 0 && reserve < monthlyDebtService;
      }
      return false;
    });
    
  const hasLtvWarning = results.warnings?.highLtv || results.ltv.some(ltv => ltv > 80);
  
  if (!hasCashReserveWarning && !hasLiquidityWarning && !hasLtvWarning) {
    return null;
  }
  
  return (
    <>
      {hasCashReserveWarning && (
        <Card className="bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-900/50">
          <CardContent className="p-4">
            <p className="text-red-800 dark:text-red-200">
              Warning: Cash reserve goes negative in some years. The inputs are infeasible.
            </p>
            <p className="text-red-800 dark:text-red-200 mt-1 text-sm">
              Under-funded schedule — raise capital or LTV to maintain positive cash reserves.
            </p>
          </CardContent>
        </Card>
      )}
      
      {hasLiquidityWarning && (
        <Card className="bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/50">
          <CardContent className="p-4">
            <p className="text-yellow-800 dark:text-yellow-200">
              Warning: Cash reserve falls below 3 months of mortgage payments in some years, which presents liquidity risk.
            </p>
          </CardContent>
        </Card>
      )}
      
      {hasLtvWarning && (
        <Card className="bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/50">
          <CardContent className="p-4">
            <p className="text-yellow-800 dark:text-yellow-200">
              Warning: LTV exceeds 80% in some years, which presents increased risk.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
} 