import {
    BarChart3,
    Calendar,
    CheckCircle2,
    ChevronDown,
    Clock,
    Home,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import React, { useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { useDashboard } from '../../hooks';
import { formatRupiah } from '../../lib/utils';

export function Dashboard() {
  const { summary, cashflow, constructionProgress, salesDistribution, budgetVsActual } = useDashboard();
  const [period, setPeriod] = useState('6 Bulan Terakhir');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const periods = ['Hari Ini', 'Minggu Ini', 'Bulan Ini', '6 Bulan Terakhir', 'Tahun Ini'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ringkasan Dashboard</h2>
          <p className="text-gray-500">Selamat datang kembali, admin. Berikut progres hari ini.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowPeriodMenu(!showPeriodMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Calendar size={16} className="text-primary" />
              <span>{period}</span>
              <ChevronDown size={14} className={`transition-transform ${showPeriodMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showPeriodMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowPeriodMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                  {periods.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPeriod(p);
                        setShowPeriodMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 transition-colors ${
                        period === p ? 'text-primary font-bold bg-primary/10' : 'text-gray-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total Unit" 
          value={String(summary?.total_unit ?? '...')} 
          subValue="+5 bulan ini" 
          icon={<Home className="text-primary" size={24} />}
          trend="up"
        />
        <KpiCard 
          title="Unit Terjual" 
          value={String(summary?.unit_terjual ?? '...')} 
          subValue="70% dari target" 
          icon={<CheckCircle2 className="text-green-600" size={24} />}
          trend="up"
        />
        <KpiCard 
          title="Unit Progres" 
          value={String(summary?.unit_progres ?? '...')} 
          subValue="12 kritis" 
          icon={<Clock className="text-orange-600" size={24} />}
          trend="down"
        />
        <KpiCard 
          title="Pendapatan" 
          value={summary ? formatRupiah(summary.pendapatan) : '...'} 
          subValue="+12% dari target" 
          icon={<BarChart3 className="text-purple-600" size={24} />}
          trend="up"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cashflow Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800">Arus Kas (Miliar IDR)</h3>
            <select className="text-sm border-none bg-gray-50 rounded-md py-1 px-2 focus:ring-0">
              <option>6 Bulan Terakhir</option>
              <option>1 Tahun</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="masuk" fill="#b7860f" radius={[4, 4, 0, 0]} name="Kas Masuk" />
                <Bar dataKey="keluar" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Kas Keluar" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Construction Progress */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800">Progres Pembangunan (%)</h3>
            <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded">Update: Hari ini</span>
          </div>
          <div className="space-y-6">
            {constructionProgress.map((item, index) => (
              <div key={`${item.name}-${index}`} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">{item.name}</span>
                  <span className="font-bold">{item.progress}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000" 
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Distribution */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6">Status Penjualan Unit</h3>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {salesDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 1 ? '#b7860f' : entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold">{summary?.total_unit ?? '-'}</span>
              <span className="text-xs text-gray-500">Total Unit</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {salesDistribution.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: index === 1 ? '#b7860f' : item.color }}></div>
                <span className="text-xs text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Budget vs Actual Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800">Realisasi vs Pagu Biaya (M)</h3>
            <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">Efisiensi: 92%</span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={budgetVsActual}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="pagu" stroke="#94a3b8" strokeWidth={2} dot={{ r: 4 }} name="Pagu Biaya" />
                <Line type="monotone" dataKey="realisasi" stroke="#b7860f" strokeWidth={2} dot={{ r: 4 }} name="Realisasi" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-gray-400"></div>
              <span className="text-xs text-gray-600">Pagu Biaya</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-[#b7860f]"></div>
              <span className="text-xs text-gray-600">Realisasi</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">

      </div>
    </div>
  );
}

function KpiCard({ title, value, subValue, icon, trend }: { title: string, value: string, subValue: string, icon: React.ReactNode, trend: 'up' | 'down' }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
          <div className="mt-2 flex items-center gap-1">
            {trend === 'up' ? (
              <TrendingUp size={14} className="text-green-500" />
            ) : (
              <TrendingDown size={14} className="text-red-500" />
            )}
            <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {subValue}
            </span>
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ user, action, target, time }: { user: string, action: string, target: string, time: string }) {
  return (
    <div className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
        {user.charAt(0)}
      </div>
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-semibold text-gray-900">{user}</span> {action} <span className="font-semibold text-primary">{target}</span>
        </p>
        <span className="text-xs text-gray-400">{time}</span>
      </div>
    </div>
  );
}
