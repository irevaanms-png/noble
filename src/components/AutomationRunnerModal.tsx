import React, { useState } from 'react';
import { sound } from '../services/audio';
import { Terminal, Download, Copy, Check, Play, ShieldAlert, Cpu } from 'lucide-react';

interface AutomationRunnerModalProps {
  currentPayload: any;
  onClose?: () => void;
  onSimulateComplete?: () => void;
}

const PYTHON_RUNNER_SCRIPT = `#!/usr/bin/env python3
"""
====================================================================
ICARUS D. NOBLE — LOCAL DESKTOP AUTOMATION RUNNER
Inspired by Jarvis, FRIDAY & EDITH for PC Application Control
Requires: pip install pyautogui requests pyttsx3
====================================================================
"""

import sys
import time
import json
import subprocess
import webbrowser
try:
    import pyautogui
    pyautogui.FAILSAFE = True  # Move mouse to corner to abort
except ImportError:
    print("[ERROR] Please run: pip install pyautogui requests")
    sys.exit(1)

try:
    import pyttsx3
    voice_engine = pyttsx3.init()
    voice_engine.setProperty('rate', 175)
except Exception:
    voice_engine = None

def speak(message):
    """Voice feedback synthesis"""
    print(f"[NOBLE VOICE]: {message}")
    if voice_engine:
        voice_engine.say(message)
        voice_engine.runAndWait()

def execute_noble_action(payload):
    """Parses standard Icarus D. Noble JSON payload and executes on OS"""
    status = payload.get("agent_status")
    action_type = payload.get("action_type")
    target_app = payload.get("target_application")
    params = payload.get("action_parameters", {})
    feedback = payload.get("feedback_message", "Executing command, Boss.")

    print(f"\\n[NOBLE CORE] Dispatching: {action_type} -> {target_app}")
    speak(feedback)

    # 1. APP_LAUNCH
    if action_type == "APP_LAUNCH":
        app_name = params.get("app_name") or target_app
        command = params.get("command") or app_name
        print(f"[OS EXEC]: Launching '{command}'...")
        if sys.platform == "win32":
            subprocess.Popen(["start", command], shell=True)
        elif sys.platform == "darwin":
            subprocess.Popen(["open", "-a", app_name])
        else:
            subprocess.Popen([command], shell=True)

    # 2. CLICK_COORDINATE
    elif action_type == "CLICK_COORDINATE":
        screen_w, screen_h = pyautogui.size()
        x_pct = params.get("coordinate_x", 50)
        y_pct = params.get("coordinate_y", 50)
        target_x = int(screen_w * (x_pct / 100.0))
        target_y = int(screen_h * (y_pct / 100.0))
        print(f"[OS EXEC]: Gliding cursor to ({target_x}, {target_y}) [{x_pct}%, {y_pct}%]...")
        pyautogui.moveTo(target_x, target_y, duration=0.45)
        pyautogui.click()

    # 3. TYPE_TEXT
    elif action_type == "TYPE_TEXT":
        text_to_type = params.get("text", "")
        press_enter = params.get("press_enter", True)
        print(f"[OS EXEC]: Typing '{text_to_type}'...")
        time.sleep(0.3)
        pyautogui.write(text_to_type, interval=0.03)
        if press_enter:
            pyautogui.press('enter')

    # 4. WEB_SEARCH
    elif action_type == "WEB_SEARCH":
        query = params.get("query", "")
        url = params.get("url") or f"https://www.google.com/search?q={query}"
        print(f"[OS EXEC]: Navigating web to '{url}'...")
        webbrowser.open(url)

    # 5. SYSTEM_CALL / HOTKEY
    elif action_type == "SYSTEM_CALL":
        keys = params.get("hotkeys", [])
        if keys:
            print(f"[OS EXEC]: Triggering hotkey combination: {keys}...")
            pyautogui.hotkey(*keys)

    print("[NOBLE CORE] Task completed successfully. Awaiting further commands, Boss.")

if __name__ == "__main__":
    print("==========================================================")
    print("   ICARUS D. NOBLE — DESKTOP RUNNER INITIALIZED")
    print("   Listening for incoming automation payloads...")
    print("==========================================================")
    sample_payload = {
        "agent_status": "EXECUTING",
        "action_type": "WEB_SEARCH",
        "target_application": "Chrome",
        "action_parameters": {
            "query": "Stark Industries Arc Reactor telemetry"
        },
        "feedback_message": "Searching the web for Arc Reactor telemetry, Boss."
    }
    execute_noble_action(sample_payload)
`;

