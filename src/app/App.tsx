import {
    Building2,
    Clock,
    Construction,
    Database,
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
import { useMemo, useState, useEffect } from 'react';
import {
    Navigate,
    Outlet,
    Route,
    Routes,
    useLocation,
    useNavigate,
} from 'react-router-dom';
import { Toaster } from 'sonner';
import logoMini from "../assets/61cebe8f7139be169da0e497fe1e0c50a3adec15.png";
import logoMain from "../assets/c1369a79bc00e989fba6fc14517246c6364e83d7.png";
import { useAuth } from '../context/AuthContext';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { Absensi } from './pages/Absensi';
import { Construction as ConstructionModule } from './pages/Construction';
import { DataMaster } from './pages/DataMaster';
import { Dashboard } from './pages/Dashboard';
import { Finance } from './pages/Finance';
import { ForgotPassword } from './pages/ForgotPassword';
import { Login } from './pages/Login';
import { Marketing } from './pages/Marketing';
import { Profile } from './pages/Profile';
import { ResetPassword } from './pages/ResetPassword';
import { SaaSManagement } from './pages/SaaSManagement';
import { TenantDetail } from './pages/TenantDetail';
import { SOP } from './pages/SOP';
import { Transaksi } from './pages/Transaksi';
import { UserManagement } from './pages/UserManagement';

type MenuId = 'dashboard' | 'users' | 'absensi' | 'finance' | 'construction' | 'quality' | 'marketing' | 'sop' | 'transaksi' | 'saas' | 'datamaster';

interface MenuItem {
  id: MenuId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  roles: string[];
  path: string;
  subItems?: Array<{
    label: string;
    path: string;
    roles: string[];
  }>;
}

interface AppShellProps {
  menuItems: MenuItem[];
  userName: string;
  userRole: string;
  appName: string;
  logoUrl: string;
  logoMiniUrl: string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onLogout: () => void;
}

function AppShell({
  menuItems,
  userName,
  userRole,
  appName,
  logoUrl,
  logoMiniUrl,
  isSidebarOpen,
  setIsSidebarOpen,
  onLogout,
}: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isPathActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const [openParentId, setOpenParentId] = useState<string | null>(null);

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
                src={logoUrl}
                alt={`${appName} Logo`}
                className="h-24 w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-full flex justify-center animate-in fade-in duration-300">
              <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
                <ImageWithFallback
                  src={logoMiniUrl}
                  alt="M"
                  className="w-10 h-10 object-contain"
                />
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => {
                  const visibleSubs = (item.subItems ?? []).filter((s) => s.roles.includes(userRole));
                  const target = visibleSubs[0]?.path ?? item.path;
                  if (isSidebarOpen && (item.subItems?.length ?? 0) > 0) setOpenParentId(item.id);
                  navigate(target);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isPathActive(item.path) ||
                  (item.subItems ?? []).some((s) => isPathActive(s.path))
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <item.icon size={20} />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>

              {isSidebarOpen && item.subItems?.length && openParentId === item.id && (
                <div className="pl-7 space-y-1">
                  {item.subItems
                    .filter((s) => s.roles.includes(userRole))
                    .map((sub) => (
                      <button
                        key={sub.path}
                        onClick={() => navigate(sub.path)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                          isPathActive(sub.path)
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => {
              onLogout();
              navigate('/login', { replace: true });
            }}
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
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <User size={20} />
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isInitialized, user, logout } = useAuth();
  const userRole = user?.role ?? 'Platform Owner';
  const userName = user?.name ?? '';
  let appName = 'Primeris One';
  let logoUrl = logoMain;
  let logoMiniUrl = logoMini;
  let faviconUrl: string | null = null;
  if (user?.role !== 'Platform Owner' && user?.company?.settings) {
    appName = user.company.settings.app_name || 'Primeris One';
    const tenantLogoPath = user.company.settings.logo_url;
    if (tenantLogoPath) {
      const tenantLogoUrl = `${import.meta.env.VITE_ASSET_URL ?? ''}${tenantLogoPath}`;
      logoUrl = tenantLogoUrl;
      logoMiniUrl = tenantLogoUrl;
    }
    const tenantFaviconPath = user.company.settings.favicon_url;
    if (tenantFaviconPath) {
      faviconUrl = `${import.meta.env.VITE_ASSET_URL ?? ''}${tenantFaviconPath}`;
    }
  }

  useEffect(() => {
    if (!faviconUrl) return;
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, [faviconUrl]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const allMenuItems: MenuItem[] = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['Platform Owner', 'Super Admin', 'Finance', 'Project Management'] },
      { id: 'saas', label: 'SaaS Management', icon: Building2, path: '/saas', roles: ['Platform Owner'] },
      { id: 'construction', label: 'Project & Konstruksi', icon: Construction, path: '/construction', roles: ['Platform Owner', 'Super Admin', 'Project Management'] },
      {
        id: 'datamaster',
        label: 'Data Master',
        icon: Database,
        path: '/data-master',
        roles: ['Platform Owner', 'Super Admin', 'Project Management'],
        subItems: [
          { label: 'Data Project', path: '/data-master/projects', roles: ['Platform Owner', 'Super Admin', 'Project Management'] },
        ],
      },
      { id: 'finance', label: 'Finance & Accounting', icon: Wallet, path: '/finance', roles: ['Platform Owner', 'Super Admin', 'Finance'] },
      { id: 'marketing', label: 'Marketing & Penjualan', icon: Megaphone, path: '/marketing', roles: ['Platform Owner', 'Super Admin'] },
      { id: 'sop', label: 'SOP', icon: FileText, path: '/sop', roles: ['Platform Owner', 'Super Admin', 'Project Management'] },
      { id: 'absensi', label: 'Absensi Karyawan', icon: Clock, path: '/absensi', roles: ['Platform Owner', 'Super Admin', 'Finance', 'Project Management'] },
      { id: 'users', label: 'User Management', icon: Users, path: '/users', roles: ['Platform Owner', 'Super Admin'] },
      { id: 'transaksi', label: 'Transaksi', icon: Receipt, path: '/transaksi', roles: ['Platform Owner', 'Super Admin', 'Finance'] },
    ],
    [],
  );

  const menuItems = useMemo(() => {
    if (userRole === 'Platform Owner') {
      // Hanya tampilkan menu SaaS Management (kelola tenant)
      return allMenuItems.filter((item) => item.id === 'saas');
    }
    return allMenuItems.filter((item) => item.roles.includes(userRole));
  }, [allMenuItems, userRole]);

  const pageByMenuId: Record<MenuId, React.ReactNode> = {
    dashboard: <Dashboard />,
    users: <UserManagement />,
    absensi: <Absensi userRole={userRole} userName={userName} />,
    finance: <Finance />,
    construction: <ConstructionModule />,
    datamaster: <Navigate to="/data-master/projects" replace />,
    marketing: <Marketing />,
    sop: <SOP />,
    transaksi: <Transaksi />,
    saas: <SaaSManagement />,
    quality: <Dashboard />,
  };

  const defaultPath = menuItems[0]?.path ?? '/dashboard';

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        Memuat sesi...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to={defaultPath} replace />} />

      <Route
        element={(
          <AppShell
            menuItems={menuItems}
            userName={userName}
            userRole={userRole}
            appName={appName}
            logoUrl={logoUrl}
            logoMiniUrl={logoMiniUrl}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            onLogout={logout}
          />
        )}
      >
        <Route path="/" element={<Navigate to={defaultPath} replace />} />
        <Route path="/profile" element={<Profile />} />
        {menuItems.map((item) =>
          item.id === 'saas' ? (
            <Route key="saas" path="saas/*" element={<Outlet />}>
              <Route index element={<SaaSManagement />} />
              <Route path="tenant/:companyId" element={<TenantDetail />} />
            </Route>
          ) : (
            <Route
              key={item.id}
              path={item.path.replace(/^\//, '')}
              element={pageByMenuId[item.id] ?? <Navigate to={defaultPath} replace />}
            />
          )
        )}
        <Route path="data-master/projects" element={<DataMaster />} />
        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Route>
    </Routes>
  );
}