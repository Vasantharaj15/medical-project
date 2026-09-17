import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Stethoscope, 
  RefreshCw, 
  Search, 
  Filter, 
  Building, 
  SlidersHorizontal, 
  ChevronDown, 
  Trash2,
  LogIn,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import { AdminStats, Department, Doctor, Token, User as UserType } from '../types';

interface AdminPortalProps {
  stats: AdminStats | null;
  departments: Department[];
  doctors: Doctor[];
  allTokens: Token[];
  currentUser?: UserType | null;
  onOpenAuthModal?: () => void;
  onRefreshData: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  stats,
  departments,
  doctors,
  allTokens,
  currentUser,
  onOpenAuthModal,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [resetting, setResetting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filter master tokens
  const filteredTokens = allTokens.filter((t) => {
    const matchesSearch = 
      t.token_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.room_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesDept = deptFilter === 'all' || t.department_id.toString() === deptFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  // Handle Token Status Override
  const handleUpdateTokenStatus = async (tokenId: number, newStatus: Token['status']) => {
    try {
      const res = await fetch(`/api/tokens/${tokenId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(`Token #${tokenId} status changed to ${newStatus}`);
        onRefreshData();
      }
    } catch {
      alert('Error updating status');
    }
  };

  // Reset hospital queues
  const handleResetSystem = async () => {
    if (!confirm('Are you sure you want to reset all hospital active queues?')) return;
    setResetting(true);
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionNotice(data.message);
        onRefreshData();
      }
    } catch {
      alert('Reset failed');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-purple-600" />
            Hospital Operations & Queue Administration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time analytics, queue supervision, doctor allocations, and system controls.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenAuthModal && (
            <button
              id="admin-portal-login-btn"
              onClick={onOpenAuthModal}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{currentUser?.role === 'admin' ? 'Switch Admin' : 'Admin Login'}</span>
            </button>
          )}

          <button
            onClick={onRefreshData}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            id="admin-reset-queue-btn"
            onClick={handleResetSystem}
            disabled={resetting}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            {resetting ? 'Resetting...' : 'Reset Queue Counters'}
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-900 font-semibold flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-purple-600 hover:text-purple-800 text-xs font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Analytics KPI Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Tokens</span>
            <span className="text-3xl font-extrabold font-display text-slate-900 mt-1 block">{stats.total_tokens}</span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Generated today</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Waiting</span>
            <span className="text-3xl font-extrabold font-display text-amber-600 mt-1 block">{stats.waiting_tokens}</span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">In waiting lounge</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider block">Now Calling</span>
            <span className="text-3xl font-extrabold font-display text-sky-600 mt-1 block">{stats.calling_tokens}</span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Heading to rooms</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">Consulting</span>
            <span className="text-3xl font-extrabold font-display text-indigo-600 mt-1 block">{stats.in_consultation_tokens}</span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Active with doctors</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Completed</span>
            <span className="text-3xl font-extrabold font-display text-emerald-600 mt-1 block">{stats.completed_tokens}</span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Finished visits</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Emergency</span>
            <span className="text-3xl font-extrabold font-display text-rose-600 mt-1 block">{stats.emergency_tokens}</span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Priority triage</span>
          </div>
        </div>
      )}

      {/* Departments Live Capacity Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2 mb-4">
          <Building className="w-4 h-4 text-purple-600" />
          Clinic Room Loads & Doctor Roster
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {departments.slice(0, 4).map((dept) => {
            const doc = doctors.find((d) => d.department_id === dept.id);
            const waitingCount = allTokens.filter((t) => t.department_id === dept.id && t.status === 'waiting').length;
            const activeToken = allTokens.find((t) => t.department_id === dept.id && (t.status === 'calling' || t.status === 'in_consultation'));

            return (
              <div key={dept.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono-num font-bold text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                      {dept.code}
                    </span>
                    <span className="text-xs font-bold text-slate-600">{dept.room_number}</span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mt-2">{dept.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Doctor: <strong>{doc?.full_name || 'Staff Doctor'}</strong>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500">{waitingCount} waiting</span>
                  {activeToken ? (
                    <span className="font-mono-num font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded text-[11px]">
                      Serving {activeToken.token_number}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Available</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Master Queue Management Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900">
              Master Hospital Token Registry ({filteredTokens.length})
            </h3>
            <p className="text-xs text-slate-500">Live operational log of all patient tokens across departments</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by token #, name..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="waiting">Waiting</option>
              <option value="calling">Calling</option>
              <option value="in_consultation">In Consultation</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Clinics</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id.toString()}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredTokens.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No tokens match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Token #</th>
                  <th className="pb-3 px-3">Patient</th>
                  <th className="pb-3 px-3">Department & Room</th>
                  <th className="pb-3 px-3">Doctor</th>
                  <th className="pb-3 px-3">Priority</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTokens.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono-num font-bold text-slate-900">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-sky-900 border border-slate-200">
                        {t.token_number}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {t.patient_name}
                      {t.patient_phone && (
                        <span className="block text-[11px] text-slate-400 font-normal">{t.patient_phone}</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-700">
                      {t.department_name}
                      <span className="block text-[11px] text-slate-400">{t.room_number}</span>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {t.doctor_name || '—'}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.priority === 'emergency' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {t.priority}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                        t.status === 'calling' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                        t.status === 'in_consultation' ? 'bg-indigo-100 text-indigo-700' :
                        t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        t.status === 'waiting' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {t.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateTokenStatus(t.id, 'completed')}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-bold cursor-pointer"
                            title="Mark visit done"
                          >
                            Mark Done
                          </button>
                        )}
                        {t.status === 'waiting' && (
                          <button
                            onClick={() => handleUpdateTokenStatus(t.id, 'calling')}
                            className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded text-[11px] font-bold cursor-pointer"
                            title="Call token"
                          >
                            Call
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

function RotateCw(props: any) {
  return (
    <svg {...props} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
    </svg>
  );
}
