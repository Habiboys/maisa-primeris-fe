import { CheckCircle2, Download, Edit2, Key, Plus, Search, Trash2, UserMinus, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useActivityLogs, useConfirmDialog, useUsers } from '../../hooks';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

export function UserManagement() {
  const { showConfirm, ConfirmDialog: ConfirmDialogElement } = useConfirmDialog();
  const { users, isLoading, create, update, toggleStatus, remove } = useUsers();
  const { activityLogs } = useActivityLogs();
  const { user } = useAuth();
  const isPlatformOwner = user?.role === 'Platform Owner';

  const [activeTab, setActiveTab] = useState<'list' | 'logs'>('list');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<{ id: string; name: string; email: string; role: UserRole } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('Semua Role');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Project Management' as UserRole,
  });

  // Hanya tampilkan user dari tenant yang sama (company_id); tenant tidak lihat Platform Owner
  const currentCompanyId = user?.company_id ?? null;
  const filteredUsers = users.filter((u) => {
    if (!isPlatformOwner) {
      if (u.role === 'Platform Owner') return false;
      if (currentCompanyId != null && u.company_id !== currentCompanyId) return false;
    }
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'Semua Role' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'Semua Status' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'Project Management' });
    setShowModal(true);
  };

  const handleOpenEditModal = (user: typeof users[0]) => {
    setEditingUser({ id: user.id, name: user.name, email: user.email, role: user.role });
    setFormData({ name: user.name, email: user.email, role: user.role });
    setShowModal(true);
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Mohon lengkapi nama dan email');
      return;
    }
    try {
      if (editingUser) {
        await update(editingUser.id, { name: formData.name, email: formData.email, role: formData.role });
      } else {
        await create({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: 'Maisa@2026',
          ...(currentCompanyId ? { company_id: currentCompanyId } : {}),
        });
      }
      setShowModal(false);
    } catch {
      // error sudah di-toast oleh hook
    }
  };

  const toggleUserStatus = async (id: string) => {
    await toggleStatus(id);
  };

  const handleDeleteUser = async (id: string) => {
    if (await showConfirm({ title: 'Hapus User', description: 'Apakah Anda yakin ingin menghapus user ini?' })) {
      await remove(id);
    }
  };

  const handleExportLogs = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
      loading: 'Menyiapkan data log...',
      success: 'Log aktivitas berhasil di-export ke CSV',
      error: 'Gagal meng-export log'
    });
  };

  return (
    <div className="space-y-6">
      {ConfirmDialogElement}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-500">Kelola akses, peran pengguna, dan pantau log aktivitas sistem.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Daftar User
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Log Aktivitas
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
              <p className="text-sm text-primary font-medium">Total User</p>
              <p className="text-2xl font-bold text-primary">{users.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <p className="text-sm text-green-600 font-medium">User Aktif</p>
              <p className="text-2xl font-bold text-green-900">{users.filter(u => u.status === 'Aktif').length}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
              <p className="text-sm text-orange-600 font-medium">Izin Tertunda</p>
              <p className="text-2xl font-bold text-orange-900">0</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari berdasarkan nama atau email..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <select 
                  className="bg-white border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option>Semua Role</option>
                  {isPlatformOwner && <option>Platform Owner</option>}
                  <option>Super Admin</option>
                  <option>Finance</option>
                  <option>Project Management</option>
                </select>
                <select 
                  className="bg-white border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>Semua Status</option>
                  <option>Aktif</option>
                  <option>Nonaktif</option>
                </select>
                <button 
                  onClick={handleOpenAddModal}
                  className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
                >
                  <Plus size={18} />
                  <span>Tambah User</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Nama & Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Aktivitas Terakhir</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.last_login ?? (user as unknown as { lastActivity?: string }).lastActivity ?? '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button 
                            onClick={() => handleOpenEditModal(user)}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" 
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => toast.info(`Instruksi reset password telah dikirim ke ${user.email}`)}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" 
                            title="Reset Password"
                          >
                            <Key size={18} />
                          </button>
                          <button 
                            onClick={() => toggleUserStatus(user.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.status === 'Aktif' 
                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' 
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={user.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            {user.status === 'Aktif' ? <UserMinus size={18} /> : <CheckCircle2 size={18} />}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Hapus"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">Data user tidak ditemukan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h3 className="font-bold">Audit Trail / Log Aktivitas Sistem</h3>
            <button 
              onClick={handleExportLogs}
              className="text-sm font-semibold text-primary flex items-center gap-2 hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download size={16} />
              Export Log
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Pengguna</th>
                  <th className="px-6 py-4">Aktivitas</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Perangkat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activityLogs.map((log) => {
                  const l = log as any;
                  // Backend mengirim `user` sebagai object (join dari tabel users),
                  // sedangkan UI lama menganggap string + field berbeda.
                  const time = l.time ?? l.created_at ?? '-';
                  const userDisplay =
                    typeof l.user === 'string'
                      ? l.user
                      : l.user?.name ?? l.user_name ?? l.user_id ?? '-';
                  const action = l.action ?? l.entity ?? '-';
                  const target =
                    l.target ??
                    l.entity ??
                    l.entity_name ??
                    l.description ??
                    '-';
                  const ip = l.ip ?? l.ip_address ?? '-';
                  const device = l.device ?? l.device_info ?? '-';

                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{time}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{userDisplay}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                          {action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">{target}</td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">{ip}</td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{device}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
            <button className="text-sm font-bold text-gray-400 hover:text-primary transition-colors">
              Muat Aktivitas Lainnya...
            </button>
          </div>
        </div>
      )}

      {/* Modal User */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="text-lg font-bold">{editingUser ? 'Edit Data User' : 'Tambah User Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" 
                  placeholder="Masukkan nama"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Email Kerja</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all" 
                  placeholder="name@maisaprimeris.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Role Akses</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                >
                  {isPlatformOwner && <option value="Platform Owner">Platform Owner</option>}
                  <option value="Project Management">Project Management</option>
                  <option value="Finance">Finance</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveUser}
                className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 shadow-md shadow-primary/10 transition-all"
              >
                {editingUser ? 'Simpan Perubahan' : 'Tambah User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles = {
    'Platform Owner': 'bg-indigo-50 text-indigo-700 border-indigo-100',
    'Super Admin': 'bg-purple-50 text-purple-700 border-purple-100',
    'Finance': 'bg-primary/10 text-primary border-primary/20',
    'Project Management': 'bg-orange-50 text-orange-700 border-orange-100',
  }[role] || 'bg-gray-50 text-gray-700 border-gray-100';

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = status === 'Aktif' 
    ? 'bg-green-50 text-green-700 border-green-100' 
    : 'bg-red-50 text-red-700 border-red-100';

  return (
    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border w-fit ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'Aktif' ? 'bg-green-500' : 'bg-red-500'}`}></span>
      {status}
    </span>
  );
}
