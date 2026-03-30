import { Building2, ChevronLeft, ChevronRight, Plus, RefreshCcw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useCompanies } from '../../hooks';

const PER_PAGE_OPTIONS = [5, 10, 20, 50];
const PLAN_OPTIONS = ['Semua Plan', 'basic', 'pro', 'enterprise'];
const STATUS_OPTIONS = ['Semua Status', 'active', 'trial', 'grace', 'inactive', 'suspended', 'cancelled'];
const BILLING_OPTIONS = ['Semua Billing', 'monthly', 'yearly'];

export function SaaSManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManageTenant = user?.role === 'Platform Owner';

  const { companies, isLoading, refetch } = useCompanies();

  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('Semua Plan');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [billingFilter, setBillingFilter] = useState('Semua Billing');
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.code ?? '').toLowerCase().includes(q);
      const matchesPlan = planFilter === 'Semua Plan' || (c.subscription_plan ?? '') === planFilter;
      const matchesStatus = statusFilter === 'Semua Status' || (c.subscription_status ?? '') === statusFilter;
      const matchesBilling = billingFilter === 'Semua Billing' || (c.billing_cycle ?? '') === billingFilter;
      return matchesSearch && matchesPlan && matchesStatus && matchesBilling;
    });
  }, [companies, searchQuery, planFilter, statusFilter, billingFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / perPage));
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredCompanies.slice(start, start + perPage);
  }, [filteredCompanies, currentPage, perPage]);

  const resetPage = () => setCurrentPage(1);

  if (!canManageTenant) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">SaaS Management</h2>
          <p className="text-sm text-gray-500">
            Kelola tenant perusahaan, status subscriber, dan branding aplikasi.
          </p>
        </div>
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          Anda tidak memiliki akses ke halaman ini.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">SaaS Management</h2>
          <p className="text-gray-500">
            Kelola tenant perusahaan. Klik Detail untuk mengedit info, tambah user, dan pengaturan branding.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
          <p className="text-sm text-primary font-medium">Total Tenant</p>
          <p className="text-2xl font-bold text-primary">{companies.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <p className="text-sm text-green-600 font-medium">Aktif</p>
          <p className="text-2xl font-bold text-green-900">
            {companies.filter((c) => c.subscription_status === 'active').length}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
          <p className="text-sm text-orange-600 font-medium">Trial / Lainnya</p>
          <p className="text-2xl font-bold text-orange-900">
            {companies.filter((c) => c.subscription_status !== 'active').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full flex-wrap">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari nama atau kode..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  resetPage();
                }}
              />
            </div>
            <select
              className="bg-white border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                resetPage();
              }}
            >
              {PLAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <select
              className="bg-white border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                resetPage();
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <select
              className="bg-white border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              value={billingFilter}
              onChange={(e) => {
                setBillingFilter(e.target.value);
                resetPage();
              }}
            >
              {BILLING_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <select
              className="bg-white border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} / halaman</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/saas/tenant/new')}
              className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              <Plus size={18} />
              Tambah Tenant
            </button>
            <button
              onClick={refetch}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCcw size={18} />
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Nama & Kode</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Billing</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Memuat data tenant...
                  </td>
                </tr>
              ) : paginatedCompanies.length > 0 ? (
                paginatedCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        <p className="text-sm text-gray-500">{c.code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{c.subscription_plan ?? '-'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {c.subscription_status ?? '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{c.billing_cycle ?? '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/saas/tenant/${c.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                    Tidak ada tenant yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <p className="text-gray-500">
            Menampilkan {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filteredCompanies.length)} dari {filteredCompanies.length} tenant
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              title="Sebelumnya"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-gray-600 min-w-[6rem] text-center">
              Halaman {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              title="Berikutnya"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
