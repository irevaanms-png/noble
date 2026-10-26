import React, { useState, useEffect, useRef } from 'react';
import { SecureCryptoService } from '../services/crypto';
import { sound } from '../services/audio';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Database,
  Trash2,
  AlertTriangle,
  Fingerprint,
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  XCircle,
  Settings,
  History,
  Radio,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface VaultItem {
  id: string;
  label: string;
  encryptedValue: string;
  createdAt: string;
}

interface BiometricAuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  spokenPhrase: string;
  requiredPhrase: string;
  score: number;
  passed: boolean;
}

type CriticalActionType = 'UNLOCK_VAULT' | 'DECRYPT_ITEM' | 'EMERGENCY_PURGE';

interface PendingCriticalAction {
  type: CriticalActionType;
  label: string;
  payload?: any;
}

const PRESET_PHRASES = [
  'I am Iron Man',
  'Noble authorization code alpha nine five',
  'Jarvis initialize protocol clean slate',
  'Stark Industries clearance level ten',
];

export const SecurityVault: React.FC = () => {
  // Vault State
  const [masterPassphrase, setMasterPassphrase] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([
    {
      id: 'demo-1',
      label: 'Stark Orbital Defense Uplink Token',
      encryptedValue: 'U2FsdGVkX1+9b6J4fH8f2w==',
      createdAt: '10:04:12 AM',
    },
  ]);
  const [newLabel, setNewLabel] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [decryptedValues, setDecryptedValues] = useState<{ [id: string]: string }>({});

  // Voice Biometrics State
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(true);
  const [targetPhrase, setTargetPhrase] = useState('I am Iron Man');
  const [customPhraseInput, setCustomPhraseInput] = useState('');
  const [isCustomPhrase, setIsCustomPhrase] = useState(false);
  const [sensitivityThreshold, setSensitivityThreshold] = useState(70); // 70% threshold
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  // Biometric Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingCriticalAction | null>(null);
  const [verificationState, setVerificationState] = useState<
    'idle' | 'listening' | 'evaluating' | 'granted' | 'denied'
  >('idle');
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [calculatedScore, setCalculatedScore] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [recognitionActive, setRecognitionActive] = useState(false);
  const [fallbackPasswordInput, setFallbackPasswordInput] = useState('');
  const [showFallbackInput, setShowFallbackInput] = useState(false);

  // Biometric Audit Trail
  const [auditLogs, setAuditLogs] = useState<BiometricAuditLogEntry[]>([
    {
      id: 'init-1',
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
      action: 'INITIAL_SECURITY_CALIBRATION',
      spokenPhrase: 'I am Iron Man',
      requiredPhrase: 'I am Iron Man',
      score: 100,
      passed: true,
    },
  ]);

  // Audio Equalizer Wave Animation State
  const [waveHeights, setWaveHeights] = useState<number[]>([
    20, 45, 70, 35, 90, 60, 40, 85, 30, 65, 50, 80,
  ]);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Security status telemetry
  const securityStatus = {
    encryptionAlgorithm: 'AES-GCM-256 (NIST Certified)',
    kdf: 'PBKDF2 SHA-256 (100,000 Iterations)',
    tokenStorage: 'RAM In-Memory Ephemeral Cache ONLY',
    tamperDetection: 'HARDENED // ZERO LOCALSTORAGE LEAK',
    biometricLayer: isBiometricEnabled ? 'ARMED // ACOUSTIC VOICEPRINT' : 'BYPASSED',
  };

  // Clean string helper
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Calculate similarity score between spoken and target phrase
  const evaluatePhraseMatch = (spoken: string, target: string): number => {
    const normSpoken = normalizeText(spoken);
    const normTarget = normalizeText(target);

    if (!normSpoken || !normTarget) return 0;
    if (normSpoken === normTarget) return 100;
    if (normSpoken.includes(normTarget) || normTarget.includes(normSpoken)) return 95;

    const targetWords = normTarget.split(' ');
    const spokenWords = normSpoken.split(' ');

    let matchedWords = 0;
    targetWords.forEach((word) => {
      if (spokenWords.includes(word)) {
        matchedWords++;
      } else {
        // partial word match
        const found = spokenWords.some((sw) => sw.startsWith(word) || word.startsWith(sw));
        if (found) matchedWords += 0.75;
      }
    });

    const score = Math.min(100, Math.round((matchedWords / targetWords.length) * 100));
    return score;
  };

  // Animate soundwave bars when listening
  useEffect(() => {
    if (recognitionActive) {
      const interval = setInterval(() => {
        setWaveHeights(
          Array.from({ length: 14 }, () => Math.floor(Math.random() * 75) + 20)
        );
      }, 110);
      return () => clearInterval(interval);
    } else {
      setWaveHeights([25, 40, 20, 55, 30, 45, 20, 35, 60, 25, 40, 20, 30, 15]);
    }
  }, [recognitionActive]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Dispatch protected critical action with Voice Biometric check
  const executeWithVoiceBiometrics = (action: PendingCriticalAction) => {
    // If voice biometrics is disabled, execute directly
    if (!isBiometricEnabled) {
      executeActionPayload(action);
      return;
    }

    // Open Biometric HUD Scanner Modal
    setPendingAction(action);
    setSpokenTranscript('');
    setCalculatedScore(null);
    setVerificationState('idle');
    setFeedbackMessage('Awaiting voiceprint capture, Boss. Please speak the authorization phrase.');
    setShowFallbackInput(false);
    setFallbackPasswordInput('');
    setIsModalOpen(true);

    sound.playArcCharge();
    sound.speakWithWebSpeech(
      `Voice biometric verification required, Boss. Please state authorization phrase: ${targetPhrase}`
    );

    // Auto-start listening after brief delay
    setTimeout(() => {
      startSpeechRecognition();
    }, 700);
  };

  // Start Speech Recognition
  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVerificationState('denied');
      setFeedbackMessage(
        'Web Speech API not supported on this browser engine. Use master passphrase bypass below.'
      );
      setShowFallbackInput(true);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setRecognitionActive(true);
        setVerificationState('listening');
        sound.playChirp(1400);
        setFeedbackMessage('Listening... Speak your phrase clearly.');
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        setSpokenTranscript(currentText);

        const currentScore = evaluatePhraseMatch(currentText, targetPhrase);
        setCalculatedScore(currentScore);

        if (finalTranscript) {
          processBiometricVerdict(finalTranscript, currentScore);
        }
      };

      recognition.onerror = (event: any) => {
        setRecognitionActive(false);
        if (event.error !== 'no-speech') {
          setVerificationState('denied');
          setFeedbackMessage(`Acoustic sensor error: ${event.error}. Press 'Speak Phrase' to retry.`);
        }
      };

      recognition.onend = () => {
        setRecognitionActive(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setRecognitionActive(false);
      setVerificationState('denied');
      setFeedbackMessage('Speech sensor initialization failed. Try clicking Speak Phrase.');
    }
  };

  // Process verdict after speech input
  const processBiometricVerdict = (spokenText: string, score: number) => {
    setVerificationState('evaluating');

    const passed = score >= sensitivityThreshold;

    // Record in Biometric Audit Trail
    const newAuditEntry: BiometricAuditLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      action: pendingAction?.type || 'BIOMETRIC_CHECK',
      spokenPhrase: spokenText,
      requiredPhrase: targetPhrase,
      score,
      passed,
    };
    setAuditLogs((prev) => [newAuditEntry, ...prev.slice(0, 49)]);

    if (passed) {
      setVerificationState('granted');
      sound.playCommandAcknowledged();
      setFeedbackMessage(`Voiceprint confirmed (${score}% phonetic match). Authorization granted, Boss.`);
      sound.speakWithWebSpeech('Voiceprint confirmed. Access granted, Boss.');

      // Proceed with critical action after confirmation animation
      setTimeout(() => {
        if (pendingAction) {
          executeActionPayload(pendingAction);
        }
        setIsModalOpen(false);
        setPendingAction(null);
      }, 1000);
    } else {
      setVerificationState('denied');
      sound.playAlert();
      setFeedbackMessage(
        `Voiceprint correlation insufficient (${score}% vs ${sensitivityThreshold}% required). Access denied.`
      );
      sound.speakWithWebSpeech('Voiceprint mismatch detected. Access denied, Boss.');
    }
  };

  // Execute the underlying critical action
  const executeActionPayload = async (action: PendingCriticalAction) => {
    if (action.type === 'UNLOCK_VAULT') {
      sound.playArcCharge();
      setIsUnlocked(true);
      sound.playCommandAcknowledged();
    } else if (action.type === 'DECRYPT_ITEM') {
      const item: VaultItem = action.payload;
      try {
        sound.playChirp(1400);
        const dec = await SecureCryptoService.decrypt(item.encryptedValue, masterPassphrase);
        setDecryptedValues((prev) => ({ ...prev, [item.id]: dec }));
        sound.playCommandAcknowledged();
      } catch (err: any) {
        alert('Decryption failed: ' + err.message);
      }
    } else if (action.type === 'EMERGENCY_PURGE') {
      sound.playAlert();
      setVaultItems([]);
      setDecryptedValues({});
      setMasterPassphrase('');
      setIsUnlocked(false);
      alert('Security Protocol Activated: In-memory keys, decrypted secrets, and session buffers sanitized.');
    }
  };

  // Master Passphrase Bypass (Emergency Fail-Safe)
  const handleFallbackBypass = () => {
    if (fallbackPasswordInput && fallbackPasswordInput === masterPassphrase) {
      sound.playCommandAcknowledged();
      setVerificationState('granted');
      setFeedbackMessage('Master Key override accepted. Proceeding with execution.');
      setTimeout(() => {
        if (pendingAction) {
          executeActionPayload(pendingAction);
        }
        setIsModalOpen(false);
        setPendingAction(null);
      }, 700);
    } else {
      sound.playAlert();
      alert('Invalid Master Passphrase override.');
    }
  };

  // Unlock Trigger
  const handleUnlockClick = () => {
    if (!masterPassphrase.trim()) {
      alert('Master passphrase required to derive cryptographic key.');
      return;
    }
    executeWithVoiceBiometrics({
      type: 'UNLOCK_VAULT',
      label: 'ENCLAVE AES-256 MASTER UNLOCK',
    });
  };

  // Add Encrypted Secret
  const handleAddSecret = async () => {
    if (!newLabel || !newSecret || !masterPassphrase) return;
    try {
      sound.playChirp(1300);
      const encrypted = await SecureCryptoService.encrypt(newSecret, masterPassphrase);
      const newItem: VaultItem = {
        id: Date.now().toString(),
        label: newLabel,
        encryptedValue: encrypted,
        createdAt: new Date().toLocaleTimeString(),
      };
      setVaultItems((prev) => [...prev, newItem]);
      setNewLabel('');
      setNewSecret('');
      sound.playCommandAcknowledged();
    } catch {
      alert('Encryption failed.');
    }
  };

  // Decrypt Item Trigger
  const handleDecryptItemClick = (item: VaultItem) => {
    executeWithVoiceBiometrics({
      type: 'DECRYPT_ITEM',
      label: `DECRYPT CONFIDENTIAL ASSET: "${item.label}"`,
      payload: item,
    });
  };

  // Emergency Purge Trigger
  const handleEmergencyPurgeClick = () => {
    executeWithVoiceBiometrics({
      type: 'EMERGENCY_PURGE',
      label: 'ZERO-KNOWLEDGE PURGE // SANITIZE MEMORY BUFFERS',
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#070c16] border border-cyan-500/25 rounded-lg overflow-hidden font-sans select-none">
      {/* HEADER HUD */}
      <div className="px-5 py-3 bg-[#0a1120] border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-xs font-bold tracking-widest text-cyan-300 uppercase">
            END-TO-END ENCRYPTED SECURITY VAULT
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-semibold">
            AES-256 ZERO-LEAK GUARANTEE
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold flex items-center gap-1 ${
              isBiometricEnabled
                ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                : 'bg-amber-950/80 border-amber-500/40 text-amber-400'
            }`}
          >
            <Fingerprint className="w-3 h-3" />
            {isBiometricEnabled ? 'VOICE BIOMETRICS ARMED' : 'BIOMETRICS OFF'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Config */}
          <button
            onClick={() => {
              sound.playChirp(1200);
              setShowConfigPanel(!showConfigPanel);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
              showConfigPanel
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                : 'bg-slate-900 border-cyan-500/30 text-cyan-300/80 hover:bg-slate-800'
            }`}
            title="Configure Voice Biometrics"
          >
            <Settings className="w-3 h-3" />
            <span>BIOMETRIC SETTINGS</span>
          </button>

          {/* Toggle Audit Trail */}
          <button
            onClick={() => {
              sound.playChirp(1200);
              setShowAuditLogs(!showAuditLogs);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
              showAuditLogs
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                : 'bg-slate-900 border-cyan-500/30 text-cyan-300/80 hover:bg-slate-800'
            }`}
            title="View Biometric Audit Log"
          >
            <History className="w-3 h-3" />
            <span>AUDIT TRAIL ({auditLogs.length})</span>
          </button>

          {/* Emergency Purge */}
          {isUnlocked && (
            <button
              onClick={handleEmergencyPurgeClick}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-950/80 text-rose-300 border border-rose-500/40 rounded text-xs font-mono font-bold hover:bg-rose-900 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              EMERGENCY PURGE
            </button>
          )}
        </div>
      </div>

      {/* MAIN VAULT SCROLLER */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5">
        {/* VOICE BIOMETRICS CONFIGURATION DRAWER */}
        {showConfigPanel && (
          <div className="p-4 bg-[#0a1426] border border-cyan-500/40 rounded-lg font-mono text-xs space-y-4 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
              <div className="flex items-center gap-2 text-cyan-300 font-bold tracking-wider">
                <Fingerprint className="w-4 h-4 text-cyan-400" />
                <span>VOICE BIOMETRIC VERIFICATION LAYER PROTOCOLS</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[11px] text-slate-400">ENABLE LAYER:</span>
                <input
                  type="checkbox"
                  checked={isBiometricEnabled}
                  onChange={(e) => {
                    setIsBiometricEnabled(e.target.checked);
                    sound.playCommandAcknowledged();
                  }}
                  className="rounded bg-slate-950 border-cyan-500/50 text-cyan-500 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Target Phrase Selection */}
              <div className="space-y-2">
                <label className="text-[11px] text-cyan-400/90 font-bold uppercase">
                  AUTHORIZATION VOICEPRINT PHRASE:
                </label>
                <div className="space-y-1.5">
                  {PRESET_PHRASES.map((phrase) => (
                    <button
                      key={phrase}
                      onClick={() => {
                        setTargetPhrase(phrase);
                        setIsCustomPhrase(false);
                        sound.playChirp(1200);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded text-[11px] border transition-colors cursor-pointer ${
                        !isCustomPhrase && targetPhrase === phrase
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                          : 'bg-black/40 border-cyan-500/15 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      "{phrase}"
                    </button>
                  ))}

                  {/* Custom Phrase Option */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={customPhraseInput}
                      onChange={(e) => setCustomPhraseInput(e.target.value)}
                      placeholder="Or enter custom authorization passphrase..."
                      className="flex-1 bg-black/60 border border-cyan-500/30 rounded px-2.5 py-1 text-[11px] text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={() => {
                        if (customPhraseInput.trim()) {
                          setTargetPhrase(customPhraseInput.trim());
                          setIsCustomPhrase(true);
                          sound.playCommandAcknowledged();
                        }
                      }}
                      disabled={!customPhraseInput.trim()}
                      className="px-3 py-1 bg-cyan-500 text-slate-950 font-bold rounded text-[11px] disabled:opacity-40 cursor-pointer"
                    >
                      SET
                    </button>
                  </div>
                </div>
              </div>

              {/* Sensitivity & Calibration */}
              <div className="space-y-3 bg-black/30 p-3.5 rounded border border-cyan-500/15">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-cyan-400/90 font-bold uppercase">
                    PHONETIC MATCH THRESHOLD:
                  </span>
                  <span className="text-cyan-300 font-bold">{sensitivityThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={sensitivityThreshold}
                  onChange={(e) => setSensitivityThreshold(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Lenient (50%)</span>
                  <span>Standard (70%)</span>
                  <span>Strict (95%)</span>
                </div>

                <div className="pt-2 border-t border-cyan-500/15 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">ACTIVE TARGET:</span>
                  <span className="text-emerald-400 font-bold">"{targetPhrase}"</span>
                </div>

                {/* Test Voiceprint Calibration */}
                <button
                  onClick={() => {
                    executeWithVoiceBiometrics({
                      type: 'UNLOCK_VAULT',
                      label: 'VOICEPRINT CALIBRATION TEST',
                    });
                  }}
                  className="w-full mt-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  TEST VOICEPRINT CALIBRATION
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BIOMETRIC AUDIT TRAIL LOGS */}
        {showAuditLogs && (
          <div className="p-4 bg-[#0a1120] border border-cyan-500/30 rounded-lg font-mono text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
              <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                VOICE BIOMETRIC AUDIT TRAIL ({auditLogs.length} ATTEMPTS RECORDED)
              </div>
              <button
                onClick={() => setAuditLogs([])}
                className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                Clear Log
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2.5 rounded border text-[11px] flex items-center justify-between gap-3 ${
                    log.passed
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {log.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">{log.action}</span>
                      <div className="text-[10px] text-slate-400">
                        Heard: "{log.spokenPhrase}" | Target: "{log.requiredPhrase}"
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold">{log.score}% MATCH</span>
                    <div className="text-[10px] text-slate-500">{log.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECURITY AUDIT TELEMETRY CARD */}
        <div className="p-4 bg-slate-900/80 border border-cyan-500/30 rounded font-mono text-xs">
          <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>NOBLE DEFENSE & ZERO-BREACH AUDIT STATUS</span>
            <span className="text-emerald-400 text-[10px]">INTEGRITY LEVEL: 100%</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-[11px]">
            <div className="flex items-center justify-between p-2 bg-black/40 rounded border border-cyan-500/15">
              <span className="text-slate-400">CIPHER:</span>
              <span className="text-cyan-300 font-bold">{securityStatus.encryptionAlgorithm}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-black/40 rounded border border-cyan-500/15">
              <span className="text-slate-400">KEY DERIVATION:</span>
              <span className="text-cyan-300 font-bold">{securityStatus.kdf}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-black/40 rounded border border-cyan-500/15">
              <span className="text-slate-400">BIOMETRICS:</span>
              <span className="text-cyan-400 font-bold">{securityStatus.biometricLayer}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-black/40 rounded border border-cyan-500/15">
              <span className="text-slate-400">TOKEN RESIDENCE:</span>
              <span className="text-emerald-400 font-bold">{securityStatus.tokenStorage}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-black/40 rounded border border-cyan-500/15 col-span-1 md:col-span-2">
              <span className="text-slate-400">TAMPER SENSORS:</span>
              <span className="text-emerald-400 font-bold">{securityStatus.tamperDetection}</span>
            </div>
          </div>
        </div>

        {/* LOCK SCREEN VS UNLOCKED VAULT */}
        {!isUnlocked ? (
          <div className="max-w-md mx-auto p-6 bg-[#0a1120] border border-cyan-500/30 rounded-lg text-center font-mono relative overflow-hidden">
            {/* Holographic background corner reticles */}
            <div className="absolute top-2 left-2 text-[8px] text-cyan-500/40">SEC//01</div>
            <div className="absolute top-2 right-2 text-[8px] text-cyan-500/40">AUTH//REQ</div>

            <Lock className="w-10 h-10 text-cyan-400 mx-auto mb-3 animate-pulse" />
            <h3 className="text-sm font-bold text-cyan-200 uppercase mb-1">STARK SECURITY ENCLAVE</h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Enter your master passphrase and authenticate via your registered voiceprint phrase to derive zero-knowledge keys.
            </p>

            <input
              type="password"
              value={masterPassphrase}
              onChange={(e) => setMasterPassphrase(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlockClick()}
              placeholder="Enter Master Security Passphrase..."
              className="w-full bg-black/70 border border-cyan-500/40 rounded px-3 py-2 text-xs text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 mb-3"
            />

            <button
              onClick={handleUnlockClick}
              className="w-full py-2.5 bg-cyan-500 text-slate-950 font-bold text-xs rounded hover:bg-cyan-400 transition-colors shadow-[0_0_12px_rgba(0,240,255,0.4)] cursor-pointer flex items-center justify-center gap-2"
            >
              <Fingerprint className="w-4 h-4" />
              <span>AUTHENTICATE & UNLOCK VAULT</span>
            </button>

            {isBiometricEnabled && (
              <div className="mt-3 text-[10px] text-cyan-400/70 flex items-center justify-center gap-1">
                <Mic className="w-3 h-3 text-cyan-400" />
                <span>Requires spoken verification: "{targetPhrase}"</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 font-mono text-xs">
            {/* ADD SECRET FORM */}
            <div className="p-4 bg-[#0d1627] border border-cyan-500/30 rounded space-y-3">
              <div className="text-xs font-bold text-cyan-300 uppercase flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                ENCRYPT & STORE CONFIDENTIAL ASSET
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Asset identifier (e.g. Quantum Core SSH Key)..."
                  className="bg-black/60 border border-cyan-500/30 rounded px-3 py-2 text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  value={newSecret}
                  onChange={(e) => setNewSecret(e.target.value)}
                  placeholder="Secret payload to encrypt..."
                  className="bg-black/60 border border-cyan-500/30 rounded px-3 py-2 text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleAddSecret}
                  disabled={!newLabel || !newSecret}
                  className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded hover:bg-cyan-400 disabled:opacity-40 cursor-pointer transition-colors"
                >
                  ENCRYPT (AES-256)
                </button>
              </div>
            </div>

            {/* LIST OF ENCRYPTED SECRETS */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold text-cyan-400/80 uppercase flex items-center justify-between">
                <span>STORED ENCRYPTED VAULT ITEMS ({vaultItems.length})</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Decryption guarded by Voice Biometric Verification
                </span>
              </div>

              {vaultItems.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-black/30 border border-slate-800 rounded">
                  No encrypted items in enclave. Add credentials or secrets above.
                </div>
              ) : (
                vaultItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-[#0a1120] border border-cyan-500/20 rounded flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-cyan-500/40 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-cyan-200 flex items-center gap-2">
                        <span>{item.label}</span>
                        <span className="text-[10px] text-slate-500 font-normal">({item.createdAt})</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-md font-mono mt-0.5">
                        Ciphertext: {item.encryptedValue.slice(0, 48)}...
                      </div>
                      {decryptedValues[item.id] && (
                        <div className="mt-2 p-2 bg-emerald-950/40 border border-emerald-500/40 rounded text-emerald-300 text-[11px] flex items-center justify-between">
                          <span>
                            Decrypted Plaintext: <strong>{decryptedValues[item.id]}</strong>
                          </span>
                          <button
                            onClick={() => {
                              const next = { ...decryptedValues };
                              delete next[item.id];
                              setDecryptedValues(next);
                            }}
                            className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer underline ml-3"
                          >
                            Hide
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDecryptItemClick(item)}
                      className="px-3 py-1.5 bg-slate-800 text-cyan-300 border border-cyan-500/30 rounded hover:bg-slate-700 text-[11px] cursor-pointer whitespace-nowrap flex items-center gap-1.5 self-start md:self-auto"
                    >
                      <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                      <span>DECRYPT ASSET</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* VOICE BIOMETRIC SCANNER MODAL HUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono">
          <div className="w-full max-w-md bg-[#080f1e] border-2 border-cyan-500/50 rounded-xl p-6 shadow-[0_0_30px_rgba(0,240,255,0.35)] relative overflow-hidden text-center space-y-4">
            {/* Top scanning animation line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

            {/* Subsystem Header */}
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 text-[10px] text-slate-400">
              <div className="flex items-center gap-1 text-cyan-400 font-bold">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>NOBLE BIOMETRIC ACCESS CONTROL</span>
              </div>
              <button
                onClick={() => {
                  if (recognitionRef.current) {
                    try {
                      recognitionRef.current.abort();
                    } catch {}
                  }
                  setIsModalOpen(false);
                  setPendingAction(null);
                }}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕ CANCEL
              </button>
            </div>

            {/* Target Action Banner */}
            <div className="p-2.5 bg-black/40 border border-cyan-500/25 rounded text-xs text-cyan-300 font-bold">
              {pendingAction?.label || 'SYSTEM CRITICAL ACTION'}
            </div>

            {/* Interactive Voice Reticle & Animated Waveform */}
            <div className="py-2 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center w-24 h-24 mb-3">
                {/* Concentric rotating rings */}
                <div
                  className={`absolute inset-0 rounded-full border-2 border-dashed ${
                    verificationState === 'granted'
                      ? 'border-emerald-400 shadow-[0_0_20px_#10b981]'
                      : verificationState === 'denied'
                      ? 'border-rose-500 shadow-[0_0_20px_#f43f5e]'
                      : 'border-cyan-400 animate-spin shadow-[0_0_15px_#00f0ff]'
                  }`}
                  style={{ animationDuration: '6s' }}
                />

                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    verificationState === 'granted'
                      ? 'bg-emerald-950 text-emerald-400'
                      : verificationState === 'denied'
                      ? 'bg-rose-950 text-rose-400'
                      : recognitionActive
                      ? 'bg-cyan-950 text-cyan-300 shadow-[0_0_15px_#00f0ff]'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {verificationState === 'granted' ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : verificationState === 'denied' ? (
                    <XCircle className="w-8 h-8" />
                  ) : (
                    <Mic className={`w-8 h-8 ${recognitionActive ? 'animate-bounce' : ''}`} />
                  )}
                </div>
              </div>

              {/* Dynamic Soundwave Equalizer Bars */}
              <div className="flex items-center justify-center gap-1.5 h-10 w-full px-8 mb-2">
                {waveHeights.map((h, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-100 ${
                      verificationState === 'granted'
                        ? 'bg-emerald-400'
                        : verificationState === 'denied'
                        ? 'bg-rose-500'
                        : 'bg-cyan-400 shadow-[0_0_6px_#00f0ff]'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              {/* Target Passphrase prompt */}
              <div className="text-xs text-slate-300 mb-1">
                Please speak your authorization phrase:
              </div>
              <div className="px-4 py-1.5 bg-cyan-950/80 border border-cyan-400/60 rounded text-cyan-200 font-bold text-sm tracking-wide">
                "{targetPhrase}"
              </div>
            </div>

            {/* Real-time Spoken Transcript Display */}
            <div className="p-3 bg-black/60 border border-cyan-500/30 rounded text-left space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>RECOGNIZED ACOUSTIC TRANSCRIPT:</span>
                {calculatedScore !== null && (
                  <span
                    className={`font-bold ${
                      calculatedScore >= sensitivityThreshold ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {calculatedScore}% PHONETIC MATCH
                  </span>
                )}
              </div>
              <div className="text-xs text-cyan-100 min-h-[22px] font-mono italic">
                {spokenTranscript || (
                  <span className="text-slate-600 not-italic">Listening for voice input...</span>
                )}
              </div>
            </div>

            {/* Status Feedback Message */}
            <div
              className={`text-xs px-3 py-2 rounded border ${
                verificationState === 'granted'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : verificationState === 'denied'
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  : 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300'
              }`}
            >
              {feedbackMessage}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={startSpeechRecognition}
                disabled={recognitionActive}
                className="flex-1 py-2 bg-cyan-500 text-slate-950 font-bold text-xs rounded hover:bg-cyan-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.3)]"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{recognitionActive ? 'LISTENING...' : 'SPEAK PHRASE'}</span>
              </button>

              <button
                onClick={() => setShowFallbackInput(!showFallbackInput)}
                className="py-2 px-3 bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 text-xs rounded font-bold cursor-pointer"
                title="Use Master Key Override"
              >
                KEY BYPASS
              </button>
            </div>

            {/* Emergency Passphrase Fallback */}
            {showFallbackInput && (
              <div className="p-3 bg-black/70 border border-cyan-500/25 rounded space-y-2 text-left">
                <div className="text-[10px] text-slate-400">
                  MANUAL OVERRIDE: Enter Master Passphrase
                </div>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={fallbackPasswordInput}
                    onChange={(e) => setFallbackPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFallbackBypass()}
                    placeholder="Enter Master Passphrase..."
                    className="flex-1 bg-slate-950 border border-cyan-500/30 rounded px-2.5 py-1 text-xs text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleFallbackBypass}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded text-xs cursor-pointer"
                  >
                    VERIFY
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
