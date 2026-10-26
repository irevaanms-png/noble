import React, { useState, useEffect } from 'react';
import { initAuth } from './services/auth';
import { sound } from './services/audio';
import { ArcReactorCanvas } from './components/ArcReactorCanvas';
import { ConsoleChat } from './components/ConsoleChat';
import { EdithScreenVision } from './components/EdithScreenVision';
import { SmartHomeMatrix } from './components/SmartHomeMatrix';
import { WorkspaceHub } from './components/WorkspaceHub';
import { SecurityVault } from './components/SecurityVault';
import { MediaLab } from './components/MediaLab';
import { AutomationRunnerModal } from './components/AutomationRunnerModal';
import {
  Terminal,
  Scan,
  Activity,
  FolderOpen,
  ShieldCheck,
  Sparkles,
  Cpu,
  Volume2,
  VolumeX,
  Play,
  Layers,
  CircleDot,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'reactor' | 'console' | 'edith' | 'smarthome' | 'workspace' | 'vault' | 'medialab'
  >('reactor');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [activePayload, setActivePayload] = useState<any>(null);
  const [showRunnerModal, setShowRunnerModal] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Clock tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => setCurrentUser(user),
      () => setCurrentUser(null)
    );
    return () => unsubscribe();
  }, []);

  // Toggle procedural audio
  const handleToggleMute = () => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);
    sound.setMuted(nextState);
    if (!nextState) sound.playChirp(1200);
  };

  // Trigger automation payload execution
  const handleExecuteAction = (payload: any) => {
    sound.playCommandAcknowledged();
    setActivePayload(payload);
    setShowRunnerModal(true);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#05080f] text-slate-100 font-sans overflow-hidden select-none">
      {/* TOP TACTICAL TELEMETRY HUD BAR */}
      <header className="h-14 px-5 bg-[#080d18] border-b border-cyan-500/25 flex items-center justify-between z-30 shrink-0">
        {/* Left: Identity & Status Indicator */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff]" />
            <div className="absolute w-5 h-5 rounded-full border border-cyan-400/50" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-300 tracking-widest uppercase">
                ICARUS D. NOBLE
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-cyan-950 text-cyan-400 rounded border border-cyan-500/30 font-semibold">
                MK VII // DESKTOP CORE
              </span>
            </div>
            <div className="text-[9px] font-mono text-cyan-200/60 tracking-wider">
              ARC REACTOR: 100% | CRYPTO ENCLAVE: ARMED | MESH: SECURE
            </div>
          </div>
        </div>

        {/* Center: System Clock & Environmental Metrics */}
        <div className="hidden md:flex items-center gap-6 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px]">LOCAL TIME:</span>
            <span className="text-cyan-300 font-bold tracking-wider">{currentTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px]">FREQ:</span>
            <span className="text-cyan-400 font-bold">4.82 THz</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px]">EDITH STATUS:</span>
            <span className="text-emerald-400 font-bold">STANDBY</span>
          </div>
        </div>

        {/* Right: Quick Action Controls & User */}
        <div className="flex items-center gap-3 font-mono">
          <button
            onClick={() => {
              sound.playChirp(1300);
              setShowRunnerModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 rounded text-xs hover:bg-cyan-500/30 transition-colors cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PYTHON RUNNER</span>
          </button>

          <button
            onClick={handleToggleMute}
            className="p-2 text-cyan-400 hover:text-cyan-200 bg-slate-900 border border-cyan-500/25 rounded cursor-pointer transition-colors"
            title={isAudioMuted ? 'Unmute Procedural Audio' : 'Mute Audio'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* NAVIGATION PILL BAR */}
      <nav className="h-11 px-5 bg-[#060b14] border-b border-cyan-500/20 flex items-center gap-1.5 overflow-x-auto shrink-0 z-20">
        {[
          { id: 'reactor', label: '3D ARC REACTOR', icon: CircleDot },
          { id: 'console', label: 'NOBLE COMMUNICATOR', icon: Terminal },
          { id: 'edith', label: 'EDITH VISION (SCREEN)', icon: Scan },
          { id: 'smarthome', label: 'SMART HOME & IOT', icon: Activity },
          { id: 'workspace', label: 'GOOGLE WORKSPACE', icon: FolderOpen },
          { id: 'vault', label: 'SECURITY VAULT (AES-256)', icon: ShieldCheck },
          { id: 'medialab', label: 'MEDIA & CREATIVE LAB', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                sound.playChirp(isActive ? 900 : 1300);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'bg-slate-900/90 text-cyan-300/80 border border-cyan-500/15 hover:bg-slate-800 hover:text-cyan-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* MAIN VIEWPORT DISPLAY */}
      <main className="flex-1 w-full relative overflow-hidden bg-[#05080f]">
        {activeTab === 'reactor' && <ArcReactorCanvas powerLevel={100} colorTheme="cyan" />}
        {activeTab === 'console' && (
          <div className="w-full h-full p-3 md:p-4">
            <ConsoleChat onTriggerExecution={handleExecuteAction} />
          </div>
        )}
        {activeTab === 'edith' && (
          <div className="w-full h-full p-3 md:p-4">
            <EdithScreenVision onExecuteAction={handleExecuteAction} />
          </div>
        )}
        {activeTab === 'smarthome' && (
          <div className="w-full h-full p-3 md:p-4">
            <SmartHomeMatrix />
          </div>
        )}
        {activeTab === 'workspace' && (
          <div className="w-full h-full p-3 md:p-4">
            <WorkspaceHub currentUser={currentUser} onUserChange={setCurrentUser} />
          </div>
        )}
        {activeTab === 'vault' && (
          <div className="w-full h-full p-3 md:p-4">
            <SecurityVault />
          </div>
        )}
        {activeTab === 'medialab' && (
          <div className="w-full h-full p-3 md:p-4">
            <MediaLab />
          </div>
        )}
      </main>

      {/* AUTOMATION RUNNER MODAL (FOR EXECUTING LOCAL PC AUTOMATIONS) */}
      {showRunnerModal && (
        <AutomationRunnerModal
          currentPayload={activePayload}
          onClose={() => setShowRunnerModal(false)}
        />
      )}
    </div>
  );
}
