import React from 'react';
import { 
  UserCheck, 
  UserPlus,
  LogIn,
  Lock,
  Stethoscope, 
  ShieldCheck, 
  Tv, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Building, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  Activity,
  HeartPulse,
  Database
} from 'lucide-react';
import { Department, Doctor, Token, AdminStats, User } from '../types';

interface HomeViewProps {
  departments: Department[];
  doctors: Doctor[];
  liveTokens: { calling: Token[]; waiting: Token[] };
  stats: AdminStats | null;
  onNavigate: (view: 'home' | 'patient' | 'doctor' | 'admin' | 'database' | 'tv') => void;
  onSelectToken?: (token: Token) => void;
  currentUser?: User | null;
  onOpenAuthModal?: (targetPortal?: 'patient' | 'doctor' | 'admin' | 'database', mode?: 'login' | 'register') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  departments,
  doctors,
  liveTokens,
  stats,
  onNavigate,
  currentUser,
  onOpenAuthModal,
}) => {
  const isPatientLoggedIn = currentUser && (currentUser.role === 'patient' || currentUser.role === 'admin');
  const isDoctorLoggedIn = currentUser && (currentUser.role === 'doctor' || currentUser.role === 'admin');

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold mb-6 shadow-xs">
          <Activity className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
          <span>Real-time Hospital Queue & Smart Appointments</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-display max-w-3xl mx-auto leading-tight">
          Hospital Token & <span className="bg-gradient-to-r from-sky-600 to-teal-600 bg-clip-text text-transparent">Appointment</span> Management
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal">
          Seamless queue tracking for patients, streamlined caller dashboard for doctors, and central hospital operations control.
        </p>

        {/* Quick Hospital Live Metrics */}
        {stats && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto px-4">
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200 text-center shadow-xs">
              <p className="text-xs font-medium text-slate-500">Currently Waiting</p>
              <p className="text-2xl font-bold font-display text-amber-600 mt-0.5">{stats.waiting_tokens}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200 text-center shadow-xs">
              <p className="text-xs font-medium text-slate-500">Now Calling</p>
              <p className="text-2xl font-bold font-display text-sky-600 mt-0.5">{stats.calling_tokens + stats.in_consultation_tokens}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200 text-center shadow-xs">
              <p className="text-xs font-medium text-slate-500">Completed Visits</p>
              <p className="text-2xl font-bold font-display text-emerald-600 mt-0.5">{stats.completed_tokens}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200 text-center shadow-xs">
              <p className="text-xs font-medium text-slate-500">Active Doctors</p>
              <p className="text-2xl font-bold font-display text-slate-800 mt-0.5">{stats.total_doctors}</p>
            </div>
          </div>
        )}
      </section>

      {/* Hospital Service Access */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-slate-900 font-display">Hospital Service Desk & Live Display</h2>
          <p className="text-sm text-slate-500 mt-1">Issue walk-in queue tokens or launch the waiting area monitor</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* 1. Patient Portal */}
          <div 
            id="portal-card-patient"
            onClick={() => {
              if (isPatientLoggedIn) {
                onNavigate('patient');
              } else {
                onOpenAuthModal?.('patient', 'login');
              }
            }}
            className="group relative bg-white rounded-2xl p-6 border border-slate-200/90 hover:border-sky-500 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-1.5">
                Patient Portal
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold border border-sky-100">
                  Instant
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Register account, sign in, generate walk-in tokens, run smart symptom triage, and track real-time queue position on your mobile device.
              </p>
            </div>
            
            <div className="mt-5">
              {isPatientLoggedIn ? (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-teal-700 font-bold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/60 mb-3">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="truncate">Signed in: {currentUser?.full_name}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-600 group-hover:text-sky-700">
                    <span>Enter Patient Portal</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-semibold bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/80 mb-3">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>First register and login then only get into portal</span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      id="patient-desk-card-register-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAuthModal?.('patient', 'register');
                      }}
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register</span>
                    </button>
                    <button
                      id="patient-desk-card-login-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAuthModal?.('patient', 'login');
                      }}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Login</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Doctor Portal */}
          <div 
            id="portal-card-doctor"
            onClick={() => {
              if (isDoctorLoggedIn) {
                onNavigate('doctor');
              } else {
                onOpenAuthModal?.('doctor', 'login');
              }
            }}
            className="group relative bg-white rounded-2xl p-6 border border-slate-200/90 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-1.5">
                Doctor Portal
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                  Clinical
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Physician consultation console to call waiting patients in sequence, review symptom triage assessments, update diagnoses, and write prescriptions.
              </p>
            </div>
            
            <div className="mt-5">
              {isDoctorLoggedIn ? (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 mb-3">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Doctor Active: {currentUser?.full_name}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
                    <span>Enter Doctor Portal</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-semibold bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/80 mb-3">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>First register and login then only get into portal</span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      id="doctor-desk-card-register-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAuthModal?.('doctor', 'register');
                      }}
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register</span>
                    </button>
                    <button
                      id="doctor-desk-card-login-btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAuthModal?.('doctor', 'login');
                      }}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Login</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Public TV Waiting Board */}
          <div 
            id="portal-card-tv"
            onClick={() => onNavigate('tv')}
            className="group relative bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/20 transition-all duration-300 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Tv className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-1.5">
                Waiting Room TV Display
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Live
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Fullscreen public queue board with audio chimes and voice announcements for hospital consultation rooms.
              </p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-sky-400 group-hover:text-sky-300">
              <span>Launch TV Board</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </section>

      {/* Hospital Departments Realtime Directory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
                <Building className="w-5 h-5 text-sky-600" />
                Hospital Departments & Consultation Rooms
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time status of clinics, doctor assignments, and active queue length</p>
            </div>
            <button
              onClick={() => onNavigate('patient')}
              className="self-start sm:self-center px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl border border-sky-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <HeartPulse className="w-4 h-4 text-sky-600" />
              Book Token in Clinic
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const deptDoctors = doctors.filter((d) => d.department_id === dept.id);
              const deptTokensWaiting = liveTokens.waiting.filter((t) => t.department_id === dept.id);
              const deptCurrentCalling = liveTokens.calling.find((t) => t.department_id === dept.id);

              return (
                <div key={dept.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 hover:bg-white hover:border-slate-300 transition-all shadow-2xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono-num text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                        {dept.code}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{dept.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{dept.room_number} • {dept.floor}</p>
                    </div>

                    <div className="text-right">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        deptTokensWaiting.length > 0 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {deptTokensWaiting.length} waiting
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-2.5 line-clamp-2">{dept.description}</p>

                  <div className="mt-3 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                      {deptDoctors.length > 0 ? deptDoctors[0].full_name : 'Physician On Duty'}
                    </span>
                    {deptCurrentCalling ? (
                      <span className="font-bold text-sky-700 font-mono-num bg-sky-50 px-1.5 py-0.5 rounded text-[11px]">
                        Serving: {deptCurrentCalling.token_number}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Room Ready</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
};
