import {
  AlertCircle,
  Building2,
  Calculator,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Edit2,
  FileText,
  Home,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConfirmDialog, useHousingUnits, usePaymentHistory, useProjects, useProjectUnits } from "../../hooks";
import { housingService } from "../../services/housing.service";
import { formatRupiah } from "../../lib/utils";
import type { CreateHousingUnitPayload, HousingUnit, HousingUnitStatus, Project } from "../../types";

function getProjectName(projects: Project[] | undefined, projectId: string | undefined): string {
  if (!projectId) return "—";
  const p = projects?.find((x) => x.id === projectId);
  return p?.name ?? "—";
}

// ─── Status Badge ────────────────────────────────────────────────
function StatusBadge({ status }: { status: HousingUnitStatus }) {
  const map: Record<HousingUnitStatus, { bg: string; text: string; label: string }> = {
    Tersedia: { bg: "bg-green-100", text: "text-green-700", label: "Tersedia" },
    Proses: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Proses" },
    Sold: { bg: "bg-red-100", text: "text-red-700", label: "Sold" },
  };
  const s = map[status] ?? map.Tersedia;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

// ─── Payment History Tab: terhubung ke Piutang (Finance) ──────────
function PaymentHistoryTab({ unit, onNavigateToFinance }: { unit: HousingUnit; onNavigateToFinance: (opts: { detailConsumerId?: string; goMarketingForLead?: boolean }) => void }) {
  const consumerId = unit.consumer_id ?? (unit.consumer as { id?: string } | undefined)?.id ?? "";
  const hasConsumer = !!consumerId;
  const { payments, isLoading } = usePaymentHistory(consumerId);
  const hargaJual = unit.harga_jual ?? 0;
  const totalPaid = (payments ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const progressPercent = hargaJual > 0 ? Math.min(100, Math.round((totalPaid / hargaJual) * 100)) : 0;

  if (isLoading && hasConsumer) {
    return <p className="text-sm text-gray-500 py-4 text-center">Memuat riwayat pembayaran piutang...</p>;
  }

  // Unit belum punya piutang → arahkan ke Finance untuk tambah piutang
  if (!hasConsumer) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <Wallet className="w-10 h-10 mx-auto mb-3 text-amber-600 opacity-80" />
          <p className="text-sm font-bold text-amber-800">Belum ada piutang untuk unit ini</p>
          <p className="text-xs text-amber-700 mt-1">
            Piutang hanya boleh dari lead Deal. Buat atau lengkapi lead untuk unit ini di Marketing, setujui menjadi Deal, lalu tambah piutang dari aksi lead.
          </p>
          <button
            type="button"
            onClick={() => onNavigateToFinance({ goMarketingForLead: true })}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Tambah Piutang
          </button>
        </div>
      </div>
    );
  }

  // Unit punya konsumen/piutang → style selaras tab Info & Simulasi
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {hargaJual > 0 && (
        <div>
          <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3 mb-3">Progres Pembayaran Piutang</h4>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Terbayar</span>
              <span className="font-bold text-gray-900">{progressPercent}%</span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{formatRupiah(totalPaid)}</span>
              <span>dari {formatRupiah(hargaJual)}</span>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Riwayat Pembayaran</h4>
          <button
            type="button"
            onClick={() => onNavigateToFinance({ detailConsumerId: consumerId })}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-bold"
          >
            <Wallet className="w-4 h-4" />
            Lihat di Finance
          </button>
        </div>

        {(payments ?? []).length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
              <Clock size={32} />
            </div>
            <div>
              <p className="font-bold text-gray-900">Belum ada riwayat</p>
              <p className="text-sm text-gray-500">Unit ini belum melakukan transaksi pembayaran.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToFinance({ detailConsumerId: consumerId })}
              className="mt-2 text-sm text-primary font-bold hover:underline"
            >
              Buka detail piutang →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {(payments ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{p.notes || p.payment_method || "Pembayaran"}</p>
                    <p className="text-xs text-gray-500">{p.payment_date}{p.payment_method && ` · ${p.payment_method}`}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatRupiah(p.amount)}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Paid</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function Housing({ readOnly = false }: { readOnly?: boolean } = {}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilterId, setProjectFilterId] = useState<string>("");
  const { units, isLoading, create, update, remove } = useHousingUnits(undefined, { limit: 500, project_id: projectFilterId || undefined });
  const { projects } = useProjects();
  const { showConfirm, ConfirmDialog: ConfirmDialogElement } = useConfirmDialog();

  // UI state
  const [statusFilter, setStatusFilter] = useState<HousingUnitStatus | "">("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<HousingUnit | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<HousingUnit | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState<HousingUnit | null>(null);
  const [newStatus, setNewStatus] = useState<HousingUnitStatus>("Tersedia");
  const [drawerTab, setDrawerTab] = useState<"info" | "simulasi" | "history">("info");

  // Project & project unit selection (sumber data dari modul Project)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedProjectUnitId, setSelectedProjectUnitId] = useState<string>("");
  const { units: projectUnits } = useProjectUnits(selectedProjectId);

  // Form state
  const initialForm: CreateHousingUnitPayload & {
    id_rumah?: string;
    no_sertifikat?: string;
    panjang_kanan?: number;
    panjang_kiri?: number;
    lebar_depan?: number;
    lebar_belakang?: number;
    harga_per_meter?: number;
    daya_listrik?: number;
  } = {
    unit_code: "",
    project_id: undefined,
    project_unit_id: undefined,
    unit_type: "",
    id_rumah: "",
    no_sertifikat: "",
    panjang_kanan: undefined,
    panjang_kiri: undefined,
    lebar_depan: undefined,
    lebar_belakang: undefined,
    luas_tanah: undefined,
    luas_bangunan: undefined,
    harga_per_meter: 2_500_000,
    harga_jual: undefined,
    daya_listrik: 2200,
    status: "Tersedia",
    notes: "",
  };
  const [form, setForm] = useState<typeof initialForm>(initialForm);
  const [formPhoto, setFormPhoto] = useState<File | null>(null);

  // KPR simulation state
  const [dpPercent, setDpPercent] = useState(20);
  const [tenor, setTenor] = useState(15);
  const [bungaRate, setBungaRate] = useState(7);

  // ─── Filtering ──────────────────────────────────────────────
  const filteredUnits = useMemo(() => {
    if (!units) return [];
    return units.filter((u: HousingUnit) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        u.unit_code.toLowerCase().includes(q) ||
        (u.unit_type?.toLowerCase().includes(q) ?? false);
      const matchStatus = !statusFilter || u.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [units, searchQuery, statusFilter]);

  // ─── Stats ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const all = units ?? [];
    return {
      tersedia: all.filter((u: HousingUnit) => u.status === "Tersedia").length,
      terjual: all.filter((u: HousingUnit) => u.status === "Proses" || u.status === "Sold").length,
      total: all.length,
    };
  }, [units]);

  // Sinkronkan selectedUnit dengan data terbaru dari list (setelah refetch, termasuk photo_url)
  useEffect(() => {
    if (!selectedUnit || !units?.length) return;
    const updated = units.find((u: HousingUnit) => u.id === selectedUnit.id);
    if (updated) setSelectedUnit(updated);
  }, [units]);

  // ─── KPR Calculation ───────────────────────────────────────
  const kprCalc = useMemo(() => {
    const harga = selectedUnit?.harga_jual ?? 0;
    const dp = (dpPercent / 100) * harga;
    const pinjaman = harga - dp;
    const r = bungaRate / 100 / 12;
    const n = tenor * 12;
    const cicilan = r > 0 ? (pinjaman * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : pinjaman / n;
    return { dp, pinjaman, cicilan: Math.round(cicilan), totalBayar: Math.round(cicilan * n + dp) };
  }, [selectedUnit, dpPercent, tenor, bungaRate]);

  // ─── Handlers ───────────────────────────────────────────────
  function openAdd() {
    if (readOnly) return;
    setForm(initialForm);
    setFormPhoto(null);
    setEditingUnit(null);
    setSelectedProjectId("");
    setSelectedProjectUnitId("");
    setShowAddModal(true);
  }

  function openEdit(unit: HousingUnit) {
    if (readOnly) return;
    setSelectedProjectId(unit.project_id ?? "");
    setSelectedProjectUnitId((unit as any).project_unit_id ?? "");
    setForm({
      unit_code: unit.unit_code,
      project_id: unit.project_id,
      project_unit_id: (unit as any).project_unit_id,
      unit_type: unit.unit_type ?? "",
      id_rumah: unit.id_rumah ?? "",
      no_sertifikat: (unit as any).no_sertifikat ?? "",
      panjang_kanan: unit.panjang_kanan,
      panjang_kiri: unit.panjang_kiri,
      lebar_depan: unit.lebar_depan,
      lebar_belakang: unit.lebar_belakang,
      luas_tanah: unit.luas_tanah,
      luas_bangunan: unit.luas_bangunan,
      harga_per_meter: unit.harga_per_meter ?? 2_500_000,
      harga_jual: unit.harga_jual,
      daya_listrik: unit.daya_listrik ?? 2200,
      status: unit.status,
      notes: unit.notes ?? "",
    });
    setFormPhoto(null);
    setEditingUnit(unit);
    setShowAddModal(true);
  }

  function toFormData(): FormData {
    const fd = new FormData();
    if (form.project_id) fd.append("project_id", form.project_id);
    if ((form as any).project_unit_id) fd.append("project_unit_id", (form as any).project_unit_id);
    fd.append("unit_code", form.unit_code);
    if (form.unit_type) fd.append("unit_type", form.unit_type);
    if (form.id_rumah) fd.append("id_rumah", form.id_rumah);
    if ((form as any).no_sertifikat) fd.append("no_sertifikat", (form as any).no_sertifikat);
    if (form.panjang_kanan != null) fd.append("panjang_kanan", String(form.panjang_kanan));
    if (form.panjang_kiri != null) fd.append("panjang_kiri", String(form.panjang_kiri));
    if (form.lebar_depan != null) fd.append("lebar_depan", String(form.lebar_depan));
    if (form.lebar_belakang != null) fd.append("lebar_belakang", String(form.lebar_belakang));
    if (form.luas_tanah != null) fd.append("luas_tanah", String(form.luas_tanah));
    if (form.luas_bangunan != null) fd.append("luas_bangunan", String(form.luas_bangunan));
    if (form.harga_per_meter != null) fd.append("harga_per_meter", String(form.harga_per_meter));
    if (form.harga_jual != null) fd.append("harga_jual", String(form.harga_jual));
    if (form.daya_listrik != null) fd.append("daya_listrik", String(form.daya_listrik));
    fd.append("status", form.status ?? "Tersedia");
    if (form.notes) fd.append("notes", form.notes);
    if (formPhoto) fd.append("photo", formPhoto);
    return fd;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = formPhoto ? toFormData() : (form as CreateHousingUnitPayload);
    if (editingUnit) {
      await update(editingUnit.id, payload);
    } else {
      await create(payload);
    }
    setShowAddModal(false);
    setForm(initialForm);
    setFormPhoto(null);
    setEditingUnit(null);
  }

  async function handleDelete(unit: HousingUnit) {
    if (readOnly) return;
    const confirmed = await showConfirm({
      title: `Hapus unit ${unit.unit_code}?`,
      description: 'Data yang dihapus tidak dapat dikembalikan.',
    });
    if (confirmed) {
      await remove(unit.id);
      if (selectedUnit?.id === unit.id) setSelectedUnit(null);
    }
  }

  function openStatusModal(unit: HousingUnit) {
    if (readOnly) return;
    setStatusTarget(unit);
    setNewStatus(unit.status);
    setShowStatusModal(true);
  }

  async function handleStatusUpdate() {
    if (statusTarget) {
      await update(statusTarget.id, { status: newStatus });
      if (selectedUnit?.id === statusTarget.id) {
        setSelectedUnit((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      setShowStatusModal(false);
      setStatusTarget(null);
    }
  }

  function openDetail(unit: HousingUnit) {
    setSelectedUnit(unit);
    setDrawerTab("info");
    // Muat data terbaru dari server (termasuk photo_url) agar foto selalu tampil
    housingService.getById(unit.id).then((data) => setSelectedUnit(data)).catch(() => {});
  }

  function handleDownload() {
    const headers = ["No. Kavling", "Tipe Rumah", "L. Tanah", "L. Bangunan", "Harga Jual", "Status"];
    const rows = filteredUnits.map((u: HousingUnit) => [
      u.unit_code,
      u.unit_type ?? "-",
      u.luas_tanah ?? "-",
      u.luas_bangunan ?? "-",
      u.harga_jual ?? "-",
      u.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "housing-units.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Confirm dialog portal */}
      {ConfirmDialogElement}

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kavling &amp; Unit Perumahan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data kavling dan unit perumahan</p>
        </div>
        {!readOnly && (
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={20} />
            <span>Tambah Unit Baru</span>
          </button>
        )}
      </div>

      {/* ── Stats Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tersedia</p>
              <p className="text-2xl font-bold text-gray-900">{stats.tersedia}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Terjual / Proses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.terjual}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Unit</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari no. kavling atau tipe rumah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <select
            value={projectFilterId}
            onChange={(e) => setProjectFilterId(e.target.value)}
            className="appearance-none bg-white border rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
          >
            <option value="">Semua Proyek</option>
            {(projects ?? []).map((p: Project) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as HousingUnitStatus | "")}
            className="appearance-none bg-white border rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="Tersedia">Tersedia</option>
            <option value="Proses">Proses</option>
            <option value="Sold">Sold</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 border rounded-lg px-4 py-2.5 text-sm hover:bg-gray-50 transition"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-medium text-gray-600">No. Kavling</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nama Proyek</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipe Rumah</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">L. Tanah</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">L. Bangunan</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Harga Jual</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    Tidak ada unit ditemukan
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit: HousingUnit) => (
                  <tr
                    key={unit.id}
                    className="border-b last:border-b-0 hover:bg-gray-50 transition-colors group cursor-pointer"
                    onClick={() => openDetail(unit)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{unit.unit_code}</td>
                    <td className="px-4 py-3 text-gray-600">{getProjectName(projects, unit.project_id)}</td>
                    <td className="px-4 py-3 text-gray-600">{unit.unit_type ?? "-"}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {unit.luas_tanah != null ? `${unit.luas_tanah} m²` : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {unit.luas_bangunan != null ? `${unit.luas_bangunan} m²` : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {unit.harga_jual != null ? formatRupiah(unit.harga_jual) : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {readOnly ? (
                        <StatusBadge status={unit.status} />
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openStatusModal(unit);
                          }}
                        >
                          <StatusBadge status={unit.status} />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {!readOnly && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(unit);
                              }}
                              className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(unit);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(unit);
                          }}
                          className="p-2 text-gray-400 group-hover:text-primary transition-colors"
                          title="Detail"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal (style ala Mentahan/Figma) ───────────── */}
      {!readOnly && showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{editingUnit ? "Edit Detail Kavling & Unit" : "Tambah Unit Baru"}</h3>
                  <p className="text-xs text-gray-500">Lengkapi semua detail kavling dan spesifikasi unit</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Proyek & Unit Proyek */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Proyek &amp; Unit Proyek</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700">Proyek</label>
                      <select
                        value={selectedProjectId}
                        onChange={(e) => {
                          const pid = e.target.value;
                          setSelectedProjectId(pid);
                          setSelectedProjectUnitId("");
                          setForm((prev) => ({ ...prev, project_id: pid || undefined, project_unit_id: undefined }));
                        }}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                      >
                        <option value="">Pilih proyek...</option>
                        {projects?.map((p: Project) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700">Unit Proyek</label>
                      <select
                        value={selectedProjectUnitId}
                        onChange={(e) => {
                          const uid = e.target.value;
                          setSelectedProjectUnitId(uid);
                          const u = (projectUnits ?? []).find((pu: any) => pu.id === uid);
                          setForm((prev) => ({
                            ...prev,
                            project_id: selectedProjectId || prev.project_id,
                            project_unit_id: uid || undefined,
                            unit_code: u?.no ?? prev.unit_code,
                            unit_type: u?.tipe ?? prev.unit_type,
                          }));
                        }}
                        disabled={!selectedProjectId}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option value="">{selectedProjectId ? "Pilih unit proyek..." : "Pilih proyek dulu"}</option>
                        {(projectUnits ?? []).map((u: any) => (
                          <option key={u.id} value={u.id}>
                            {u.no} {u.tipe ? `— ${u.tipe}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Informasi Dasar */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Informasi Dasar</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700">No. Kavling *</label>
                      <input
                        required
                        type="text"
                        value={form.unit_code}
                        onChange={(e) => setForm({ ...form, unit_code: e.target.value })}
                        placeholder="Contoh: A-01"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700">Type Rumah *</label>
                      <input
                        type="text"
                        value={form.unit_type ?? ""}
                        onChange={(e) => setForm({ ...form, unit_type: e.target.value })}
                        placeholder="Contoh: 40 / 104"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700">ID Rumah</label>
                      <input
                        type="text"
                        value={form.id_rumah ?? ""}
                        onChange={(e) => setForm({ ...form, id_rumah: e.target.value })}
                        placeholder="Contoh: 001"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700">NO. Sertipikat</label>
                      <input
                        type="text"
                        value={(form as any).no_sertifikat ?? ""}
                        onChange={(e) => setForm({ ...form, no_sertifikat: e.target.value })}
                        placeholder="Nomor sertipikat tanah"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Dimensi Kavling (Meter) */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Dimensi Kavling (Meter)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700">Panjang Kanan</label>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={form.panjang_kanan ?? ""}
                        onChange={(e) => setForm({ ...form, panjang_kanan: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700">Panjang Kiri</label>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={form.panjang_kiri ?? ""}
                        onChange={(e) => setForm({ ...form, panjang_kiri: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700">Lebar Depan</label>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={form.lebar_depan ?? ""}
                        onChange={(e) => setForm({ ...form, lebar_depan: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700">Lebar Belakang</label>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={form.lebar_belakang ?? ""}
                        onChange={(e) => setForm({ ...form, lebar_belakang: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Luas & Harga */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Luas & Harga</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700">Luas Tanah (m²) *</label>
                      <input
                        type="number"
                        min={0}
                        value={form.luas_tanah ?? ""}
                        onChange={(e) => setForm({ ...form, luas_tanah: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="0"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-gray-700">Luas Bangunan (m²) *</label>
                      <input
                        type="number"
                        min={0}
                        value={form.luas_bangunan ?? ""}
                        onChange={(e) => setForm({ ...form, luas_bangunan: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="0"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">Harga Per Meter (IDR)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.harga_per_meter ?? ""}
                      onChange={(e) => setForm({ ...form, harga_per_meter: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">Harga Jual (IDR) *</label>
                    <input
                      required
                      type="number"
                      min={0}
                      value={form.harga_jual ?? ""}
                      onChange={(e) => setForm({ ...form, harga_jual: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Masukkan harga jual unit"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                    {form.harga_jual != null && form.harga_jual > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{formatRupiah(form.harga_jual)}</p>
                    )}
                  </div>
                </div>

                {/* Spesifikasi Lainnya */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Spesifikasi Lainnya</h4>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">Daya Listrik (Watt)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.daya_listrik ?? ""}
                      onChange={(e) => setForm({ ...form, daya_listrik: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">Status *</label>
                    <select
                      value={form.status ?? "Tersedia"}
                      onChange={(e) => setForm({ ...form, status: e.target.value as HousingUnitStatus })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="Tersedia">Tersedia</option>
                      <option value="Proses">Proses</option>
                      <option value="Sold">Sold</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700">Keterangan</label>
                    <textarea
                      rows={2}
                      value={form.notes ?? ""}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Keterangan tambahan untuk unit ini..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Foto Unit */}
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Foto Unit</h4>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                    onChange={(e) => setFormPhoto(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium"
                  />
                  <p className="text-xs text-gray-500">PNG, JPG, atau JPEG (max. 5MB)</p>
                  {editingUnit?.photo_url && !formPhoto && (
                    <p className="text-xs text-green-600">Foto saat ini: {editingUnit.photo_url}</p>
                  )}
                </div>
              </div>

              {/* Footer ala Mentahan */}
              <div className="p-6 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                <div />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition"
                  >
                    {editingUnit ? "💾 Simpan Perubahan" : "➕ Tambah Unit"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Status Update Modal (style selaras Mentahan) ─────────── */}
      {!readOnly && showStatusModal && statusTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setShowStatusModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Update Status Unit {statusTarget.unit_code}</h3>
                  <p className="text-xs text-gray-500">Ubah status ketersediaan unit</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                <strong>Proses</strong> = dalam proses pembayaran (booking/cicilan). <strong>Sold</strong> = sudah lunas atau serah terima.
              </p>
              {(["Tersedia", "Proses", "Sold"] as HousingUnitStatus[]).map((s) => (
                <label
                  key={s}
                  className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                    newStatus === s ? "border-primary bg-primary/5" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={newStatus === s}
                    onChange={() => setNewStatus(s)}
                    className="accent-primary"
                  />
                  <StatusBadge status={s} />
                </label>
              ))}
            </div>
            <div className="p-6 bg-gray-50 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-6 py-2.5 text-gray-600 font-bold hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleStatusUpdate}
                className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
              >
                💾 Simpan Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Drawer (style ala Mentahan) ───────────────────── */}
      {selectedUnit && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedUnit(null)} />
          <div className="absolute inset-y-0 right-0 max-w-xl w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer header — sama Mentahan: judul Unit + subteks tipe, tombol tutup rounded-full */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold text-gray-900">Unit {selectedUnit.unit_code}</h3>
                  <StatusBadge status={selectedUnit.status} />
                </div>
                <p className="text-sm text-gray-500">{selectedUnit.unit_type ?? "—"}</p>
              </div>
              <button type="button" onClick={() => setSelectedUnit(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Tabs — style Mentahan: font-bold, gap-2, icon 18 */}
            <div className="flex border-b border-gray-100 px-6">
              {[
                { key: "info" as const, icon: Home, label: "Info Unit" },
                { key: "simulasi" as const, icon: Calculator, label: "Simulasi Harga" },
                { key: "history" as const, icon: Clock, label: "Riwayat Bayar" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setDrawerTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 -mb-px transition-all ${
                    drawerTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Drawer body — semua tab pakai wrapper sama: space-y-6, animate-in fade-in */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* ── Info Unit Tab (section style persis Mentahan) ───── */}
              {drawerTab === "info" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Foto Unit */}
                  {selectedUnit.photo_url ? (
                    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                      <img
                        src={`${import.meta.env.VITE_ASSET_URL ?? ''}${selectedUnit.photo_url}`}
                        alt={`Unit ${selectedUnit.unit_code}`}
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100 h-64 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Belum ada foto unit</span>
                    </div>
                  )}

                  {/* Harga & Luas — grid 2 kolom seperti Mentahan */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                      <p className="text-xs text-gray-600 mb-1 font-medium">Harga Jual</p>
                      <p className="text-xl font-bold text-primary">
                        {selectedUnit.harga_jual != null ? formatRupiah(selectedUnit.harga_jual) : "-"}
                      </p>
                      {(selectedUnit as HousingUnit & { harga_per_meter?: number }).harga_per_meter != null && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRupiah((selectedUnit as HousingUnit & { harga_per_meter?: number }).harga_per_meter ?? 0)}/m²
                        </p>
                      )}
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-xs text-gray-600 mb-1 font-medium">Total LT / LB</p>
                      <p className="text-xl font-bold text-gray-900">
                        {selectedUnit.luas_tanah ?? "-"} / {selectedUnit.luas_bangunan ?? "-"} m²
                      </p>
                    </div>
                  </div>

                  {/* Informasi Dasar — label uppercase tracking-wider */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Informasi Dasar</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">No. Kavling</p>
                        <p className="font-bold text-gray-900">{selectedUnit.unit_code}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Type Rumah</p>
                        <p className="font-bold text-gray-900">{selectedUnit.unit_type ?? "-"}</p>
                      </div>
                    </div>
                    {((selectedUnit as HousingUnit & { id_rumah?: string }).id_rumah || (selectedUnit as HousingUnit & { no_sertifikat?: string }).no_sertifikat) && (
                      <div className="grid grid-cols-2 gap-4">
                        {(selectedUnit as HousingUnit & { id_rumah?: string }).id_rumah && (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">ID Rumah</p>
                            <p className="font-bold text-gray-900">{(selectedUnit as HousingUnit & { id_rumah?: string }).id_rumah}</p>
                          </div>
                        )}
                        {(selectedUnit as HousingUnit & { no_sertifikat?: string }).no_sertifikat && (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">NO. Sertifikat</p>
                            <p className="font-bold text-gray-900">{(selectedUnit as HousingUnit & { no_sertifikat?: string }).no_sertifikat}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dimensi Kavling (Meter) — bg-gray-50, inner card putih */}
                  {([(selectedUnit as HousingUnit & { panjang_kanan?: number }).panjang_kanan, (selectedUnit as HousingUnit & { lebar_depan?: number }).lebar_depan].some((v) => v != null)) && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Dimensi Kavling (Meter)</h4>
                      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                        <div className="grid grid-cols-2 gap-4">
                          {(selectedUnit as HousingUnit & { panjang_kanan?: number }).panjang_kanan != null && (
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                              <p className="text-xs font-bold text-gray-500">Panjang Kanan</p>
                              <p className="font-bold text-gray-900">{(selectedUnit as HousingUnit & { panjang_kanan?: number }).panjang_kanan} m</p>
                            </div>
                          )}
                          {(selectedUnit as HousingUnit & { panjang_kiri?: number }).panjang_kiri != null && (
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                              <p className="text-xs font-bold text-gray-500">Panjang Kiri</p>
                              <p className="font-bold text-gray-900">{(selectedUnit as HousingUnit & { panjang_kiri?: number }).panjang_kiri} m</p>
                            </div>
                          )}
                          {(selectedUnit as HousingUnit & { lebar_depan?: number }).lebar_depan != null && (
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                              <p className="text-xs font-bold text-gray-500">Lebar Depan</p>
                              <p className="font-bold text-gray-900">{(selectedUnit as HousingUnit & { lebar_depan?: number }).lebar_depan} m</p>
                            </div>
                          )}
                          {(selectedUnit as HousingUnit & { lebar_belakang?: number }).lebar_belakang != null && (
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                              <p className="text-xs font-bold text-gray-500">Lebar Belakang</p>
                              <p className="font-bold text-gray-900">{(selectedUnit as HousingUnit & { lebar_belakang?: number }).lebar_belakang} m</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Spesifikasi — daya listrik, box biru + ikon ⚡ */}
                  {(selectedUnit as HousingUnit & { daya_listrik?: number }).daya_listrik != null && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Spesifikasi</h4>
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">⚡</div>
                        <div>
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Daya Listrik</p>
                          <p className="font-bold text-gray-900">{(selectedUnit as HousingUnit & { daya_listrik?: number }).daya_listrik} Watt</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Konsumen */}
                  {selectedUnit.consumer && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Konsumen</h4>
                      <div className="p-4 border border-gray-100 rounded-xl">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nama</p>
                            <p className="font-bold text-gray-900">{selectedUnit.consumer.name}</p>
                          </div>
                          {selectedUnit.consumer.phone && (
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Telepon</p>
                              <p className="font-bold text-gray-900">{selectedUnit.consumer.phone}</p>
                            </div>
                          )}
                          {selectedUnit.consumer.email && (
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</p>
                              <p className="font-bold text-gray-900">{selectedUnit.consumer.email}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tanggal Penting */}
                  {(selectedUnit.akad_date || selectedUnit.serah_terima_date) && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Tanggal Penting</h4>
                      <div className="p-4 border border-gray-100 rounded-xl">
                        <div className="grid grid-cols-2 gap-4">
                          {selectedUnit.akad_date && (
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Akad</p>
                              <p className="font-bold text-gray-900">{selectedUnit.akad_date}</p>
                            </div>
                          )}
                          {selectedUnit.serah_terima_date && (
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Serah Terima</p>
                              <p className="font-bold text-gray-900">{selectedUnit.serah_terima_date}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Keterangan — bg amber seperti Mentahan */}
                  {selectedUnit.notes && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Keterangan</h4>
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-sm text-gray-700 leading-relaxed">{selectedUnit.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Metode Pembayaran Tersedia — card border-gray-100 + icon kanan */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 border-l-4 border-primary pl-3">Metode Pembayaran Tersedia</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-4 border border-gray-100 rounded-xl hover:border-primary/30 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-gray-800">KPR (Kredit Pemilikan Rumah)</p>
                          <CreditCard className="text-primary opacity-50 group-hover:opacity-100" size={20} />
                        </div>
                        <p className="text-xs text-gray-500">Uang muka fleksibel (min 10%), proses cepat melalui bank partner.</p>
                      </div>
                      <div className="p-4 border border-gray-100 rounded-xl hover:border-primary/30 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-gray-800">Cash Bertahap</p>
                          <Clock className="text-primary opacity-50 group-hover:opacity-100" size={20} />
                        </div>
                        <p className="text-xs text-gray-500">Cicilan langsung ke developer hingga 12x tanpa bunga (flat).</p>
                      </div>
                      <div className="p-4 border border-gray-100 rounded-xl hover:border-primary/30 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-gray-800">Cash Keras</p>
                          <TrendingUp className="text-primary opacity-50 group-hover:opacity-100" size={20} />
                        </div>
                        <p className="text-xs text-gray-500">Pembayaran lunas dalam 1 bulan dengan diskon khusus unit ready.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Simulasi Harga Tab (style selaras Info & Riwayat) ─ */}
              {drawerTab === "simulasi" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                    <h4 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                      <Calculator size={18} />
                      Simulasi KPR Unit {selectedUnit.unit_code}
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-2">
                          <label className="text-gray-700">Uang Muka (DP): {dpPercent}%</label>
                          <span className="text-primary">{formatRupiah(kprCalc.dp)}</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={50}
                          step={5}
                          value={dpPercent}
                          onChange={(e) => setDpPercent(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                      <div>
                        <label className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
                          <span>Tenor: {tenor} tahun</span>
                          <span className="text-primary">{tenor * 12} bulan</span>
                        </label>
                        <input
                          type="range"
                          min={5}
                          max={25}
                          step={1}
                          value={tenor}
                          onChange={(e) => setTenor(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                      <div>
                        <label className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
                          <span>Suku Bunga: {bungaRate}%</span>
                        </label>
                        <input
                          type="range"
                          min={3}
                          max={15}
                          step={0.5}
                          value={bungaRate}
                          onChange={(e) => setBungaRate(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hasil simulasi — card konsisten dengan tab lain */}
                  <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl">
                    <p className="text-xs text-gray-400 font-medium mb-1">Estimasi Angsuran / Bulan</p>
                    <p className="text-3xl font-bold mb-6 text-primary">{formatRupiah(kprCalc.cicilan)}</p>
                    <div className="space-y-3 pt-4 border-t border-white/10">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total Pinjaman</span>
                        <span className="font-semibold">{formatRupiah(kprCalc.pinjaman)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Uang Muka (DP)</span>
                        <span className="font-semibold">{formatRupiah(kprCalc.dp)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total Tenor</span>
                        <span className="font-semibold">{tenor * 12} Bulan</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <AlertCircle className="text-amber-600 shrink-0" size={20} />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      * Simulasi ini hanya estimasi. Suku bunga dan persetujuan KPR mengikuti kebijakan bank mitra.
                    </p>
                  </div>
                </div>
              )}

              {/* ── History Tab ──────────────────────── */}
              {drawerTab === "history" && (
                <PaymentHistoryTab
                  unit={selectedUnit}
                  onNavigateToFinance={({ detailConsumerId, goMarketingForLead }) => {
                    setSelectedUnit(null);
                    if (detailConsumerId) {
                      navigate("/finance", { state: { openDetailId: detailConsumerId } });
                    } else if (goMarketingForLead) {
                      navigate("/marketing", {
                        state: {
                          focusLeadsTab: true,
                          openLeadFormForUnit: {
                            projectId: selectedUnit.project_id,
                            unitId: selectedUnit.id,
                          },
                        },
                      });
                    }
                  }}
                />
              )}
            </div>

            {/* Footer drawer: Cek Detail + Update Status (ala Mentahan) */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3 sticky bottom-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedUnit(null);
                  navigate("/finance", { state: { openDetailId: selectedUnit?.consumer_id ?? (selectedUnit?.consumer as { id?: string })?.id } });
                }}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cek Detail
              </button>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => selectedUnit && openStatusModal(selectedUnit)}
                  className="px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  Update Status
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

