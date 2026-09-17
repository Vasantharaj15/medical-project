import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Megaphone, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Volume2, 
  SkipForward, 
  UserCheck, 
  AlertCircle,
  Play,
  RotateCcw,
  User,
  Phone,
  Activity,
  ChevronDown,
  LogIn
} from 'lucide-react';
import { Doctor, Token, Department, User as UserType } from '../types';
import { announceToken, playChime } from '../utils/sound';

interface DoctorDeskProps {
  doctors: Doctor[];
  departments: Department[];
  allLiveTokens: { calling: Token[]; waiting: Token[] };
  currentUser?: UserType | null;
  onOpenAuthModal?: () => void;
  onRefreshData: () => void;
}

export const DoctorDesk: React.FC<DoctorDeskProps> = ({
  doctors,
  departments,
  allLiveTokens,
  currentUser,
  onOpenAuthModal,
  onRefreshData,
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(doctors[0]?.id || 1);
  const [callingNext, setCallingNext] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];

  // Tokens waiting in this doctor's department
  const doctorWaitingQueue = allLiveTokens.waiting
    .filter((t) => t.department_id === currentDoctor?.department_id)
    .sort((a, b) => {
      if (a.priority === 'emergency' && b.priority !== 'emergency') return -1;
      if (a.priority !== 'emergency' && b.priority === 'emergency') return 1;
      return a.id - b.id;
    });

  // Current active consultation or calling token for this doctor
  const currentCalling = allLiveTokens.calling.find(
    (t) => (t.doctor_id === currentDoctor?.id || t.department_id === currentDoctor?.department_id) && 
           (t.status === 'calling' || t.status === 'in_consultation')
  );

  // Call next patient
  const handleCallNext = async () => {
    if (!currentDoctor) return;
    setCallingNext(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/doctors/${currentDoctor.id}/call-next`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success && data.token) {
        setActionMessage(`Calling ${data.token.token_number} - ${data.token.patient_name}`);
        onRefreshData();

        // Audio announcement
        if (voiceEnabled) {
          announceToken(data.token.token_number, currentDoctor.room_number, true);
        } else {
          playChime();
        }
      } else {
        setActionMessage(data.message || 'No patients waiting in queue.');
      }
    } catch {
      setActionMessage('Failed to call next patient.');
    } finally {
      setCallingNext(false);
    }
  };

  // Call specific token
  const handleCallSpecific = async (token: Token) => {
    try {
      const res = await fetch(`/api/tokens/${token.id}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_id: currentDoctor?.id })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Calling ${token.token_number}`);
        onRefreshData();
        if (voiceEnabled) {
          announceToken(token.token_number, currentDoctor?.room_number || token.room_number, true);
        } else {
          playChime();
        }
      }
    } catch {
      setActionMessage('Error calling token.');
    }
  };

  // Change token status
  const handleStatusChange = async (tokenId: number, newStatus: Token['status']) => {
    try {
      const res = await fetch(`/api/tokens/${tokenId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Token updated to ${newStatus}`);
        onRefreshData();
      }
    } catch {
      setActionMessage('Failed to update status.');
    }
  };

  // Toggle doctor availability
  const handleToggleDoctorStatus = async (newStatus: 'available' | 'busy' | 'offline') => {
    if (!currentDoctor) return;
    try {
      await fetch(`/api/doctors/${currentDoctor.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      onRefreshData();
    } catch {
      // ignore
    }
  };

  // If doctor is not logged in, enforce login first
  if (!currentUser || (currentUser.role !== 'doctor' && currentUser.role !== 'admin')) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
              Doctor Authentication Required
            </span>
            <h2 className="text-2xl font-bold font-display text-slate-900 mt-3">
              Doctor Portal Access Gate
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Practitioners must first log in with doctor credentials to get into the Doctor Portal and access clinical calling controls.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              id="doctor-gate-login-btn"
              type="button"
              onClick={() => onOpenAuthModal?.()}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Doctor Login</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* Console Header & Doctor Profile Selector */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wide">
              Clinical Practitioner Station
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
              currentDoctor?.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
              currentDoctor?.status === 'busy' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
            }`}>
              ● {currentDoctor?.status || 'available'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-7 h-7 text-teal-600" />
            {currentDoctor?.full_name}
          </h1>

          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>{currentDoctor?.specialization}</span>
            <span>•</span>
            <strong className="text-slate-800">{currentDoctor?.department_name} ({currentDoctor?.room_number})</strong>
          </p>
        </div>

        {/* Doctor Switcher & Audio Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Select Doctor */}
          <div className="relative flex-1 md:flex-initial">
            <select
              id="doctor-station-select"
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
              className="w-full md:w-auto pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.full_name} ({doc.room_number})
                </option>
              ))}
            </select>
          </div>

          {/* Voice Announcement Toggle */}
          <button
            id="toggle-voice-desk-btn"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              voiceEnabled 
                ? 'bg-teal-50 text-teal-700 border-teal-200' 
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
            title="Toggle speech synthesis voice announcements"
          >
            <Volume2 className="w-4 h-4" />
            <span>Voice Call {voiceEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Test Sound */}
          <button
            onClick={() => announceToken('TEST 101', currentDoctor?.room_number || 'Room 101', true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            Test Chime
          </button>

          {/* Doctor Login / Authenticate */}
          {onOpenAuthModal && (
            <button
              id="doctor-portal-login-btn"
              onClick={onOpenAuthModal}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{currentUser?.role === 'doctor' ? 'Switch Doctor' : 'Doctor Login'}</span>
            </button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-800 font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-600 animate-pulse" />
          {actionMessage}
        </div>
      )}

      {/* Main Action Bar: Call Next Button & Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* BIG CALL NEXT PATIENT BANNER (12 cols or left 7) */}
        <div className="md:col-span-7 bg-gradient-to-br from-teal-700 via-sky-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-200 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                Waiting in Queue: {doctorWaitingQueue.length} Patients
              </span>
              {doctorWaitingQueue.some((t) => t.priority === 'emergency') && (
                <span className="text-xs font-bold uppercase tracking-wider bg-rose-500 text-white px-3 py-1 rounded-full animate-bounce flex items-center gap-1 shadow-md">
                  <Flame className="w-3.5 h-3.5" />
                  Emergency Case Waiting
                </span>
              )}
            </div>

            <div className="mt-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
                Ready for Consultation?
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-md">
                Emergency priority patients will automatically be called first, followed by standard queue arrival order.
              </p>
            </div>
          </div>

          <div className="mt-8 relative z-10">
            <button
              id="call-next-patient-btn"
              onClick={handleCallNext}
              disabled={callingNext || doctorWaitingQueue.length === 0}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-teal-900 rounded-2xl font-extrabold text-base shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
            >
              {callingNext ? (
                <>
                  <div className="w-5 h-5 border-2 border-teal-900 border-t-transparent rounded-full animate-spin" />
                  Calling Next in Queue...
                </>
              ) : (
                <>
                  <Megaphone className="w-5 h-5 text-teal-700" />
                  CALL NEXT PATIENT
                </>
              )}
            </button>
          </div>
        </div>

        {/* CURRENT SERVING PATIENT CARD (Right 5 cols) */}
        <div className="md:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Current Consultation
              </span>
              {currentCalling ? (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 animate-pulse uppercase">
                  {currentCalling.status.replace('_', ' ')}
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  Room Idle
                </span>
              )}
            </div>

            {currentCalling ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="text-4xl font-extrabold font-display text-sky-700 font-mono-num">
                    {currentCalling.token_number}
                  </div>
                  {currentCalling.priority === 'emergency' && (
                    <span className="text-[11px] font-bold bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full uppercase">
                      Emergency Case
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{currentCalling.patient_name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {currentCalling.patient_phone || 'No phone recorded'}
                  </p>
                </div>

                {currentCalling.symptoms && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                    <span className="font-semibold block text-slate-900 mb-0.5">Reported Symptoms:</span>
                    {currentCalling.symptoms}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-slate-400 text-xs">
                <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                No patient currently in consultation. Click <strong>CALL NEXT PATIENT</strong> to summon the next in line.
              </div>
            )}
          </div>

          {/* Action Buttons for Current Patient */}
          {currentCalling && (
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="re-announce-btn"
                  onClick={() => announceToken(currentCalling.token_number, currentDoctor?.room_number || currentCalling.room_number, true)}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  Recall / Voice
                </button>

                {currentCalling.status === 'calling' ? (
                  <button
                    id="start-consult-btn"
                    onClick={() => handleStatusChange(currentCalling.id, 'in_consultation')}
                    className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Start Visit
                  </button>
                ) : (
                  <button
                    id="complete-consult-btn"
                    onClick={() => handleStatusChange(currentCalling.id, 'completed')}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Complete Visit
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange(currentCalling.id, 'skipped')}
                  className="flex-1 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors cursor-pointer"
                >
                  Mark No-Show / Skip
                </button>
                {currentCalling.status === 'in_consultation' && (
                  <button
                    onClick={() => handleStatusChange(currentCalling.id, 'completed')}
                    className="flex-1 py-1.5 text-emerald-600 hover:text-emerald-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Finish Visit ✓
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* DEPARTMENT WAITING QUEUE TABLE */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              {currentDoctor?.department_name} Waiting Room ({doctorWaitingQueue.length})
            </h3>
            <p className="text-xs text-slate-500">Live order of patients queued for {currentDoctor?.room_number}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Order:</span>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Emergency First
            </span>
            <span className="text-xs font-medium text-slate-600">→ Arrival Time</span>
          </div>
        </div>

        {doctorWaitingQueue.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Queue is Clear!</p>
            <p className="text-xs text-slate-400 mt-0.5">No patients currently waiting for {currentDoctor?.department_name}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Token #</th>
                  <th className="pb-3 px-3">Patient Name</th>
                  <th className="pb-3 px-3">Symptoms / Notes</th>
                  <th className="pb-3 px-3">Urgency</th>
                  <th className="pb-3 px-3">Arrival Time</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {doctorWaitingQueue.map((t, index) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono-num font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[11px] w-4">#{index + 1}</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-sky-800 border border-slate-200">
                          {t.token_number}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {t.patient_name}
                      {t.patient_phone && (
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {t.patient_phone}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {t.symptoms || 'General consultation'}
                    </td>

                    <td className="py-3 px-3">
                      {t.priority === 'emergency' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 inline-flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          Emergency
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                          Normal
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-400">
                      {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleCallSpecific(t)}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-700 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                      >
                        Call Now
                      </button>
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
