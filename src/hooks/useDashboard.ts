/**
 * hooks/useDashboard.ts
 * Hook untuk data ringkasan dashboard utama
 *
 * Cara pakai di komponen:
 *   const { summary, cashflow, isLoading } = useDashboard();
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { USE_MOCK_DATA } from '../lib/config';
import { MOCK } from '../lib/mockData';
import { getErrorMessage } from '../lib/utils';
import {
    dashboardService,
    type BudgetVsActualItem,
    type CashflowPoint,
    type ConstructionProgressItem,
    type DashboardSummary,
    type SalesDistributionItem,
} from '../services/dashboard.service';

export function useDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cashflow, setCashflow] = useState<CashflowPoint[]>([]);
  const [constructionProgress, setConstructionProgress] = useState<ConstructionProgressItem[]>([]);
  const [salesDistribution, setSalesDistribution] = useState<SalesDistributionItem[]>([]);
  const [budgetVsActual, setBudgetVsActual] = useState<BudgetVsActualItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    // ── Mode Mock ────────────────────────────────────────────
    if (USE_MOCK_DATA) {
      setSummary({
        total_unit: MOCK.dashboardKpi.totalUnit,
        unit_terjual: MOCK.dashboardKpi.unitTerjual,
        unit_progres: MOCK.dashboardKpi.unitProgres,
        pendapatan: MOCK.dashboardKpi.pendapatan,
      } as DashboardSummary);
      setCashflow(MOCK.cashflowData as CashflowPoint[]);
      setConstructionProgress(MOCK.constructionProgress as ConstructionProgressItem[]);
      setSalesDistribution(MOCK.salesStatus as SalesDistributionItem[]);
      setBudgetVsActual(MOCK.budgetVsActualData as BudgetVsActualItem[]);
      return;
    }
    setIsLoading(true);
    try {
      // Fetch semua data dashboard sekaligus agar efisien
      const [sum, cf, cp, sd, bva] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getCashflow(6),
        dashboardService.getConstructionProgress(),
        dashboardService.getSalesDistribution(),
        dashboardService.getBudgetVsActual(),
      ]);
      setSummary(sum);
      setCashflow(cf);
      setConstructionProgress(cp);
      setSalesDistribution(sd);
      setBudgetVsActual(bva);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return {
    summary,
    cashflow,
    constructionProgress,
    salesDistribution,
    budgetVsActual,
    isLoading,
    refetch: fetchAll,
  };
}
