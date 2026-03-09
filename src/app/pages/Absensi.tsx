import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Clock3,
  Eye,
  LogOut,
  Navigation,
  Plus,
  Search,
  Target,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  useAttendance,
  useConfirmDialog,
  useLeaveRequests,
  useLocationAssignments,
  useWorkLocations,
} from '../../hooks';
import { mockAttendanceRecap } from '../../lib/mockAttendance';
import type { Attendance, LeaveRequest, WorkLocation } from '../../types';

// Map imports
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

// Fix for default marker icon in leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface AbsensiProps {
  userRole: string;
  userName: string;
}

/* ── Map helper components ──────────────────────────────────────── */

function LocationMarker({
  position,
  setPosition,
}: {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center);
  return null;
}

/* ── Status badge ───────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const color: Record<string, string> = {
    Hadir: 'text-green-600 bg-green-50',
    Terlambat: 'text-orange-600 bg-orange-50',
    Izin: 'text-blue-600 bg-blue-50',
    Sakit: 'text-yellow-600 bg-yellow-50',
    Alpha: 'text-red-600 bg-red-50',
    Menunggu: 'text-orange-600 bg-orange-50',
    Disetujui: 'text-green-600 bg-green-50',
    Ditolak: 'text-red-600 bg-red-50',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color[status] ?? 'text-gray-600 bg-gray-50'}`}>
      {status}
    </span>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────── */

/** Extract HH:mm from ISO string like "2026-03-03T08:02:00.000Z" */
function fmtTime(iso?: string): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/* ── Main Component ──────────────────────────────────────────────── */

