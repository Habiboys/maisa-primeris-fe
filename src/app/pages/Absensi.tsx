import {
    AlertCircle,
    CalendarDays,
    Camera,
    CheckCircle2,
    Clock,
    Clock3,
    Eye,
    LogOut,
    Navigation,
    Pencil,
    Plus,
    Search,
    SwitchCamera,
    Target,
    Trash2,
    UserCheck,
    X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import Calendar from 'react-calendar';
import { toast } from 'sonner';
import {
    useAttendance,
    useAttendanceRecap,
    useAttendanceSettings,
    useConfirmDialog,
    useLeaveRequests,
    useLocationAssignments,
    useMyAttendance,
    useWorkLocations,
} from '../../hooks';
import { API_BASE_URL } from '../../lib/config';
import { compressImageToFile } from '../../lib/utils';
import { userService } from '../../services';
import type { Attendance, LeaveRequest, User, UserLocationAssignment, WorkLocation } from '../../types';

// Map imports
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-calendar/dist/Calendar.css';
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import '../../styles/react-calendar-absensi.css';

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

// Blue dot icon for user's current GPS position
const userGpsIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.5)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Haversine distance in meters
const haversineM = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

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
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [map, center[0], center[1]]);
  return null;
}

function MapZoomControls() {
  const map = useMap();
  return (
    <div className="absolute top-4 left-4 z-[1000] bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="w-9 h-9 text-lg font-bold text-gray-700 hover:bg-gray-50 border-b border-gray-100"
        title="Zoom in"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="w-9 h-9 text-lg font-bold text-gray-700 hover:bg-gray-50"
        title="Zoom out"
      >
        −
      </button>
    </div>
  );
}

