import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Mic,
  ArrowRight,
  Terminal,
  CircleDot,
  FolderOpen,
  Scan,
  ShieldCheck,
  Activity,
  Sparkles,
  Cpu,
  X,
  Volume2,
  Check,
  Copy,
} from 'lucide-react';
import { sound } from '../services/audio';

export interface CommandItem {
  id: string;
  category: 'core' | 'workspace' | 'edith' | 'vault' | 'iot' | 'media' | 'automation';
  phrase: string;
  description: string;
  targetSubsystem: string;
  actionPayloadType?: string;
  exampleParam?: string;
}

const COMMAND_CATALOG: CommandItem[] = [
  // Arc Reactor & System Core
  {
    id: 'core-1',
    category: 'core',
    phrase: 'Noble, set reactor power to 300% overdrive',
    description: 'Ramps Arc Reactor power output to maximum 300% overload with enhanced plasma flux.',
    targetSubsystem: '3D Arc Reactor',
    actionPayloadType: 'SYSTEM_CALL',
  },
  {
    id: 'core-2',
    category: 'core',
    phrase: 'Toggle exploded view schematic',
    description: 'Animates the 12-component Mark VII physical assembly into exploded holographic inspection mode.',
    targetSubsystem: '3D Arc Reactor',
    actionPayloadType: 'SYSTEM_CALL',
  },
  {
    id: 'core-3',
    category: 'core',
    phrase: 'Switch frequency matrix to stealth theme',
    description: 'Re-tunes the Three.js plasma ring and UI accents to crimson stealth frequency.',
    targetSubsystem: '3D Arc Reactor',
    actionPayloadType: 'SYSTEM_CALL',
  },
  {
    id: 'core-4',
    category: 'core',
    phrase: 'Run system diagnostics hardware audit',
    description: 'Polls real-time CPU core metrics, RAM distribution, and network bandwidth sparklines.',
    targetSubsystem: 'System Diagnostics',
    actionPayloadType: 'OVERLAY_HUD',
  },

  // Google Workspace & Comms
  {
    id: 'ws-1',
    category: 'workspace',
    phrase: 'Check my unread emails from Gmail',
    description: 'Queries the Gmail API for high-priority unread executive messages and summaries.',
    targetSubsystem: 'Google Workspace',
    actionPayloadType: 'SYSTEM_CALL',
  },
  {
    id: 'ws-2',
    category: 'workspace',
    phrase: 'Launch Google Picker to inspect cloud assets',
    description: 'Triggers the secure Google Picker modal to browse Google Drive and Sheets.',
    targetSubsystem: 'Google Workspace',
    actionPayloadType: 'APP_LAUNCH',
  },
  {
    id: 'ws-3',
    category: 'workspace',
    phrase: 'Schedule strategic briefing in Google Calendar for tomorrow at 10 AM',
    description: 'Creates a calendar event payload with automated notification reminders.',
    targetSubsystem: 'Google Workspace',
    actionPayloadType: 'SYSTEM_CALL',
  },
  {
    id: 'ws-4',
    category: 'workspace',
    phrase: 'Create a new Google Docs strategic brief for project Mark VII',
    description: 'Initializes a structured engineering brief in Google Docs.',
    targetSubsystem: 'Google Workspace',
    actionPayloadType: 'SYSTEM_CALL',
  },
  {
    id: 'ws-5',
    category: 'workspace',
    phrase: 'List my pending tasks from Google Tasks',
    description: 'Retrieves current task items and action checklists.',
    targetSubsystem: 'Google Workspace',
    actionPayloadType: 'SYSTEM_CALL',
  },

  // EDITH Screen Vision
  {
    id: 'edith-1',
    category: 'edith',
    phrase: 'Noble, analyze current screen context',
    description: 'Executes multimodal visual analysis on active desktop applications and windows.',
    targetSubsystem: 'EDITH Screen Vision',
    actionPayloadType: 'OVERLAY_HUD',
  },
  {
    id: 'edith-2',
    category: 'edith',
    phrase: 'Detect interactive UI elements and clickable buttons on screen',
    description: 'Maps interactive buttons, text fields, and tabs with tactical coordinate reticles.',
    targetSubsystem: 'EDITH Screen Vision',
    actionPayloadType: 'OVERLAY_HUD',
  },
  {
    id: 'edith-3',
    category: 'edith',
    phrase: 'Recommend proactive desktop automation action',
    description: 'Synthesizes screen state and formulates one-click desktop automation recommendations.',
    targetSubsystem: 'EDITH Screen Vision',
    actionPayloadType: 'SYSTEM_CALL',
  },

  // Security Vault & Biometrics
  {
    id: 'vault-1',
    category: 'vault',
    phrase: 'I am Iron Man',
    description: 'Primary voice biometric passphrase to unlock the AES-256 cryptographic vault.',
    targetSubsystem: 'Security Vault',
    actionPayloadType: 'SYSTEM_CALL',
  },
  {
    id: 'vault-2',
    category: 'vault',
    phrase: 'Noble authorization code alpha nine five',
    description: 'Secondary high-security vocal passkey for confidential record decryption.',
    targetSubsystem: 'Security Vault',
    actionPayloadType: 'SYSTEM_CALL',
  },
  {
    id: 'vault-3',
    category: 'vault',
    phrase: 'Initialize emergency memory purge protocol',
    description: 'Sanitizes in-memory AES encryption keys, decrypted credentials, and RAM caches.',
    targetSubsystem: 'Security Vault',
    actionPayloadType: 'SYSTEM_CALL',
  },

  // Smart Home & IoT Mesh
  {
    id: 'iot-1',
    category: 'iot',
    phrase: 'Activate workshop cooling system',
    description: 'Dispatches HVAC cooling command to lab temperature regulation sensors.',
    targetSubsystem: 'Smart Home & IoT',
    actionPayloadType: 'SYSTEM_CALL',
  },
  {
    id: 'iot-2',
    category: 'iot',
    phrase: 'Dim lab ambient lighting to 30%',
    description: 'Modulates smart lighting mesh to focused low-reflection engineering mode.',
    targetSubsystem: 'Smart Home & IoT',
    actionPayloadType: 'SYSTEM_CALL',
  },
  {
    id: 'iot-3',
    category: 'iot',
    phrase: 'Run machine learning predictive automation on sensor telemetry',
    description: 'Executes Gemini predictive telemetry model on environmental IoT sensor streams.',
    targetSubsystem: 'Smart Home & IoT',
    actionPayloadType: 'SYSTEM_CALL',
  },

  // Media & Generative Lab
  {
    id: 'media-1',
    category: 'media',
    phrase: 'Compose an orchestral cinematic theme using Lyria',
    description: 'Generates procedural symphonic score via Gemini Lyria music synthesis.',
    targetSubsystem: 'Media & Creative Lab',
    actionPayloadType: 'SYSTEM_CALL',
  },
  {
    id: 'media-2',
    category: 'media',
    phrase: 'Generate Iron Man Mark VII flight test video using Omni Flash',
    description: 'Dispatches video generation prompt to Gemini Omni Flash for spatial simulation.',
    targetSubsystem: 'Media & Creative Lab',
    actionPayloadType: 'SYSTEM_CALL',
  },
  {
    id: 'media-3',
    category: 'media',
    phrase: 'Generate high-resolution nano-tech armor blueprint',
    description: 'Synthesizes high-fidelity visual schematic using Imagen / Nano Banana generation.',
    targetSubsystem: 'Media & Creative Lab',
    actionPayloadType: 'SYSTEM_CALL',
  },

  // Automation & Python PyAutoGUI
  {
    id: 'auto-1',
    category: 'automation',
    phrase: 'Launch Python automation runner for local tasks',
    description: 'Generates executable noble_automation_runner.py script with PyAutoGUI routines.',
    targetSubsystem: 'Python Runner',
    actionPayloadType: 'APP_LAUNCH',
  },
  {
    id: 'auto-2',
    category: 'automation',
    phrase: 'Search web for latest quantum computing breakthroughs',
    description: 'Formulates web search query payload with automated browser dispatch.',
    targetSubsystem: 'Desktop OS',
    actionPayloadType: 'WEB_SEARCH',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'ALL PROTOCOLS', icon: BookOpen },
  { id: 'core', label: 'ARC REACTOR & CORE', icon: CircleDot },
  { id: 'workspace', label: 'WORKSPACE & COMMS', icon: FolderOpen },
  { id: 'edith', label: 'EDITH VISION', icon: Scan },
  { id: 'vault', label: 'SECURITY & BIOMETRICS', icon: ShieldCheck },
  { id: 'iot', label: 'SMART HOME & IOT', icon: Activity },
  { id: 'media', label: 'MEDIA LAB', icon: Sparkles },
  { id: 'automation', label: 'DESKTOP AUTOMATION', icon: Cpu },
];

