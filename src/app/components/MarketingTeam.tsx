import React from 'react';
import { Users, Phone, Mail, Edit2, Trash2, UserPlus, Briefcase, CheckCircle2 } from 'lucide-react';

interface MarketingPerson {
  id: string;
  name: string;
  address: string;
  gender: 'Laki-laki' | 'Perempuan';
  job: string;
  phone: string;
  photo?: string;
  status: 'Aktif' | 'Tidak Aktif';
  type: 'Marketing Offline' | 'Marketing Freelance';
  bankName: string;
  bankAccount: string;
  accountName: string;
  leadsCount?: number;
  closedDeals?: number;
}

interface MarketingTeamProps {
  team: MarketingPerson[];
  onAdd: () => void;
  onEdit: (person: MarketingPerson) => void;
  onDelete: (id: string) => void;
}

export function MarketingTeamTable({ team, onAdd, onEdit, onDelete }: MarketingTeamProps) {
  return (
    <div className="space-y-6">
      {/* Header dengan button tambah */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Tim Marketing</h3>
          <p className="text-sm text-gray-500 mt-1">Kelola data marketing offline dan freelance</p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <UserPlus size={18} />
          Tambah Marketing
        </button>
      </div>

      {/* Tabel Marketing */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Marketing</th>
                <th className="px-6 py-4">Kontak</th>
                <th className="px-6 py-4">Tipe & Pekerjaan</th>
                <th className="px-6 py-4">Performa</th>
                <th className="px-6 py-4">Rekening</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {team.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {person.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                          {person.name}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400">
                          {person.id} • {person.gender}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone size={14} className="text-primary" />
                        {person.phone}
                      </div>
                      <p className="text-[10px] text-gray-400">{person.address}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                          person.type === 'Marketing Offline'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-purple-50 text-purple-600'
                        }`}
                      >
                        {person.type === 'Marketing Offline' ? 'Offline' : 'Freelance'}
                      </span>
                      <p className="text-xs text-gray-600 mt-1">{person.job}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-900">
                        {person.leadsCount || 0} Leads
                      </p>
                      <p className="text-[10px] text-green-600 font-bold">
                        {person.closedDeals || 0} Closing
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-gray-900">{person.bankName}</p>
                      <p className="text-[10px] text-gray-400">{person.bankAccount}</p>
                      <p className="text-[10px] text-gray-400">a.n {person.accountName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        person.status === 'Aktif'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      {person.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(person)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(person.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {team.length === 0 && (
            <div className="py-20 text-center space-y-3">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <Users size={32} />
              </div>
              <p className="text-gray-500 font-medium">Belum ada data tim marketing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
