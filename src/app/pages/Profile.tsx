import { Building2, Eye, EyeOff, Key, Lock, Mail, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useConfirmDialog } from '../../hooks';
import { getErrorMessage } from '../../lib/utils';
import { authService } from '../../services/auth.service';
import type { ChangePasswordPayload } from '../../types';

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
    </div>
  );
}
