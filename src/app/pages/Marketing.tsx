import {
    ArrowUpRight,
    BarChart3,
    CheckCircle2,
    Edit2,
    Filter,
    Home,
    Loader2,
    Mail,
    Map as MapIcon,
    MessageSquare,
    Phone,
    PieChart as PieChartIcon,
    Plus,
    Search,
    Target,
    Trash2,
    TrendingUp,
    UserPlus,
    Users,
    Wallet,
    XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { LEAD_STATUS_VALUES, type LeadStatus } from '../../constants/leadStatus';
import { useAuth } from '../../context/AuthContext';
import { useConfirmDialog, useHousingUnits, useLeads, useMarketingPersons, useProjects } from '../../hooks';
import { formatRupiah } from '../../lib/utils';
import { marketingService } from '../../services/marketing.service';
import { projectService } from '../../services/project.service';
import type {
    CreateLeadPayload,
    CreateMarketingPersonPayload,
    HousingUnit,
    Lead,
    MarketingPerson,
    Project,
} from '../../types';
import Housing from '../components/Housing';
const COLORS = ['#b7860f', '#d4af37', '#e5c100', '#f1d24c', '#fff194'];

const statusBadgeClass = (status: LeadStatus) => {
  switch (status) {
    case 'Baru': return 'bg-blue-50 text-blue-600';
    case 'Follow-up': return 'bg-orange-50 text-orange-600';
    case 'Survey': return 'bg-purple-50 text-purple-600';
    case 'Negoisasi': return 'bg-red-50 text-red-600';
    case 'Deal': return 'bg-green-50 text-green-600';
    case 'Batal': return 'bg-gray-100 text-gray-400';
    default: return 'bg-gray-50 text-gray-400';
  }
};

/** Style untuk status unit di Siteplan (sumber: Kavling & Unit / housing_units) */
const housingStatusStyle = (status: HousingUnit['status']) => {
  switch (status) {
    case 'Tersedia': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', dot: 'bg-green-500' };
    case 'Proses': return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', dot: 'bg-yellow-500' };
    case 'Sold': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', dot: 'bg-red-500' };
    default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-400', dot: 'bg-gray-400' };
  }
};

// ── Empty form defaults ──────────────────────────────────────

const emptyLeadForm: CreateLeadPayload = {
  name: '', phone: '', email: '', interest: '', source: 'Instagram',
  status: 'Baru', marketing_id: '', notes: '',
};

const emptyMarketingForm: CreateMarketingPersonPayload = {
  name: '', phone: '', email: '', target: 0, is_active: true,
};

// ═════════════════════════════════════════════════════════════
// Component
// ═════════════════════════════════════════════════════════════

export function Marketing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showConfirm, ConfirmDialog: ConfirmDialogElement } = useConfirmDialog();
  const { user } = useAuth();

  // ── Hooks (single source of truth) ─────────────────────────
  const [leadPage, setLeadPage] = useState(1);
  const [leadPerPage, setLeadPerPage] = useState(10);
  const [leadProjectId, setLeadProjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'Semua'>('Semua');
  const leadParams = useMemo(() => ({
    page: leadPage,
    limit: leadPerPage,
    search: searchQuery || undefined,
    status: statusFilter === 'Semua' ? undefined : statusFilter,
    project_id: leadProjectId || undefined,
  }), [leadPage, leadPerPage, searchQuery, statusFilter, leadProjectId]);
  const leadHook = useLeads(leadParams);
  const personsHook = useMarketingPersons({ limit: 500 });
  const { projects } = useProjects();
  const [siteplanProjectId, setSiteplanProjectId] = useState<string>('');
  const siteplanHousing = useHousingUnits(undefined, { limit: 500, project_id: siteplanProjectId || undefined });

  // ── SVG Siteplan State ──────────────────────────────────────
  const [isUploadingLayout, setIsUploadingLayout] = useState(false);
  const [isLoadingSvg, setIsLoadingSvg] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Auto-select proyek pertama untuk siteplan (tidak ada opsi "Semua Proyek")
  useEffect(() => {
    if (!siteplanProjectId && projects && projects.length > 0) {
      setSiteplanProjectId(projects[0].id);
    }
  }, [projects, siteplanProjectId]);

  // Lead modal: Minat Unit = pilih proyek + unit
  const [newLeadProjectId, setNewLeadProjectId] = useState('');
  const [newLeadUnitId, setNewLeadUnitId] = useState('');
  const leadFormUnits = useHousingUnits(undefined, { limit: 500, project_id: newLeadProjectId || undefined });

  // ── Tab state ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'leads' | 'team' | 'siteplan' | 'analytics' | 'housing'>('leads');

  useEffect(() => {
    const st = location.state as {
      focusLeadsTab?: boolean;
      openLeadFormForUnit?: { projectId?: string; unitId?: string };
    } | null;
    if (!st?.focusLeadsTab) return;
    setActiveTab('leads');
    if (st.openLeadFormForUnit?.projectId) setNewLeadProjectId(st.openLeadFormForUnit.projectId);
    if (st.openLeadFormForUnit?.unitId) setNewLeadUnitId(st.openLeadFormForUnit.unitId);
    if (st.openLeadFormForUnit?.projectId || st.openLeadFormForUnit?.unitId) setIsAddModalOpen(true);
    toast.info('Lengkapi lead menjadi Deal, lalu gunakan ikon dompet pada baris lead untuk buat piutang.');
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  // ── Team pagination ────────────────────────────────────────
  const [teamPage, setTeamPage] = useState(1);
  const [teamPerPage, setTeamPerPage] = useState(10);
  const teamParams = useMemo(() => ({ page: teamPage, limit: teamPerPage }), [teamPage, teamPerPage]);
  const teamHook = useMarketingPersons(teamParams);

  // ── Lead modals ────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLead, setNewLead] = useState<CreateLeadPayload>({ ...emptyLeadForm });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingLeadProjectId, setEditingLeadProjectId] = useState('');
  const [editingLeadUnitId, setEditingLeadUnitId] = useState('');
  const editingLeadUnits = useHousingUnits(undefined, { limit: 500, project_id: editingLeadProjectId || undefined });

  // ── Marketing modals ───────────────────────────────────────
  const [isAddMarketingModalOpen, setIsAddMarketingModalOpen] = useState(false);
  const [newMarketing, setNewMarketing] = useState<CreateMarketingPersonPayload>({ ...emptyMarketingForm });

  const [isEditMarketingModalOpen, setIsEditMarketingModalOpen] = useState(false);
  const [editingMarketing, setEditingMarketing] = useState<MarketingPerson | null>(null);

  // ── Siteplan selection (unit = housing unit dari Kavling & Unit) ─
  const [selectedUnit, setSelectedUnit] = useState<HousingUnit | null>(null);

  // ── Computed ───────────────────────────────────────────────

  const stats = useMemo(() => {
    const s = leadHook.stats;
    return [
      { label: 'Total Leads', value: s?.total ?? 0, sub: '+12% vs bulan lalu', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Hot Leads', value: s?.hot ?? 0, sub: 'Peluang Closing Tinggi', icon: Target, color: 'text-red-600', bg: 'bg-red-50' },
      { label: 'Closing Rate', value: `${s?.closing_rate ?? 0}%`, sub: 'Target 15% Bulan ini', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'Leads Batal', value: s?.batal ?? 0, sub: 'Perlu evaluasi', icon: ArrowUpRight, color: 'text-primary', bg: 'bg-primary/10' },
    ];
  }, [leadHook.stats]);

  const leadsList = leadHook.leads;
  const leadPagination = leadHook.pagination;

  // ── Lead handlers ──────────────────────────────────────────

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name) { toast.error('Nama wajib diisi'); return; }
    try {
      await leadHook.create({
        ...newLead,
        housing_unit_id: newLeadUnitId || undefined,
      });
      // Setelah lead tersimpan, backend akan mengunci unit (reserved_lead_id) -> refresh siteplan
      await siteplanHousing.refetch();
      setIsAddModalOpen(false);
      setNewLead({ ...emptyLeadForm });
      setNewLeadProjectId('');
      setNewLeadUnitId('');
    } catch { /* hook handles toast */ }
  };

  const startEditingLead = (lead: Lead) => {
    setEditingLead({ ...lead });
    setEditingLeadProjectId(lead.housingUnit?.project_id ?? '');
    setEditingLeadUnitId(lead.housing_unit_id ?? '');
    setIsEditModalOpen(true);
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    try {
      await leadHook.update(editingLead.id, {
        name: editingLead.name,
        phone: editingLead.phone,
        email: editingLead.email,
        housing_unit_id: editingLeadUnitId || undefined,
        source: editingLead.source,
        status: editingLead.status,
        marketing_id: editingLead.marketing_id,
        notes: editingLead.notes,
        follow_up_date: editingLead.follow_up_date,
      });
      // Status unit dapat berubah (release/lock) saat update lead.
      await siteplanHousing.refetch();
      setIsEditModalOpen(false);
      setEditingLead(null);
      setEditingLeadProjectId('');
      setEditingLeadUnitId('');
    } catch { /* hook handles toast */ }
  };

  const handleDeleteLead = async (id: string) => {
    if (await showConfirm({ title: 'Hapus Prospek', description: 'Hapus prospek ini dari database?', variant: 'danger' })) {
      try { await leadHook.remove(id); } catch { /* hook handles toast */ }
      // Jika lead dihapus, unit yang terkunci harus dilepas.
      await siteplanHousing.refetch();
    }
  };

  // ── Marketing person handlers ──────────────────────────────

  const handleAddMarketing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarketing.name) { toast.error('Nama wajib diisi'); return; }
    try {
      await personsHook.create(newMarketing);
      teamHook.refetch();
      setIsAddMarketingModalOpen(false);
      setNewMarketing({ ...emptyMarketingForm });
    } catch { /* hook handles toast */ }
  };

  const startEditingMarketing = (person: MarketingPerson) => {
    setEditingMarketing({ ...person });
    setIsEditMarketingModalOpen(true);
  };

  const handleUpdateMarketing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMarketing) return;
    try {
      await personsHook.update(editingMarketing.id, {
        name: editingMarketing.name,
        phone: editingMarketing.phone,
        email: editingMarketing.email,
        target: editingMarketing.target,
        is_active: editingMarketing.is_active,
      });
      teamHook.refetch();
      setIsEditMarketingModalOpen(false);
      setEditingMarketing(null);
    } catch { /* hook handles toast */ }
  };

  const handleDeleteMarketing = async (id: string) => {
    if (await showConfirm({ title: 'Hapus Marketing', description: 'Hapus data marketing ini?', variant: 'danger' })) {
      try {
        await personsHook.remove(id);
        teamHook.refetch();
      } catch { /* hook handles toast */ }
    }
  };

  // ── Siteplan handler (update status unit di Kavling & Unit) ───

  const handleBookUnit = async (unit: HousingUnit) => {
    // Booking/lock unit harus melalui pembuatan Lead,
    // supaya unit reserved dan status lead/unit saling terhubung.
    setNewLead({ ...emptyLeadForm });
    setNewLeadProjectId(unit.project_id ?? siteplanProjectId ?? '');
    setNewLeadUnitId(unit.id);
    setIsAddModalOpen(true);
  };

  // ── SVG Siteplan: Get status color for housing unit ────────
  const getHousingStatusColor = (status: HousingUnit['status']): string => {
    switch (status) {
      case 'Tersedia': return '#22c55e'; // green-500
      case 'Proses': return '#eab308';   // yellow-500
      case 'Sold': return '#ef4444';     // red-500
      default: return '#d1d5db';         // gray-300
    }
  };

  // ── SVG Siteplan: Get text color for contrast ─────────────
  const getHousingTextColor = (bgHex: string): string => {
    const hex = (bgHex || '').trim().replace('#', '');
    if (![3, 6].includes(hex.length)) return '#111827';
    const full = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.6 ? '#111827' : '#ffffff';
  };

  // ── SVG Siteplan: Load and color SVG by housing unit status ─
  const selectedProject = projects?.find(p => p.id === siteplanProjectId);

  const loadSvgWithUnitColors = async (svgPath: string) => {
    // Re-resolve selectedProject inside to avoid stale closure
    const currentProject = projects?.find(p => p.id === siteplanProjectId);
    if (!svgPath || !currentProject) {
      console.warn('[Siteplan SVG] skip — svgPath:', svgPath, 'currentProject:', currentProject?.name);
      return;
    }
    setIsLoadingSvg(true);
    try {
      const normalizedPath = svgPath.startsWith('/') ? svgPath : `/${svgPath}`;
      const url = `/asset-proxy${normalizedPath}`;
      console.log('[Siteplan SVG] fetching:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch SVG: ${response.status} ${response.statusText}`);
      let svgText = await response.text();

      const unitColorMap = new Map(
        siteplanHousing.units.map(u => [u.unit_code, getHousingStatusColor(u.status)])
      );

      svgText = svgText.replace(
        /<path\b([^>]*?)(\/?)\s*>/g,
        (match, attrs: string, selfClose: string) => {
          const idMatch = attrs.match(/\bid="([^"]+)"/);
          if (!idMatch) return match;
          const unitId = idMatch[1];
          const color = unitColorMap.get(unitId);
          if (!color) return match;

          const attrsWithoutStyle = attrs.replace(/\bstyle="[^"]*"/, '').trim();
          let styleAttr = (attrs.match(/\bstyle="([^"]*)"/)?.[1] ?? '').trim();
          const hasFill = /\bfill\s*:/.test(styleAttr);
          const hasFillOpacity = /\bfill-opacity\s*:/.test(styleAttr);

          if (hasFill) {
            styleAttr = styleAttr.replace(/\bfill\s*:[^;]+;?/, `fill:${color};`);
          } else {
            styleAttr = `fill:${color};${styleAttr}`;
          }

          if (hasFillOpacity) {
            styleAttr = styleAttr.replace(/\bfill-opacity\s*:[^;]+;?/, `fill-opacity:0.6;`);
          } else {
            styleAttr = `fill-opacity:0.6;${styleAttr}`;
          }

          return `<path ${attrsWithoutStyle} style="${styleAttr}"${selfClose}>`;
        }
      );

      setSvgContent(svgText);
    } catch (err) {
      console.error('[Siteplan SVG] Error loading SVG:', err);
      toast.error('Gagal memuat peta kawasan');
      setSvgContent(null);
    } finally {
      setIsLoadingSvg(false);
    }
  };

  // ── SVG Siteplan: Upload handler ───────────────────────────
  const handleUploadLayoutSvg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !siteplanProjectId) return;

    const allowedTypes = ['image/svg+xml'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.svg')) {
      toast.error('Hanya file SVG yang diizinkan');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB');
      return;
    }

    setIsUploadingLayout(true);
    try {
      const formData = new FormData();
      formData.append('layout_svg', file);
      await projectService.updateLayoutSvg(siteplanProjectId, formData);
      // Refresh projects to get updated layout_svg
      const res = await projectService.getAll();
      const updatedProject = res.data.find(p => p.id === siteplanProjectId);
      if (updatedProject?.layout_svg) {
        loadSvgWithUnitColors(updatedProject.layout_svg);
      }
      toast.success('Layout SVG berhasil diupload');
    } catch {
      /* error handled by service */
    } finally {
      setIsUploadingLayout(false);
    }
    e.target.value = '';
  };

  // ── SVG Siteplan: Load SVG when tab/view changes ───────────
  useEffect(() => {
    if (activeTab === 'siteplan' && selectedProject?.layout_svg) {
      loadSvgWithUnitColors(selectedProject.layout_svg);
    } else if (activeTab !== 'siteplan') {
      setSvgContent(null);
    }
  }, [activeTab, selectedProject?.layout_svg, siteplanHousing.units]);

  // ── SVG Siteplan: Event delegation handlers ─────────────────
  const getUnitIdFromEvent = (e: React.MouseEvent): string | null => {
    let target = e.target as Element | null;
    while (target && target !== e.currentTarget) {
      if (target.tagName.toLowerCase() === 'path' && target.getAttribute('id')) {
        const unitId = target.getAttribute('id')!;
        const unit = siteplanHousing.units.find(u => u.unit_code === unitId);
        if (unit) return unitId;
      }
      target = target.parentElement;
    }
    return null;
  };

  const handleSvgClick = (e: React.MouseEvent) => {
    const unitId = getUnitIdFromEvent(e);
    if (!unitId) return;
    const unit = siteplanHousing.units.find(u => u.unit_code === unitId);
    if (unit) setSelectedUnit(unit);
  };

  const handleSvgMouseOver = (e: React.MouseEvent) => {
    const target = e.target as Element;
    if (target.tagName.toLowerCase() === 'path' && target.getAttribute('id')) {
      const unitId = target.getAttribute('id')!;
      if (siteplanHousing.units.find(u => u.unit_code === unitId)) {
        (target as SVGPathElement).style.fillOpacity = '0.9';
        (target as SVGPathElement).style.cursor = 'pointer';
      }
    }
  };

  const handleSvgMouseOut = (e: React.MouseEvent) => {
    const target = e.target as Element;
    if (target.tagName.toLowerCase() === 'path' && target.getAttribute('id')) {
      const unitId = target.getAttribute('id')!;
      if (siteplanHousing.units.find(u => u.unit_code === unitId)) {
        (target as SVGPathElement).style.fillOpacity = '0.6';
      }
    }
  };

  // ════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {ConfirmDialogElement}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marketing & Penjualan</h2>
          <p className="text-gray-500 text-sm">Monitor pipa penjualan, database prospek, dan ketersediaan unit.</p>
        </div>
        <div className="flex p-1 bg-gray-100 rounded-xl w-fit border border-gray-200">
          {([
            { key: 'leads', label: 'Leads', icon: Users },
            { key: 'team', label: 'Team', icon: Users },
            { key: 'siteplan', label: 'Siteplan', icon: MapIcon },
            { key: 'analytics', label: 'Analytics', icon: BarChart3 },
            { key: 'housing', label: 'Kavling & Unit', icon: Home },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.key ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-left">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-4`}>
              <s.icon size={20} />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
            <h4 className="text-2xl font-black text-gray-900 mt-1">{s.value}</h4>
            <div className="mt-2 text-[10px] font-bold text-gray-400 flex items-center gap-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ─── Leads Tab ─────────────────────────────────────── */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center text-left">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari nama, No. HP, atau unit..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setLeadPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
              <select
                value={leadProjectId}
                onChange={(e) => { setLeadProjectId(e.target.value); setLeadPage(1); }}
                className="pl-3 pr-8 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-sm font-bold border border-gray-200 focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-all"
              >
                <option value="">Semua Proyek</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="relative flex-1 md:flex-none">
                <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as LeadStatus | 'Semua'); setLeadPage(1); }}
                  className="w-full md:w-auto pl-10 pr-8 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-sm font-bold border border-gray-200 focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-all"
                >
                  <option value="Semua">Semua Status</option>
                  {LEAD_STATUS_VALUES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                <Plus size={18} />
                Lead Baru
              </button>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-left">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Prospek</th>
                    <th className="px-6 py-4">Kontak</th>
                    <th className="px-6 py-4">Minat & Sumber</th>
                    <th className="px-6 py-4">Marketing</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leadsList.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{lead.name}</p>
                            <p className="text-[10px] font-bold text-gray-400">{lead.created_at?.slice(0, 10)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {lead.phone && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Phone size={14} className="text-primary" />
                              {lead.phone}
                            </div>
                          )}
                          {lead.email && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Mail size={14} className="text-primary" />
                              {lead.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {(lead.housingUnit?.unit_code ?? lead.interest) && (
                            <span className="inline-block px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-bold rounded uppercase">
                              Unit {lead.housingUnit?.unit_code ?? lead.interest}
                            </span>
                          )}
                          {lead.source && (
                            <p className="text-[10px] text-gray-400 font-bold uppercase ml-1">{lead.source}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lead.marketingPerson ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {lead.marketingPerson.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900">{lead.marketingPerson.name}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Belum ditentukan</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {lead.phone && (
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="WhatsApp"
                            >
                              <MessageSquare size={18} />
                            </a>
                          )}
                          {lead.status === 'Deal' && !lead.consumer_id && (
                            <button
                              type="button"
                              onClick={() => navigate('/finance', { state: { prefilledLeadId: lead.id } })}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Tambah piutang dari prospek Deal"
                            >
                              <Wallet size={18} />
                            </button>
                          )}
                          <button onClick={() => startEditingLead(lead)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDeleteLead(lead.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leadsList.length === 0 && (
                <div className="py-20 text-center space-y-3">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                    <Search size={32} />
                  </div>
                  <p className="text-gray-500 font-medium">Tidak ada prospek yang cocok dengan pencarian Anda.</p>
                </div>
              )}
            </div>
            {leadPagination && leadPagination.total_pages > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 font-medium">
                    Halaman {leadPagination.page} dari {leadPagination.total_pages} ({leadPagination.total} data)
                  </span>
                  <select
                    value={leadPerPage}
                    onChange={(e) => { setLeadPerPage(Number(e.target.value)); setLeadPage(1); }}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-gray-700 focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value={10}>10 per halaman</option>
                    <option value={20}>20 per halaman</option>
                    <option value={50}>50 per halaman</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={leadPagination.page <= 1}
                    onClick={() => setLeadPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 rounded-lg font-bold border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={leadPagination.page >= leadPagination.total_pages}
                    onClick={() => setLeadPage((p) => Math.min(leadPagination.total_pages, p + 1))}
                    className="px-4 py-2 rounded-lg font-bold border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Team Tab ──────────────────────────────────────── */}
      {activeTab === 'team' && (
        <div className="space-y-6 animate-in zoom-in-95 duration-300 text-left">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Tim Marketing</h3>
              <p className="text-sm text-gray-500 mt-1">Kelola data tim marketing</p>
            </div>
            <button
              onClick={() => setIsAddMarketingModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <UserPlus size={18} />
              Tambah Marketing
            </button>
          </div>

          {/* Team Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Marketing</th>
                    <th className="px-6 py-4">Kontak</th>
                    <th className="px-6 py-4">Target</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {teamHook.persons.map((person) => (
                    <tr key={person.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {person.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{person.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {person.phone && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Phone size={14} className="text-primary" />
                              {person.phone}
                            </div>
                          )}
                          {person.email && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Mail size={14} className="text-primary" />
                              {person.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900">{person.target}</span>
                        <span className="text-xs text-gray-400 ml-1">leads/bln</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${person.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {person.is_active ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => startEditingMarketing(person)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDeleteMarketing(person.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {teamHook.persons.length === 0 && (
                <div className="py-20 text-center space-y-3">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                    <Users size={32} />
                  </div>
                  <p className="text-gray-500 font-medium">Belum ada data marketing.</p>
                </div>
              )}
            </div>
            {teamHook.pagination && teamHook.pagination.total_pages > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 font-medium">
                    Halaman {teamHook.pagination.page} dari {teamHook.pagination.total_pages} ({teamHook.pagination.total} data)
                  </span>
                  <select
                    value={teamPerPage}
                    onChange={(e) => { setTeamPerPage(Number(e.target.value)); setTeamPage(1); }}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-gray-700 focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value={10}>10 per halaman</option>
                    <option value={20}>20 per halaman</option>
                    <option value={50}>50 per halaman</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={teamHook.pagination.page <= 1}
                    onClick={() => setTeamPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 rounded-lg font-bold border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={teamHook.pagination.page >= teamHook.pagination.total_pages}
                    onClick={() => setTeamPage((p) => Math.min(teamHook.pagination!.total_pages, p + 1))}
                    className="px-4 py-2 rounded-lg font-bold border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Siteplan Tab ──────────────────────────────────── */}
      {activeTab === 'siteplan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
          {/* Main Siteplan View */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">
                    Peta Interaktif — {siteplanProjectId ? (projects?.find((p: Project) => p.id === siteplanProjectId)?.name ?? 'Proyek') : (user?.company?.settings?.app_name || 'Semua Proyek')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Data dari Kavling & Unit. Pilih proyek untuk menampilkan siteplan per proyek.</p>
                </div>
                <div className="flex gap-3 items-center">
                  <label className="text-xs font-bold text-gray-500 uppercase">Proyek</label>
                  <select
                    value={siteplanProjectId}
                    onChange={(e) => setSiteplanProjectId(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                  >
                    {(projects ?? []).map((p: Project) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {selectedProject?.layout_svg && (
                    <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg">
                      SVG Tersedia
                    </span>
                  )}
                  <label className={`px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-primary/90 transition-colors inline-flex items-center gap-2 ${isUploadingLayout ? 'opacity-60 pointer-events-none' : ''}`}>
                    {isUploadingLayout ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Mengupload...
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        Upload SVG
                      </>
                    )}
                    <input
                      type="file"
                      accept=".svg,image/svg+xml"
                      className="hidden"
                      onChange={handleUploadLayoutSvg}
                      disabled={isUploadingLayout}
                    />
                  </label>
                </div>
              </div>

              {selectedProject?.layout_svg ? (
                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 overflow-hidden">
                  {isLoadingSvg ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <Loader2 size={32} className="animate-spin text-primary" />
                    </div>
                  ) : svgContent ? (
                    <div
                      ref={svgContainerRef}
                      className="w-full overflow-auto max-h-[600px]"
                      dangerouslySetInnerHTML={{ __html: svgContent }}
                      onClick={handleSvgClick}
                      onMouseOver={handleSvgMouseOver}
                      onMouseOut={handleSvgMouseOut}
                    />
                  ) : (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <p className="text-gray-500">Gagal memuat peta kawasan</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center min-h-[300px] bg-gray-50">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <MapIcon size={32} className="text-gray-300" />
                    </div>
                    <h6 className="text-gray-900 font-bold mb-2">Belum Ada Peta Kawasan</h6>
                    <p className="text-sm text-gray-500 text-center max-w-md mb-4">
                      Upload file SVG untuk menampilkan peta kawasan visual.
                      File SVG akan menggantikan tampilan grid default.
                    </p>
                    <div className="text-xs text-gray-400 mb-6">
                      Format: .svg | Maks: 10MB
                    </div>
                    <label className={`px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-primary/90 transition-colors inline-flex items-center gap-2 ${isUploadingLayout ? 'opacity-60 pointer-events-none' : ''}`}>
                      {isUploadingLayout ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Mengupload...
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          Pilih File SVG
                        </>
                      )}
                      <input
                        type="file"
                        accept=".svg,image/svg+xml"
                        className="hidden"
                        onChange={handleUploadLayoutSvg}
                        disabled={isUploadingLayout}
                      />
                    </label>
                  </div>

                  {/* Default Grid Preview */}
                  <div className="mt-8">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 text-center">
                      Preview Default (Grid)
                    </p>
                    <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                      {siteplanHousing.units.map((unit) => {
                        const style = housingStatusStyle(unit.status);
                        return (
                          <button
                            key={unit.id}
                            onClick={() => setSelectedUnit(unit)}
                            className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 ${
                              selectedUnit?.id === unit.id ? 'ring-4 ring-primary/20 border-primary shadow-lg' :
                              `${style.bg} ${style.border} ${style.text}`
                            }`}
                          >
                            <span className="text-[10px] font-black">{unit.unit_code}</span>
                            <div className={`w-1.5 h-1.5 rounded-full mt-1 ${style.dot}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {siteplanHousing.units.length === 0 && !siteplanHousing.isLoading && !selectedProject?.layout_svg && (
                <p className="text-center text-gray-500 py-8">Belum ada unit. Tambah unit di tab <strong>Kavling & Unit</strong>.</p>
              )}

              {/* Legend */}
              <div className="mt-8 flex flex-wrap justify-center gap-8 bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200">
                {(['Tersedia', 'Proses', 'Sold'] as const).map((status) => {
                  const style = housingStatusStyle(status);
                  const count = siteplanHousing.units.filter((u) => u.status === status).length;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className={`w-5 h-5 ${style.bg} border-2 ${style.border} rounded-lg`} />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900">{status}</span>
                        <span className="text-[10px] text-gray-500">{count} Unit</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Unit Info / Selection */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-24">
              {selectedUnit ? (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold">Detail Unit {selectedUnit.unit_code}</h4>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${housingStatusStyle(selectedUnit.status).bg} ${housingStatusStyle(selectedUnit.status).text}`}>
                      {selectedUnit.status}
                    </span>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400 font-bold uppercase">Harga</span>
                      <span className="text-sm font-bold text-gray-900">{selectedUnit.harga_jual != null ? formatRupiah(selectedUnit.harga_jual) : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400 font-bold uppercase">Tipe</span>
                      <span className="text-sm font-bold text-gray-900">{selectedUnit.unit_type || '—'}</span>
                    </div>
                    {selectedUnit.notes && (
                      <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                        <span className="text-xs text-gray-400 font-bold uppercase">Catatan</span>
                        <span className="text-sm font-bold text-primary">{selectedUnit.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {selectedUnit.status === 'Tersedia' ? (
                      <>
                        <button
                          onClick={() => handleBookUnit(selectedUnit)}
                          className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={18} />
                          Proses Booking
                        </button>
                        <button className="w-full py-3 bg-gray-50 text-gray-600 rounded-xl font-bold border border-gray-200 hover:bg-gray-100 transition-all">
                          Lihat Denah
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          const consumerId = selectedUnit.consumer_id ?? (selectedUnit.consumer as { id?: string } | undefined)?.id;
                          if (consumerId) {
                            navigate('/finance', { state: { openDetailId: consumerId } });
                          } else {
                            // Jika unit sudah terkunci oleh lead (Proses), arahkan user ke edit lead itu.
                            if (selectedUnit.reserved_lead_id) {
                              setActiveTab('leads');
                              void (async () => {
                                try {
                                  const lead = await marketingService.getLeadById(selectedUnit.reserved_lead_id as string);
                                  startEditingLead(lead);
                                } catch {
                                  toast.error('Gagal memuat lead yang mengunci unit ini.');
                                }
                              })();
                              return;
                            }

                            // Fallback: jika belum ada reserved lead, buka modal tambah lead.
                            setActiveTab('leads');
                            if (selectedUnit.project_id) setNewLeadProjectId(selectedUnit.project_id);
                            setNewLeadUnitId(selectedUnit.id);
                            setIsAddModalOpen(true);
                            toast.info('Buat lead untuk unit ini, lalu tambah piutang dari ikon dompet pada baris lead.');
                          }
                        }}
                        className="w-full py-3 bg-primary/10 text-primary rounded-xl font-bold border border-primary/20 hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                      >
                        <TrendingUp size={18} />
                        Lihat Progres Bayar
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary/30">
                    <MapIcon size={32} />
                  </div>
                  <p className="text-gray-400 text-sm font-medium">Pilih unit pada siteplan untuk melihat detail.</p>
                </div>
              )}
            </div>

            <div className="bg-primary p-6 rounded-3xl text-white shadow-lg shadow-primary/20">
              <h4 className="font-bold flex items-center gap-2 mb-2 text-lg text-left">
                <TrendingUp size={20} />
                Update Target
              </h4>
              <p className="text-xs text-primary-foreground/80 mb-4 leading-relaxed text-left">
                Anda hanya butuh {Math.max(0, 15 - siteplanHousing.units.filter((u) => u.status === 'Sold').length)} unit closing lagi untuk mencapai target bulanan!
              </p>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mb-2">
                <div className="bg-white h-full" style={{ width: `${Math.min(100, (siteplanHousing.units.filter((u) => u.status === 'Sold').length / 15) * 100)}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-bold">
                <span>{siteplanHousing.units.filter((u) => u.status === 'Sold').length} Sold</span>
                <span>Target: 15</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Analytics Tab ─────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-in zoom-in-95 duration-300 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Conversion Chart */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={20} className="text-primary" />
                  Tren Leads & Closing
                </h4>
                <select className="bg-gray-50 text-[10px] font-bold uppercase p-2 rounded-lg outline-none border-none">
                  <option>6 Bulan Terakhir</option>
                  <option>Tahun Ini</option>
                </select>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[]}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#b7860f" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#b7860f" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="leads" stroke="#b7860f" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={3} />
                    <Area type="monotone" dataKey="closing" stroke="#d4af37" fillOpacity={0.1} fill="#d4af37" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Source Chart */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <PieChartIcon size={20} className="text-primary" />
                Sumber Prospek
              </h4>
              <div className="h-[300px] w-full flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {[].map((_entry: unknown, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Housing Tab (Read-only) ───────────────────────── */}
      {activeTab === 'housing' && (
        <div className="space-y-8 animate-in zoom-in-95 duration-300 text-left">
          <Housing readOnly />
        </div>
      )}

      {/* ═══ Add Lead Modal ════════════════════════════════════ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-left max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">Tambah Prospek Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={28} />
              </button>
            </div>
            <form onSubmit={handleAddLead}>
              <div className="p-8 space-y-5">
                {/* name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nama Lengkap</label>
                  <input
                    required type="text" value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Masukkan nama prospek..."
                  />
                </div>
                {/* phone + email */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">No. WhatsApp</label>
                    <input
                      type="tel" value={newLead.phone ?? ''}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="0812..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                    <input
                      type="email" value={newLead.email ?? ''}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="prospek@email.com"
                    />
                  </div>
                </div>
                {/* Minat Unit: pilih proyek lalu unit */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Proyek</label>
                    <select
                      value={newLeadProjectId}
                      onChange={(e) => { setNewLeadProjectId(e.target.value); setNewLeadUnitId(''); }}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Pilih Proyek...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Minat Unit</label>
                    <select
                      value={newLeadUnitId}
                      onChange={(e) => setNewLeadUnitId(e.target.value)}
                      disabled={!newLeadProjectId}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer disabled:opacity-60"
                    >
                      <option value="">Pilih Unit...</option>
                      {leadFormUnits.units.map((u) => (
                        <option key={u.id} value={u.id}>{u.unit_code}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sumber</label>
                    <select
                      value={newLead.source ?? ''}
                      onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook Ads">Facebook Ads</option>
                      <option value="Website">Website</option>
                      <option value="Walk-in">Walk-in</option>
                      <option value="Referral">Referral</option>
                    </select>
                  </div>
                </div>
                {/* marketing_id + status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Marketing Person</label>
                    <select
                      value={newLead.marketing_id ?? ''}
                      onChange={(e) => setNewLead({ ...newLead, marketing_id: e.target.value || undefined })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Pilih Marketing...</option>
                      {personsHook.persons.filter((p) => p.is_active).map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status Awal</label>
                    <select
                      value={newLead.status ?? 'Baru'}
                      onChange={(e) => setNewLead({ ...newLead, status: e.target.value as LeadStatus })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Baru">Baru</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Survey">Survey</option>
                    </select>
                  </div>
                </div>
                {/* notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Catatan</label>
                  <textarea
                    value={newLead.notes ?? ''}
                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all h-24 resize-none"
                    placeholder="Catatan tambahan..."
                  />
                </div>
              </div>
              <div className="p-8 bg-gray-50 flex items-center justify-end gap-4 sticky bottom-0">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 text-gray-600 font-bold hover:text-gray-900 transition-colors">
                  Batal
                </button>
                <button type="submit" className="px-8 py-3 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95">
                  Simpan Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Edit Lead Modal ═══════════════════════════════════ */}
      {isEditModalOpen && editingLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-left max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">Edit Data Prospek</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={28} />
              </button>
            </div>
            <form onSubmit={handleUpdateLead}>
              <div className="p-8 space-y-5">
                {/* name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nama Lengkap</label>
                  <input
                    required type="text" value={editingLead.name}
                    onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                {/* phone + email */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">No. WhatsApp</label>
                    <input
                      type="tel" value={editingLead.phone ?? ''}
                      onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                    <input
                      type="email" value={editingLead.email ?? ''}
                      onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>
                {/* Minat Unit: pilih proyek lalu unit */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Proyek</label>
                    <select
                      value={editingLeadProjectId}
                      onChange={(e) => { setEditingLeadProjectId(e.target.value); setEditingLeadUnitId(''); }}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Pilih Proyek...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Minat Unit</label>
                    <select
                      value={editingLeadUnitId}
                      onChange={(e) => setEditingLeadUnitId(e.target.value)}
                      disabled={!editingLeadProjectId}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer disabled:opacity-60"
                    >
                      <option value="">Pilih Unit...</option>
                      {editingLeadUnits.units.map((u) => (
                        <option key={u.id} value={u.id}>{u.unit_code}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sumber</label>
                    <select
                      value={editingLead.source ?? ''}
                      onChange={(e) => setEditingLead({ ...editingLead, source: e.target.value })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Pilih Sumber...</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook Ads">Facebook Ads</option>
                      <option value="Website">Website</option>
                      <option value="Walk-in">Walk-in</option>
                      <option value="Referral">Referral</option>
                    </select>
                  </div>
                </div>
                {/* marketing_id + status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Marketing Person</label>
                    <select
                      value={editingLead.marketing_id ?? ''}
                      onChange={(e) => setEditingLead({ ...editingLead, marketing_id: e.target.value || undefined })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Pilih Marketing...</option>
                      {personsHook.persons.filter((p) => p.is_active).map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status Prospek</label>
                    <select
                      value={editingLead.status}
                      onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value as LeadStatus })}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                    >
                      {LEAD_STATUS_VALUES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* follow_up_date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tanggal Follow-up</label>
                  <input
                    type="date" value={editingLead.follow_up_date ?? ''}
                    onChange={(e) => setEditingLead({ ...editingLead, follow_up_date: e.target.value || undefined })}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                {/* notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Catatan Tambahan</label>
                  <textarea
                    value={editingLead.notes ?? ''}
                    onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all h-24 resize-none"
                    placeholder="Masukkan catatan perkembangan prospek..."
                  />
                </div>
              </div>
              <div className="p-8 bg-gray-50 flex items-center justify-end gap-4 sticky bottom-0">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 text-gray-600 font-bold hover:text-gray-900 transition-colors">
                  Batal
                </button>
                <button type="submit" className="px-8 py-3 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95">
                  Update Prospek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Add Marketing Modal ═══════════════════════════════ */}
      {isAddMarketingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-left">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold">Tambah Marketing Baru</h3>
              <button onClick={() => setIsAddMarketingModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={22} />
              </button>
            </div>
            <form onSubmit={handleAddMarketing}>
              <div className="p-5 space-y-4">
                {/* name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nama Lengkap</label>
                  <input
                    required type="text" value={newMarketing.name}
                    onChange={(e) => setNewMarketing({ ...newMarketing, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                    placeholder="Nama marketing..."
                  />
                </div>
                {/* phone + email */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">No. WhatsApp</label>
                    <input
                      type="tel" value={newMarketing.phone ?? ''}
                      onChange={(e) => setNewMarketing({ ...newMarketing, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                      placeholder="0812..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                    <input
                      type="email" value={newMarketing.email ?? ''}
                      onChange={(e) => setNewMarketing({ ...newMarketing, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                      placeholder="email@domain.com"
                    />
                  </div>
                </div>
                {/* target + is_active */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target (leads/bulan)</label>
                    <input
                      type="number" min={0} value={newMarketing.target ?? 0}
                      onChange={(e) => setNewMarketing({ ...newMarketing, target: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</label>
                    <label className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer">
                      <input
                        type="checkbox" checked={newMarketing.is_active ?? true}
                        onChange={(e) => setNewMarketing({ ...newMarketing, is_active: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-bold text-gray-700">Aktif</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsAddMarketingModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:text-gray-900 transition-colors text-sm">
                  Batal
                </button>
                <button type="submit" className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm">
                  Simpan Marketing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Edit Marketing Modal ══════════════════════════════ */}
      {isEditMarketingModalOpen && editingMarketing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-left">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold">Edit Data Marketing</h3>
              <button onClick={() => setIsEditMarketingModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={22} />
              </button>
            </div>
            <form onSubmit={handleUpdateMarketing}>
              <div className="p-5 space-y-4">
                {/* name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nama Lengkap</label>
                  <input
                    required type="text" value={editingMarketing.name}
                    onChange={(e) => setEditingMarketing({ ...editingMarketing, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                  />
                </div>
                {/* phone + email */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">No. WhatsApp</label>
                    <input
                      type="tel" value={editingMarketing.phone ?? ''}
                      onChange={(e) => setEditingMarketing({ ...editingMarketing, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email</label>
                    <input
                      type="email" value={editingMarketing.email ?? ''}
                      onChange={(e) => setEditingMarketing({ ...editingMarketing, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                {/* target + is_active */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target (leads/bulan)</label>
                    <input
                      type="number" min={0} value={editingMarketing.target}
                      onChange={(e) => setEditingMarketing({ ...editingMarketing, target: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</label>
                    <label className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer">
                      <input
                        type="checkbox" checked={editingMarketing.is_active}
                        onChange={(e) => setEditingMarketing({ ...editingMarketing, is_active: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-bold text-gray-700">Aktif</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsEditMarketingModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:text-gray-900 transition-colors text-sm">
                  Batal
                </button>
                <button type="submit" className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 text-sm">
                  Update Marketing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
