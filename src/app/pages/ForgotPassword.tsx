import { ArrowLeft, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
        <h2 className="text-3xl font-bold leading-tight mb-3">Pemulihan Akses Akun</h2>
        <p className="text-white/80 text-base">Reset password dengan aman untuk melanjutkan aktivitas Anda.</p>
      </div>
    </div>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Masukkan email Anda.');
      return;
    }
    setIsLoading(true);
    setSent(false);
    try {
      await authService.forgotPassword({ email: email.trim() });
      setSent(true);
      toast.success('Jika email terdaftar, Anda akan menerima link reset password.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <AuthIllustrationPanel />

        <div className="p-8 lg:p-14 flex flex-col justify-center">
          <div className="text-center lg:text-left mb-8">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6">
              <ArrowLeft size={16} />
              Kembali ke login
            </Link>
            <ImageWithFallback src={logoMain} alt="Logo" className="h-16 mx-auto lg:mx-0 mb-4 object-contain" />
            <h1 className="text-xl font-bold text-gray-900">Lupa Password?</h1>
            <p className="text-gray-500 text-sm mt-1">
              Masukkan email terdaftar. Kami akan mengirim link untuk reset password.
            </p>
          </div>

          {sent ? (
            <div className="text-center lg:text-left py-2">
              <p className="text-gray-600 text-sm">
                Cek inbox email <strong>{email}</strong>. Jika tidak ada, periksa folder spam.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-block w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 text-center"
              >
                Kembali ke login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@contoh.com"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}
                Kirim link reset
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
