import React, { useState } from 'react';
import { 
  Building2, 
  User as UserIcon, 
  UserPlus,
  Stethoscope, 
  Home, 
  Tv,
  Phone,
  PhoneCall,
  CheckCircle2, 
  ChevronDown, 
  LogIn, 
  LogOut, 
  Clock, 
  ShieldCheck, 
  Database,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { User, Doctor } from '../types';

export type AppView = 'home' | 'patient' | 'doctor' | 'admin' | 'database' | 'tv';

interface NavbarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  sseConnected: boolean;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  allUsers: User[];
  doctors?: Doctor[];
  onOpenAuthModal: (targetPortal?: 'patient' | 'doctor' | 'admin' | 'database', mode?: 'login' | 'register') => void;
  waitingCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  currentUser,
  setCurrentUser,
  doctors = [],
  onOpenAuthModal,
  waitingCount: _waitingCount,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [loginMenuOpen, setLoginMenuOpen] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  // Available doctors count
  const availableDoctors = doctors.filter((d) => d.status === 'available');
  const availableCount = availableDoctors.length > 0 ? availableDoctors.length : doctors.length;

  const handleLogout = async () => {
    if (currentUser) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUser.id })
        });
      } catch {
        // ignore
      }
    }
    setCurrentUser(null);
    setCurrentView('home');
    setProfileDropdownOpen(false);
  };

  const getPortalNameForUser = (user: User) => {
    switch (user.role) {
      case 'doctor':
        return 'Doctor Console';
      case 'admin':
        return 'Admin Portal';
      default:
        return 'Patient Desk';
    }
  };

  const openUserPortal = () => {
    if (!currentUser) return;
    if (currentUser.role === 'doctor') setCurrentView('doctor');
    else if (currentUser.role === 'admin') setCurrentView('admin');
    else setCurrentView('patient');
    setProfileDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Brand Identity */}
          <button 
            id="brand-home-button"
            onClick={() => setCurrentView('home')} 
            className="flex items-center gap-2.5 sm:gap-3 text-left focus:outline-none group cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-600 via-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-display font-bold text-base sm:text-xl text-slate-900 tracking-tight flex items-center gap-1">
                Medi<span className="text-sky-600">Token</span>
              </div>
              <p className="hidden sm:block text-[10px] font-semibold text-slate-500 tracking-wide uppercase">Hospital Queue Desk</p>
            </div>
          </button>

          {/* RIGHT SIDE: Combined Nav (Home, Patient, Doctor, Contact) + Far Right Login Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Combined Nav Bar */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-inner">
              {/* Home */}
              <button
                id="nav-home-btn"
                onClick={() => setCurrentView('home')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'home'
                    ? 'bg-white text-sky-700 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Home className="w-3.5 h-3.5 text-sky-600" />
                <span>Home</span>
              </button>

              {/* Patient with direct Desk, Login & Register options */}
              <div 
                className="relative flex items-center"
                onMouseEnter={() => setShowPatientDropdown(true)}
                onMouseLeave={() => setShowPatientDropdown(false)}
              >
                <button
                  id="nav-patient-btn"
                  onClick={() => {
                    if (currentUser && (currentUser.role === 'patient' || currentUser.role === 'admin')) {
                      setCurrentView('patient');
                    } else {
                      onOpenAuthModal('patient', 'login');
                    }
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-l-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    currentView === 'patient'
                      ? 'bg-white text-teal-700 shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  title={currentUser ? `Signed in as ${currentUser.full_name}` : "Patient must first register and login"}
                >
                  <UserIcon className="w-3.5 h-3.5 text-teal-600" />
                  <span>Patient</span>
                </button>
                <button
                  id="nav-patient-dropdown-toggle"
                  onClick={() => setShowPatientDropdown(!showPatientDropdown)}
                  className={`px-1 sm:px-1.5 py-1.5 rounded-r-lg text-xs font-bold transition-all border-l border-slate-200/80 cursor-pointer ${
                    showPatientDropdown
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                  }`}
                  title="Patient Portal, Login & Register"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${showPatientDropdown ? 'rotate-180 text-teal-700' : ''}`} />
                </button>

                {/* Patient Dropdown Menu */}
                {showPatientDropdown && (
                  <div className="absolute left-0 top-full mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-scale-up">
                    <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                      <span>Patient Access</span>
                      {currentUser?.role === 'patient' ? (
                        <span className="text-[9px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded">Signed In</span>
                      ) : (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">Auth Required</span>
                      )}
                    </div>

                    <button
                      id="dropdown-patient-register-btn"
                      onClick={() => {
                        onOpenAuthModal('patient', 'register');
                        setShowPatientDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-900 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                        <UserPlus className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-teal-800">1. Patient Register</div>
                        <div className="text-[10px] text-slate-400">First register patient account</div>
                      </div>
                    </button>

                    <button
                      id="dropdown-patient-login-btn"
                      onClick={() => {
                        onOpenAuthModal('patient', 'login');
                        setShowPatientDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-900 flex items-center gap-2.5 cursor-pointer transition-colors border-t border-slate-50"
                    >
                      <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                        <LogIn className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-sky-800">2. Patient Login</div>
                        <div className="text-[10px] text-slate-400">Login with email & password</div>
                      </div>
                    </button>

                    <button
                      id="dropdown-patient-desk-btn"
                      onClick={() => {
                        if (currentUser && (currentUser.role === 'patient' || currentUser.role === 'admin')) {
                          setCurrentView('patient');
                        } else {
                          onOpenAuthModal('patient', 'login');
                        }
                        setShowPatientDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 cursor-pointer transition-colors border-t border-slate-100"
                    >
                      <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">
                          {currentUser ? 'Enter Patient Desk' : 'Get into Patient Desk'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {currentUser ? `Active as ${currentUser.full_name}` : 'Login required first'}
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Doctor - Only Doctor, nothing else */}
              <button
                id="nav-doctor-btn"
                onClick={() => {
                  if (currentUser?.role === 'doctor' || currentUser?.role === 'admin') {
                    setCurrentView('doctor');
                  } else {
                    onOpenAuthModal('doctor', 'login');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'doctor'
                    ? 'bg-white text-emerald-700 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                <span>Doctor</span>
              </button>

              {/* Contact (Emergency: 9843593154) */}
              <div className="relative">
                <button
                  id="nav-contact-btn"
                  onClick={() => setShowContactDropdown(!showContactDropdown)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    showContactDropdown
                      ? 'bg-rose-100 text-rose-800'
                      : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50/70'
                  }`}
                  title="Emergency Contact: 9843593154 (Only for emergency)"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden md:inline">Contact</span>
                  <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                    9843593154
                  </span>
                </button>

                {/* Contact Dropdown - Strictly emergency 9843593154 */}
                {showContactDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-rose-200 py-3 z-50 animate-scale-up"
                    onMouseLeave={() => setShowContactDropdown(false)}
                  >
                    <div className="px-4 pb-2 border-b border-rose-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                        <PhoneCall className="w-4 h-4 text-rose-600" />
                        <span>Emergency Contact</span>
                      </div>
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded uppercase">
                        Only for Emergency
                      </span>
                    </div>

                    <div className="p-3 text-xs space-y-2">
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950">
                        <div className="text-[11px] font-semibold text-rose-700">Immediate Emergency Line:</div>
                        <a 
                          href="tel:9843593154" 
                          className="mt-1 flex items-center justify-between font-mono font-bold text-base text-rose-600 hover:text-rose-800 bg-white p-2 rounded-lg border border-rose-200"
                        >
                          <span>9843593154</span>
                          <span className="text-xs bg-rose-600 text-white px-2 py-0.5 rounded font-sans font-bold">Call Now</span>
                        </a>
                        <p className="text-[10px] text-rose-600 mt-1.5 font-medium">
                          Notice: Number 9843593154 is reserved strictly for emergencies.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FAR RIGHT CORNER: LOGIN WITH PATIENT, DOCTOR & DATABASE */}
            {!currentUser ? (
              <div className="relative" onMouseLeave={() => setLoginMenuOpen(false)}>
                <div className="flex items-center rounded-xl bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 p-0.5 shadow-sm shrink-0">
                  <button
                    id="top-right-login-btn"
                    onClick={() => setLoginMenuOpen(!loginMenuOpen)}
                    className="px-3.5 py-1.5 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-white/10 rounded-xl transition-all cursor-pointer active:scale-95"
                    title="Sign in to Hospital Portal (Patient, Doctor, Database)"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Login</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${loginMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Login Menu Dropdown */}
                {loginMenuOpen && (
                  <div 
                    id="top-right-login-dropdown"
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2.5 z-50 animate-scale-up"
                  >
                    <div className="px-3.5 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                      <span>Hospital Portals</span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">IST</span>
                    </div>

                    <div className="p-1.5 space-y-1">
                      {/* Patient Login & Register */}
                      <button
                        id="login-menu-patient-btn"
                        onClick={() => {
                          setLoginMenuOpen(false);
                          onOpenAuthModal('patient', 'login');
                        }}
                        className="w-full text-left px-2.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 rounded-xl flex items-center gap-2.5 font-medium cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-800 flex items-center justify-between">
                            <span>Patient</span>
                            <span className="text-[10px] text-teal-600 font-semibold">Portal</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">Book token & medical status</div>
                        </div>
                      </button>

                      {/* Doctor Login */}
                      <button
                        id="login-menu-doctor-btn"
                        onClick={() => {
                          setLoginMenuOpen(false);
                          onOpenAuthModal('doctor', 'login');
                        }}
                        className="w-full text-left px-2.5 py-2 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-900 rounded-xl flex items-center gap-2.5 font-medium cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-800 flex items-center justify-between">
                            <span>Doctor</span>
                            <span className="text-[10px] text-sky-600 font-semibold">Console</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">Consultation queue & calling</div>
                        </div>
                      </button>

                      {/* Database Portal inside Login */}
                      <button
                        id="login-menu-database-btn"
                        onClick={() => {
                          setLoginMenuOpen(false);
                          setCurrentView('database');
                        }}
                        className={`w-full text-left px-2.5 py-2 text-xs rounded-xl flex items-center gap-2.5 cursor-pointer transition-all ${
                          currentView === 'database'
                            ? 'bg-emerald-600 text-white font-bold shadow-xs'
                            : 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100 font-bold border border-emerald-200/80'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          currentView === 'database' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-800'
                        }`}>
                          <Database className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span>Database</span>
                            <span className={`text-[9px] px-1 rounded font-mono ${
                              currentView === 'database' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-800'
                            }`}>IST</span>
                          </div>
                          <div className={`text-[10px] font-normal truncate ${
                            currentView === 'database' ? 'text-white/80' : 'text-emerald-700'
                          }`}>Registered data & issue logs</div>
                        </div>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 mt-1 pt-1.5 px-2">
                      <button
                        id="login-menu-admin-btn"
                        onClick={() => {
                          setLoginMenuOpen(false);
                          onOpenAuthModal('admin', 'login');
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs text-slate-600 hover:bg-purple-50 hover:text-purple-900 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-[11px] font-medium">Administrator Login</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* When logged in: shows active persona & portal quick switcher + Database button */
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  id="top-right-database-btn-active"
                  onClick={() => setCurrentView('database')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    currentView === 'database'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100'
                  }`}
                  title="Open Central Database Portal"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Database</span>
                </button>

                <div className="relative">
                  <button
                    id="user-profile-menu-btn"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 pl-2 pr-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold transition-all border border-slate-200 shadow-xs cursor-pointer"
                  >
                    <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-[10px] ${
                      currentUser.role === 'admin' ? 'bg-purple-600' :
                      currentUser.role === 'doctor' ? 'bg-sky-600' :
                      currentUser.role === 'database' ? 'bg-emerald-600' : 'bg-teal-600'
                    }`}>
                      {currentUser.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="text-left hidden sm:block max-w-[110px]">
                      <div className="truncate text-xs font-bold leading-none text-slate-800">
                        {currentUser.full_name.split(' ')[0]}
                      </div>
                      <div className="text-[10px] text-slate-500 capitalize leading-none mt-0.5">
                        {currentUser.role === 'database' ? 'DB Admin' : currentUser.role}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Logged in User Profile & Portal Navigation Dropdown */}
                  {profileDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2.5 z-50 animate-scale-up"
                      onMouseLeave={() => setProfileDropdownOpen(false)}
                    >
                      {/* User Info Header */}
                      <div className="px-3.5 py-2 border-b border-slate-100">
                        <div className="text-xs font-bold text-slate-900">{currentUser.full_name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-1">
                          <Clock className="w-3 h-3" />
                          <span>Logged in: {currentUser.last_login_formatted || 'Active'}</span>
                        </div>
                      </div>

                      {/* Direct Portal Access */}
                      <div className="p-2 border-b border-slate-100">
                        <button
                          onClick={openUserPortal}
                          className="w-full text-left px-3 py-2 text-xs bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl flex items-center justify-between font-bold cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {currentUser.role === 'doctor' ? <Stethoscope className="w-4 h-4 text-sky-600" /> :
                             currentUser.role === 'admin' ? <ShieldCheck className="w-4 h-4 text-purple-600" /> :
                             currentUser.role === 'database' ? <Database className="w-4 h-4 text-emerald-600" /> :
                             <UserIcon className="w-4 h-4 text-teal-600" />}
                            <span>Open {getPortalNameForUser(currentUser)}</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                        </button>
                      </div>

                      {/* Database Portal Option in Profile Dropdown */}
                      <div className="px-2 py-1 border-b border-slate-100">
                        <button
                          id="profile-database-portal-btn"
                          onClick={() => {
                            setCurrentView('database');
                            setProfileDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between font-semibold cursor-pointer transition-colors ${
                            currentView === 'database'
                              ? 'bg-emerald-100 text-emerald-900 font-bold'
                              : 'text-emerald-800 hover:bg-emerald-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Database className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Database Portal</span>
                          </div>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.5 rounded font-bold">IST</span>
                        </button>
                      </div>

                      {/* Switch Portal Login */}
                      <div className="px-2 py-1 border-b border-slate-100">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            onOpenAuthModal('doctor');
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 font-medium cursor-pointer transition-colors"
                        >
                          <LogIn className="w-3.5 h-3.5 text-slate-500" />
                          <span>Switch Login / Other Portal</span>
                        </button>
                      </div>

                      {/* Sign Out */}
                      <div className="pt-1.5 px-2">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-semibold cursor-pointer transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out of Session</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
