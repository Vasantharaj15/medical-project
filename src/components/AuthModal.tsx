import React, { useState, useEffect } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Stethoscope, 
  ShieldCheck, 
  User as UserIcon, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Database
} from 'lucide-react';
import { User, Doctor } from '../types';

export type PortalType = 'patient' | 'doctor' | 'admin' | 'database';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPortal?: 'patient' | 'doctor' | 'admin' | 'database';
  onAuthSuccess: (user: User, doctor?: Doctor, targetView?: 'patient' | 'doctor' | 'admin' | 'database') => void;
  allUsers: User[];
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  targetPortal = 'doctor',
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [selectedPortal, setSelectedPortal] = useState<PortalType>(
    targetPortal === 'admin' ? 'admin' : targetPortal === 'doctor' ? 'doctor' : targetPortal === 'database' ? 'database' : 'patient'
  );
  const [isRegisterMode, setIsRegisterMode] = useState(initialMode === 'register');

  // Credentials / User Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const activePortal: PortalType = targetPortal === 'admin' ? 'admin' : targetPortal === 'doctor' ? 'doctor' : targetPortal === 'database' ? 'database' : 'patient';
      setSelectedPortal(activePortal);
      setErrorMsg(null);
      setSuccessMsg(null);
      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
      setIsRegisterMode(initialMode === 'register');
    }
  }, [isOpen, targetPortal, initialMode]);

  if (!isOpen) return null;

  const handlePortalSelect = (portal: PortalType) => {
    setSelectedPortal(portal);
    setErrorMsg(null);
    setSuccessMsg(null);
    setEmail('');
    setPassword('');
  };

  const handleDirectDatabaseAccess = () => {
    onAuthSuccess(
      {
        id: 999,
        full_name: 'Database Auditor',
        email: 'database@hospital.org',
        role: 'database',
        created_at: new Date().toISOString()
      },
      undefined,
      'database'
    );
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail) {
      setErrorMsg('Please enter your email or ID.');
      return;
    }
    if (!cleanPass) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPass,
          targetPortal: selectedPortal
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed. Please check credentials.');
      }

      setSuccessMsg(`Logged in successfully! Entering ${selectedPortal === 'doctor' ? 'Doctor Portal' : selectedPortal === 'admin' ? 'Admin Portal' : 'Patient Portal'}...`);

      setTimeout(() => {
        onAuthSuccess(data.user, data.doctor, selectedPortal);
        onClose();
      }, 500);

    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('Please provide your full name and email address.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please create a password for your account.');
      return;
    }

    setLoading(true);
    try {
      const userRole = selectedPortal === 'doctor' ? 'doctor' : selectedPortal === 'admin' ? 'admin' : 'patient';

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          role: userRole,
          password: password.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed.');
      }

      setSuccessMsg(`Account registered successfully with Indian Time! Logging into ${selectedPortal === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}...`);

      setTimeout(async () => {
        // Auto-login after registration
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password.trim(),
            targetPortal: selectedPortal
          })
        });
        const loginData = await loginRes.json();
        if (loginData.success) {
          onAuthSuccess(loginData.user, loginData.doctor, selectedPortal);
          onClose();
        } else {
          setIsRegisterMode(false);
        }
      }, 700);

    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving to database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        id="unified-auth-modal"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-md w-full overflow-hidden flex flex-col animate-scale-up"
      >
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-5 text-white relative">
          <button
            id="close-unified-auth-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
              {selectedPortal === 'doctor' ? 'Doctor Access' : selectedPortal === 'admin' ? 'Admin Access' : selectedPortal === 'database' ? 'Database Portal' : 'Patient Access'}
            </span>
          </div>
          <h3 className="text-xl font-bold font-display text-white">
            {isRegisterMode 
              ? `Register ${selectedPortal === 'doctor' ? 'Doctor' : selectedPortal === 'admin' ? 'Admin' : selectedPortal === 'database' ? 'Database Auditor' : 'Patient'} Account`
              : `Login to ${selectedPortal === 'doctor' ? 'Doctor Portal' : selectedPortal === 'admin' ? 'Admin Portal' : selectedPortal === 'database' ? 'Database Portal' : 'Patient Portal'}`
            }
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>First register and login then get into portal (Stored in Indian Time)</span>
          </p>
        </div>

        {/* Portal Selector Tabs (Patient, Doctor, Database, Admin) */}
        <div className="p-3 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/80 rounded-2xl">
            {/* Patient */}
            <button
              type="button"
              id="portal-tab-patient"
              onClick={() => handlePortalSelect('patient')}
              className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                selectedPortal === 'patient'
                  ? 'bg-white text-teal-700 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserIcon className="w-4 h-4 text-teal-600" />
              <span className="text-[11px] truncate">Patient</span>
            </button>

            {/* Doctor */}
            <button
              type="button"
              id="portal-tab-doctor"
              onClick={() => handlePortalSelect('doctor')}
              className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                selectedPortal === 'doctor'
                  ? 'bg-white text-emerald-700 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px] truncate">Doctor</span>
            </button>

            {/* Database */}
            <button
              type="button"
              id="portal-tab-database"
              onClick={() => handlePortalSelect('database')}
              className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                selectedPortal === 'database'
                  ? 'bg-white text-emerald-800 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px] truncate">Database</span>
            </button>

            {/* Admin */}
            <button
              type="button"
              id="portal-tab-admin"
              onClick={() => handlePortalSelect('admin')}
              className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                selectedPortal === 'admin'
                  ? 'bg-white text-purple-700 shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span className="text-[11px] truncate">Admin</span>
            </button>
          </div>

          {/* Mode Switcher: Register vs Login */}
          <div className="flex items-center gap-2 mt-2.5">
            <button
              type="button"
              id="auth-mode-login-tab"
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isRegisterMode
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>

            <button
              type="button"
              id="auth-mode-register-tab"
              onClick={() => {
                setIsRegisterMode(true);
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isRegisterMode
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Account</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {errorMsg && (
            <div className="mb-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isRegisterMode ? (
            /* Registration Form */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200/80 text-xs text-teal-900">
                <span className="font-bold">Step 1: First Register</span>
                <p className="text-[11px] text-teal-700 mt-0.5">
                  Enter your details below to register in the central hospital database. All records are timestamped in normal Indian Time.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={selectedPortal === 'doctor' ? 'Dr. Full Name' : 'Full Name'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter contact phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Creating Account in Database...' : `Register & Continue to ${selectedPortal === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}`}</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className="text-xs text-slate-500 hover:text-teal-700 font-semibold cursor-pointer"
                >
                  Already registered? Switch to Login
                </button>
              </div>
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200/80 text-xs text-sky-900">
                <span className="font-bold">Step 2: Sign In to Portal</span>
                <p className="text-[11px] text-sky-700 mt-0.5">
                  Enter your registered credentials to authenticate and access your portal.
                </p>
              </div>

              {/* Direct Database Portal Quick Access Card */}
              {selectedPortal === 'database' && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                      <Database className="w-4 h-4 text-emerald-600" />
                      <span>Database Central Audit Desk</span>
                    </div>
                    <span className="text-[9px] bg-emerald-200 text-emerald-800 font-mono px-1.5 py-0.5 rounded font-bold">IST</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Directly access all entered registrations, logins, and issued tokens recorded with normal Indian Time.
                  </p>
                  <button
                    type="button"
                    id="quick-open-database-btn"
                    onClick={handleDirectDatabaseAccess}
                    className="mt-2.5 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Open Database Portal Directly</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <div className="mt-2 text-center text-[10px] text-emerald-600 font-medium">
                    — or sign in with your registered account below —
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {selectedPortal === 'database' ? 'Database Admin / User Email' : `${selectedPortal.charAt(0).toUpperCase() + selectedPortal.slice(1)} ID / Email`} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter email or ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-2 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  selectedPortal === 'doctor' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  selectedPortal === 'admin' ? 'bg-purple-600 hover:bg-purple-700' :
                  selectedPortal === 'database' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>
                  {loading ? 'Authenticating...' : `Log In & Open ${selectedPortal === 'doctor' ? 'Doctor Portal' : selectedPortal === 'admin' ? 'Admin Portal' : selectedPortal === 'database' ? 'Database Portal' : 'Patient Portal'}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className="text-xs text-teal-600 hover:text-teal-800 font-bold cursor-pointer"
                >
                  Need an account? First register here
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
