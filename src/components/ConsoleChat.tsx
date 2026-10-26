import React, { useState, useRef, useEffect } from 'react';
import { sound } from '../services/audio';
import { CommandReferenceOverlay } from './CommandReferenceOverlay';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Play,
  Terminal,
  Cpu,
  Sparkles,
  Settings2,
  Radio,
  Square,
  FileText,
  Download,
  Trash2,
  Filter,
  Search,
  CheckCircle2,
  ListRestart,
  BookOpen,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  actionPayload?: any;
  timestamp: string;
  isVoiceInput?: boolean;
}

export interface VoiceTranscriptEntry {
  id: string;
  timestamp: string;
  userCommand: string;
  isVoiceInput: boolean;
  nobleResponse: string;
  actionType?: string;
  confidenceScore?: number;
}

interface ConsoleChatProps {
  onTriggerExecution?: (payload: any) => void;
  initialAction?: any;
}

export const ConsoleChat: React.FC<ConsoleChatProps> = ({ onTriggerExecution, initialAction }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Good day, Boss. I am Icarus D. Noble—"Noble" at your command.\n\nAll diagnostic matrices, Three.js Arc Reactor telemetry, and Google Workspace integration channels are operational. Web Speech voice recognition and synthesized voice access are online.\n\nYou may speak your instructions directly or type your commands. How may I assist you today?`,
      timestamp: '06:28',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);

  // Voice Access & Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [continuousVoiceAccess, setContinuousVoiceAccess] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastInputWasVoice, setLastInputWasVoice] = useState(false);

  // Speech Synthesis State
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [speechRate, setSpeechRate] = useState<number>(1.02);
  const [speechPitch, setSpeechPitch] = useState<number>(0.92);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showCommandReference, setShowCommandReference] = useState(false);

  // Visual Transcript Log State
  const [showTranscriptLog, setShowTranscriptLog] = useState(false);
  const [transcripts, setTranscripts] = useState<VoiceTranscriptEntry[]>([
    {
      id: 'init-1',
      timestamp: '06:28:10',
      userCommand: '[System Initialization Handshake]',
      isVoiceInput: false,
      nobleResponse: 'All diagnostic matrices, Three.js Arc Reactor telemetry, and Google Workspace integration channels are operational.',
      actionType: 'OVERLAY_HUD',
      confidenceScore: 1.0,
    },
  ]);
  const [filterVoiceOnly, setFilterVoiceOnly] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState('');

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const continuousRef = useRef<boolean>(false);

  // Sync ref
  useEffect(() => {
    continuousRef.current = continuousVoiceAccess;
  }, [continuousVoiceAccess]);

  // Load available speech synthesis voices
  useEffect(() => {
    const updateVoices = () => {
      const voices = sound.getVoices();
      setAvailableVoices(voices);
      if (voices.length > 0 && !selectedVoiceName) {
        const preferred =
          voices.find((v) => v.name.includes('Daniel') || v.name.includes('Oliver') || v.name.includes('Arthur')) ||
          voices.find((v) => v.name.includes('Google UK English Male')) ||
          voices.find((v) => v.lang === 'en-GB' || v.lang.startsWith('en-GB')) ||
          voices[0];
        if (preferred) setSelectedVoiceName(preferred.name);
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Auto-scroll chat thread to bottom
  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isLoading, interimTranscript]);

  // Handle external actions from other tabs
  useEffect(() => {
    if (initialAction) {
      handleSend(`Execute system action: ${initialAction.action_type} for ${initialAction.target_application}`, false);
    }
  }, [initialAction]);

  // Stop recognition helper
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  // Start Web Speech Recognition
  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use text input.');
      return;
    }

    // Stop speaking if Noble was talking
    sound.stopSpeaking();
    setIsSpeaking(false);

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = continuousRef.current;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        sound.playChirp(1400);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (finalTranscript.trim()) {
          setInterimTranscript('');
          sound.playChirp(1600);
          setLastInputWasVoice(true);
          handleSend(finalTranscript.trim(), true);
          if (!continuousRef.current) {
            stopListening();
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setIsListening(false);
          setContinuousVoiceAccess(false);
        }
      };

      recognition.onend = () => {
        if (continuousRef.current && !isSpeaking) {
          setTimeout(() => {
            if (continuousRef.current && !isSpeaking) {
              try {
                recognition.start();
              } catch {}
            }
          }, 300);
        } else {
          setIsListening(false);
          setInterimTranscript('');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // Toggle Voice Recognition
  const toggleListening = () => {
    if (isListening) {
      sound.playChirp(800);
      stopListening();
    } else {
      startListening();
    }
  };

  // Toggle Continuous Hands-Free Voice Access Mode
  const toggleContinuousVoice = () => {
    const nextState = !continuousVoiceAccess;
    setContinuousVoiceAccess(nextState);
    continuousRef.current = nextState;
    sound.playChirp(nextState ? 1700 : 900);

    if (nextState) {
      startListening();
    } else {
      stopListening();
    }
  };

  // Speak Noble response using Web Speech Synthesis API
  const speakWithNobleVoice = (text: string) => {
    if (!autoSpeak) return;

    sound.speakWithWebSpeech(text, {
      voiceName: selectedVoiceName,
      pitch: speechPitch,
      rate: speechRate,
      onStart: () => {
        setIsSpeaking(true);
        if (isListening && !continuousRef.current) {
          stopListening();
        }
      },
      onEnd: () => {
        setIsSpeaking(false);
        if (continuousRef.current) {
          setTimeout(() => {
            if (continuousRef.current) startListening();
          }, 400);
        }
      },
    });
  };

  // Stop currently speaking voice
  const handleInterruptSpeech = () => {
    sound.playChirp(800);
    sound.stopSpeaking();
    setIsSpeaking(false);
    if (continuousRef.current) {
      startListening();
    }
  };

  // Export Transcript Log as JSON
  const handleExportTranscripts = () => {
    sound.playChirp(1200);
    const jsonStr = JSON.stringify(transcripts, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noble_voice_transcripts_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Dispatch message to Gemini Server-side
  const handleSend = async (customInput?: string, fromVoice = false) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isLoading) return;

    sound.playChirp(1400);
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoiceInput: fromVoice,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          thinking: isThinkingMode,
          model: isThinkingMode ? 'gemini-4-argon' : 'gemini-3.8-flash',
        }),
      });

      if (!res.ok) throw new Error('Noble Core encountered an error');
      const data = await res.json();
      const rawText = data.text || 'I have executed your directive, Boss.';

      // Extract JSON action payload if present
      let actionPayload = null;
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          actionPayload = JSON.parse(jsonMatch[1]);
        } catch {}
      }

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: rawText,
        actionPayload,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMsg]);
      sound.playCommandAcknowledged();

      // Record in Visual Transcript Log
      const newTranscriptEntry: VoiceTranscriptEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        userCommand: textToSend.trim(),
        isVoiceInput: fromVoice,
        nobleResponse: rawText.replace(/```json[\s\S]*?```/g, '').trim(),
        actionType: actionPayload?.action_type,
        confidenceScore: fromVoice ? 0.98 : 1.0,
      };
      setTranscripts((prev) => [newTranscriptEntry, ...prev]);

      if (actionPayload && onTriggerExecution) {
        onTriggerExecution(actionPayload);
      }

      // Proactively speak response using Web Speech Synthesis API
      speakWithNobleVoice(rawText);
    } catch (err: any) {
      console.error(err);
      sound.playAlert();
      const errorReply = `My apologies, Boss. An anomaly interrupted the transmission: ${err.message}. Awaiting further commands.`;
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: errorReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      speakWithNobleVoice(errorReply);
    } finally {
      setIsLoading(false);
      setLastInputWasVoice(false);
    }
  };

  // Filtered transcript entries
  const filteredTranscripts = transcripts.filter((t) => {
    if (filterVoiceOnly && !t.isVoiceInput) return false;
    if (transcriptSearch.trim()) {
      const q = transcriptSearch.toLowerCase();
      return (
        t.userCommand.toLowerCase().includes(q) ||
        t.nobleResponse.toLowerCase().includes(q) ||
        (t.actionType && t.actionType.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="w-full h-full flex flex-col bg-[#070c16] border border-cyan-500/25 rounded-lg overflow-hidden font-sans relative">
      {/* Console Top Header */}
      <div className="px-5 py-3 bg-[#0a1120] border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold tracking-widest text-cyan-300 uppercase">
            NOBLE CENTRAL COMMUNICATOR
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 font-semibold">
            VOICE ACCESS: {continuousVoiceAccess ? 'HANDS-FREE ON' : 'STANDBY'}
          </span>
        </div>

        {/* Console Controls */}
        <div className="flex items-center gap-2.5">
          {/* Command Reference Matrix Overlay Toggle */}
          <button
            onClick={() => {
              setShowCommandReference(true);
              sound.playChirp(1300);
            }}
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono rounded border border-cyan-500/40 bg-cyan-950/60 text-cyan-200 hover:bg-cyan-900/80 transition-all cursor-pointer shadow-[0_0_8px_rgba(0,240,255,0.2)]"
            title="Open Voice Command Reference Matrix"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>COMMAND MATRIX</span>
          </button>

          {/* Visual Transcript Log Toggle */}
          <button
            onClick={() => {
              setShowTranscriptLog(!showTranscriptLog);
              sound.playChirp(1300);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono rounded border transition-all cursor-pointer ${
              showTranscriptLog
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                : 'bg-slate-900 text-cyan-300 border-cyan-500/30 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>TRANSCRIPT LOG ({transcripts.length})</span>
          </button>

          {/* Continuous Hands-Free Voice Access Toggle */}
          <button
            onClick={toggleContinuousVoice}
            className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono rounded border transition-all cursor-pointer ${
              continuousVoiceAccess
                ? 'bg-rose-600/30 text-rose-300 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                : 'bg-slate-900 text-slate-300 border-cyan-500/30 hover:border-cyan-400'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${continuousVoiceAccess ? 'animate-pulse text-rose-400' : ''}`} />
            <span>{continuousVoiceAccess ? 'HANDS-FREE LISTENING' : 'ENABLE VOICE ACCESS'}</span>
          </button>

          {/* High Thinking Level Toggle (gemini-4-argon) */}
          <button
            onClick={() => {
              setIsThinkingMode(!isThinkingMode);
              sound.playChirp(isThinkingMode ? 900 : 1600);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
              isThinkingMode
                ? 'bg-purple-600/30 text-purple-300 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-cyan-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isThinkingMode ? 'ARGON HIGH: ON' : 'THINKING: NORMAL'}</span>
          </button>

          {/* Voice Settings Popover Toggle */}
          <button
            onClick={() => {
              setShowVoiceSettings(!showVoiceSettings);
              sound.playChirp(1200);
            }}
            className={`p-1.5 rounded border transition-colors cursor-pointer ${
              showVoiceSettings
                ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400'
                : 'bg-slate-900 text-slate-400 border-cyan-500/20 hover:text-cyan-200'
            }`}
            title="Configure Synthesized Voice"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {/* Mute / Unmute Auto-Speak */}
          <button
            onClick={() => {
              setAutoSpeak(!autoSpeak);
              if (autoSpeak) sound.stopSpeaking();
              sound.playChirp(autoSpeak ? 800 : 1300);
            }}
            className="p-1.5 text-cyan-400 hover:text-cyan-200 bg-slate-900 border border-cyan-500/20 rounded cursor-pointer transition-colors"
            title={autoSpeak ? 'Mute Noble Speech' : 'Enable Noble Speech'}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Voice Settings Drawer */}
      {showVoiceSettings && (
        <div className="p-4 bg-[#090f1d] border-b border-cyan-500/30 font-mono text-xs space-y-3 z-10 shadow-lg">
          <div className="flex items-center justify-between text-cyan-300 font-bold uppercase text-[11px]">
            <span>WEB SPEECH SYNTHESIS ENGINE CONFIGURATION</span>
            <button
              onClick={() => setShowVoiceSettings(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">
                SYNTHESIZED BUTLER VOICE ({availableVoices.length})
              </label>
              <select
                value={selectedVoiceName}
                onChange={(e) => {
                  setSelectedVoiceName(e.target.value);
                  sound.speakWithWebSpeech('Voice parameters synchronized, Boss.', {
                    voiceName: e.target.value,
                    pitch: speechPitch,
                    rate: speechRate,
                  });
                }}
                className="w-full bg-slate-950 border border-cyan-500/30 rounded px-2.5 py-1.5 text-cyan-200 focus:outline-none focus:border-cyan-400"
              >
                {availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-400 uppercase mb-1">
                <span>CADENCE RATE: {speechRate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-400 uppercase mb-1">
                <span>TONAL PITCH: {speechPitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.25"
                step="0.05"
                value={speechPitch}
                onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Real-time Voice Speaking Waveform HUD Banner */}
      {isSpeaking && (
        <div className="px-5 py-2.5 bg-cyan-950/80 border-b border-cyan-500/40 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 h-4">
              <span className="w-1 h-3 bg-cyan-400 animate-pulse rounded" />
              <span className="w-1 h-4 bg-cyan-300 animate-pulse delay-75 rounded" />
              <span className="w-1 h-2.5 bg-cyan-400 animate-pulse delay-150 rounded" />
              <span className="w-1 h-4 bg-cyan-200 animate-pulse delay-100 rounded" />
              <span className="w-1 h-3 bg-cyan-400 animate-pulse rounded" />
            </div>
            <span className="font-mono text-xs font-bold text-cyan-300 tracking-wider">
              NOBLE IS SPEAKING (WEB SPEECH SYNTHESIS)...
            </span>
          </div>

          <button
            onClick={handleInterruptSpeech}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-rose-300 border border-rose-500/40 rounded text-xs font-mono font-bold hover:bg-rose-950 cursor-pointer"
          >
            <Square className="w-3 h-3 fill-current" />
            INTERRUPT SPEECH
          </button>
        </div>
      )}

      {/* Real-time Voice Input Transcript Banner (When user is talking) */}
      {isListening && (
        <div className="px-5 py-2.5 bg-rose-950/70 border-b border-rose-500/40 flex items-center justify-between z-10 font-mono text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="font-bold text-rose-300 uppercase tracking-wider">
              VOICE RECOGNITION ACTIVE:
            </span>
            <span className="text-white italic">
              {interimTranscript ? `"${interimTranscript}"` : 'Listening for your command, Boss...'}
            </span>
          </div>

          <button
            onClick={stopListening}
            className="text-[10px] text-rose-300 underline cursor-pointer"
          >
            CANCEL MIC
          </button>
        </div>
      )}

      {/* MAIN BODY: Split between Chat Thread & Visual Transcript Log if toggled */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Chat Message Thread */}
        <div
          ref={chatScrollRef}
          className={`flex-1 p-5 overflow-y-auto space-y-4 ${
            showTranscriptLog ? 'hidden lg:block lg:w-1/2 lg:border-r lg:border-cyan-500/20' : 'w-full'
          }`}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-cyan-400/60 font-semibold uppercase flex items-center gap-1">
                  {msg.role === 'user' ? (
                    <>
                      {msg.isVoiceInput && <Mic className="w-3 h-3 text-rose-400" />}
                      COMMANDER (YOU) {msg.isVoiceInput ? '[VOICE]' : '[TEXT]'}
                    </>
                  ) : (
                    'ICARUS D. NOBLE'
                  )}
                </span>
                <span className="text-[9px] font-mono text-slate-500">{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[85%] rounded-lg p-4 font-mono text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan-950/40 text-cyan-100 border border-cyan-500/30 rounded-tr-none'
                    : 'bg-[#0d1627] text-slate-200 border border-cyan-500/20 rounded-tl-none shadow-[0_0_15px_rgba(0,0,0,0.4)]'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.content.replace(/```json[\s\S]*?```/g, '').trim()}
                </div>

                {/* Action Intent Card */}
                {msg.actionPayload && (
                  <div className="mt-3.5 pt-3 border-t border-cyan-500/30 bg-[#070d18] p-3 rounded border border-cyan-400/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-bold tracking-wider uppercase">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        SYSTEM ACTION PAYLOAD [{msg.actionPayload.action_type || 'SYSTEM_CALL'}]
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40">
                        {msg.actionPayload.agent_status || 'EXECUTING'}
                      </span>
                    </div>

                    <div className="text-[11px] text-cyan-200 font-mono mb-2">
                      Target: <strong className="text-white">{msg.actionPayload.target_application || 'Desktop'}</strong>
                    </div>

                    <pre className="p-2 bg-black/60 rounded text-[10px] text-emerald-400 font-mono overflow-x-auto border border-emerald-500/20 mb-2">
                      {JSON.stringify(msg.actionPayload, null, 2)}
                    </pre>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 italic">
                        "{msg.actionPayload.feedback_message}"
                      </span>
                      <button
                        onClick={() => {
                          sound.playCommandAcknowledged();
                          if (onTriggerExecution) {
                            onTriggerExecution(msg.actionPayload);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 text-slate-950 text-[10px] font-mono font-bold rounded hover:bg-cyan-400 transition-colors cursor-pointer shadow-[0_0_8px_rgba(0,240,255,0.4)]"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        DISPATCH AUTOMATION
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs p-3 bg-[#0d1627]/60 border border-cyan-500/20 rounded max-w-[320px]">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span>NOBLE NEURAL CORE PROCESSING...</span>
            </div>
          )}
        </div>

        {/* VISUAL TRANSCRIPT LOG PANEL (Side-by-side or focused view) */}
        {showTranscriptLog && (
          <div className="flex-1 lg:w-1/2 p-5 bg-[#050912] flex flex-col overflow-hidden font-mono text-xs">
            {/* Transcript Log Header */}
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-cyan-500/20 gap-2 mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-300 font-bold uppercase tracking-wider">
                  VISUAL VOICE TRANSCRIPT & INTERACTION AUDIT
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportTranscripts}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-cyan-300 border border-cyan-500/30 rounded text-[10px] hover:bg-slate-800 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  EXPORT JSON
                </button>
                <button
                  onClick={() => {
                    sound.playChirp(800);
                    setTranscripts([]);
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-slate-900 text-slate-400 border border-slate-700 rounded text-[10px] hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  CLEAR
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  placeholder="Filter transcript search query..."
                  className="w-full bg-slate-950 border border-cyan-500/25 rounded pl-8 pr-3 py-1.5 text-[11px] text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                onClick={() => setFilterVoiceOnly(!filterVoiceOnly)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded border text-[10px] transition-colors cursor-pointer ${
                  filterVoiceOnly
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-cyan-200'
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>VOICE ONLY</span>
              </button>
            </div>

            {/* Chronological Transcript Timeline */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredTranscripts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-black/30 border border-slate-800 rounded">
                  No transcripts match current filter criteria.
                </div>
              ) : (
                filteredTranscripts.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 bg-[#090f1d] border border-cyan-500/20 rounded space-y-2 hover:border-cyan-500/40 transition-colors"
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold uppercase flex items-center gap-1 ${
                            entry.isVoiceInput
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                              : 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                          }`}
                        >
                          {entry.isVoiceInput ? <Mic className="w-2.5 h-2.5" /> : null}
                          {entry.isVoiceInput ? 'VOICE RECOGNITION' : 'KEYBOARD INPUT'}
                        </span>
                        {entry.actionType && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                            {entry.actionType}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500">{entry.timestamp}</span>
                    </div>

                    {/* User Command */}
                    <div className="p-2 bg-black/40 rounded border border-slate-800 text-[11px] text-cyan-200">
                      <span className="text-slate-500 text-[9px] uppercase block mb-0.5">RECOGNIZED UTTERANCE:</span>
                      "{entry.userCommand}"
                    </div>

                    {/* Noble Synthesized Voice Response */}
                    <div className="p-2 bg-cyan-950/20 rounded border border-cyan-500/20 text-[11px] text-slate-300">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-cyan-400/80 text-[9px] uppercase font-bold">
                          NOBLE SYNTHESIZED RESPONSE:
                        </span>
                        <button
                          onClick={() => {
                            sound.playChirp(1200);
                            sound.speakWithWebSpeech(entry.nobleResponse, {
                              voiceName: selectedVoiceName,
                              pitch: speechPitch,
                              rate: speechRate,
                            });
                          }}
                          className="flex items-center gap-1 text-[9px] text-cyan-400 hover:text-cyan-200 cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>REPLAY AUDIO</span>
                        </button>
                      </div>
                      <p className="line-clamp-3 text-slate-200">{entry.nobleResponse}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preset Command Chips for Quick Testing */}
      <div className="px-5 py-2 bg-[#090f1d] border-t border-cyan-500/20 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-mono text-cyan-400/60 uppercase whitespace-nowrap">QUICK DISPATCH:</span>
        {[
          'Type an email to Pepper Potts about Arc Reactor telemetry',
          'Open Google Picker and browse cloud blueprints',
          'Launch Google Drive and verify Nanotech armor blueprints',
          'Schedule an orbital recon briefing on Google Calendar for 3 PM',
          'Analyze compound thermal IoT telemetry and balance cooling',
        ].map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt, false)}
            className="px-2.5 py-1 text-[10px] font-mono rounded bg-slate-900 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-950 hover:border-cyan-400/40 whitespace-nowrap transition-colors cursor-pointer"
          >
            {prompt.slice(0, 38)}...
          </button>
        ))}
      </div>

      {/* Input Area with Push-to-Talk and Text Submission */}
      <div className="p-4 bg-[#0a1220] border-t border-cyan-500/20 flex items-center gap-3">
        {/* Push-to-Talk / One-shot Mic Button */}
        <button
          onClick={toggleListening}
          className={`p-2.5 rounded-full border transition-all cursor-pointer ${
            isListening
              ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-[0_0_15px_#f43f5e]'
              : 'bg-slate-900 text-cyan-400 border-cyan-500/30 hover:bg-cyan-950'
          }`}
          title={isListening ? 'Stop Listening' : 'Push-to-Talk Voice Input (Web Speech API)'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(undefined, false)}
          placeholder={
            isListening
              ? 'Speak your command now...'
              : 'Issue command or speak to Icarus D. Noble (e.g. "Draft an email", "Pick Drive files", "Check power grid")...'
          }
          className="flex-1 bg-slate-950/80 border border-cyan-500/30 rounded px-4 py-2.5 text-xs font-mono text-cyan-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
        />

        <button
          onClick={() => handleSend(undefined, false)}
          disabled={!input.trim() || isLoading}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-cyan-500 text-slate-950 font-mono font-bold text-xs rounded hover:bg-cyan-400 transition-colors shadow-[0_0_10px_rgba(0,240,255,0.4)] disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          DISPATCH
        </button>
      </div>

      {/* Voice-Triggerable Command Reference Matrix Overlay */}
      <CommandReferenceOverlay
        isOpen={showCommandReference}
        onClose={() => setShowCommandReference(false)}
        onExecuteCommand={(commandText, isVoice) => handleSend(commandText, isVoice)}
        onInsertCommand={(commandText) => setInput(commandText)}
      />
    </div>
  );
};
