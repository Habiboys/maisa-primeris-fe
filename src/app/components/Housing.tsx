import {
  AlertCircle,
  Building2,
  Calculator,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  Edit,
  Eye,
  Home,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useConfirmDialog, useHousingPayments, useHousingUnits } from "../../hooks";
import { formatRupiah } from "../../lib/utils";
import type {
  CreateHousingUnitPayload,
  HousingPaymentHistory,
  HousingUnit,
  HousingUnitStatus,
} from "../../types";

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

// ─── Payment History Sub-section ─────────────────────────────────
function PaymentHistoryTab({ unitId }: { unitId: string }) {
  const { payments, isLoading } = useHousingPayments(unitId);

  if (isLoading) {
    return <p className="text-sm text-gray-500 py-4 text-center">Memuat riwayat pembayaran...</p>;
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Belum ada riwayat pembayaran</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((p: HousingPaymentHistory) => (
        <div key={p.id} className="border rounded-lg p-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-900">{p.type || "Pembayaran"}</p>
              <p className="text-xs text-gray-500">{p.payment_date}</p>
              {p.description && <p className="text-xs text-gray-500 mt-1">{p.description}</p>}
            </div>
            <p className="text-sm font-semibold text-green-600">{formatRupiah(p.amount)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function Housing() {
  // Hooks
  const [searchQuery, setSearchQuery] = useState("");
  const { units, isLoading, create, update, remove } = useHousingUnits();
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

  // Form state
  const initialForm: CreateHousingUnitPayload = {
    unit_code: "",
    unit_type: "",
    luas_tanah: undefined,
    luas_bangunan: undefined,
    harga_jual: undefined,
    status: "Tersedia",
    notes: "",
  };
  const [form, setForm] = useState<CreateHousingUnitPayload>(initialForm);

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
    setForm(initialForm);
    setEditingUnit(null);
    setShowAddModal(true);
  }

  function openEdit(unit: HousingUnit) {
    setForm({
      unit_code: unit.unit_code,
      unit_type: unit.unit_type ?? "",
      luas_tanah: unit.luas_tanah,
      luas_bangunan: unit.luas_bangunan,
      harga_jual: unit.harga_jual,
      status: unit.status,
      notes: unit.notes ?? "",
    });
    setEditingUnit(unit);
    setShowAddModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingUnit) {
      await update(editingUnit.id, form);
    } else {
      await create(form);
    }
    setShowAddModal(false);
    setForm(initialForm);
    setEditingUnit(null);
  }

  async function handleDelete(unit: HousingUnit) {
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
    setStatusTarget(unit);
    setNewStatus(unit.status);
    setShowStatusModal(true);
  }

  async function handleStatusUpdate() {
    if (statusTarget) {
      await update(statusTarget.id, { status: newStatus });
      setShowStatusModal(false);
      setStatusTarget(null);
    }
  }

  function openDetail(unit: HousingUnit) {
    setSelectedUnit(unit);
    setDrawerTab("info");
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
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Tambah Unit Baru
        </button>
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipe Rumah</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">L. Tanah</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">L. Bangunan</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Harga Jual</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Tidak ada unit ditemukan
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit: HousingUnit) => (
                  <tr key={unit.id} className="border-b last:border-b-0 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{unit.unit_code}</td>
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
                      <button onClick={() => openStatusModal(unit)}>
                        <StatusBadge status={unit.status} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openDetail(unit)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                          title="Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(unit)}
                          className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(unit)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* ── Add / Edit Modal ──────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{editingUnit ? "Edit Unit" : "Tambah Unit Baru"}</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* unit_code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Kavling *</label>
                <input
                  required
                  type="text"
                  value={form.unit_code}
                  onChange={(e) => setForm({ ...form, unit_code: e.target.value })}
                  placeholder="Contoh: A-01"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* unit_type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Rumah</label>
                <input
                  type="text"
                  value={form.unit_type ?? ""}
                  onChange={(e) => setForm({ ...form, unit_type: e.target.value })}
                  placeholder="Contoh: Tipe 36/60"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* luas tanah & bangunan */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Luas Tanah (m²)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.luas_tanah ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, luas_tanah: e.target.value ? Number(e.target.value) : undefined })
                    }
                    placeholder="60"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Luas Bangunan (m²)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.luas_bangunan ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, luas_bangunan: e.target.value ? Number(e.target.value) : undefined })
                    }
                    placeholder="36"
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* harga_jual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={form.harga_jual ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, harga_jual: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="150000000"
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {form.harga_jual != null && form.harga_jual > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{formatRupiah(form.harga_jual)}</p>
                )}
              </div>

              {/* status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status ?? "Tersedia"}
                  onChange={(e) => setForm({ ...form, status: e.target.value as HousingUnitStatus })}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Tersedia">Tersedia</option>
                  <option value="Proses">Proses</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>

              {/* notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <textarea
                  rows={3}
                  value={form.notes ?? ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Catatan tambahan..."
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  {editingUnit ? "Simpan Perubahan" : "Tambah Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Status Update Modal ───────────────────────────────── */}
      {showStatusModal && statusTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowStatusModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Ubah Status</h2>
              <button onClick={() => setShowStatusModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Unit: <span className="font-medium">{statusTarget.unit_code}</span>
              </p>
              {(["Tersedia", "Proses", "Sold"] as HousingUnitStatus[]).map((s) => (
                <label
                  key={s}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                    newStatus === s ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={newStatus === s}
                    onChange={() => setNewStatus(s)}
                    className="accent-blue-600"
                  />
                  <StatusBadge status={s} />
                </label>
              ))}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleStatusUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Drawer ─────────────────────────────────────── */}
      {selectedUnit && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedUnit(null)} />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-xl animate-slide-in-right">
            {/* Drawer header */}
            <div className="sticky top-0 bg-white z-10 border-b">
              <div className="flex items-center justify-between p-5">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Detail Unit</h2>
                  <p className="text-sm text-gray-500">{selectedUnit.unit_code}</p>
                </div>
                <button onClick={() => setSelectedUnit(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b px-5">
                {[
                  { key: "info" as const, icon: Home, label: "Info" },
                  { key: "simulasi" as const, icon: Calculator, label: "Simulasi" },
                  { key: "history" as const, icon: Clock, label: "History" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setDrawerTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                      drawerTab === tab.key
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer body */}
            <div className="p-5">
              {/* ── Info Tab ─────────────────────────── */}
              {drawerTab === "info" && (
                <div className="space-y-5">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status</span>
                    <StatusBadge status={selectedUnit.status} />
                  </div>

                  {/* Harga */}
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-blue-600 mb-1">Harga Jual</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {selectedUnit.harga_jual != null ? formatRupiah(selectedUnit.harga_jual) : "-"}
                    </p>
                  </div>

                  {/* Detail grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <InfoItem label="No. Kavling" value={selectedUnit.unit_code} />
                    <InfoItem label="Tipe Rumah" value={selectedUnit.unit_type ?? "-"} />
                    <InfoItem
                      label="Luas Tanah"
                      value={selectedUnit.luas_tanah != null ? `${selectedUnit.luas_tanah} m²` : "-"}
                    />
                    <InfoItem
                      label="Luas Bangunan"
                      value={selectedUnit.luas_bangunan != null ? `${selectedUnit.luas_bangunan} m²` : "-"}
                    />
                  </div>

                  {/* Consumer info */}
                  {selectedUnit.consumer && (
                    <div className="border rounded-xl p-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Konsumen</p>
                      <InfoItem label="Nama" value={selectedUnit.consumer.name} />
                      {selectedUnit.consumer.phone && (
                        <InfoItem label="Telepon" value={selectedUnit.consumer.phone} />
                      )}
                      {selectedUnit.consumer.email && (
                        <InfoItem label="Email" value={selectedUnit.consumer.email} />
                      )}
                    </div>
                  )}

                  {/* Dates */}
                  {(selectedUnit.akad_date || selectedUnit.serah_terima_date) && (
                    <div className="border rounded-xl p-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Tanggal Penting</p>
                      {selectedUnit.akad_date && <InfoItem label="Akad" value={selectedUnit.akad_date} />}
                      {selectedUnit.serah_terima_date && (
                        <InfoItem label="Serah Terima" value={selectedUnit.serah_terima_date} />
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {selectedUnit.notes && (
                    <div className="border rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Catatan</p>
                      <p className="text-sm text-gray-600">{selectedUnit.notes}</p>
                    </div>
                  )}

                  {/* Metode Pembayaran */}
                  <div className="border rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Metode Pembayaran Tersedia</p>
                    <div className="space-y-2">
                      {[
                        { label: "KPR", desc: "Kredit Pemilikan Rumah via bank" },
                        { label: "Cash Bertahap", desc: "Pembayaran bertahap langsung ke developer" },
                        { label: "Cash Keras", desc: "Pembayaran lunas sekaligus" },
                      ].map((m) => (
                        <div key={m.label} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">{m.label}</p>
                            <p className="text-xs text-gray-500">{m.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Simulasi Tab ─────────────────────── */}
              {drawerTab === "simulasi" && (
                <div className="space-y-5">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Harga Unit</p>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedUnit.harga_jual != null ? formatRupiIah(selectedUnit.harga_jual) : "-"}
                    </p>
                  </div>

                  {/* DP */}
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                      <span>Uang Muka (DP)</span>
                      <span className="text-blue-600">{dpPercent}%</span>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={50}
                      step={5}
                      value={dpPercent}
                      onChange={(e) => setDpPercent(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>10%</span>
                      <span>50%</span>
                    </div>
                  </div>

                  {/* Tenor */}
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                      <span>Tenor</span>
                      <span className="text-blue-600">{tenor} tahun</span>
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={25}
                      step={1}
                      value={tenor}
                      onChange={(e) => setTenor(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>5 thn</span>
                      <span>25 thn</span>
                    </div>
                  </div>

                  {/* Bunga */}
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                      <span>Suku Bunga</span>
                      <span className="text-blue-600">{bungaRate}%</span>
                    </label>
                    <input
                      type="range"
                      min={3}
                      max={15}
                      step={0.5}
                      value={bungaRate}
                      onChange={(e) => setBungaRate(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>3%</span>
                      <span>15%</span>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="border rounded-xl divide-y">
                    <div className="flex justify-between p-3">
                      <span className="text-sm text-gray-500">Uang Muka (DP)</span>
                      <span className="text-sm font-medium">{formatRupiah(kprCalc.dp)}</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span className="text-sm text-gray-500">Pinjaman</span>
                      <span className="text-sm font-medium">{formatRupiah(kprCalc.pinjaman)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-blue-50">
                      <span className="text-sm font-medium text-blue-700">Cicilan / Bulan</span>
                      <span className="text-sm font-bold text-blue-700">{formatRupiah(kprCalc.cicilan)}</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span className="text-sm text-gray-500">Total Bayar</span>
                      <span className="text-sm font-medium">{formatRupiah(kprCalc.totalBayar)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 text-center">
                    * Simulasi ini bersifat estimasi. Angka sebenarnya dapat berbeda tergantung kebijakan bank.
                  </p>
                </div>
              )}

              {/* ── History Tab ──────────────────────── */}
              {drawerTab === "history" && <PaymentHistoryTab unitId={selectedUnit.id} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helper ────────────────────────────────────────────────
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}
