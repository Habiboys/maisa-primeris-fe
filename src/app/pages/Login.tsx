import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import logoMain from "../../assets/c1369a79bc00e989fba6fc14517246c6364e83d7.png";
import { useAuth } from '../../context/AuthContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function Login() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Silakan isi email dan password Anda.');
      return;
    }
    setIsLoading(true);
    try {
      await login({ email, password });
      // Redirect otomatis ditangani oleh AuthContext
    } catch {
      // Error sudah ditangani di AuthContext dengan toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 m-4">
        {/* Left Side: Illustration/Brand */}
        <div className="hidden lg:block relative bg-[#b7860f]">
          <ImageWithFallback 
            src="/images/rumah.webp" 
            alt="Real Estate" 
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#b7860f] to-transparent opacity-60"></div>
          <div className="relative h-full flex flex-col justify-end p-12 text-white">
            <div className="mb-8">
              <h1 className="text-4xl font-bold leading-tight mb-4">
                Sistem Manajemen Properti Terintegrasi.
              </h1>
              <p className="text-white/80 text-lg">
                Kelola proyek, keuangan, dan absensi dalam satu platform modern dan efisien.
              </p>
            </div>
            <p className="text-sm text-white/60">
              © 2026 Maisa Primeris. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 lg:p-16 flex flex-col justify-center">
          <div className="mb-10 text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-6">
              <ImageWithFallback 
                src={logoMain} 
                alt="Logo" 
                className="h-24 w-auto object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang Kembali</h2>
            <p className="text-gray-500">Silakan masuk ke akun Anda untuk melanjutkan.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 block ml-1">Email / Username</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email anda"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 block ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors font-medium">Ingat saya</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-bold text-primary hover:underline transition-all">
                Lupa password?
              </Link>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#b7860f] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#a1760d] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Masuk Sekarang'
              )}
            </button>
          </form>

          {/* Hapus bantuan akses */}
        </div>
      </div>
    </div>
  );
}
