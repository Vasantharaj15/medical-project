import React, { useState, useEffect } from "react";
import {
  Ticket,
  Sparkles,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  User,
  Phone,
  Stethoscope,
  ArrowRight,
  Flame,
  Volume2,
  Calendar,
  XCircle,
  HelpCircle,
  Activity,
  LogIn,
  UserPlus,
  Lock,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Department, Token, User as UserType } from "../types";
import { announceToken } from "../utils/sound";

interface PatientPortalProps {
  departments: Department[];
  currentUser: UserType | null;
  activeToken: Token | null;
  setActiveToken: (token: Token | null) => void;
  allLiveTokens: { calling: Token[]; waiting: Token[] };
  onRefreshData: () => void;
  onOpenAuthModal?: (targetPortal?: 'patient' | 'doctor' | 'admin' | 'database', mode?: 'login' | 'register') => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  departments,
  currentUser,
  activeToken,
  setActiveToken,
  allLiveTokens,
  onRefreshData,
  onOpenAuthModal,
}) => {
  const [fullName, setFullName] = useState(
    currentUser?.full_name || "",
  );
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [age, setAge] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<number>(1);
  const [symptoms, setSymptoms] = useState("");
  const [priority, setPriority] = useState<"normal" | "emergency">("normal");

  const [triageLoading, setTriageLoading] = useState(false);
  const [triageResult, setTriageResult] = useState<{
    departmentId: number;
    priority: "normal" | "emergency";
    reasoning: string;
    firstAidTip: string;
    aiPowered: boolean;
  } | null>(null);

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [myTokens, setMyTokens] = useState<Token[]>([]);

  // Keep fields synced if user switches
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name || "");
      setPhone(currentUser.phone || "");
      fetchMyTokens(currentUser.id);
    }
  }, [currentUser]);

  const fetchMyTokens = async (patientId: number) => {
    try {
      const res = await fetch(`/api/tokens/patient/${patientId}`);
      const data = await res.json();
      if (data.success) {
        setMyTokens(data.tokens || []);
        // If no active token set, pick the latest active one
        if (!activeToken && data.tokens && data.tokens.length > 0) {
          const active = data.tokens.find((t: Token) =>
            ["waiting", "calling", "in_consultation"].includes(t.status),
          );
          if (active) setActiveToken(active);
        }
      }
    } catch {
      // Ignore
    }
  };

  // Run AI / Clinical Triage
  const handleRunTriage = async () => {
    if (!symptoms.trim()) {
      alert("Please describe your symptoms first to run clinical triage.");
      return;
    }

    setTriageLoading(true);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms, patientAge: age }),
      });
      const data = await res.json();
      if (data.success) {
        setTriageResult({
          departmentId: data.departmentId,
          priority: data.priority,
          reasoning: data.reasoning,
          firstAidTip: data.firstAidTip,
          aiPowered: data.aiPowered,
        });
      }
    } catch {
      alert("Triage service temporarily unavailable.");
    } finally {
      setTriageLoading(false);
    }
  };

  const applyTriage = () => {
    if (!triageResult) return;
    setSelectedDeptId(triageResult.departmentId);
    setPriority(triageResult.priority);
  };

  // Submit Token Generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerateError(null);
    setGenerating(true);

    try {
      const res = await fetch("/api/tokens/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: currentUser?.id,
          patient_name: fullName,
          patient_phone: phone,
          department_id: selectedDeptId,
          symptoms,
          priority,
        }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        setActiveToken(data.token);
        onRefreshData();
        if (currentUser) {
          fetchMyTokens(currentUser.id);
        }
        // Scroll to active ticket
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setGenerateError(data.message || "Failed to issue token.");
      }
    } catch (err: any) {
      setGenerateError(err.message || "Network error generating token.");
    } finally {
      setGenerating(false);
    }
  };

  // Cancel Token
  const handleCancelToken = async (tokenId: number) => {
    if (!confirm("Are you sure you wish to cancel this token?")) return;
    try {
      const res = await fetch(`/api/tokens/${tokenId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveToken(null);
        onRefreshData();
        if (currentUser) fetchMyTokens(currentUser.id);
      }
    } catch {
      alert("Error updating status");
    }
  };

  // Calculate position ahead in queue
  const calculateQueueAhead = (token: Token) => {
    if (token.status === "calling" || token.status === "in_consultation")
      return 0;
    const sameDeptWaiting = allLiveTokens.waiting.filter(
      (t) => t.department_id === token.department_id,
    );
    const index = sameDeptWaiting.findIndex((t) => t.id === token.id);
    return index >= 0 ? index : sameDeptWaiting.length;
  };

  const selectedDept =
    departments.find((d) => d.id === selectedDeptId) || departments[0];

  // If patient is not logged in, enforce registration and login first
  if (!currentUser || (currentUser.role !== 'patient' && currentUser.role !== 'admin')) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto border border-sky-100">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
              Registration & Login Required
            </span>
            <h2 className="text-2xl font-bold font-display text-slate-900 mt-3">
              Patient Portal Access Gate
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              In accordance with hospital desk requirements, patients must first register an account and log in before getting into the Patient Portal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              id="patient-gate-register-btn"
              type="button"
              onClick={() => onOpenAuthModal?.('patient', 'register')}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>1. Register Patient</span>
            </button>
            <button
              id="patient-gate-login-btn"
              type="button"
              onClick={() => onOpenAuthModal?.('patient', 'login')}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-bold transition-all border border-slate-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>2. Patient Login</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* View Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 flex items-center gap-2.5">
          <Ticket className="w-7 h-7 text-sky-600" />
          Patient Token Desk
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Issue instant walk-in clinic tokens, check live queue waiting
          positions, and receive voice callouts.
        </p>
      </div>

      {/* Patient Portal Register & Login Section */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
            {currentUser ? <UserCheck className="w-6 h-6 text-emerald-600" /> : <ShieldCheck className="w-6 h-6 text-sky-600" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 font-display">
                {currentUser ? `Patient Account: ${currentUser.full_name}` : 'Patient Portal Registration & Login'}
              </h2>
              {currentUser ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Registered Patient
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  Database Synced
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser
                ? `Logged in. Tokens and consultation requests are automatically recorded in the database with verified timestamps.`
                : `Register or login to save your appointments and clinical token reports into the database with date and time.`}
            </p>
          </div>
        </div>

        {onOpenAuthModal && (
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              id="patient-register-btn"
              type="button"
              onClick={() => onOpenAuthModal('patient', 'register')}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{currentUser ? 'Register New Patient' : 'Register as Patient'}</span>
            </button>
            <button
              id="patient-login-btn"
              type="button"
              onClick={() => onOpenAuthModal('patient', 'login')}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{currentUser ? 'Switch Patient' : 'Patient Login'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ACTIVE TICKET PASS (If Patient has an active token) */}
      {activeToken && (
        <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-sky-800/40 relative overflow-hidden">
          {/* Subtle Background Elements */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left: Token Number & Department */}
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-300 bg-sky-900/60 px-3 py-1 rounded-full border border-sky-700/50">
                  {activeToken.department_name}
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                    activeToken.priority === "emergency"
                      ? "bg-rose-500/30 text-rose-300 border border-rose-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {activeToken.priority} Visit
                </span>
              </div>

              <div className="mt-4">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                  Your Hospital Token
                </p>
                <div className="text-5xl sm:text-7xl font-extrabold font-display tracking-tight text-white mt-1">
                  {activeToken.token_number}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-slate-300">
                <span className="flex items-center gap-1.5 font-medium text-white">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  Proceed to:{" "}
                  <strong className="text-teal-300">
                    {activeToken.room_number}
                  </strong>
                </span>
                {activeToken.doctor_name && (
                  <span className="flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-sky-400" />
                    Doctor: {activeToken.doctor_name}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Live Queue Status & ETA */}
            <div className="w-full md:w-auto bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-center min-w-[280px]">
              <div className="mb-3">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    activeToken.status === "calling"
                      ? "bg-sky-400 text-slate-900 animate-gentle-pulse font-extrabold"
                      : activeToken.status === "in_consultation"
                        ? "bg-indigo-400 text-slate-900 font-bold"
                        : "bg-amber-400/30 text-amber-200 border border-amber-400/40"
                  }`}
                >
                  {activeToken.status === "calling"
                    ? "🔔 NOW CALLING YOUR TOKEN"
                    : activeToken.status.replace("_", " ")}
                </span>
              </div>

              {activeToken.status === "calling" ? (
                <div className="py-2">
                  <p className="text-lg font-bold text-sky-200 animate-pulse">
                    Please proceed inside now!
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Room {activeToken.room_number}
                  </p>
                </div>
              ) : activeToken.status === "in_consultation" ? (
                <div className="py-2">
                  <p className="text-base font-bold text-white">
                    Consultation in progress
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-3xl font-extrabold font-display text-white">
                    {calculateQueueAhead(activeToken)}
                  </div>
                  <p className="text-xs font-medium text-slate-300">
                    Patients ahead of you
                  </p>
                  <p className="text-[11px] text-sky-300/80 mt-1 font-mono-num">
                    Estimated wait: ~{calculateQueueAhead(activeToken) * 8} mins
                  </p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <button
                  onClick={() =>
                    announceToken(
                      activeToken.token_number,
                      activeToken.room_number,
                    )
                  }
                  className="text-sky-300 hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  title="Test audio callout"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Voice Test
                </button>
                <button
                  onClick={() => handleCancelToken(activeToken.id)}
                  className="text-rose-300 hover:text-rose-100 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel Token
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Token Generator & My Past History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Token Form (Left / 7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
                <Ticket className="w-5 h-5 text-sky-600" />
                Book or Generate Walk-in Token
              </h2>
              <p className="text-xs text-slate-500">
                Fill in patient details to reserve an appointment slot in queue
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-sky-50 text-sky-700 rounded-full border border-sky-100">
              Walk-in & Clinic
            </span>
          </div>

          <form onSubmit={handleGenerate} className="mt-6 space-y-5">
            {generateError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {generateError}
              </div>
            )}

            {/* Patient Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Patient Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="patient-name-input"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Patient full name"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="patient-phone-input"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Department Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Department Clinic *
              </label>
              <select
                id="patient-department-select"
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.room_number}) - Code: {d.code}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Room Location: <strong>{selectedDept?.room_number}</strong> (
                {selectedDept?.floor})
              </p>
            </div>

            {/* Symptoms & AI Clinical Triage */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Symptoms & Clinical Reason
                </label>
                <button
                  id="run-ai-triage-btn"
                  type="button"
                  onClick={handleRunTriage}
                  disabled={triageLoading || !symptoms.trim()}
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-800 disabled:opacity-40 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  {triageLoading ? "Evaluating..." : "Smart Clinical Triage"}
                </button>
              </div>

              <textarea
                id="patient-symptoms-textarea"
                rows={3}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your current medical condition (sharp chest tightness, fever, child ear pain, sprained knee)..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* AI Triage Feedback Banner */}
            {triageResult && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-teal-50 border border-sky-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-sky-900">
                          AI Triage Assessment
                        </span>
                        {triageResult.aiPowered && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-200 text-sky-800 font-bold uppercase">
                            Gemini
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${
                            triageResult.priority === "emergency"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {triageResult.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">
                        {triageResult.reasoning}
                      </p>
                      <p className="text-[11px] text-teal-800 mt-1 font-medium italic">
                        Guidance: {triageResult.firstAidTip}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={applyTriage}
                    className="shrink-0 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Apply Suggestion
                  </button>
                </div>
              </div>
            )}

            {/* Visit Priority Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Visit Urgency Level
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPriority("normal")}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    priority === "normal"
                      ? "border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50"
                  }`}
                >
                  <CheckCircle2
                    className={`w-5 h-5 shrink-0 ${priority === "normal" ? "text-sky-600" : "text-slate-400"}`}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Normal Visit
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Standard queue order
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPriority("emergency")}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    priority === "emergency"
                      ? "border-rose-500 bg-rose-50/70 ring-2 ring-rose-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50"
                  }`}
                >
                  <Flame
                    className={`w-5 h-5 shrink-0 ${priority === "emergency" ? "text-rose-600" : "text-slate-400"}`}
                  />
                  <div>
                    <span className="text-xs font-bold text-rose-900 block">
                      Emergency / Critical
                    </span>
                    <span className="text-[11px] text-rose-700">
                      Immediate front-of-queue priority
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="generate-token-submit-btn"
              type="submit"
              disabled={generating}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Issuing Token...
                </>
              ) : (
                <>
                  <Ticket className="w-4 h-4" />
                  Issue Hospital Token Pass
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Waiting Queue Insights & Token History (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Clinic Waiting Stats Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-sky-600" />
              Live Clinic Waiting Room
            </h3>

            <div className="space-y-3">
              {departments.slice(0, 4).map((dept) => {
                const waiting = allLiveTokens.waiting.filter(
                  (t) => t.department_id === dept.id,
                );
                return (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">
                        {dept.name}
                      </span>
                      <span className="text-slate-400 text-[11px] ml-1.5">
                        ({dept.room_number})
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold ${
                        waiting.length > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {waiting.length} waiting
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Patient's History */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-teal-600" />
              My Tokens & History
            </h3>

            {myTokens.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No active or previous tokens recorded for {fullName}. Generate
                your first token on the left!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {myTokens.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setActiveToken(t)}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 rounded-lg px-2 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num font-bold text-slate-900 text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                          {t.token_number}
                        </span>
                        <span className="text-xs text-slate-700 font-medium">
                          {t.department_name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(t.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        • {t.room_number}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        t.status === "calling"
                          ? "bg-blue-100 text-blue-700 animate-pulse"
                          : t.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : t.status === "waiting"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
