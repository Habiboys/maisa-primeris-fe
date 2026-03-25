import { ChevronDown, Search } from 'lucide-react';
import React from 'react';

export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  activeSort: SortState;
  onSort: (sortKey: string) => void;
  align?: 'left' | 'right' | 'center';
}

export function SortableHeader({
  label,
  sortKey,
  activeSort,
  onSort,
  align = 'left',
}: SortableHeaderProps) {
  const isActive = activeSort.key === sortKey;
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <th className={`px-6 py-4 ${alignClass}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-primary transition-colors"
      >
        {label}
        <ChevronDown
          size={14}
          className={`transition-transform ${isActive ? 'opacity-100' : 'opacity-40'} ${isActive && activeSort.direction === 'asc' ? 'rotate-180' : ''}`}
        />
      </button>
    </th>
  );
}

interface FinanceTableToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
  addLabel: string;
  onAdd: () => void;
  extraFilters?: React.ReactNode;
}

export function FinanceTableToolbar({
  searchQuery,
  onSearchChange,
  perPage,
  onPerPageChange,
  addLabel,
  onAdd,
  extraFilters,
}: FinanceTableToolbarProps) {
  return (
    <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Cari data..."
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-full focus:ring-2 focus:ring-primary outline-none"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
        >
          <option value={5}>5 / halaman</option>
          <option value={10}>10 / halaman</option>
          <option value={20}>20 / halaman</option>
          <option value={50}>50 / halaman</option>
        </select>

        {extraFilters}
      </div>

      <button
        onClick={onAdd}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/10 whitespace-nowrap"
      >
        {addLabel}
      </button>
    </div>
  );
}

interface FinanceTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function FinanceTablePagination({ currentPage, totalPages, totalItems, onPageChange }: FinanceTablePaginationProps) {
  return (
    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
      <p className="text-gray-500">Total {totalItems} data</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
        >
          Sebelumnya
        </button>
        <span className="text-gray-600">{currentPage} / {Math.max(totalPages, 1)}</span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}
