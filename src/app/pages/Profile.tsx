import { Building2, Eye, EyeOff, Key, Lock, Mail, User, Trash2, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useConfirmDialog } from '../../hooks';
import { getErrorMessage } from '../../lib/utils';
import { authService } from '../../services/auth.service';
import { useCompanies } from '../../hooks';
import type { ChangePasswordPayload } from '../../types';

function useMathCaptcha() {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  
  const generate = useCallback(() => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
  }, []);

  useEffect(() => {
    generate();
  }, [generate]);

  return { num1, num2, expected: num1 + num2, generate };
}

export function Profile() {
  const { user } = useAuth();
  const { showConfirm, ConfirmDialog: ConfirmDialogElement } = useConfirmDialog();
  const [profile, setProfile] = useState<{ name: string; email: string; role: string; company?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState<ChangePasswordPayload>({ old_password: '', new_password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const { reset } = useCompanies();
  const [isResetting, setIsResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetAnswer, setResetAnswer] = useState('');
  const mathCaptcha = useMathCaptcha();

  useEffect(() => {
    let cancelled = false;
    authService
      .getProfile()
      .then((data) => {
        if (!cancelled) {
          setProfile({
            name: data.name,
            email: data.email,
            role: data.role,
            company: data.company?.name ?? undefined,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) toast.error(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== confirmPassword) {
      toast.error('Konfirmasi password baru tidak cocok.');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('Password baru minimal 8 karakter.');
      return;
    }
    const ok = await showConfirm({
      title: 'Ubah Password',
      description: 'Anda yakin ingin mengubah password? Setelah itu gunakan password baru untuk login.',
    });
    if (!ok) return;
    setSavingPassword(true);
    try {
      await authService.changePassword(passwordForm);
      toast.success('Password berhasil diubah.');
      setPasswordForm({ old_password: '', new_password: '' });
      setConfirmPassword('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleOpenResetModal = () => {
    mathCaptcha.generate();
    setResetAnswer('');
    setShowResetModal(true);
  };

  const handleResetTenant = async () => {
    if (parseInt(resetAnswer, 10) !== mathCaptcha.expected) {
      toast.error('Jawaban penjumlahan salah');
      return;
    }
    setIsResetting(true);
    try {
      await reset(); // using resetMyTenant
      setShowResetModal(false);
      // Wait a moment then reload to clear all states
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      // ignore
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {ConfirmDialogElement}
      <div>
        <h2 className="text-2xl font-bold">Profil Saya</h2>
        <p className="text-gray-500">Lihat informasi akun dan ubah password.</p>
      </div>

      {/* Info profil (read-only) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800">Informasi Akun</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Nama</p>
              <p className="font-medium">{profile?.name ?? user?.name ?? '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{profile?.email ?? user?.email ?? '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Key className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium">{profile?.role ?? user?.role ?? '-'}</p>
            </div>
          </div>
          {(profile?.company ?? user?.company?.name) && (
            <div className="flex items-center gap-3">
              <Building2 className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-500">Perusahaan</p>
                <p className="font-medium">{profile?.company ?? user?.company?.name ?? '-'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ubah password */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800">Ubah Password</h3>
          <p className="text-sm text-gray-500 mt-0.5">Ganti password untuk keamanan akun Anda.</p>
        </div>
        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password lama</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showOldPass ? 'text' : 'password'}
                value={passwordForm.old_password}
                onChange={(e) => setPasswordForm((p) => ({ ...p, old_password: e.target.value }))}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowOldPass(!showOldPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password baru</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showNewPass ? 'text' : 'password'}
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                placeholder="Min. 8 karakter"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi password baru</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="Ulangi password baru"
            />
          </div>
          <button
            type="submit"
            disabled={savingPassword || !passwordForm.old_password || !passwordForm.new_password || !confirmPassword}
            className="px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {savingPassword ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            Simpan password
          </button>
        </form>
      </div>

      {/* Danger Zone untuk Super Admin */}
      {user?.role === 'Super Admin' && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden p-6 mt-8">
          <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-600 mb-4">
            Fitur ini akan mengosongkan SELURUH data operasional (proyek, unit, leads, transaksi, dsb) untuk perusahaan ini. Data yang tersisa hanyalah akun pengguna dan pengaturan branding.
          </p>
          <button
            onClick={handleOpenResetModal}
            className="px-6 py-2.5 bg-orange-500 text-white font-medium hover:bg-orange-600 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-60"
            disabled={isResetting}
          >
            <Trash2 size={18} />
            {isResetting ? 'Sedang mereset...' : 'Reset Seluruh Data Perusahaan'}
          </button>
        </div>
      )}

      {/* Modal Reset Data */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-600">Peringatan: Reset Data Perusahaan</h3>
              <button onClick={() => setShowResetModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Anda akan mengosongkan <strong>SELURUH</strong> data operasional untuk tenant ini (Proyek, Leads, Keuangan, dsb). Hanya Akun User & Pengaturan Branding yang tidak terhapus.
              </p>
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-bold text-orange-800 mb-2">Konfirmasi Keamanan</p>
                <p className="text-sm text-orange-700 mb-2">Berapa hasil dari <strong>{mathCaptcha.num1} + {mathCaptcha.num2}</strong>?</p>
                <input
                  type="number"
                  placeholder="Ketik jawaban di sini"
                  className="w-full px-4 py-2 border border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  value={resetAnswer}
                  onChange={(e) => setResetAnswer(e.target.value)}
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex items-center justify-end gap-3">
              <button onClick={() => setShowResetModal(false)} className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800">
                Batal
              </button>
              <button
                onClick={handleResetTenant}
                disabled={isResetting || !resetAnswer}
                className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-60"
              >
                Mulai Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