interface OSMSearchResult {
  display_name: string;
  lat: string;
  lon: string;
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

/** Extract HH:mm from TIME string ("08:30:00") or ISO string ("2026-03-03T08:02:00.000Z") */
function fmtTime(val?: string): string {
  if (!val) return '--:--';
  // Handle HH:mm:ss format from MySQL TIME type
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(val)) return val.slice(0, 5);
  // Handle ISO string
  const d = new Date(val);
  if (isNaN(d.getTime())) return '--:--';
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

function fmtTimeInput(val?: string): string {
  if (!val) return '08:00';
  return val.slice(0, 5);
}

function resolveAttendancePhotoUrl(photoPath?: string): string | null {
  if (!photoPath) return null;
  if (/^https?:\/\//i.test(photoPath)) return photoPath;

  const origin = API_BASE_URL.replace(/\/api\/v\d+\/?$/i, '');
  return `${origin}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
}

/* ── Main Component ──────────────────────────────────────────────── */

export function Absensi({ userRole, userName }: AbsensiProps) {
  const { showConfirm, ConfirmDialog: ConfirmDialogElement } = useConfirmDialog();
  const isSuperAdmin = userRole === 'Super Admin' || userRole === 'Platform Owner';
  const [activeTab, setActiveTab] = useState<'realtime' | 'recap' | 'requests' | 'settings'>('realtime');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [userGpsPos, setUserGpsPos] = useState<[number, number] | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [clockInPhoto, setClockInPhoto] = useState<File | null>(null);
  const [clockOutPhoto, setClockOutPhoto] = useState<File | null>(null);
  const [clockInPhotoPreview, setClockInPhotoPreview] = useState<string | null>(null);
  const [clockOutPhotoPreview, setClockOutPhotoPreview] = useState<string | null>(null);
  const [photoCompressing, setPhotoCompressing] = useState(false);
  const [pendingAttendanceAction, setPendingAttendanceAction] = useState<'in' | 'out' | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'in' | 'out' | null>(null);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
  /** null = kamera belakang (ideal) pada pembukaan pertama */
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const hasAutoVerified = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [monitorPage, setMonitorPage] = useState(1);
  const [monitorPerPage, setMonitorPerPage] = useState(10);

  // ── Hooks ────────────────────────────────────────────────────────
  const { locations, create: createLocation, update: updateLocation, remove: removeLocation } = useWorkLocations();
  const { assignments, create: createAssignment, remove: removeAssignment } = useLocationAssignments();
  const { attendances, clockIn, clockOut } = useAttendance();
  const { settings, update: updateSettings } = useAttendanceSettings();
  const { myAttendances, refetch: refetchMyAttendances } = useMyAttendance();
  const {
    leaveRequests,
    create: createLeave,
    approve: approveLeave,
    reject: rejectLeave,
    remove: removeLeave,
  } = useLeaveRequests(isSuperAdmin ? 'all' : 'my');

  // SA: load users list for assignment form
  const [usersList, setUsersList] = useState<User[]>([]);
  useEffect(() => {
    if (isSuperAdmin) {
      userService.getAll({ limit: 200 }).then(res => setUsersList(res.data)).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  // Rekap bulanan
  const [recapMonth, setRecapMonth] = useState(new Date().getMonth() + 1);
  const [recapYear,  setRecapYear]  = useState(new Date().getFullYear());
  const { recap: recapData, isLoading: recapLoading } = useAttendanceRecap(recapMonth, recapYear);

  // Find assigned location for current user from assignments
  const userAssignment = assignments.find((a) => a.user?.name === userName);
  const userAssignedLocation = locations.find((l) => l.id === userAssignment?.work_location_id);

  // Derive clock-in/out state from real API data
  const todayStr2 = new Date().toISOString().slice(0, 10);
  const todayRecord = myAttendances.find((a) => a.attendance_date === todayStr2);
  const isClockedIn  = !!todayRecord?.clock_in && !todayRecord?.clock_out;
  const hasClockedOut = !!todayRecord?.clock_out;

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-trigger GPS verification once when location assignment is loaded
  useEffect(() => {
    if (!hasAutoVerified.current && (userAssignedLocation || locations.length > 0)) {
      hasAutoVerified.current = true;
      triggerGps();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAssignedLocation, locations]);

  // ── Modals ───────────────────────────────────────────────────────
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);

  // ── Leave list controls (filter/search/pagination/calendar) ─────
  const [leaveSearch, setLeaveSearch] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<'all' | 'Cuti' | 'Izin' | 'Sakit'>('all');
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<'all' | 'Menunggu' | 'Disetujui' | 'Ditolak'>('all');
  const [leaveViewMode, setLeaveViewMode] = useState<'table' | 'calendar'>('table');
  const [leavePage, setLeavePage] = useState(1);
  const [leavePerPage, setLeavePerPage] = useState(10);
  const [leaveSelectedDate, setLeaveSelectedDate] = useState<Date>(new Date());

  // ── Attendance settings form (SA) ───────────────────────────────
  const [timeSettingsForm, setTimeSettingsForm] = useState({
    work_start_time: '08:00',
    work_end_time: '17:00',
    late_grace_minutes: 0,
  });

  // ── Add location form state ──────────────────────────────────────
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    radius_m: 50,
    latitude: -6.2088,
    longitude: 106.8456,
  });
  const [pickedPosition, setPickedPosition] = useState<[number, number]>([-6.2088, 106.8456]);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [locationCurrentLoading, setLocationCurrentLoading] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState<OSMSearchResult[]>([]);

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
    user_id: '',
  });

  // ── Assignment form state ────────────────────────────────────────
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ user_id: '', work_location_id: '' });
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setTimeSettingsForm({
      work_start_time: fmtTimeInput(settings.work_start_time),
      work_end_time: fmtTimeInput(settings.work_end_time),
      late_grace_minutes: Number(settings.late_grace_minutes || 0),
    });
  }, [settings]);

  /* ── Handlers ────────────────────────────────────────────────────── */

  const triggerGps = () => {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung GPS');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const gps: [number, number] = [latitude, longitude];
        setUserGpsPos(gps);
        if (userAssignedLocation?.latitude != null && userAssignedLocation?.longitude != null) {
          const dist = haversineM(latitude, longitude,
            Number(userAssignedLocation.latitude), Number(userAssignedLocation.longitude));
          const d = Math.round(dist);
          setDistanceM(d);
          const radius = userAssignedLocation.radius_m ?? 100;
          if (d <= radius) {
            setIsLocationVerified(true);
            setGpsError(null);
          } else {
            setIsLocationVerified(false);
            setGpsError(`Di luar area absensi. Jarak: ${d}m, maks: ${radius}m`);
          }
        } else {
          // Tidak ada penugasan lokasi — blokir absensi
          setIsLocationVerified(false);
          setGpsError('Anda belum ditugaskan ke lokasi absensi. Hubungi admin.');
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsError('GPS gagal: ' + err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleVerifyLocation = () => triggerGps();

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  };

  const closeCameraModal = () => {
    stopCameraStream();
    setShowCameraModal(false);
    setCameraTarget(null);
    setCameraError(null);
    setPendingAttendanceAction(null);
    setVideoInputDevices([]);
  };

  const startCameraStream = async (deviceId: string | null) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Browser tidak mendukung kamera');
      return;
    }
    stopCameraStream();
    setCameraStarting(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }
      const listed = await navigator.mediaDevices.enumerateDevices();
      const videos = listed.filter((d) => d.kind === 'videoinput');
      setVideoInputDevices(videos);
      const active = stream.getVideoTracks()[0]?.getSettings?.()?.deviceId;
      if (active) setSelectedCameraId(active);
    } catch {
      setCameraError('Tidak bisa membuka kamera. Pastikan izin kamera sudah diberikan.');
      toast.error('Gagal membuka kamera');
    } finally {
      setCameraStarting(false);
    }
  };

  const cycleNextCamera = () => {
    if (videoInputDevices.length < 2) return;
    const idx = Math.max(
      0,
      videoInputDevices.findIndex((d) => d.deviceId === selectedCameraId),
    );
    const next = videoInputDevices[(idx + 1) % videoInputDevices.length];
    setSelectedCameraId(next.deviceId);
    void startCameraStream(next.deviceId);
  };

  const openCameraCapture = async (kind: 'in' | 'out') => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Browser tidak mendukung kamera');
      return;
    }
    setCameraTarget(kind);
    setCameraError(null);
    setShowCameraModal(true);
    await startCameraStream(selectedCameraId);
  };

  const clearClockPhoto = (kind: 'in' | 'out') => {
    if (kind === 'in') {
      if (clockInPhotoPreview) URL.revokeObjectURL(clockInPhotoPreview);
      setClockInPhoto(null);
      setClockInPhotoPreview(null);
      return;
    }

    if (clockOutPhotoPreview) URL.revokeObjectURL(clockOutPhotoPreview);
    setClockOutPhoto(null);
    setClockOutPhotoPreview(null);
  };

  const handleCaptureFromCamera = async () => {
    if (!cameraTarget) {
      toast.error('Target foto belum dipilih');
      return;
    }

    const video = cameraVideoRef.current;
    const canvas = cameraCanvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Kamera belum siap');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast.error('Gagal memproses gambar kamera');
      return;
    }

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });

      if (!blob) {
        toast.error('Gagal mengambil foto dari kamera');
        return;
      }

      setPhotoCompressing(true);
      const rawFile = new File([blob], `attendance-${cameraTarget}-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const compressed = await compressImageToFile(rawFile, 1200 * 1024);
      const previewUrl = URL.createObjectURL(compressed);
      const target = cameraTarget;
      const shouldSubmit = pendingAttendanceAction === target;

      if (target === 'in') {
        if (clockInPhotoPreview) URL.revokeObjectURL(clockInPhotoPreview);
        setClockInPhoto(compressed);
        setClockInPhotoPreview(previewUrl);
      } else {
        if (clockOutPhotoPreview) URL.revokeObjectURL(clockOutPhotoPreview);
        setClockOutPhoto(compressed);
        setClockOutPhotoPreview(previewUrl);
      }

      closeCameraModal();

      if (shouldSubmit) {
        if (target === 'in') {
          await submitClockIn(compressed);
        } else {
          await submitClockOut(compressed);
        }
      }
    } catch {
      toast.error('Gagal memproses foto. Coba lagi.');
    } finally {
      setPhotoCompressing(false);
    }
  };

  useEffect(() => () => {
    stopCameraStream();
    if (clockInPhotoPreview) URL.revokeObjectURL(clockInPhotoPreview);
    if (clockOutPhotoPreview) URL.revokeObjectURL(clockOutPhotoPreview);
  }, [clockInPhotoPreview, clockOutPhotoPreview]);

  const submitClockIn = async (photo?: File) => {
    if (activeApprovedLeave) {
      toast.info('Anda sedang dalam periode izin/cuti yang disetujui. Tidak perlu absen masuk.');
      return;
    }
    if (!userGpsPos) {
      toast.error('Verifikasi GPS terlebih dahulu');
      return;
    }
    if (!isLocationVerified) {
      toast.error('Anda berada di luar area absensi yang ditentukan');
      return;
    }
    const photoFile = photo ?? clockInPhoto;
    if (!photoFile) {
      toast.error('Ambil foto absen masuk terlebih dahulu');
      return;
    }
    try {
      await clockIn({ lat: userGpsPos[0], lng: userGpsPos[1], photo: photoFile });
      await refetchMyAttendances();
      clearClockPhoto('in');
    } catch {
      // hook already shows toast
    }
  };

