import { Eye, EyeOff, Lock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import logoMain from '../../assets/c1369a79bc00e989fba6fc14517246c6364e83d7.png';
import { getErrorMessage } from '../../lib/utils';
import { authService } from '../../services/auth.service';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

function AuthIllustrationPanel() {
  return (
    <div className="hidden lg:block relative bg-[#b7860f]">
      <ImageWithFallback
        src="/images/rumah.webp"
        alt="Perumahan"
        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#b7860f] to-transparent opacity-60" />
      <div className="relative h-full flex flex-col justify-end p-12 text-white">
        <h2 className="text-3xl font-bold leading-tight mb-3">Atur Ulang Akses</h2>
        <p className="text-white/80 text-base">Gunakan password baru agar akun tetap aman dan mudah diakses.</p>
      </div>
    </div>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <AuthIllustrationPanel />
        <div className="p-8 lg:p-14 flex flex-col justify-center">{children}</div>
      </div>
    </div>
  );
}

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    authService
      .verifyResetToken(token)
      .then(() => setTokenValid(true))
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok.');
      return;
    }
    setIsLoading(true);
    try {
      await authService.resetPassword({ token, new_password: newPassword });
      setSuccess(true);
      toast.success('Password berhasil direset. Silakan login.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token || tokenValid === false) {
    return (
      <AuthShell>
        <div className="text-center lg:text-left">
          <ImageWithFallback src={logoMain} alt="Logo" className="h-16 mx-auto lg:mx-0 mb-4 object-contain" />
          <h1 className="text-xl font-bold text-gray-900">Link tidak valid</h1>
          <p className="text-gray-500 text-sm mt-2">
            Link reset password tidak valid atau sudah kadaluarsa. Silakan minta link baru dari halaman lupa password.
          </p>
          <Link
            to="/forgot-password"
            className="mt-6 inline-block w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 text-center"
          >
            Minta link baru
          </Link>
          <Link to="/login" className="mt-3 inline-block text-sm text-primary hover:underline">
            Kembali ke login
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell>
        <div className="text-center lg:text-left">
          <ImageWithFallback src={logoMain} alt="Logo" className="h-16 mx-auto lg:mx-0 mb-4 object-contain" />
          <h1 className="text-xl font-bold text-gray-900">Password berhasil direset</h1>
          <p className="text-gray-500 text-sm mt-2">Silakan login dengan password baru Anda.</p>
          <Link
            to="/login"
            className="mt-6 inline-block w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 text-center"
          >
            Ke halaman login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="text-center lg:text-left mb-8">
        <ImageWithFallback src={logoMain} alt="Logo" className="h-16 mx-auto lg:mx-0 mb-4 object-contain" />
        <h1 className="text-xl font-bold text-gray-900">Atur ulang password</h1>
        <p className="text-gray-500 text-sm mt-1">Masukkan password baru (min. 8 karakter).</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password baru</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type={showPass ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="Min. 8 karakter"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
            placeholder="Ulangi password baru"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
          className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : null}
          Simpan password
        </button>
      </form>

      <p className="text-center lg:text-left mt-4">
        <Link to="/login" className="text-sm text-primary hover:underline">
          Kembali ke login
        </Link>
      </p>
    </AuthShell>
  );
}
