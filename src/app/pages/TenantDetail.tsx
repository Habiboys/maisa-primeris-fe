import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Edit2,
  Palette,
  Save,
  Trash2,
  UserMinus,
  Users,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, useCompanies, useCompany, useCompanyBranding, useUsers } from '../../hooks';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { getErrorMessage } from '../../lib/utils';
import type { CompanyPayload, CreateUserPayload } from '../../types';
import type { CompanySettingsPayload } from '../../types';
import type { UserRole } from '../../types';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { toast } from 'sonner';

const defaultCompanyForm: CompanyPayload = {
  name: '',
  code: '',
  domain: '',
  is_active: true,
  subscription_plan: 'basic',
  billing_cycle: 'monthly',
  subscription_status: 'active',
  is_suspended: false,
};

const SUBSCRIPTION_STATUSES = ['active', 'trial', 'grace', 'inactive', 'suspended', 'cancelled'] as const;
const BILLING_CYCLES = ['monthly', 'yearly'] as const;
const ADMIN_ROLES: UserRole[] = ['Super Admin', 'Finance', 'Project Management'];

export function TenantDetail() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPlatformOwner = user?.role === 'Platform Owner';
  const isNew = companyId === 'new';

  const { showConfirm, ConfirmDialog: ConfirmDialogElement } = useConfirmDialog();

  const { company, isLoading: loadingCompany, refetch: refetchCompany } = useCompany(
    isNew ? undefined : companyId,
    !isNew
  );
  const { update, create, remove } = useCompanies();
  const { settings, isLoading: loadingBranding, update: updateBranding } = useCompanyBranding({
    companyId: isPlatformOwner && company?.id ? company.id : undefined,
    enabled: !isNew && Boolean(company?.id),
  });
  const { users, create: createUser, update: updateUser, toggleStatus, remove: removeUser, refetch: refetchUsers } = useUsers(
    company?.id ? {} : undefined
  );

  const [companyForm, setCompanyForm] = useState<CompanyPayload>(defaultCompanyForm);
  const [brandingForm, setBrandingForm] = useState<CompanySettingsPayload>({
    app_name: '',
    primary_color: '#2563eb',
    secondary_color: '#14b8a6',
    accent_color: '#f59e0b',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', role: 'Super Admin' as UserRole });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<{ id: string; name: string; email: string; role: UserRole } | null>(null);
  const [adminFormData, setAdminFormData] = useState({ name: '', email: '', password: '', role: 'Super Admin' as UserRole });
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Hanya user yang terikat ke tenant ini; Platform Owner tidak punya tenant jadi tidak ditampilkan
  const adminUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.role !== 'Platform Owner' &&
          u.company_id != null &&
          u.company_id === company?.id
      ),
    [users, company?.id]
  );

  useEffect(() => {
    if (company) {
      setCompanyForm({
        name: company.name,
        code: company.code,
        domain: company.domain ?? '',
        is_active: company.is_active,
        subscription_plan: company.subscription_plan ?? 'basic',
        billing_cycle: company.billing_cycle ?? 'monthly',
        subscription_status: company.subscription_status ?? 'active',
        subscription_started_at: company.subscription_started_at ?? null,
        subscription_ended_at: company.subscription_ended_at ?? null,
        is_suspended: company.is_suspended ?? false,
      });
    } else if (isNew) {
      setCompanyForm(defaultCompanyForm);
    }
  }, [company, isNew]);

  useEffect(() => {
    if (settings) {
      setBrandingForm({
        app_name: settings.app_name ?? '',
        primary_color: settings.primary_color ?? '#2563eb',
        secondary_color: settings.secondary_color ?? '#14b8a6',
        accent_color: settings.accent_color ?? '#f59e0b',
      });
    }
  }, [settings]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const goBack = useCallback(() => navigate('/saas'), [navigate]);

  const saveInfo = async () => {
    const confirmed = await showConfirm({
      title: 'Simpan Perubahan',
      description: 'Simpan perubahan info perusahaan dan subscription?',
      confirmText: 'Simpan',
      cancelText: 'Batal',
      variant: 'default',
    });
    if (!confirmed) return;
    setIsSavingInfo(true);
    try {
      if (isNew) {
        const payload = { ...companyForm };
        delete (payload as Record<string, unknown>).code;
        await create(payload);
        toast.success('Tenant berhasil dibuat');
        goBack();
      } else if (company?.id) {
        await update(company.id, companyForm);
        toast.success('Info tenant berhasil diperbarui');
        refetchCompany();
      }
    } catch {
      // toast di hook
    } finally {
      setIsSavingInfo(false);
    }
  };

  const saveBranding = async () => {
    if (!company?.id) return;
    const confirmed = await showConfirm({
      title: 'Simpan Branding',
      description: 'Simpan pengaturan branding (nama aplikasi, logo, warna)?',
      confirmText: 'Simpan',
      cancelText: 'Batal',
      variant: 'default',
    });
    if (!confirmed) return;
    setIsSavingBranding(true);
    try {
      await updateBranding(brandingForm, logoFile);
      setLogoFile(null);
      refetchCompany();
    } catch {
      // toast di hook
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!adminForm.name || !adminForm.email || !adminForm.password) {
      toast.error('Lengkapi nama, email, dan password');
      return;
    }
    if (!company?.id) return;
    setIsCreatingUser(true);
    try {
      await createUser({
        name: adminForm.name,
        email: adminForm.email,
        password: adminForm.password,
        role: adminForm.role,
        company_id: company.id,
      } as CreateUserPayload);
      setAdminForm({ name: '', email: '', password: '', role: 'Super Admin' });
      toast.success('Admin tenant berhasil dibuat');
      refetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsCreatingUser(false);
    }
  };

  const openEditAdmin = (u: (typeof adminUsers)[0]) => {
    setEditingAdmin({ id: u.id, name: u.name, email: u.email, role: u.role });
    setAdminFormData({ name: u.name, email: u.email, password: '', role: u.role });
    setShowAdminModal(true);
  };

  const handleSaveAdmin = async () => {
    if (!editingAdmin) return;
    if (!adminFormData.name || !adminFormData.email) {
      toast.error('Nama dan email wajib diisi');
      return;
    }
    setIsCreatingUser(true);
    try {
      const payload: { name: string; email: string; role: UserRole; password?: string } = {
        name: adminFormData.name,
        email: adminFormData.email,
        role: adminFormData.role,
      };
      if (adminFormData.password) payload.password = adminFormData.password;
      await updateUser(editingAdmin.id, payload);
      toast.success('Admin berhasil diperbarui');
      setShowAdminModal(false);
      setEditingAdmin(null);
      refetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleToggleAdminStatus = async (id: string) => {
    try {
      await toggleStatus(id);
      refetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRemoveAdmin = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Hapus Admin',
      description: 'Apakah Anda yakin ingin menghapus admin ini?',
      confirmText: 'Hapus',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await removeUser(id);
      refetchUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!company?.id) return;
    const confirmed = await showConfirm({
      title: 'Hapus Tenant',
      description: `Hapus tenant "${company.name}"? Tindakan ini tidak dapat dibatalkan. Semua data terkait akan hilang.`,
      confirmText: 'Hapus Tenant',
      variant: 'danger',
    });
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      await remove(company.id);
      toast.success('Tenant berhasil dihapus');
      goBack();
    } catch {
      // toast di hook
    } finally {
      setIsDeleting(false);
    }
  };

  const logoDisplayUrl =
    logoPreview ??
    (settings?.logo_url
      ? `${import.meta.env.VITE_ASSET_URL ?? ''}${settings.logo_url}`
      : null);

  if (!isNew && !company && !loadingCompany) {
    return (
      <div className="space-y-4">
        <button onClick={goBack} className="text-primary flex items-center gap-2">
          <ArrowLeft size={18} /> Kembali
        </button>
        <p className="text-gray-500">Tenant tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ConfirmDialogElement}
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Kembali ke SaaS Management
        </button>
      </div>

      <header>
        <h2 className="text-2xl font-bold">
          {isNew ? 'Tambah Tenant' : `Detail Tenant: ${company?.name ?? '...'}`}
        </h2>
        <p className="text-sm text-gray-500">
          {isNew
            ? 'Buat perusahaan tenant baru. Kode akan digenerate otomatis dari nama.'
            : 'Edit info, kelola user admin, dan pengaturan branding.'}
        </p>
      </header>

      {/* Section: Info Perusahaan & Subscription */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-bold flex items-center gap-2">
          <Building2 size={18} />
          Info Perusahaan & Subscription
        </h3>
        <div className="grid gap-3 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama perusahaan</label>
            <input
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Nama perusahaan"
              value={companyForm.name ?? ''}
              onChange={(e) => setCompanyForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          {isNew ? (
            <p className="text-sm text-gray-500">Kode akan digenerate otomatis dari nama perusahaan.</p>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode</label>
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600"
                value={companyForm.code ?? ''}
                readOnly
                disabled
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domain (opsional)</label>
            <input
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="example.com"
              value={companyForm.domain ?? ''}
              onChange={(e) => setCompanyForm((p) => ({ ...p, domain: e.target.value || null }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <input
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="basic / pro / enterprise"
              value={companyForm.subscription_plan ?? ''}
              onChange={(e) => setCompanyForm((p) => ({ ...p, subscription_plan: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                value={companyForm.billing_cycle ?? 'monthly'}
                onChange={(e) =>
                  setCompanyForm((p) => ({ ...p, billing_cycle: e.target.value as CompanyPayload['billing_cycle'] }))
                }
              >
                {BILLING_CYCLES.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                value={companyForm.subscription_status ?? 'active'}
                onChange={(e) =>
                  setCompanyForm((p) => ({
                    ...p,
                    subscription_status: e.target.value as CompanyPayload['subscription_status'],
                  }))
                }
              >
                {SUBSCRIPTION_STATUSES.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(companyForm.is_suspended)}
              onChange={(e) => setCompanyForm((p) => ({ ...p, is_suspended: e.target.checked }))}
            />
            Suspended
          </label>
        </div>
        <button
          onClick={saveInfo}
          disabled={isSavingInfo || !companyForm.name}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-60"
        >
          <Save size={16} />
          {isSavingInfo ? 'Menyimpan...' : isNew ? 'Buat Tenant' : 'Simpan Perubahan'}
        </button>
      </section>

      {/* Section: Admin Tenant */}
      {!isNew && company?.id && (
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Users size={18} />
            Admin Tenant
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold">
                  <th className="pb-2 pr-4">Nama & Email</th>
                  <th className="pb-2 pr-4">Role</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {adminUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-gray-400">
                      Belum ada admin tenant.
                    </td>
                  </tr>
                )}
                {adminUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-gray-500 text-xs">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditAdmin(u)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleAdminStatus(u.id)}
                          className={`p-2 rounded-lg ${u.status === 'Aktif' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                          title={u.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {u.status === 'Aktif' ? <UserMinus size={16} /> : <CheckCircle2 size={16} />}
                        </button>
                        <button
                          onClick={() => handleRemoveAdmin(u.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 max-w-3xl pt-2">
            <input
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Nama"
              value={adminForm.name}
              onChange={(e) => setAdminForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Email"
              value={adminForm.email}
              onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))}
            />
            <input
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              type="password"
              placeholder="Password"
              value={adminForm.password}
              onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))}
            />
            <select
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              value={adminForm.role}
              onChange={(e) => setAdminForm((f) => ({ ...f, role: e.target.value as UserRole }))}
            >
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddAdmin}
            disabled={isCreatingUser || !adminForm.name || !adminForm.email || !adminForm.password}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-60"
          >
            Tambah Admin
          </button>
        </section>
      )}

      {/* Section: Branding */}
      {!isNew && company?.id && (
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Palette size={18} />
            Branding
          </h3>
          <div className="grid gap-3 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama aplikasi</label>
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Nama aplikasi"
                value={brandingForm.app_name ?? ''}
                onChange={(e) => setBrandingForm((p) => ({ ...p, app_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
              {logoDisplayUrl && (
                <div className="mb-2 flex items-center gap-3">
                  <ImageWithFallback
                    src={logoDisplayUrl}
                    alt="Logo saat ini"
                    className="h-16 w-16 object-contain border border-gray-200 rounded-lg bg-gray-50"
                  />
                  <span className="text-sm text-gray-500">
                    {logoFile ? 'Preview upload baru' : 'Logo saat ini'}
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              />
              {!logoDisplayUrl && !logoFile && (
                <p className="text-sm text-gray-400 mt-1">Belum ada logo. Upload file untuk menambah logo.</p>
              )}
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                Primary
                <input
                  type="color"
                  className="w-10 h-10 rounded border cursor-pointer"
                  value={brandingForm.primary_color ?? '#2563eb'}
                  onChange={(e) => setBrandingForm((p) => ({ ...p, primary_color: e.target.value }))}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                Secondary
                <input
                  type="color"
                  className="w-10 h-10 rounded border cursor-pointer"
                  value={brandingForm.secondary_color ?? '#14b8a6'}
                  onChange={(e) => setBrandingForm((p) => ({ ...p, secondary_color: e.target.value }))}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                Accent
                <input
                  type="color"
                  className="w-10 h-10 rounded border cursor-pointer"
                  value={brandingForm.accent_color ?? '#f59e0b'}
                  onChange={(e) => setBrandingForm((p) => ({ ...p, accent_color: e.target.value }))}
                />
              </label>
            </div>
          </div>
          <button
            onClick={saveBranding}
            disabled={isSavingBranding || loadingBranding}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-60"
          >
            <Save size={16} />
            {isSavingBranding ? 'Menyimpan...' : 'Simpan Branding'}
          </button>
        </section>
      )}

      {/* Danger Zone */}
      {!isNew && company?.id && (
        <section className="bg-white rounded-xl border border-red-100 p-5">
          <h3 className="font-bold text-red-700 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-600 mb-3">
            Menghapus tenant akan menghapus data terkait. Tindakan ini tidak dapat dibatalkan.
          </p>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
          >
            <Trash2 size={16} />
            {isDeleting ? 'Menghapus...' : 'Hapus Tenant'}
          </button>
        </section>
      )}

      {/* Modal Edit Admin */}
      {showAdminModal && editingAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold">Edit Admin Tenant</h3>
              <button
                onClick={() => { setShowAdminModal(false); setEditingAdmin(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Nama"
                  value={adminFormData.name}
                  onChange={(e) => setAdminFormData((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="email@example.com"
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  value={adminFormData.role}
                  onChange={(e) => setAdminFormData((f) => ({ ...f, role: e.target.value as UserRole }))}
                >
                  {ADMIN_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password baru (kosongkan jika tidak diubah)</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="••••••••"
                  value={adminFormData.password}
                  onChange={(e) => setAdminFormData((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowAdminModal(false); setEditingAdmin(null); }}
                className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAdmin}
                disabled={isCreatingUser || !adminFormData.name || !adminFormData.email}
                className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 disabled:opacity-60"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