  const submitClockOut = async (photo?: File) => {
    if (activeApprovedLeave) {
      toast.info('Anda sedang dalam periode izin/cuti yang disetujui. Tidak perlu absen pulang.');
      return;
    }
    if (!userGpsPos) {
      toast.error('Verifikasi GPS terlebih dahulu');
      return;
    }
    const photoFile = photo ?? clockOutPhoto;
    if (!photoFile) {
      toast.error('Ambil foto absen pulang terlebih dahulu');
      return;
    }
    try {
      await clockOut({ lat: userGpsPos[0], lng: userGpsPos[1], photo: photoFile });
      await refetchMyAttendances();
      clearClockPhoto('out');
    } catch {
      // hook already shows toast
    }
  };

  const handleClockIn = async () => {
    if (!clockInPhoto) {
      setPendingAttendanceAction('in');
      await openCameraCapture('in');
      return;
    }

    await submitClockIn();
  };

  const handleClockOut = async () => {
    if (!clockOutPhoto) {
      setPendingAttendanceAction('out');
      await openCameraCapture('out');
      return;
    }

    await submitClockOut();
  };

  const resetLocationForm = () => {
    setNewLocation({ name: '', address: '', radius_m: 50, latitude: -6.2088, longitude: 106.8456 });
    setPickedPosition([-6.2088, 106.8456]);
    setLocationSearchQuery('');
    setLocationSearchResults([]);
    setEditingLocationId(null);
  };

  const openCreateLocationModal = () => {
    resetLocationForm();
    setShowAddLocationModal(true);
  };

