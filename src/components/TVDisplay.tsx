import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  ArrowLeft, 
  Flame, 
  Building2, 
  Clock, 
  CheckCircle,
  Bell
} from 'lucide-react';
import { Token, Department, Doctor } from '../types';
import { announceToken, playChime } from '../utils/sound';

interface TVDisplayProps {
  callingTokens: Token[];
  waitingTokens: Token[];
  departments: Department[];
  doctors: Doctor[];
  onExit: () => void;
}

export const TVDisplay: React.FC<TVDisplayProps> = ({
  callingTokens,
  waitingTokens,
  departments,
  doctors,
  onExit,
}) => {
  const [time, setTime] = useState(new Date());
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Digital clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Primary active token currently calling
  const currentCalling = callingTokens[0] || null;

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-sky-500 selection:text-white">
      
      {/* Top TV Bar */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
        
        {/* Brand & Hospital Banner */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl tracking-tight text-white flex items-center gap-2">
              MediToken <span className="text-sky-400">Live Waiting Board</span>
            </h1>
            <p className="text-xs text-slate-400 tracking-wider uppercase font-medium">
              Central Hospital Outpatient Clinic Queue
            </p>
          </div>
        </div>

        {/* Live Clock & Screen Controls */}
        <div className="flex items-center gap-4">
          
          {/* Digital Clock */}
          <div className="text-right px-4 py-1.5 bg-slate-900 rounded-xl border border-slate-800">
            <div className="font-mono-num text-xl sm:text-2xl font-extrabold text-sky-400 tracking-wider">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          {/* Voice Toggle */}
          <button
            id="tv-toggle-voice-btn"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              voiceEnabled 
                ? 'bg-sky-950/80 text-sky-300 border-sky-800 hover:bg-sky-900' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title={voiceEnabled ? 'Voice announcements active' : 'Voice muted'}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Sound Test */}
          <button
            onClick={() => {
              if (currentCalling) {
                announceToken(currentCalling.token_number, currentCalling.room_number, true);
              } else {
                playChime();
              }
            }}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            Test Chime
          </button>

          {/* Fullscreen */}
          <button
            id="tv-fullscreen-btn"
            onClick={toggleFullscreen}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Exit TV Screen */}
          <button
            onClick={onExit}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit TV</span>
          </button>
        </div>

      </header>

      {/* Main Waiting Room Display Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 flex-1 items-stretch">
        
        {/* LEFT 7 COLS: HUGE NOW CALLING HIGHLIGHT */}
        <div className="lg:col-span-7 bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border-2 border-sky-500/80 p-6 sm:p-10 flex flex-col justify-between shadow-2xl shadow-sky-500/10 relative overflow-hidden">
          
          {/* Beacon Aura */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold tracking-widest uppercase bg-sky-500 text-slate-950 animate-gentle-pulse">
                <Bell className="w-4 h-4" />
                NOW CALLING
              </span>

              {currentCalling?.priority === 'emergency' && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  <Flame className="w-4 h-4 text-rose-400" />
                  Priority Emergency
                </span>
              )}
            </div>

            {currentCalling ? (
              <div className="mt-8 text-center sm:text-left">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Token Number</p>
                <div className="text-6xl sm:text-8xl lg:text-9xl font-extrabold font-display tracking-tight text-white font-mono-num drop-shadow-md mt-2">
                  {currentCalling.token_number}
                </div>

                <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-sky-500/30">
                  <div className="text-3xl sm:text-5xl font-black font-display text-sky-400 tracking-wide">
                    PROCEED TO {currentCalling.room_number.toUpperCase()}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-300 text-sm sm:text-base">
                    <span>Patient: <strong className="text-white">{currentCalling.patient_name}</strong></span>
                    <span>Department: <strong className="text-sky-300">{currentCalling.department_name}</strong></span>
                    {currentCalling.doctor_name && (
                      <span>Physician: <strong className="text-white">{currentCalling.doctor_name}</strong></span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center">
                <div className="text-6xl font-extrabold text-slate-700 font-mono-num">
                  ---
                </div>
                <div className="text-2xl font-bold text-slate-500 mt-4">
                  WAITING FOR NEXT CALL
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  Please be seated. Next token will be summoned shortly.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Audio Chime & Voice Callouts Active</span>
            <span className="font-mono-num">Auto-updating live queue</span>
          </div>

        </div>

        {/* RIGHT 5 COLS: NEXT TOKENS IN QUEUE */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-3xl border border-slate-800 p-6 flex flex-col justify-between">
          
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-400" />
                Upcoming in Queue ({waitingTokens.length})
              </h2>
              <span className="text-xs text-slate-400 font-medium">Please be ready</span>
            </div>

            {waitingTokens.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                <CheckCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                No patients currently waiting in queue.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/70 max-h-[480px] overflow-y-auto mt-2">
                {waitingTokens.slice(0, 8).map((t, idx) => (
                  <div key={t.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 font-mono text-xs w-4">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-mono-num font-extrabold text-base text-sky-400">
                          {t.token_number}
                        </span>
                        <div className="text-xs text-slate-300 font-medium">{t.patient_name}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-200">{t.room_number}</div>
                      <div className="text-[11px] text-slate-400">{t.department_name}</div>
                    </div>

                    {t.priority === 'emergency' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        EMERGENCY
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-500 text-center">
            Queue refreshed in real-time via hospital event stream
          </div>

        </div>

      </main>

      {/* Multi-Clinic Active Rooms Strip */}
      <section className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {departments.slice(0, 4).map((dept) => {
            const activeInRoom = callingTokens.find((t) => t.department_id === dept.id);
            return (
              <div key={dept.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold text-slate-300">{dept.room_number}</span>
                  <span>{dept.code}</span>
                </div>
                <div className="font-semibold text-slate-200 mt-0.5 truncate">{dept.name}</div>
                <div className="mt-1 font-mono-num font-bold text-sm text-sky-400">
                  {activeInRoom ? `Now: ${activeInRoom.token_number}` : 'Room Available'}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Announcement Marquee Ticker */}
      <footer className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-4 flex items-center gap-3 overflow-hidden text-xs text-slate-300">
        <span className="font-bold text-sky-400 shrink-0 uppercase tracking-wider flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5" /> Notice:
        </span>
        <div className="truncate font-medium text-slate-300">
          Please keep your token pass visible. Proceed to your consultation room promptly when your number is called. In case of acute cardiac or breathing distress, alert hospital triage staff immediately.
        </div>
      </footer>

    </div>
  );
};
