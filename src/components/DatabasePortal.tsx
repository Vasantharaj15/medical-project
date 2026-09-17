import React, { useState, useEffect, useMemo } from "react";
import {
  Database,
  Activity,
  Users,
  Ticket,
  Calendar,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Download,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Building,
  Server,
  FileSpreadsheet,
  FileText,
  BadgeAlert
} from "lucide-react";
import {
  ActivityLog,
  User,
  Token,
  Department,
  Doctor,
  DatabaseOverview,
} from "../types";

interface DatabasePortalProps {
  currentUser: User | null;
  onRefreshData?: () => void;
}

export const DatabasePortal: React.FC<DatabasePortalProps> = ({
  currentUser: _currentUser,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<
    "logs" | "users" | "tokens" | "architecture"
  >("logs");
  const [data, setData] = useState<DatabaseOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("ALL");

  const fetchDatabaseData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/database/overview");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseData();
    const interval = setInterval(fetchDatabaseData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filtered Logs (Commonly Stored Register, Login, and Issue Details with Indian Time)
  const filteredLogs = useMemo(() => {
    if (!data?.activity_logs) return [];
    return data.activity_logs.filter((log) => {
      let matchesType = true;
      if (eventTypeFilter === "REGISTER") {
        matchesType = log.event_type === "REGISTER";
      } else if (eventTypeFilter === "LOGIN") {
        matchesType = log.event_type === "LOGIN";
      } else if (eventTypeFilter === "ISSUE") {
        matchesType = log.event_type === "TOKEN_GENERATED" || log.event_type.startsWith("TOKEN_");
      } else if (eventTypeFilter !== "ALL") {
        matchesType = log.event_type === eventTypeFilter;
      }

      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.user_name.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.date_time.toLowerCase().includes(q) ||
        log.user_role.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [data?.activity_logs, eventTypeFilter, searchTerm]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    const q = searchTerm.toLowerCase().trim();
    if (!q) return data.users;
    return data.users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    );
  }, [data?.users, searchTerm]);

  // Filtered Tokens (Issue Details)
  const filteredTokens = useMemo(() => {
    if (!data?.tokens) return [];
    const q = searchTerm.toLowerCase().trim();
    if (!q) return data.tokens;
    return data.tokens.filter(
      (t) =>
        t.token_number.toLowerCase().includes(q) ||
        t.patient_name.toLowerCase().includes(q) ||
        t.department_name.toLowerCase().includes(q) ||
        (t.doctor_name && t.doctor_name.toLowerCase().includes(q)) ||
        (t.symptoms && t.symptoms.toLowerCase().includes(q)) ||
        t.status.toLowerCase().includes(q)
    );
  }, [data?.tokens, searchTerm]);

  const handleExportCSV = () => {
    if (!data?.activity_logs) return;
    const headers = [
      "Log ID",
      "Date and Indian Time (IST)",
      "Event Type",
      "User / Patient Name",
      "Role",
      "Common Storage Activity Details",
      "ISO Timestamp",
      "IP Address",
    ];
    const rows = data.activity_logs.map((l) => [
      l.id,
      `"${l.date_time}"`,
      `"${l.event_type}"`,
      `"${l.user_name}"`,
      `"${l.user_role}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.created_at}"`,
      `"${l.ip_address || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `hospital_common_database_records_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeForEvent = (type: ActivityLog["event_type"]) => {
    switch (type) {
      case "REGISTER":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "LOGIN":
        return "bg-sky-100 text-sky-800 border-sky-300";
      case "LOGOUT":
        return "bg-slate-100 text-slate-800 border-slate-300";
      case "TOKEN_GENERATED":
        return "bg-teal-100 text-teal-800 border-teal-300";
      case "TOKEN_CALLED":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "TOKEN_COMPLETED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-amber-100 text-amber-800 border-amber-300";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-100/50 via-teal-100/30 to-sky-100/40 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hospital Core Database • Common Storage Layer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight flex items-center gap-3">
              <Database className="w-8 h-8 text-emerald-600" />
              Common Database & Indian Time Audit Logs
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl mt-1.5 leading-relaxed">
              All registration, login, and issue details are automatically entered and stored commonly in the central database with exact Date and normal Indian Time (IST UTC+5:30).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="refresh-database-btn"
              onClick={() => {
                fetchDatabaseData();
                onRefreshData?.();
              }}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 border border-slate-200 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`}
              />
              Refresh Records
            </button>

            <button
              id="export-csv-btn"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all flex items-center gap-2 border border-emerald-200 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              Export Records (CSV)
            </button>
          </div>
        </div>

        {/* Database Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
              <span>Registered Accounts</span>
              <Users className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-display">
              {data?.stats?.total_users ?? 0}
            </div>
            <span className="text-[11px] text-sky-700 font-medium">
              Patients, Doctors & Admins
            </span>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
              <span>All Activity & Audit Logs</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-display">
              {data?.stats?.total_logs ?? 0}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">
              Stored with Indian Time
            </span>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
              <span>Total Tokens & Issues</span>
              <Ticket className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-display">
              {data?.stats?.total_tokens ?? 0}
            </div>
            <span className="text-[11px] text-teal-700 font-medium">
              Clinic Appointments
            </span>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/60">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
              <span>Last Stored Event Time</span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xs font-bold text-slate-800 truncate font-mono mt-1">
              {data?.stats?.last_activity_date_time || "Syncing..."}
            </div>
            <span className="text-[11px] text-purple-700 font-medium">
              Indian Standard Time (IST)
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6 gap-4">
        <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar">
          <button
            id="tab-db-logs-btn"
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "logs"
                ? "bg-white text-emerald-800 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            All Register, Login & Issue Details ({data?.activity_logs?.length || 0})
          </button>

          <button
            id="tab-db-users-btn"
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "users"
                ? "bg-white text-sky-800 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-600" />
            Registered Accounts ({data?.users?.length || 0})
          </button>

          <button
            id="tab-db-tokens-btn"
            onClick={() => setActiveTab("tokens")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "tokens"
                ? "bg-white text-teal-800 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Ticket className="w-3.5 h-3.5 text-teal-600" />
            Tokens & Issue Registry ({data?.tokens?.length || 0})
          </button>

          <button
            id="tab-db-arch-btn"
            onClick={() => setActiveTab("architecture")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "architecture"
                ? "bg-white text-purple-800 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Server className="w-3.5 h-3.5 text-purple-600" />
            Database Architecture & System
          </button>
        </div>

        {/* Live IST Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>All records timestamped in Indian Time (IST)</span>
        </div>
      </div>

      {/* TAB 1: ALL REGISTER, LOGIN & ISSUE DETAILS (Common Storage with Indian Time) */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by person, email, token number, or issue details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
            </div>

            {/* Quick Event Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Event Category:
              </span>
              {[
                { label: "All Records", val: "ALL" },
                { label: "Register Details", val: "REGISTER" },
                { label: "Login Details", val: "LOGIN" },
                { label: "Issue & Token Details", val: "ISSUE" },
                { label: "Logout", val: "LOGOUT" },
              ].map(({ label, val }) => (
                <button
                  key={val}
                  onClick={() => setEventTypeFilter(val)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    eventTypeFilter === val
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date & Normal Indian Time</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Person / Patient</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Commonly Stored Record Details</th>
                    <th className="py-3 px-4">Log ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-slate-400 text-sm"
                      >
                        No database records found matching your search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Date and Normal Indian Time */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-800 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{log.date_time}</span>
                          </div>
                        </td>

                        {/* Event Type Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getBadgeForEvent(log.event_type)}`}
                          >
                            {log.event_type === 'TOKEN_GENERATED' ? 'ISSUE DETAILS' : log.event_type.replace("_", " ")}
                          </span>
                        </td>

                        {/* Person / Patient */}
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {log.user_name}
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="capitalize font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {log.user_role}
                          </span>
                        </td>

                        {/* Detailed Description */}
                        <td className="py-3 px-4 text-slate-700 max-w-lg">
                          <span className="font-medium leading-relaxed">{log.details}</span>
                        </td>

                        {/* Record ID */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px] text-slate-400">
                          #{log.id}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                Showing {filteredLogs.length} activity details entered & stored commonly in database
              </span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Persistent Indian Time (IST) Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTERED ACCOUNTS DIRECTORY */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search registered accounts by name, email, role, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {filteredUsers.length} accounts stored in database
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Email / ID</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Registered Date & Indian Time</th>
                    <th className="py-3 px-4">Last Login Date & Indian Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        #{u.id}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {u.full_name}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {u.phone || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : u.role === "doctor"
                                ? "bg-sky-100 text-sky-800"
                                : "bg-teal-100 text-teal-800"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.created_at_formatted || "Pre-seeded"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-emerald-700 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {u.last_login_formatted || "Never logged in"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TOKENS & ISSUE REGISTRY */}
      {activeTab === "tokens" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search issued tokens by number, patient name, doctor, symptoms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {filteredTokens.length} tokens logged in database
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Token #</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Department & Room</th>
                    <th className="py-3 px-4">Doctor Assigned</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Symptoms / Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Issued Date & Indian Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTokens.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-teal-700 text-sm">
                        {t.token_number}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {t.patient_name}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-medium">{t.department_name}</div>
                        <div className="text-[11px] text-slate-500">
                          {t.room_number}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {t.doctor_name || "Unassigned"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            t.priority === "emergency"
                              ? "bg-rose-100 text-rose-800 animate-pulse"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {t.symptoms || "General Health Consultation"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            t.status === "calling"
                              ? "bg-amber-100 text-amber-800"
                              : t.status === "in_consultation"
                                ? "bg-sky-100 text-sky-800"
                                : t.status === "completed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-teal-600" />
                          <span>{t.created_at_formatted || new Date(t.created_at).toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATABASE ARCHITECTURE */}
      {activeTab === "architecture" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-2">
              <Server className="w-5 h-5 text-emerald-600" />
              Central In-Memory Database Engine & Schema
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              All records for users, doctors, departments, tokens, and audit events are stored centrally and shared across all hospital desks. All write actions (Registration, Authentication, Token Issuance, Doctor Calls, and Status changes) generate immutable audit logs with Date and Indian Time (IST).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Users Table</span>
                </div>
                <p className="text-xs text-slate-600">
                  Stores accounts for Patients, Doctors, and Administrators with registration date & last login formatted in Indian Time.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                  <Ticket className="w-4 h-4 text-teal-600" />
                  <span>Tokens & Queue Table</span>
                </div>
                <p className="text-xs text-slate-600">
                  Stores walk-in tokens, priority triage ratings, symptoms, assigned physician, and timestamps in Indian Standard Time.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Activity Logs Table</span>
                </div>
                <p className="text-xs text-slate-600">
                  Captures all REGISTER, LOGIN, TOKEN_GENERATED (Issue), and consultation events commonly with Date and normal Indian Time.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
