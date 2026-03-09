import {
    Clock,
    Construction,
    FileText,
    LayoutDashboard,
    LogOut,
    Megaphone,
    Menu,
    Receipt,
    User,
    Users,
    Wallet
} from 'lucide-react';
import { useState } from 'react';
import { Toaster } from 'sonner';
import logoMini from "../assets/61cebe8f7139be169da0e497fe1e0c50a3adec15.png";
import logoMain from "../assets/c1369a79bc00e989fba6fc14517246c6364e83d7.png";
import { useAuth } from '../context/AuthContext';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { Absensi } from './pages/Absensi';
import { Construction as ConstructionModule } from './pages/Construction';
import { Dashboard } from './pages/Dashboard';
import { Finance } from './pages/Finance';
import { Login } from './pages/Login';
import { Marketing } from './pages/Marketing';
import { SOP } from './pages/SOP';
import { Transaksi } from './pages/Transaksi';
import { UserManagement } from './pages/UserManagement';

type MenuId = 'dashboard' | 'users' | 'absensi' | 'finance' | 'construction' | 'quality' | 'marketing' | 'sop' | 'transaksi';

export default function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const userRole = user?.role ?? 'Super Admin';
  const userName = user?.name ?? '';
  const [activeTab, setActiveTab] = useState<MenuId>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Finance', 'Project Management'] },
    { id: 'construction', label: 'Project & Konstruksi', icon: Construction, roles: ['Super Admin', 'Project Management'] },
    { id: 'finance', label: 'Finance & Accounting', icon: Wallet, roles: ['Super Admin', 'Finance'] },
    { id: 'marketing', label: 'Marketing & Penjualan', icon: Megaphone, roles: ['Super Admin'] },
    { id: 'sop', label: 'SOP', icon: FileText, roles: ['Super Admin', 'Project Management'] },
    { id: 'absensi', label: 'Absensi Karyawan', icon: Clock, roles: ['Super Admin', 'Finance', 'Project Management'] },
    { id: 'users', label: 'User Management', icon: Users, roles: ['Super Admin'] },
    { id: 'transaksi', label: 'Transaksi', icon: Receipt, roles: ['Super Admin', 'Finance'] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'users': return <UserManagement />;
      case 'absensi': return <Absensi userRole={userRole} userName={userName} />;
      case 'finance': return <Finance />;
      case 'construction': return <ConstructionModule />;
      case 'marketing': return <Marketing />;
      case 'sop': return <SOP />;
      case 'transaksi': return <Transaksi />;
      default: return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <Login />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300 bg-white border-r border-gray-200 flex flex-col fixed h-full z-30`}
      >
        <div className="h-28 flex items-center justify-center px-2 border-b border-gray-100 overflow-hidden bg-white">
          {isSidebarOpen ? (
            <div className="flex items-center justify-center w-full animate-in fade-in zoom-in-95 duration-500">
              <ImageWithFallback 
                src={logoMain} 
                alt="Maisa Primeris Logo" 
                className="h-24 w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-full flex justify-center animate-in fade-in duration-300">
              <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
                <ImageWithFallback 
                  src={logoMini} 
                  alt="M" 
                  className="w-10 h-10 object-contain"
                />
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}