export const AutomationRunnerModal: React.FC<AutomationRunnerModalProps> = ({
  currentPayload,
  onClose,
  onSimulateComplete,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simSteps, setSimSteps] = useState<string[]>([]);

  const handleCopyScript = () => {
    sound.playChirp(1400);
    navigator.clipboard.writeText(PYTHON_RUNNER_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    sound.playChirp(1200);
    const blob = new Blob([PYTHON_RUNNER_SCRIPT], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'noble_automation_runner.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSimulateExecution = async () => {
    if (!currentPayload) return;
    setIsSimulating(true);
    setSimSteps([]);
    sound.playArcCharge();

    const steps = [
      `[1/4] Interfacing with Desktop Window Manager... Focus: ${currentPayload.target_application || 'Desktop'}`,
      `[2/4] Parsing intent: ${currentPayload.action_type}`,
      `[3/4] Dispatching hardware parameters: ${JSON.stringify(currentPayload.action_parameters || {})}`,
      `[4/4] Execution confirmed. Voice synthesis: "${currentPayload.feedback_message || 'Task completed, Boss.'}"`,
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setSimSteps((prev) => [...prev, steps[i]]);
      sound.playChirp(1100 + i * 150);
    }

    sound.playCommandAcknowledged();
    setIsSimulating(false);
    if (onSimulateComplete) onSimulateComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-[#0a1120] border-2 border-cyan-500/60 rounded-lg p-6 shadow-2xl flex flex-col max-h-[90vh] font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30 mb-4">
          <div className="flex items-center gap-2 text-cyan-300">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-bold uppercase tracking-wider">
              LOCAL PC AUTOMATION RUNNER (PYAUTOGUI / OS BRIDGE)
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 cursor-pointer"
            >
              ESC / CLOSE
            </button>
          )}
        </div>

        {/* Payload In Action */}
        {currentPayload && (
          <div className="mb-4 p-3.5 bg-black/60 border border-cyan-500/40 rounded">
            <div className="flex items-center justify-between text-xs text-cyan-300 font-bold uppercase mb-2">
              <span>DISPATCHING ACTIVE PAYLOAD</span>
              <span className="text-emerald-400">{currentPayload.agent_status || 'EXECUTING'}</span>
            </div>
            <pre className="text-[11px] text-emerald-400 max-h-32 overflow-y-auto bg-[#050912] p-2.5 rounded border border-emerald-500/20">
              {JSON.stringify(currentPayload, null, 2)}
            </pre>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={handleSimulateExecution}
                disabled={isSimulating}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-slate-950 font-bold text-xs rounded hover:bg-cyan-400 transition-colors shadow-[0_0_12px_rgba(0,240,255,0.4)] cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isSimulating ? 'SIMULATING EXECUTION...' : 'RUN IN-BROWSER SIMULATION'}
              </button>
              <span className="text-[10px] text-slate-400 italic">
                "{currentPayload.feedback_message}"
              </span>
            </div>

            {simSteps.length > 0 && (
              <div className="mt-3 p-2 bg-[#060b14] border border-cyan-500/20 rounded space-y-1 text-[11px] text-cyan-300">
                {simSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Python Script Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-300 font-bold uppercase">
              STANDALONE PYTHON LOCAL RUNNER (noble_automation_runner.py)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-cyan-300 text-xs rounded border border-cyan-500/30 hover:bg-slate-700 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'COPIED SCRIPT' : 'COPY PYTHON SCRIPT'}
              </button>
              <button
                onClick={handleDownloadScript}
                className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 text-cyan-200 text-xs rounded border border-cyan-400/40 hover:bg-cyan-500/30 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                DOWNLOAD .PY
              </button>
            </div>
          </div>

          <pre className="flex-1 p-3.5 bg-black/80 border border-slate-700 text-[10px] text-slate-300 rounded overflow-y-auto leading-relaxed select-all">
            {PYTHON_RUNNER_SCRIPT}
          </pre>
        </div>
      </div>
    </div>
  );
};