export function Absensi({ userRole, userName }: AbsensiProps) {
  const { showConfirm, ConfirmDialog: ConfirmDialogElement } = useConfirmDialog();
  const isSuperAdmin = userRole === 'Super Admin';
  const [activeTab, setActiveTab] = useState<'realtime' | 'recap' | 'requests' | 'settings'>('realtime');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Hooks ────────────────────────────────────────────────────────
  const { locations, create: createLocation, remove: removeLocation } = useWorkLocations();
  const { assignments } = useLocationAssignments();
  const { attendances, clockIn, clockOut } = useAttendance();
  const {
    leaveRequests,
    create: createLeave,
    approve: approveLeave,
    reject: rejectLeave,
    remove: removeLeave,
  } = useLeaveRequests();

  // Find assigned location for current user from assignments
  const userAssignment = assignments.find((a) => a.user?.name === userName);
  const userAssignedLocation = locations.find((l) => l.id === userAssignment?.work_location_id);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Modals ───────────────────────────────────────────────────────
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);

  // ── Add location form state ──────────────────────────────────────
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    radius_m: 50,
    latitude: -6.2088,
    longitude: 106.8456,
  });
  const [pickedPosition, setPickedPosition] = useState<[number, number]>([-6.2088, 106.8456]);

  useEffect(() => {
    setNewLocation((prev) => ({
      ...prev,
      latitude: pickedPosition[0],
      longitude: pickedPosition[1],
    }));
  }, [pickedPosition]);

  // ── Leave form state ─────────────────────────────────────────────
  const [leaveForm, setLeaveForm] = useState({
    type: 'Cuti' as 'Cuti' | 'Izin' | 'Sakit',
    start_date: '',
    end_date: '',
    reason: '',
  });

  /* ── Handlers ────────────────────────────────────────────────────── */

  const handleVerifyLocation = () => {
    // In real app this uses navigator.geolocation
    setTimeout(() => {
      setIsLocationVerified(true);
    }, 1500);
  };

  const handleClockIn = async () => {
    if (!isLocationVerified) return;
    try {
      const lat = userAssignedLocation?.latitude ?? -6.2088;
      const lng = userAssignedLocation?.longitude ?? 106.8456;
      await clockIn({ lat, lng });
      setIsClockedIn(true);
      setClockInTime(currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      // hook already shows toast
    }
  };

  const handleClockOut = async () => {
    try {
      const lat = userAssignedLocation?.latitude ?? -6.2088;
      const lng = userAssignedLocation?.longitude ?? 106.8456;
      await clockOut({ lat, lng });
      setIsClockedIn(false);
    } catch {
      // hook already shows toast
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLocation(newLocation);
      setShowAddLocationModal(false);
      setNewLocation({ name: '', address: '', radius_m: 50, latitude: -6.2088, longitude: 106.8456 });
      setPickedPosition([-6.2088, 106.8456]);
    } catch {
      /* hook shows toast */
    }
  };

  const handleDeleteLocation = async (loc: WorkLocation) => {
    if (await showConfirm({ title: 'Hapus Lokasi', description: `Apakah Anda yakin ingin menghapus lokasi "${loc.name}"?` })) {
      try { await removeLocation(loc.id); } catch { /* hook shows toast */ }
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLeave({
        type: leaveForm.type,
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date || leaveForm.start_date,
        reason: leaveForm.reason || undefined,
      });
      setShowLeaveModal(false);
      setLeaveForm({ type: 'Cuti', start_date: '', end_date: '', reason: '' });
    } catch {
      /* hook shows toast */
    }
  };

  const handleApproveLeave = async (id: string) => {
    try { await approveLeave(id); } catch { /* hook shows toast */ }
  };

  const handleRejectLeave = async (id: string) => {
    try { await rejectLeave(id); } catch { /* hook shows toast */ }
  };

  const handleDeleteLeave = async (req: LeaveRequest) => {
    if (await showConfirm({ title: 'Hapus Pengajuan', description: `Hapus pengajuan izin dari ${req.user?.name ?? 'karyawan'}?` })) {
      try { await removeLeave(req.id); } catch { /* hook shows toast */ }
    }
  };

  // ── Computed stats ───────────────────────────────────────────────
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAttendances = attendances.filter((a) => a.attendance_date === todayStr);
  const displayAttendances = todayAttendances.length > 0 ? todayAttendances : attendances;
  const totalToday = displayAttendances.length;
  const hadirCount = displayAttendances.filter((a) => a.status === 'Hadir').length;
  const terlambatCount = displayAttendances.filter((a) => a.status === 'Terlambat').length;
  const izinCount = displayAttendances.filter((a) => a.status === 'Izin' || a.status === 'Sakit').length;
  const alphaCount = displayAttendances.filter((a) => a.status === 'Alpha').length;

  const stats = [
    { label: 'Hadir Hari Ini', value: String(hadirCount), total: String(totalToday), color: 'bg-green-500', icon: UserCheck },
    { label: 'Terlambat', value: String(terlambatCount), total: String(totalToday), color: 'bg-orange-500', icon: Clock3 },
    { label: 'Izin / Cuti', value: String(izinCount), total: String(totalToday), color: 'bg-blue-500', icon: CalendarDays },
    { label: 'Tanpa Keterangan', value: String(alphaCount), total: String(totalToday), color: 'bg-red-500', icon: AlertCircle },
  ];

  const filteredAttendances = attendances.filter(
    (a) =>
      !searchQuery ||
      a.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  /* ================================================================
   *  NON-SUPER-ADMIN VIEW (Employee self-service)
   * ================================================================ */
  if (!isSuperAdmin) {
    const locLat = Number(userAssignedLocation?.latitude ?? -6.2);
    const locLng = Number(userAssignedLocation?.longitude ?? 106.8);

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Presensi Kehadiran</h2>
            <p className="text-gray-500">Silakan lakukan absensi kehadiran harian Anda.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 flex items-center gap-3 shadow-sm">
            <Clock className="text-primary" size={20} />
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight">
                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clock-in card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary relative">
                <Clock size={48} />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                  <div className={`w-4 h-4 rounded-full ${isClockedIn ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{isClockedIn ? 'Sudah Masuk' : 'Belum Absen'}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {isClockedIn ? `Anda masuk pukul ${clockInTime} hari ini.` : 'Jangan lupa untuk mencatat kehadiran tepat waktu.'}
                </p>
              </div>
              {!isClockedIn ? (
                <button
                  onClick={handleClockIn}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
                >
                  <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform" />
                  Absen Masuk Sekarang
                </button>
              ) : (
                <button
                  onClick={handleClockOut}
                  className="w-full py-4 border-2 border-primary text-primary rounded-2xl font-bold text-lg hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={24} />
                  Absen Pulang
                </button>
              )}

              <div className="bg-blue-50 w-full p-4 rounded-2xl flex items-center gap-3 border border-blue-100">
                <Navigation className="text-blue-600" size={20} />
                <div className="text-left">
                  <p className="text-[10px] font-bold text-blue-400 uppercase">Titik Koordinat</p>
                  <p className="text-xs font-bold text-blue-900">{locLat.toFixed(4)}, {locLng.toFixed(4)}</p>
                </div>
              </div>

              <div className="w-full pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div className="text-left">
                  <p className="text-xs text-gray-400 font-medium uppercase">Masuk</p>
                  <p className="font-bold text-gray-800">{clockInTime || '--:--'}</p>
                </div>
                <div className="text-left border-l border-gray-100 pl-4">
                  <p className="text-xs text-gray-400 font-medium uppercase">Pulang</p>
                  <p className="font-bold text-gray-800">--:--</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden h-[400px]">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Target size={18} className="text-primary" />
                  Peta Lokasi Kerja
                </h3>
                <button onClick={handleVerifyLocation} className="text-xs font-bold text-primary hover:underline">
                  Refresh GPS
                </button>
              </div>
              <div className="h-full w-full relative z-0">
                <MapContainer center={[locLat, locLng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[locLat, locLng]} />
                  <ChangeView center={[locLat, locLng]} />
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================
   *  SUPER ADMIN VIEW
   * ================================================================ */
  return (
    <div className="space-y-6">
      {ConfirmDialogElement}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Absensi Karyawan</h2>
          <p className="text-gray-500">Monitoring kehadiran real-time dan rekapitulasi pegawai.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          {(['realtime', 'recap', 'requests', 'settings'] as const).map((tab) => {
            const labels: Record<string, string> = {
              realtime: 'Monitor Hari Ini',
              recap: 'Rekap Bulanan',
              requests: 'Izin & Cuti',
              settings: 'Pengaturan Lokasi',
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-gray-400">/ {stat.total}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
        {/* ─── Tab: Realtime ───────────────────────────────────── */}
        {activeTab === 'realtime' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 flex items-center gap-3">
                  <Clock className="text-primary" size={18} />
                  <span className="font-bold text-lg">
                    {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Cari karyawan..."
                    className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                    <th className="px-6 py-4">Karyawan</th>
                    <th className="px-6 py-4">Jam Masuk</th>
                    <th className="px-6 py-4">Jam Pulang</th>
                    <th className="px-6 py-4">Lokasi</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAttendances.map((att) => (
                    <tr key={att.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm">{att.user?.name ?? '-'}</p>
                        <p className="text-xs text-gray-500">{att.user?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">{fmtTime(att.clock_in)}</td>
                      <td className="px-6 py-4 text-sm">{fmtTime(att.clock_out)}</td>
                      <td className="px-6 py-4 text-sm">{att.location?.name ?? '-'}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={att.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => { setSelectedAttendance(att); setShowDetailModal(true); }}
                          className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold flex items-center gap-1 mx-auto"
                        >
                          <Eye size={14} /> Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAttendances.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Belum ada data absensi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Tab: Rekap Bulanan ──────────────────────────────── */}
        {activeTab === 'recap' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase">
                  <tr>
                    <th className="px-6 py-4">Nama Karyawan</th>
                    <th className="px-6 py-4 text-center text-green-600">Hadir</th>
                    <th className="px-6 py-4 text-center text-orange-600">Terlambat</th>
                    <th className="px-6 py-4 text-center text-blue-600">Izin</th>
                    <th className="px-6 py-4 text-center text-red-600">Alpha</th>
                    <th className="px-6 py-4 text-right">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockAttendanceRecap.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-sm">{item.name}</td>
                      <td className="px-6 py-4 text-center text-sm">{item.present}</td>
                      <td className="px-6 py-4 text-center text-sm">{item.late}</td>
                      <td className="px-6 py-4 text-center text-sm">{item.permit}</td>
                      <td className="px-6 py-4 text-center text-sm">{item.alpha}</td>
                      <td className="px-6 py-4 text-right font-bold text-sm text-primary">{item.score}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Tab: Izin & Cuti ────────────────────────────────── */}
        {activeTab === 'requests' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Pengajuan Izin & Cuti</h3>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2"
              >
                <Plus size={16} /> Ajukan Izin
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                    <th className="px-6 py-4">Karyawan</th>
                    <th className="px-6 py-4">Jenis</th>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Alasan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaveRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-sm">{req.user?.name ?? '-'}</td>
                      <td className="px-6 py-4 text-sm">{req.type}</td>
                      <td className="px-6 py-4 text-sm">
                        {fmtDate(req.start_date)}
                        {req.end_date !== req.start_date && ` – ${fmtDate(req.end_date)}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">{req.reason ?? '-'}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {req.status === 'Menunggu' && (
                            <>
                              <button
                                onClick={() => handleApproveLeave(req.id)}
                                className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold"
                              >
                                Setuju
                              </button>
                              <button
                                onClick={() => handleRejectLeave(req.id)}
                                className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold"
                              >
                                Tolak
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteLeave(req)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {leaveRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Belum ada pengajuan izin.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Tab: Pengaturan Lokasi ──────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 p-6 space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Location list */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 text-lg">Daftar Titik Lokasi Absen</h3>
                  <button
                    onClick={() => setShowAddLocationModal(true)}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-primary/20"
                  >
                    <Plus size={16} /> Tambah Lokasi
                  </button>
                </div>
                <div className="space-y-4">
                  {locations.map((loc) => (
                    <div key={loc.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:border-primary/30 transition-all group">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{loc.name}</p>
                          <p className="text-xs text-gray-500 mb-2">{loc.address ?? '-'}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-400">
                              <Navigation size={10} /> {Number(loc.latitude ?? 0).toFixed(4)}, {Number(loc.longitude ?? 0).toFixed(4)}
                            </div>
                            <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                              RADIUS: {loc.radius_m ?? 100}m
                            </div>
                            {loc.is_active === false && (
                              <div className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold">NON-AKTIF</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDeleteLocation(loc)}
                            className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {locations.length === 0 && <p className="text-center text-gray-400 py-8">Belum ada lokasi.</p>}
                </div>
              </div>

              {/* Assignment table */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 text-lg">Penempatan Lokasi Per Karyawan</h3>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky top-0">
                      <tr>
                        <th className="px-6 py-4">Karyawan</th>
                        <th className="px-6 py-4">Lokasi Absensi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {assignments.map((a) => (
                        <tr key={a.id}>
                          <td className="px-6 py-4 font-bold">{a.user?.name ?? '-'}</td>
                          <td className="px-6 py-4 text-gray-600">{a.location?.name ?? '-'}</td>
                        </tr>
                      ))}
                      {assignments.length === 0 && (
                        <tr>
                          <td colSpan={2} className="px-6 py-8 text-center text-gray-400">Belum ada penugasan.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Pengajuan Izin ──────────────────────────────── */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Form Pengajuan Izin</h3>
              <button onClick={() => setShowLeaveModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Jenis Izin</label>
                <select
                  className="w-full px-4 py-2 bg-gray-50 border rounded-xl"
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value as 'Cuti' | 'Izin' | 'Sakit' })}
                >
                  <option value="Cuti">Cuti</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 bg-gray-50 border rounded-xl"
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Tanggal Selesai</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 bg-gray-50 border rounded-xl"
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Alasan</label>
                <textarea
                  className="w-full px-4 py-2 bg-gray-50 border rounded-xl h-20"
                  placeholder="Tuliskan alasan izin..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                />
              </div>
              <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold">
                Kirim Pengajuan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Tambah Lokasi ───────────────────────────────── */}
      {showAddLocationModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Map Side */}
              <div className="h-[300px] md:h-full min-h-[400px] relative z-0">
                <div className="absolute top-4 left-4 z-[1000] bg-white p-2 rounded-lg shadow-md border border-gray-100 max-w-[200px]">
                  <p className="text-[10px] font-bold text-primary uppercase">Petunjuk</p>
                  <p className="text-[11px] text-gray-600">Klik pada peta untuk menentukan titik koordinat (Pin).</p>
                </div>
                <MapContainer center={pickedPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker position={pickedPosition} setPosition={setPickedPosition} />
                  <ChangeView center={pickedPosition} />
                </MapContainer>
              </div>

              {/* Form Side */}
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Konfigurasi Lokasi</h3>
                  <button onClick={() => setShowAddLocationModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleAddLocation} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Nama Lokasi / Proyek</label>
                    <input
                      type="text"
                      placeholder="Contoh: Site Cluster Meranti"
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Alamat Lengkap</label>
                    <textarea
                      placeholder="Alamat lengkap lokasi"
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm h-20 outline-none"
                      value={newLocation.address}
                      onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">Latitude</label>
                      <input type="text" readOnly className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono" value={newLocation.latitude.toFixed(6)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700">Longitude</label>
                      <input type="text" readOnly className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono" value={newLocation.longitude.toFixed(6)} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700">Radius Deteksi (Meter)</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="10"
                        max="500"
                        step="10"
                        className="flex-1 accent-primary"
                        value={newLocation.radius_m}
                        onChange={(e) => setNewLocation({ ...newLocation, radius_m: Number(e.target.value) })}
                      />
                      <span className="w-16 text-center font-bold text-primary bg-primary/5 py-1 rounded-lg border border-primary/20 text-sm">
                        {newLocation.radius_m}m
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowAddLocationModal(false)} className="flex-1 py-3 border-2 border-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                      Batal
                    </button>
                    <button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                      Simpan Lokasi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Detail Absensi ──────────────────────────────── */}
      {showDetailModal && selectedAttendance && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 text-left">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Detail Absensi</h3>
              <button onClick={() => setShowDetailModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-lg">{selectedAttendance.user?.name ?? '-'}</h4>
                <p className="text-sm text-gray-500">{selectedAttendance.user?.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">TANGGAL</p>
                  <p className="font-bold">{fmtDate(selectedAttendance.attendance_date)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">STATUS</p>
                  <StatusBadge status={selectedAttendance.status} />
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">JAM MASUK</p>
                  <p className="font-bold">{fmtTime(selectedAttendance.clock_in)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">JAM PULANG</p>
                  <p className="font-bold">{fmtTime(selectedAttendance.clock_out)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl col-span-2">
                  <p className="text-xs text-gray-500">LOKASI</p>
                  <p className="font-bold">{selectedAttendance.location?.name ?? '-'}</p>
                </div>
              </div>
              {selectedAttendance.notes && (
                <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                  <p className="text-xs text-gray-500">CATATAN</p>
                  <p className="text-sm">{selectedAttendance.notes}</p>
                </div>
              )}
              <button onClick={() => setShowDetailModal(false)} className="w-full py-2.5 bg-gray-100 rounded-xl font-bold">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
