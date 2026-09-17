import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, AppView } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { PatientPortal } from './components/PatientPortal';
import { DoctorDesk } from './components/DoctorDesk';
import { AdminPortal } from './components/AdminPortal';
import { DatabasePortal } from './components/DatabasePortal';
import { AuthModal } from './components/AuthModal';
import { TVDisplay } from './components/TVDisplay';
import { Department, Doctor, Token, AdminStats, User, SSEEventData } from './types';
import { announceToken, playChime } from './utils/sound';
import { Bell, HeartPulse, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [sseConnected, setSseConnected] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTargetPortal, setAuthTargetPortal] = useState<'patient' | 'doctor' | 'admin' | 'database'>('patient');
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const handleOpenAuthModal = (target: 'patient' | 'doctor' | 'admin' | 'database' = 'doctor', mode: 'login' | 'register' = 'login') => {
    setAuthTargetPortal(target);
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  // Core Data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [liveTokens, setLiveTokens] = useState<{ calling: Token[]; waiting: Token[] }>({ calling: [], waiting: [] });
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Active User Persona (Loaded dynamically from database)
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Active Patient Ticket
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [calledAlert, setCalledAlert] = useState<Token | null>(null);

  // Data Fetchers
  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success) setDepartments(data.departments || []);
    } catch {
      // ignore
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      const data = await res.json();
      if (data.success) setDoctors(data.doctors || []);
    } catch {
      // ignore
    }
  };

  const fetchLiveTokens = async () => {
    try {
      const res = await fetch('/api/tokens/live');
      const data = await res.json();
      if (data.success) {
        setLiveTokens({ calling: data.calling || [], waiting: data.waiting || [] });
      }
    } catch {
      // ignore
    }
  };

  const fetchAllTokens = async () => {
    try {
      const res = await fetch('/api/tokens/all');
      const data = await res.json();
      if (data.success) setAllTokens(data.tokens || []);
    } catch {
      // ignore
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) setStats(data.stats || null);
    } catch {
      // ignore
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success && data.users) {
        setAllUsers(data.users);
      }
    } catch {
      // ignore
    }
  };

  const refreshAll = useCallback(() => {
    fetchLiveTokens();
    fetchAllTokens();
    fetchStats();
    fetchDoctors();
    fetchUsers();
  }, []);

  // Initial Load
  useEffect(() => {
    fetchDepartments();
    fetchDoctors();
    fetchUsers();
    refreshAll();
  }, [refreshAll]);

  // Server-Sent Events (SSE) Real-time updates
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const setupSSE = () => {
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          setSseConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const data: SSEEventData = JSON.parse(event.data);

            if (data.type === 'TOKEN_CALLED' && data.token) {
              refreshAll();
              
              // If this is the patient's active token, trigger alert!
              if (activeToken && activeToken.id === data.token.id) {
                setActiveToken(data.token);
                setCalledAlert(data.token);
                announceToken(data.token.token_number, data.token.room_number, true);
              } else if (currentView === 'tv') {
                // TV board automatically speaks token
                announceToken(data.token.token_number, data.token.room_number, true);
              }
            } else if (
              data.type === 'TOKEN_GENERATED' || 
              data.type === 'TOKEN_STATUS_CHANGED' || 
              data.type === 'QUEUE_RESET' || 
              data.type === 'DOCTOR_UPDATED' ||
              data.type === 'USER_REGISTERED' ||
              data.type === 'USER_LOGGED_IN' ||
              data.type === 'ACTIVITY_LOG'
            ) {
              refreshAll();
            }
          } catch {
            // ignore
          }
        };

        eventSource.onerror = () => {
          setSseConnected(false);
          eventSource?.close();
          // Attempt reconnection after 4s
          setTimeout(setupSSE, 4000);
        };
      } catch {
        setSseConnected(false);
      }
    };

    setupSSE();

    return () => {
      eventSource?.close();
    };
  }, [activeToken, currentView, refreshAll]);

  // Fullscreen TV View Mode
  if (currentView === 'tv') {
    return (
      <TVDisplay
        callingTokens={liveTokens.calling}
        waitingTokens={liveTokens.waiting}
        departments={departments}
        doctors={doctors}
        onExit={() => setCurrentView('home')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        sseConnected={sseConnected}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        allUsers={allUsers}
        doctors={doctors}
        onOpenAuthModal={(target, mode) => handleOpenAuthModal(target || 'doctor', mode || 'login')}
        waitingCount={liveTokens.waiting.length}
      />

      {/* Floating Called Notification Banner */}
      {calledAlert && (
        <div className="bg-gradient-to-r from-sky-600 to-teal-600 text-white px-4 py-3 shadow-lg flex items-center justify-between sticky top-16 z-30 animate-gentle-pulse">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white text-sky-700 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-sky-100">Now Calling Your Token</p>
                <p className="text-sm font-extrabold font-display">
                  Token {calledAlert.token_number} — Please enter {calledAlert.room_number} immediately!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => announceToken(calledAlert.token_number, calledAlert.room_number, true)}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Replay Audio
              </button>
              <button
                onClick={() => setCalledAlert(null)}
                className="px-3 py-1 bg-white text-sky-700 rounded-lg text-xs font-bold hover:bg-sky-50 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            departments={departments}
            doctors={doctors}
            liveTokens={liveTokens}
            stats={stats}
            onNavigate={setCurrentView}
            currentUser={currentUser}
            onOpenAuthModal={(target, mode) => handleOpenAuthModal(target || 'patient', mode || 'login')}
          />
        )}

        {currentView === 'patient' && (
          <PatientPortal
            departments={departments}
            currentUser={currentUser}
            activeToken={activeToken}
            setActiveToken={setActiveToken}
            allLiveTokens={liveTokens}
            onRefreshData={refreshAll}
            onOpenAuthModal={(target, mode) => handleOpenAuthModal(target || 'patient', mode || 'login')}
          />
        )}

        {currentView === 'doctor' && (
          <DoctorDesk
            doctors={doctors}
            departments={departments}
            allLiveTokens={liveTokens}
            currentUser={currentUser}
            onOpenAuthModal={() => handleOpenAuthModal('doctor', 'login')}
            onRefreshData={refreshAll}
          />
        )}

        {currentView === 'admin' && (
          <AdminPortal
            stats={stats}
            departments={departments}
            doctors={doctors}
            allTokens={allTokens}
            currentUser={currentUser}
            onOpenAuthModal={() => handleOpenAuthModal('admin', 'login')}
            onRefreshData={refreshAll}
          />
        )}

        {currentView === 'database' && (
          <DatabasePortal
            currentUser={currentUser}
            onRefreshData={refreshAll}
            onOpenAuthModal={() => handleOpenAuthModal('database', 'login')}
          />
        )}
      </main>

      {/* Register / Sign-in Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        targetPortal={authTargetPortal}
        initialMode={authModalMode}
        allUsers={allUsers}
        onAuthSuccess={(user, doctor, target) => {
          setCurrentUser(user);
          setAllUsers((prev) => {
            const exists = prev.some((u) => u.id === user.id);
            return exists ? prev.map((u) => (u.id === user.id ? user : u)) : [user, ...prev];
          });
          if (target) {
            setCurrentView(target);
          }
          refreshAll();
          fetchUsers();
        }}
      />

      {/* Hospital Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-700">MediToken Hospital Management System</span>
            <span>•</span>
            <span>Enterprise Full-Stack Architecture</span>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setCurrentView('tv')} 
              className="hover:text-sky-600 font-medium transition-colors cursor-pointer"
            >
              Public TV Monitor
            </button>
            <button 
              onClick={() => setCurrentView('doctor')} 
              className="hover:text-sky-600 font-medium transition-colors cursor-pointer"
            >
              Doctor Console
            </button>
            <button 
              onClick={() => setCurrentView('admin')} 
              className="hover:text-sky-600 font-medium transition-colors cursor-pointer"
            >
              Admin Analytics
            </button>
            <button 
              onClick={() => setCurrentView('database')} 
              className="hover:text-emerald-600 font-medium transition-colors cursor-pointer"
            >
              Database Portal
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