interface CommandReferenceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (commandText: string, isVoiceSimulation?: boolean) => void;
  onInsertCommand: (commandText: string) => void;
}

export const CommandReferenceOverlay: React.FC<CommandReferenceOverlayProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
  onInsertCommand,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter commands
  const filteredCommands = useMemo(() => {
    return COMMAND_CATALOG.filter((cmd) => {
      const matchesCategory =
        selectedCategory === 'all' || cmd.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        cmd.phrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.targetSubsystem.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Handle one-click voice simulation
  const handleSimulateVoice = (cmd: CommandItem) => {
    sound.playArcCharge();
    // Simulate vocal prompt
    sound.speakWithWebSpeech(`Executing command: ${cmd.phrase}`, {
      rate: 1.05,
      pitch: 0.95,
    });
    onExecuteCommand(cmd.phrase, true);
    onClose();
  };

  // Handle insert into prompt
  const handleInsert = (cmd: CommandItem) => {
    sound.playChirp(1300);
    onInsertCommand(cmd.phrase);
    onClose();
  };

  // Copy phrase to clipboard
  const handleCopy = (cmd: CommandItem) => {
    navigator.clipboard.writeText(cmd.phrase);
    setCopiedId(cmd.id);
    sound.playChirp(1400);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md font-mono select-none">
      <div className="w-full max-w-4xl max-h-[88vh] bg-[#080d18] border-2 border-cyan-500/50 rounded-xl shadow-[0_0_35px_rgba(0,240,255,0.25)] flex flex-col overflow-hidden relative">
        {/* Top Scanning Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

        {/* HEADER */}
        <div className="px-5 py-3.5 bg-[#0a1120] border-b border-cyan-500/25 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-xs font-bold text-cyan-200 tracking-widest uppercase">
                NOBLE TACTICAL COMMAND REFERENCE MATRIX
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                VOICE-TRIGGERABLE PROTOCOLS & ACTION HOOKS ({COMMAND_CATALOG.length} REGISTERED)
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playChirp(1000);
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SEARCH & CATEGORY SELECTOR */}
        <div className="p-4 bg-[#060b14] border-b border-cyan-500/15 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voice commands by keyword, subsystem, or description..."
              className="w-full bg-black/70 border border-cyan-500/30 rounded pl-9 pr-4 py-2 text-xs text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              const count =
                cat.id === 'all'
                  ? COMMAND_CATALOG.length
                  : COMMAND_CATALOG.filter((c) => c.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    sound.playChirp(1200);
                    setSelectedCategory(cat.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-[11px] whitespace-nowrap transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : 'bg-slate-900/80 text-cyan-300/80 border-cyan-500/20 hover:bg-slate-800 hover:text-cyan-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[9px] px-1 rounded ${
                      isActive ? 'bg-slate-950/20 text-slate-900 font-bold' : 'bg-slate-800 text-cyan-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* COMMAND LIST (MATRIX GRID) */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-black/40 border border-slate-800 rounded">
              No matching commands located in telemetry directory. Try adjusting your search query.
            </div>
          ) : (
            filteredCommands.map((cmd) => (
              <div
                key={cmd.id}
                className="p-3 bg-[#0a1120] border border-cyan-500/20 hover:border-cyan-500/45 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors group"
              >
                {/* Command Details */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-cyan-300 font-bold text-xs group-hover:text-cyan-200 transition-colors">
                      "{cmd.phrase}"
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                      {cmd.targetSubsystem}
                    </span>
                    {cmd.actionPayloadType && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {cmd.actionPayloadType}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {cmd.description}
                  </p>
                </div>

                {/* Tactical Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  {/* Copy Phrase */}
                  <button
                    onClick={() => handleCopy(cmd)}
                    className="p-1.5 text-slate-400 hover:text-cyan-300 bg-slate-900 border border-cyan-500/20 rounded cursor-pointer transition-colors"
                    title="Copy command syntax"
                  >
                    {copiedId === cmd.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Insert Into Prompt */}
                  <button
                    onClick={() => handleInsert(cmd)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Insert command into message prompt"
                  >
                    <Terminal className="w-3 h-3 text-cyan-400" />
                    <span>INSERT</span>
                  </button>

                  {/* 1-Click Voice Execution */}
                  <button
                    onClick={() => handleSimulateVoice(cmd)}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.4)] cursor-pointer transition-colors"
                    title="Simulate speaking this command directly to Noble"
                  >
                    <Mic className="w-3 h-3 text-slate-950" />
                    <span>SPEAK COMMAND</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER HELPER */}
        <div className="px-5 py-2.5 bg-[#060b14] border-t border-cyan-500/20 flex flex-wrap items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Click "Speak Command" to synthesize vocal dispatch and observe automated task execution.</span>
          </div>
          <span className="text-cyan-400/80 font-bold">STARK INTERFACES MK VII</span>
        </div>
      </div>
    </div>
  );
};
