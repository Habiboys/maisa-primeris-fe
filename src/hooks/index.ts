/**
 * hooks/index.ts
 * Barrel export — impor semua hook dari satu tempat
 *
 * Cara pakai:
 *   import { useUsers, useTransactions, useDashboard } from '../hooks';
 */

// re-export useAuth dari Context (paling sering dipakai)
export { useAuth } from '../context/AuthContext';

export * from './useAttendance';
export * from './useCompanies';
export * from './useConfirmDialog';
export * from './useDashboard';
export * from './useFinance';
export * from './useHousing';
export * from './useLegal';
export * from './useLogbookMeeting';
export * from './useMarketing';
export * from './useMasterData';
export * from './useMedia';
export * from './useProjects';
export * from './useQualityControl';
export * from './useSOP';
export * from './useUsers';