  const handleStartEditLocation = (loc: WorkLocation) => {
    setEditingLocationId(loc.id);
    setNewLocation({
      name: loc.name ?? '',
      address: loc.address ?? '',
      radius_m: Number(loc.radius_m ?? 50),
      latitude: Number(loc.latitude ?? -6.2088),
      longitude: Number(loc.longitude ?? 106.8456),
    });
    setPickedPosition([Number(loc.latitude ?? -6.2088), Number(loc.longitude ?? 106.8456)]);
    setLocationSearchQuery('');
    setLocationSearchResults([]);
    setShowAddLocationModal(true);
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLocationId) {
        await updateLocation(editingLocationId, newLocation);
      } else {
        await createLocation(newLocation);
      }
      setShowAddLocationModal(false);
      resetLocationForm();
    } catch {
      /* hook shows toast */
    }
  };

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = locationSearchQuery.trim();
    if (!q) return;

    try {
      setLocationSearchLoading(true);
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=7&countrycodes=id&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!res.ok) throw new Error('Gagal mencari lokasi');
      const data = (await res.json()) as OSMSearchResult[];
      setLocationSearchResults(Array.isArray(data) ? data : []);
      if ((Array.isArray(data) ? data.length : 0) === 0) {
        toast.info('Lokasi tidak ditemukan. Coba kata kunci lain.');
      }
    } catch {
      toast.error('Gagal mencari lokasi. Coba beberapa saat lagi.');
    } finally {
      setLocationSearchLoading(false);
    }
  };

  const handlePickSearchResult = (item: OSMSearchResult) => {
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    setPickedPosition([lat, lng]);
    setNewLocation((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: prev.address?.trim() ? prev.address : item.display_name,
      name: prev.name?.trim() ? prev.name : item.display_name.split(',')[0] ?? prev.name,
    }));
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung GPS');
      return;
    }

    setLocationCurrentLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        });
      });

      const lat = Number(position.coords.latitude);
      const lng = Number(position.coords.longitude);
      setPickedPosition([lat, lng]);

      setNewLocation((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));

      // Coba isi alamat otomatis (best-effort)
      try {
        const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
        const res = await fetch(reverseUrl, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const data = (await res.json()) as { display_name?: string };
          const displayName = data.display_name ?? '';
          if (displayName) {
            setNewLocation((prev) => ({
              ...prev,
              address: prev.address.trim() ? prev.address : displayName,
              name: prev.name.trim() ? prev.name : (displayName.split(',')[0] || prev.name),
            }));
          }
        }
      } catch {
        // no-op, koordinat sudah terisi
      }

      toast.success('Lokasi saat ini berhasil digunakan');
    } catch {
      toast.error('Gagal mengambil lokasi saat ini. Pastikan izin lokasi aktif.');
    } finally {
      setLocationCurrentLoading(false);
    }
  };

  const handleDeleteLocation = async (loc: WorkLocation) => {
    if (await showConfirm({ title: 'Hapus Lokasi', description: `Apakah Anda yakin ingin menghapus lokasi "${loc.name}"?` })) {
      try { await removeLocation(loc.id); } catch { /* hook shows toast */ }
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAssignment(assignForm.user_id, assignForm.work_location_id);
      setShowAssignModal(false);
      setAssignForm({ user_id: '', work_location_id: '' });
      setEditingAssignmentId(null);
    } catch { /* hook shows toast */ }
  };

  const handleStartEditAssignment = (assignment: UserLocationAssignment) => {
    setEditingAssignmentId(assignment.id);
    setAssignForm({
      user_id: assignment.user_id,
      work_location_id: assignment.work_location_id,
    });
    setShowAssignModal(true);
  };

  const handleDeleteAssignment = async (id: string, name: string) => {
    if (await showConfirm({ title: 'Hapus Penugasan', description: `Hapus penugasan lokasi untuk ${name}?` })) {
      try { await removeAssignment(id); } catch { /* hook shows toast */ }
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSuperAdmin && !leaveForm.user_id) {
      toast.error('Pilih karyawan terlebih dahulu.');
      return;
    }

    try {
      await createLeave({
        type: leaveForm.type,
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date || leaveForm.start_date,
        reason: leaveForm.reason || undefined,
        user_id: isSuperAdmin ? leaveForm.user_id : undefined,
      });
      setShowLeaveModal(false);
      setLeaveForm({ type: 'Cuti', start_date: '', end_date: '', reason: '', user_id: '' });
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

  const handleSaveAttendanceSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        work_start_time: `${timeSettingsForm.work_start_time}:00`,
        work_end_time: `${timeSettingsForm.work_end_time}:00`,
        late_grace_minutes: Number(timeSettingsForm.late_grace_minutes || 0),
      });
    } catch {
      // hook already shows toast
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

  const monitorTotalPages = Math.max(1, Math.ceil(filteredAttendances.length / monitorPerPage));
  const monitorCurrentPage = Math.min(monitorPage, monitorTotalPages);
  const monitorPagedAttendances = filteredAttendances.slice(
    (monitorCurrentPage - 1) * monitorPerPage,
    monitorCurrentPage * monitorPerPage,
  );

  const filteredLeaveRequests = leaveRequests.filter((req) => {
    if (leaveTypeFilter !== 'all' && req.type !== leaveTypeFilter) return false;
    if (leaveStatusFilter !== 'all' && req.status !== leaveStatusFilter) return false;

    if (leaveSearch) {
      const q = leaveSearch.toLowerCase();
      const name = req.user?.name?.toLowerCase() ?? '';
      const reason = req.reason?.toLowerCase() ?? '';
      const type = req.type.toLowerCase();
      if (!name.includes(q) && !reason.includes(q) && !type.includes(q)) return false;
    }

    return true;
  });

  const leaveTotalPages = Math.max(1, Math.ceil(filteredLeaveRequests.length / leavePerPage));
  const leaveCurrentPage = Math.min(leavePage, leaveTotalPages);
  const leavePagedRequests = filteredLeaveRequests.slice(
    (leaveCurrentPage - 1) * leavePerPage,
    leaveCurrentPage * leavePerPage,
  );

  const leaveRequestsOnSelectedDate = filteredLeaveRequests.filter((req) => {
    const d = new Date(leaveSelectedDate);
    const start = new Date(req.start_date);
    const end = new Date(req.end_date || req.start_date);
    return d >= start && d <= end;
  });

  useEffect(() => {
    setLeavePage(1);
  }, [leaveSearch, leaveStatusFilter, leaveTypeFilter, leavePerPage]);

  useEffect(() => {
    setMonitorPage(1);
  }, [searchQuery, monitorPerPage]);

  const getLeaveCountByDate = (date: Date) => filteredLeaveRequests.filter((req) => {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const start = new Date(req.start_date);
    const end = new Date(req.end_date || req.start_date);
    const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return day >= startOnly && day <= endOnly;
  }).length;

  const activeApprovedLeave = leaveRequests.find((req) => {
    if (req.status !== 'Disetujui') return false;
    const today = new Date(todayStr);
    const start = new Date(req.start_date);
    const end = new Date(req.end_date || req.start_date);
    return today >= start && today <= end;
  });

  /* ================================================================
   *  NON-SUPER-ADMIN VIEW (Employee self-service)
   * ================================================================ */
  if (!isSuperAdmin) {
    const locLat = Number(userAssignedLocation?.latitude ?? -6.2);
    const locLng = Number(userAssignedLocation?.longitude ?? 106.8);

    return (
      <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold leading-tight">Presensi Kehadiran</h2>
            <p className="text-sm sm:text-base text-gray-500 mt-0.5">Silakan lakukan absensi kehadiran harian Anda.</p>
          </div>
          <div className="bg-white px-3 sm:px-4 py-2 rounded-xl border border-gray-200 flex items-center gap-3 shadow-sm shrink-0 self-start sm:self-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Clock-in card */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm flex flex-col items-center text-center space-y-4 sm:space-y-6">
              {activeApprovedLeave && (
                <div className="w-full p-4 rounded-2xl border border-blue-100 bg-blue-50 text-left">
                  <p className="text-[10px] font-bold text-blue-600 uppercase">Izin/Cuti Aktif</p>
                  <p className="text-sm font-bold text-blue-900">{activeApprovedLeave.type} Disetujui</p>
                  <p className="text-xs text-blue-700">
                    Periode {fmtDate(activeApprovedLeave.start_date)}
                    {activeApprovedLeave.end_date !== activeApprovedLeave.start_date
                      ? ` – ${fmtDate(activeApprovedLeave.end_date)}`
                      : ''}
                  </p>
                </div>
              )}

              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary relative">
                <Clock size={48} />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                  <div className={`w-4 h-4 rounded-full ${isClockedIn ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {hasClockedOut ? 'Sudah Absen Pulang' : isClockedIn ? 'Sudah Masuk' : 'Belum Absen'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {hasClockedOut
                    ? `Anda pulang pukul ${fmtTime(todayRecord?.clock_out)} · Hadir hari ini ✓`
                    : isClockedIn
                    ? `Anda masuk pukul ${fmtTime(todayRecord?.clock_in)} hari ini.`
                    : 'Jangan lupa untuk mencatat kehadiran tepat waktu.'}
                </p>
              </div>
              {hasClockedOut ? (
                <div className="w-full py-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-2xl font-bold text-base flex items-center justify-center gap-2">
                  <CheckCircle2 size={22} />
                  Absensi Selesai Hari Ini
                </div>
              ) : !isClockedIn ? (
                <div className="w-full space-y-3">
                  <label className="block text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Foto Absen Masuk</label>
                  {clockInPhotoPreview && (
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200">
                      <img src={clockInPhotoPreview} alt="Preview foto absen masuk" className="w-full h-36 object-cover" />
                      <button
                        type="button"
                        onClick={() => clearClockPhoto('in')}
                        className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black/70"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleClockIn}
                    disabled={!!activeApprovedLeave || gpsLoading || photoCompressing || !userGpsPos || !isLocationVerified}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {photoCompressing ? <Camera size={22} className="animate-pulse" /> : <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform" />}
                    {photoCompressing ? 'Memproses Foto...' : 'Absen Masuk'}
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-3">
                  <label className="block text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Foto Absen Pulang</label>
                  {clockOutPhotoPreview && (
                    <div className="relative rounded-2xl overflow-hidden border border-gray-200">
                      <img src={clockOutPhotoPreview} alt="Preview foto absen pulang" className="w-full h-36 object-cover" />
                      <button
                        type="button"
                        onClick={() => clearClockPhoto('out')}
                        className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black/70"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={handleClockOut}
                    disabled={!!activeApprovedLeave || gpsLoading || photoCompressing || !userGpsPos}
                    className="w-full py-4 border-2 border-primary text-primary rounded-2xl font-bold text-lg hover:bg-primary/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {photoCompressing ? <Camera size={22} className="animate-pulse" /> : <LogOut size={24} />}
                    {photoCompressing ? 'Memproses Foto...' : 'Absen Pulang'}
                  </button>
                </div>
              )}

              {/* GPS Status Panel */}
              {gpsLoading ? (
                <div className="bg-blue-50 w-full p-4 rounded-2xl flex items-center gap-3 border border-blue-100 animate-pulse">
                  <Navigation className="text-blue-500" size={20} />
                  <p className="text-xs font-bold text-blue-600">Mengambil posisi GPS...</p>
                </div>
              ) : gpsError ? (
                <div className="bg-red-50 w-full p-4 rounded-2xl border border-red-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="text-red-500 shrink-0" size={16} />
                    <p className="text-xs font-bold text-red-700">{gpsError}</p>
                  </div>
                  <button
                    onClick={handleVerifyLocation}
                    className="w-full py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : userGpsPos && isLocationVerified ? (
                <div className="bg-green-50 w-full p-4 rounded-2xl flex items-center gap-3 border border-green-100">
                  <CheckCircle2 className="text-green-600 shrink-0" size={20} />
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-green-600 uppercase">GPS Terverifikasi</p>
                    <p className="text-xs font-bold text-green-800">
                      {distanceM !== null ? `Dalam area (${distanceM}m dari titik absensi)` : 'Posisi GPS aktif'}
                    </p>
                  </div>
                </div>
              ) : userGpsPos && !isLocationVerified ? (
                <div className="bg-orange-50 w-full p-4 rounded-2xl flex items-center gap-3 border border-orange-100">
                  <AlertCircle className="text-orange-500 shrink-0" size={20} />
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-orange-500 uppercase">Di Luar Area</p>
                    <p className="text-xs font-bold text-orange-800">
                      Jarak: {distanceM}m, maks: {userAssignedLocation?.radius_m ?? 100}m
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 w-full p-4 rounded-2xl flex items-center gap-3 border border-gray-100">
                  <Navigation className="text-gray-400" size={20} />
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">GPS Belum Aktif</p>
                    <p className="text-xs text-gray-500">Klik Verifikasi GPS untuk memulai</p>
                  </div>
                </div>
              )}

              <div className="w-full pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div className="text-left">
                  <p className="text-xs text-gray-400 font-medium uppercase">Masuk</p>
                  <p className="font-bold text-gray-800">{fmtTime(todayRecord?.clock_in)}</p>
                </div>
                <div className="text-left border-l border-gray-100 pl-4">
                  <p className="text-xs text-gray-400 font-medium uppercase">Pulang</p>
                  <p className="font-bold text-gray-800">{fmtTime(todayRecord?.clock_out)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2 min-h-0">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm overflow-hidden h-[min(52vh,420px)] sm:h-[400px] lg:h-[min(70vh,520px)] flex flex-col">
              <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-sm sm:text-base text-gray-800 flex items-center gap-2 min-w-0">
                  <Target size={18} className="text-primary shrink-0" />
                  <span className="truncate">Peta Lokasi Kerja</span>
                </h3>
                <button
                  type="button"
                  onClick={handleVerifyLocation}
                  disabled={gpsLoading}
                  className="text-xs font-bold text-primary hover:underline disabled:opacity-50 touch-manipulation py-1.5 px-1 shrink-0"
                >
                  {gpsLoading ? 'Mengambil GPS...' : 'Refresh GPS'}
                </button>
              </div>
              <div className="flex-1 min-h-[220px] w-full relative z-0">
                <MapContainer
                  center={userGpsPos ?? [locLat, locLng]}
                  zoom={16}
                  style={{ height: '100%', width: '100%', minHeight: '220px' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {/* Work location marker (red pin) */}
                  <Marker position={[locLat, locLng]} />
                  {/* Geofence radius circle */}
                  {userAssignedLocation?.radius_m != null && (
                    <Circle
                      center={[locLat, locLng]}
                      radius={userAssignedLocation.radius_m}
                      pathOptions={{
                        color: isLocationVerified ? '#22c55e' : '#ef4444',
                        fillColor: isLocationVerified ? '#22c55e' : '#ef4444',
                        fillOpacity: 0.08,
                        weight: 2,
                      }}
                    />
                  )}
                  {/* User's current GPS position (blue dot) */}
                  {userGpsPos && (
                    <Marker position={userGpsPos} icon={userGpsIcon} />
                  )}
                  <ChangeView center={userGpsPos ?? [locLat, locLng]} />
                </MapContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Pengajuan izin untuk semua role non-super-admin */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-gray-800 text-sm sm:text-base">Pengajuan Izin & Cuti Saya</h3>
            <button
              type="button"
              onClick={() => setShowLeaveModal(true)}
              className="w-full sm:w-auto justify-center px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 touch-manipulation"
            >
              <Plus size={16} /> Ajukan Izin
            </button>
          </div>

          <div className="p-4 border-b border-gray-100 bg-gray-50/40 grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={leaveSearch}
                onChange={(e) => setLeaveSearch(e.target.value)}
                placeholder="Cari jenis/alasan..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <select
              value={leaveTypeFilter}
              onChange={(e) => setLeaveTypeFilter(e.target.value as 'all' | 'Cuti' | 'Izin' | 'Sakit')}
              className="lg:col-span-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">Semua Jenis</option>
              <option value="Cuti">Cuti</option>
              <option value="Izin">Izin</option>
              <option value="Sakit">Sakit</option>
            </select>
            <select
              value={leaveStatusFilter}
              onChange={(e) => setLeaveStatusFilter(e.target.value as 'all' | 'Menunggu' | 'Disetujui' | 'Ditolak')}
              className="lg:col-span-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
            >
              <option value="all">Semua Status</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Ditolak">Ditolak</option>
            </select>
            <select
              value={leavePerPage}
              onChange={(e) => setLeavePerPage(Number(e.target.value))}
              className="lg:col-span-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
            >
              <option value={5}>5 / halaman</option>
              <option value={10}>10 / halaman</option>
              <option value={20}>20 / halaman</option>
            </select>
            <div className="lg:col-span-2 flex rounded-lg border border-gray-200 overflow-hidden bg-white">
              <button
                onClick={() => setLeaveViewMode('table')}
                className={`flex-1 px-3 py-2 text-xs font-bold ${leaveViewMode === 'table' ? 'bg-primary text-white' : 'text-gray-600'}`}
              >
                Tabel
              </button>
              <button
                onClick={() => setLeaveViewMode('calendar')}
                className={`flex-1 px-3 py-2 text-xs font-bold ${leaveViewMode === 'calendar' ? 'bg-primary text-white' : 'text-gray-600'}`}
              >
                Kalender
              </button>
            </div>
          </div>

          {leaveViewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                  <th className="px-6 py-4">Jenis</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Alasan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leavePagedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{req.type}</td>
                    <td className="px-6 py-4 text-sm">
                      {fmtDate(req.start_date)}
                      {req.end_date !== req.start_date && ` – ${fmtDate(req.end_date)}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-[280px] truncate">{req.reason ?? '-'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      {req.status === 'Menunggu' ? (
                        <button
                          onClick={() => handleDeleteLeave(req)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100"
                        >
                          <Trash2 size={12} /> Batal
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}

                {leavePagedRequests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Belum ada pengajuan izin.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <p className="text-gray-500">Total {filteredLeaveRequests.length} data</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLeavePage((p) => Math.max(1, p - 1))}
                  disabled={leaveCurrentPage <= 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <span className="text-gray-600">{leaveCurrentPage} / {leaveTotalPages}</span>
                <button
                  onClick={() => setLeavePage((p) => Math.min(leaveTotalPages, p + 1))}
                  disabled={leaveCurrentPage >= leaveTotalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </div>
          ) : (
            <div className="p-4 grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 rounded-2xl border border-gray-200 p-4 bg-white rc-absensi-wrapper">
                <Calendar
                  locale="id-ID"
                  value={leaveSelectedDate}
                  onClickDay={(value) => setLeaveSelectedDate(value)}
                  tileClassName={({ date }) => {
                    const count = getLeaveCountByDate(date);
                    return count > 0 ? 'rc-has-leave' : undefined;
                  }}
                  tileContent={({ date, view }) => {
                    if (view !== 'month') return null;
                    const count = getLeaveCountByDate(date);
                    if (count <= 0) return null;
                    return <span className="rc-leave-badge">{count}</span>;
                  }}
                />
              </div>
              <div className="rounded-2xl border border-gray-200 p-4">
                <h4 className="font-bold text-gray-800 mb-3">
                  Pengajuan pada {leaveSelectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h4>
                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {leaveRequestsOnSelectedDate.length === 0 && (
                    <p className="text-sm text-gray-400">Tidak ada pengajuan pada tanggal ini.</p>
                  )}
                  {leaveRequestsOnSelectedDate.map((req) => (
                    <div key={req.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                      <p className="text-sm font-bold">{req.type} · <span className="font-medium">{req.user?.name ?? userName}</span></p>
                      <p className="text-xs text-gray-500">{fmtDate(req.start_date)}{req.end_date !== req.start_date ? ` – ${fmtDate(req.end_date)}` : ''}</p>
                      <div className="mt-1"><StatusBadge status={req.status} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Pengajuan Izin (non-super-admin) */}
        {showLeaveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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

        {showCameraModal && (
          <div className="fixed inset-0 z-[110] flex flex-col sm:items-center sm:justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-md sm:rounded-3xl shadow-2xl flex flex-col sm:p-5 overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-2 sm:px-0 sm:pt-0 shrink-0">
                <h3 className="text-base sm:text-lg font-bold pr-2">
                  Ambil Foto {cameraTarget === 'in' ? 'Absen Masuk' : 'Absen Pulang'}
                </h3>
                <button
                  type="button"
                  onClick={closeCameraModal}
                  className="p-2 hover:bg-gray-100 rounded-full shrink-0 touch-manipulation"
                  aria-label="Tutup"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-4 sm:px-0 space-y-3 shrink-0">
                {videoInputDevices.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="sr-only" htmlFor="absensi-camera-select">
                      Pilih kamera
                    </label>
                    <select
                      id="absensi-camera-select"
                      value={selectedCameraId ?? ''}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedCameraId(id || null);
                        void startCameraStream(id || null);
                      }}
                      disabled={cameraStarting}
                      className="flex-1 min-w-0 text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 font-medium touch-manipulation"
                    >
                      {videoInputDevices.map((d, i) => (
                        <option key={d.deviceId || `cam-${i}`} value={d.deviceId}>
                          {d.label || `Kamera ${i + 1}`}
                        </option>
                      ))}
                    </select>
                    {videoInputDevices.length > 1 && (
                      <button
                        type="button"
                        onClick={cycleNextCamera}
                        disabled={cameraStarting}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 touch-manipulation whitespace-nowrap"
                        title="Ganti kamera berikutnya"
                      >
                        <SwitchCamera size={18} />
                        <span className="sm:inline">Ganti</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 min-h-0 flex flex-col px-4 sm:px-0 pb-4">
                <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black relative flex-1 min-h-[200px] max-h-[min(55vh,420px)] sm:max-h-none sm:h-72 w-full">
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full min-h-[200px] sm:min-h-0 sm:h-72 object-cover"
                  />
                  {cameraStarting && (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold bg-black/50">
                      Membuka kamera...
                    </div>
                  )}
                </div>

                {cameraError && (
                  <div className="mt-3 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-medium">
                    {cameraError}
                  </div>
                )}

                <div className="flex gap-3 mt-4 pb-[env(safe-area-inset-bottom,0px)]">
                  <button
                    type="button"
                    onClick={closeCameraModal}
                    className="flex-1 min-h-[48px] py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 touch-manipulation"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleCaptureFromCamera}
                    disabled={cameraStarting || !!cameraError || photoCompressing}
                    className="flex-1 min-h-[48px] py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    {photoCompressing ? 'Memproses...' : 'Ambil Foto'}
                  </button>
                </div>
              </div>
              <canvas ref={cameraCanvasRef} className="hidden" />
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ================================================================
   *  SUPER ADMIN VIEW
   * ================================================================ */
  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden pb-2">
      {ConfirmDialogElement}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold">Absensi Karyawan</h2>
          <p className="text-sm sm:text-base text-gray-500">Monitoring kehadiran real-time dan rekapitulasi pegawai.</p>
        </div>
        <div className="overflow-x-auto -mx-1 px-1 pb-1 sm:mx-0 sm:px-0">
          <div className="flex bg-gray-100 p-1 rounded-xl w-max min-w-full sm:min-w-0 sm:w-fit">
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
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap touch-manipulation shrink-0 ${
                    activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
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
                {settings && (
                  <div className="hidden md:block bg-white px-3 py-2 rounded-lg border border-gray-200 text-xs">
                    <p className="text-gray-500">Jam kerja</p>
                    <p className="font-bold text-gray-700">
                      {fmtTimeInput(settings.work_start_time)} - {fmtTimeInput(settings.work_end_time)}
                      <span className="font-normal text-gray-500"> (toleransi {settings.late_grace_minutes} menit)</span>
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={monitorPerPage}
                  onChange={(e) => setMonitorPerPage(Number(e.target.value))}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                >
                  <option value={10}>10 / halaman</option>
                  <option value={20}>20 / halaman</option>
                  <option value={50}>50 / halaman</option>
                </select>
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
                  {monitorPagedAttendances.map((att) => (
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
                  {monitorPagedAttendances.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Belum ada data absensi.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <p className="text-gray-500">Total {filteredAttendances.length} data</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMonitorPage((p) => Math.max(1, p - 1))}
                    disabled={monitorCurrentPage <= 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
                  >
                    Sebelumnya
                  </button>
                  <span className="text-gray-600">{monitorCurrentPage} / {monitorTotalPages}</span>
                  <button
                    onClick={() => setMonitorPage((p) => Math.min(monitorTotalPages, p + 1))}
                    disabled={monitorCurrentPage >= monitorTotalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Tab: Rekap Bulanan ──────────────────────────────── */}
        {activeTab === 'recap' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Month/Year Selector */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-4">
              <span className="text-sm font-bold text-gray-700">Periode:</span>
              <select
                value={recapMonth}
                onChange={(e) => setRecapMonth(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
              >
                {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
                  .map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <select
                value={recapYear}
                onChange={(e) => setRecapYear(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
              >
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {recapLoading && <span className="text-xs text-gray-400 animate-pulse">Memuat...</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase">
                  <tr>
                    <th className="px-6 py-4">Nama Karyawan</th>
                    <th className="px-6 py-4 text-center text-green-600">Hadir</th>
                    <th className="px-6 py-4 text-center text-orange-600">Terlambat</th>
                    <th className="px-6 py-4 text-center text-indigo-600">Cuti</th>
                    <th className="px-6 py-4 text-center text-blue-600">Izin/Sakit</th>
                    <th className="px-6 py-4 text-center text-red-600">Alpha</th>
                    <th className="px-6 py-4 text-right">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recapData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-sm">{item.name}</td>
                      <td className="px-6 py-4 text-center text-sm">{item.present}</td>
                      <td className="px-6 py-4 text-center text-sm">{item.late}</td>
                      <td className="px-6 py-4 text-center text-sm">{item.cuti}</td>
                      <td className="px-6 py-4 text-center text-sm">{item.permit}</td>
                      <td className="px-6 py-4 text-center text-sm">{item.alpha}</td>
                      <td className="px-6 py-4 text-right font-bold text-sm text-primary">{item.score}%</td>
                    </tr>
                  ))}
                  {!recapLoading && recapData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">Belum ada data absensi untuk periode ini.</td>
                    </tr>
                  )}
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
                <Plus size={16} /> {isSuperAdmin ? 'Tambah Izin Karyawan' : 'Ajukan Izin'}
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 bg-gray-50/40 grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={leaveSearch}
                  onChange={(e) => setLeaveSearch(e.target.value)}
                  placeholder="Cari nama/alasan..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <select
                value={leaveTypeFilter}
                onChange={(e) => setLeaveTypeFilter(e.target.value as 'all' | 'Cuti' | 'Izin' | 'Sakit')}
                className="lg:col-span-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">Semua Jenis</option>
                <option value="Cuti">Cuti</option>
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
              </select>
              <select
                value={leaveStatusFilter}
                onChange={(e) => setLeaveStatusFilter(e.target.value as 'all' | 'Menunggu' | 'Disetujui' | 'Ditolak')}
                className="lg:col-span-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">Semua Status</option>
                <option value="Menunggu">Menunggu</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Ditolak">Ditolak</option>
              </select>
              <select
                value={leavePerPage}
                onChange={(e) => setLeavePerPage(Number(e.target.value))}
                className="lg:col-span-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
              >
                <option value={5}>5 / halaman</option>
                <option value={10}>10 / halaman</option>
                <option value={20}>20 / halaman</option>
              </select>
              <div className="lg:col-span-2 flex rounded-lg border border-gray-200 overflow-hidden bg-white">
                <button
                  onClick={() => setLeaveViewMode('table')}
                  className={`flex-1 px-3 py-2 text-xs font-bold ${leaveViewMode === 'table' ? 'bg-primary text-white' : 'text-gray-600'}`}
                >
                  Tabel
                </button>
                <button
                  onClick={() => setLeaveViewMode('calendar')}
                  className={`flex-1 px-3 py-2 text-xs font-bold ${leaveViewMode === 'calendar' ? 'bg-primary text-white' : 'text-gray-600'}`}
                >
                  Kalender
                </button>
              </div>
            </div>

            {leaveViewMode === 'table' ? (
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
                  {leavePagedRequests.map((req) => (
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
                  {leavePagedRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Belum ada pengajuan izin.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <p className="text-gray-500">Total {filteredLeaveRequests.length} data</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLeavePage((p) => Math.max(1, p - 1))}
                    disabled={leaveCurrentPage <= 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
                  >
                    Sebelumnya
                  </button>
                  <span className="text-gray-600">{leaveCurrentPage} / {leaveTotalPages}</span>
                  <button
                    onClick={() => setLeavePage((p) => Math.min(leaveTotalPages, p + 1))}
                    disabled={leaveCurrentPage >= leaveTotalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            </div>
            ) : (
              <div className="p-4 grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 rounded-2xl border border-gray-200 p-4 bg-white rc-absensi-wrapper">
                  <Calendar
                    locale="id-ID"
                    value={leaveSelectedDate}
                    onClickDay={(value) => setLeaveSelectedDate(value)}
                    tileClassName={({ date }) => {
                      const count = getLeaveCountByDate(date);
                      return count > 0 ? 'rc-has-leave' : undefined;
                    }}
                    tileContent={({ date, view }) => {
                      if (view !== 'month') return null;
                      const count = getLeaveCountByDate(date);
                      if (count <= 0) return null;
                      return <span className="rc-leave-badge">{count}</span>;
                    }}
                  />
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <h4 className="font-bold text-gray-800 mb-3">
                    Siapa yang cuti/izin pada {leaveSelectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </h4>
                  <div className="space-y-2 max-h-[320px] overflow-y-auto">
                    {leaveRequestsOnSelectedDate.length === 0 && (
                      <p className="text-sm text-gray-400">Tidak ada pengajuan pada tanggal ini.</p>
                    )}
                    {leaveRequestsOnSelectedDate.map((req) => (
                      <div key={req.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                        <p className="text-sm font-bold">{req.user?.name ?? '-'} · {req.type}</p>
                        <p className="text-xs text-gray-500">{fmtDate(req.start_date)}{req.end_date !== req.start_date ? ` – ${fmtDate(req.end_date)}` : ''}</p>
                        <div className="mt-1"><StatusBadge status={req.status} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Tab: Pengaturan Lokasi ──────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 p-6 space-y-8">
            <form onSubmit={handleSaveAttendanceSettings} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Pengaturan Jam Kerja</h3>
                <p className="text-sm text-gray-500">Jam masuk/pulang dan toleransi keterlambatan tidak lagi hardcoded.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase">Jam Masuk</label>
                  <input
                    type="time"
                    value={timeSettingsForm.work_start_time}
                    onChange={(e) => setTimeSettingsForm((p) => ({ ...p, work_start_time: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase">Jam Pulang</label>
                  <input
                    type="time"
                    value={timeSettingsForm.work_end_time}
                    onChange={(e) => setTimeSettingsForm((p) => ({ ...p, work_end_time: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase">Toleransi Telat (menit)</label>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={timeSettingsForm.late_grace_minutes}
                    onChange={(e) => setTimeSettingsForm((p) => ({ ...p, late_grace_minutes: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-bold">
                    Simpan Jam Kerja
                  </button>
                </div>
              </div>
            </form>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Location list */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 text-lg">Daftar Titik Lokasi Absen</h3>
                  <button
                    onClick={openCreateLocationModal}
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
                            onClick={() => handleStartEditLocation(loc)}
                            className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-primary transition-colors"
                            title="Edit Lokasi"
                          >
                            <Pencil size={15} />
                          </button>
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
                  <button
                    onClick={() => {
                      setEditingAssignmentId(null);
                      setAssignForm({ user_id: '', work_location_id: '' });
                      setShowAssignModal(true);
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-primary/20"
                  >
                    <Plus size={16} /> Assign Karyawan
                  </button>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky top-0">
                      <tr>
                        <th className="px-6 py-4">Karyawan</th>
                        <th className="px-6 py-4">Lokasi Absensi</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {assignments.map((a) => (
                        <tr key={a.id}>
                          <td className="px-6 py-4 font-bold">{a.user?.name ?? '-'}</td>
                          <td className="px-6 py-4 text-gray-600">{a.location?.name ?? '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleStartEditAssignment(a)}
                                className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-primary rounded-lg transition-colors"
                                title="Edit Penempatan"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteAssignment(a.id, a.user?.name ?? '-')}
                                className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {assignments.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-gray-400">Belum ada penugasan.</td>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{isSuperAdmin ? 'Form Izin/Cuti Karyawan' : 'Form Pengajuan Izin'}</h3>
              <button onClick={() => setShowLeaveModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              {isSuperAdmin && (
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Karyawan</label>
                  <select
                    required
                    className="w-full px-4 py-2 bg-gray-50 border rounded-xl"
                    value={leaveForm.user_id}
                    onChange={(e) => setLeaveForm({ ...leaveForm, user_id: e.target.value })}
                  >
                    <option value="">-- Pilih Karyawan --</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                  <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-2 py-1.5">
                    Saat disimpan oleh Super Admin, pengajuan langsung berstatus Disetujui.
                  </p>
                </div>
              )}

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
                {isSuperAdmin ? 'Simpan & Setujui' : 'Kirim Pengajuan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Tambah Lokasi ───────────────────────────────── */}
      {showAddLocationModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Map Side */}
              <div className="h-[380px] md:h-full min-h-[560px] relative z-0">
                <div className="absolute top-4 right-4 z-[1000] bg-white p-3 rounded-lg shadow-md border border-gray-100 w-[340px] space-y-2">
                  <form onSubmit={handleSearchLocation} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={locationSearchQuery}
                      onChange={(e) => setLocationSearchQuery(e.target.value)}
                      placeholder="Cari kota/jalan/lokasi..."
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
                    />
                    <button
                      type="submit"
                      disabled={locationSearchLoading}
                      className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-bold disabled:opacity-50"
                    >
                      {locationSearchLoading ? '...' : 'Cari'}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locationCurrentLoading}
                    className="w-full px-3 py-2 border border-primary/30 text-primary bg-primary/5 rounded-lg text-sm font-bold disabled:opacity-50"
                  >
                    {locationCurrentLoading ? 'Mengambil lokasi saat ini...' : 'Gunakan Lokasi Saat Ini'}
                  </button>

                  {locationSearchResults.length > 0 && (
                    <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-lg">
                      {locationSearchResults.map((item) => (
                        <button
                          type="button"
                          key={`${item.lat}-${item.lon}`}
                          onClick={() => handlePickSearchResult(item)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 border-b last:border-b-0 border-gray-100"
                        >
                          {item.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <MapContainer center={pickedPosition} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                  <MapZoomControls />
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker position={pickedPosition} setPosition={setPickedPosition} />
                  <ChangeView center={pickedPosition} />
                </MapContainer>
              </div>

              {/* Form Side */}
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">{editingLocationId ? 'Edit Lokasi' : 'Konfigurasi Lokasi'}</h3>
                  <button
                    onClick={() => {
                      setShowAddLocationModal(false);
                      resetLocationForm();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                  >
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
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddLocationModal(false);
                        resetLocationForm();
                      }}
                      className="flex-1 py-3 border-2 border-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                      {editingLocationId ? 'Update Lokasi' : 'Simpan Lokasi'}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-2">FOTO CHECK-IN</p>
                  {resolveAttendancePhotoUrl(selectedAttendance.clock_in_photo) ? (
                    <a
                      href={resolveAttendancePhotoUrl(selectedAttendance.clock_in_photo) as string}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <img
                        src={resolveAttendancePhotoUrl(selectedAttendance.clock_in_photo) as string}
                        alt="Foto check-in"
                        className="w-full h-36 object-cover rounded-lg border border-gray-200"
                      />
                    </a>
                  ) : (
                    <div className="w-full h-36 rounded-lg border border-dashed border-gray-300 bg-white text-gray-400 text-xs flex items-center justify-center">
                      Tidak ada foto check-in
                    </div>
                  )}
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-2">FOTO CHECK-OUT</p>
                  {resolveAttendancePhotoUrl(selectedAttendance.clock_out_photo) ? (
                    <a
                      href={resolveAttendancePhotoUrl(selectedAttendance.clock_out_photo) as string}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <img
                        src={resolveAttendancePhotoUrl(selectedAttendance.clock_out_photo) as string}
                        alt="Foto check-out"
                        className="w-full h-36 object-cover rounded-lg border border-gray-200"
                      />
                    </a>
                  ) : (
                    <div className="w-full h-36 rounded-lg border border-dashed border-gray-300 bg-white text-gray-400 text-xs flex items-center justify-center">
                      Tidak ada foto check-out
                    </div>
                  )}
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

      {/* ── Modal: Assign Karyawan ke Lokasi ──────────────────── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingAssignmentId ? 'Edit Penempatan Lokasi' : 'Assign Karyawan ke Lokasi'}</h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setEditingAssignmentId(null);
                  setAssignForm({ user_id: '', work_location_id: '' });
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Pilih Karyawan</label>
                <select
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  value={assignForm.user_id}
                  onChange={(e) => setAssignForm({ ...assignForm, user_id: e.target.value })}
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Pilih Lokasi Absensi</label>
                <select
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                  value={assignForm.work_location_id}
                  onChange={(e) => setAssignForm({ ...assignForm, work_location_id: e.target.value })}
                >
                  <option value="">-- Pilih Lokasi --</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-400">* Jika karyawan sudah memiliki penugasan sebelumnya, akan otomatis diganti.</p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setEditingAssignmentId(null);
                    setAssignForm({ user_id: '', work_location_id: '' });
                  }}
                  className="flex-1 py-3 border-2 border-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                >
                  {editingAssignmentId ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
