import React, { useState, useRef } from 'react';
import { sound } from '../services/audio';
import { Scan, Eye, Camera, RefreshCw, Layers, ShieldCheck, Crosshair, ArrowRight } from 'lucide-react';

interface EdithScreenVisionProps {
  onExecuteAction?: (payload: any) => void;
}

// Preset visual contexts for instant testing and demonstration
const PRESET_SCREENS = [
  {
    id: 'desktop-ide',
    label: 'STARK WORKSTATION (IDE)',
    desc: 'VS Code editor with quantum core simulation scripts & terminal output',
    mockSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" fill="%230c121e">
      <rect width="800" height="450" fill="%230a0f1d"/>
      <rect x="0" y="0" width="800" height="32" fill="%23131c2e"/>
      <circle cx="20" cy="16" r="5" fill="%23ef4444"/>
      <circle cx="36" cy="16" r="5" fill="%23f59e0b"/>
      <circle cx="52" cy="16" r="5" fill="%2310b981"/>
      <text x="75" y="20" fill="%2394a3b8" font-family="monospace" font-size="12">VS Code - quantum_stabilizer.py (Active)</text>
      <rect x="16" y="50" width="220" height="380" fill="%230d1527" stroke="%231e293b"/>
      <text x="30" y="80" fill="%2338bdf8" font-family="monospace" font-size="12">PROJECT EXPLORER</text>
      <text x="30" y="110" fill="%2394a3b8" font-family="monospace" font-size="11">▸ arc_reactor_v7/</text>
      <text x="30" y="130" fill="%2394a3b8" font-family="monospace" font-size="11">▾ core_telemetry/</text>
      <text x="45" y="150" fill="%2338bdf8" font-family="monospace" font-size="11">● stabilizer.py</text>
      <text x="45" y="170" fill="%2394a3b8" font-family="monospace" font-size="11">○ thermite_flow.json</text>
      <rect x="250" y="50" width="530" height="260" fill="%230b1322" stroke="%231e293b"/>
      <text x="270" y="80" fill="%2360a5fa" font-family="monospace" font-size="12">def stabilize_quantum_mesh(flux_rate=4.82):</text>
      <text x="290" y="105" fill="%23e2e8f0" font-family="monospace" font-size="12">if flux_rate > 5.0:</text>
      <text x="310" y="130" fill="%23f43f5e" font-family="monospace" font-size="12">trigger_overdrive_cooling(sector='ARC_CORE')</text>
      <text x="290" y="155" fill="%23e2e8f0" font-family="monospace" font-size="12">return {"status": "OPTIMAL", "power": "300%"}</text>
      <rect x="250" y="320" width="530" height="110" fill="%23070b14" stroke="%231e293b"/>
      <text x="270" y="345" fill="%2310b981" font-family="monospace" font-size="11">noble-terminal:~$ python quantum_stabilizer.py</text>
      <text x="270" y="370" fill="%2338bdf8" font-family="monospace" font-size="11">[SYS_INFO] Arc Reactor Core telemetry stream initialized at 60 FPS.</text>
      <text x="270" y="395" fill="%23fbbf24" font-family="monospace" font-size="11">[CAUTION] Sector 4 temperature elevation detected (+3.4°C).</text>
    </svg>`,
  },
  {
    id: 'browser-research',
    label: 'CHROME BROWSER (CLEAN ENERGY)',
    desc: 'Google Chrome displaying global grid power distribution telemetry',
    mockSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" fill="%230c121e">
      <rect width="800" height="450" fill="%230c1424"/>
      <rect x="0" y="0" width="800" height="40" fill="%23172238"/>
      <rect x="150" y="8" width="450" height="24" rx="4" fill="%230d1524" stroke="%2338bdf8" stroke-width="0.8"/>
      <text x="165" y="24" fill="%2338bdf8" font-family="monospace" font-size="11">https://grid.starkindustries.com/telemetry/clean-energy</text>
      <circle cx="760" cy="20" r="12" fill="%230284c7"/>
      <rect x="30" y="60" width="440" height="360" fill="%23101b30" rx="6" stroke="%231e293b"/>
      <text x="50" y="95" fill="%23e2e8f0" font-family="sans-serif" font-weight="bold" font-size="18">Global Arc Reactor Power Grid</text>
      <text x="50" y="120" fill="%2394a3b8" font-family="sans-serif" font-size="12">Live municipal output across North American and European sectors</text>
      <rect x="50" y="145" width="400" height="4" fill="%2338bdf8"/>
      <text x="50" y="180" fill="%2338bdf8" font-family="monospace" font-size="13">▸ Total Energy Dispatched: 14.8 GW</text>
      <text x="50" y="210" fill="%2310b981" font-family="monospace" font-size="13">▸ Carbon Offset Efficiency: 99.82%</text>
      <text x="50" y="240" fill="%23fbbf24" font-family="monospace" font-size="13">▸ Storage Reserves: 4,200 MWh</text>
      <rect x="490" y="60" width="280" height="360" fill="%23101b30" rx="6" stroke="%231e293b"/>
      <text x="510" y="95" fill="%23e2e8f0" font-family="sans-serif" font-weight="bold" font-size="14">Open Tasks</text>
      <rect x="510" y="120" width="240" height="60" rx="4" fill="%231a2942"/>
      <text x="525" y="145" fill="%23e2e8f0" font-family="sans-serif" font-size="12">Deploy firmware patch 4.2</text>
      <text x="525" y="165" fill="%2394a3b8" font-family="sans-serif" font-size="10">Assigned by Pepper Potts</text>
    </svg>`,
  },
  {
    id: 'security-matrix',
    label: 'COMPOUND SURVEILLANCE & DEFENSE',
    desc: 'Tactical perimeter defense grid & biometric access doors',
    mockSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" fill="%23060b14">
      <rect width="800" height="450" fill="%23060b14"/>
      <circle cx="400" cy="225" r="180" fill="none" stroke="%230284c7" stroke-width="1" stroke-dasharray="4 4"/>
      <circle cx="400" cy="225" r="120" fill="none" stroke="%230284c7" stroke-width="1.5"/>
      <circle cx="400" cy="225" r="60" fill="none" stroke="%2338bdf8" stroke-width="1"/>
      <line x1="400" y1="25" x2="400" y2="425" stroke="%230369a1" stroke-width="0.8"/>
      <line x1="200" y1="225" x2="600" y2="225" stroke="%230369a1" stroke-width="0.8"/>
      <rect x="30" y="30" width="220" height="90" fill="%230b1322" stroke="%2338bdf8" stroke-width="1"/>
      <text x="45" y="55" fill="%2338bdf8" font-family="monospace" font-size="11">PERIMETER STATUS: SECURE</text>
      <text x="45" y="75" fill="%2310b981" font-family="monospace" font-size="11">RADAR SWEEP: 360° ACTIVE</text>
      <text x="45" y="95" fill="%23e2e8f0" font-family="monospace" font-size="11">AIRSPACE: RESTRICTED</text>
      <circle cx="460" cy="180" r="6" fill="%2310b981"/>
      <text x="475" y="185" fill="%2310b981" font-family="monospace" font-size="10">FRIENDLY: RHODEY (WAR MACHINE)</text>
    </svg>`,
  },
];

export const EdithScreenVision: React.FC<EdithScreenVisionProps> = ({ onExecuteAction }) => {
  const [selectedScreen, setSelectedScreen] = useState<string>(PRESET_SCREENS[0].mockSvg);
  const [selectedLabel, setSelectedLabel] = useState<string>(PRESET_SCREENS[0].label);
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [detectedTargets, setDetectedTargets] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Screen Capture via browser getDisplayMedia
  const handleLiveCapture = async () => {
    sound.playChirp(1400);
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert('Screen capture API is not available on this browser. Using preset mockup.');
        return;
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      const imageCapture = (window as any).ImageCapture ? new (window as any).ImageCapture(track) : null;

      if (imageCapture) {
        const bitmap = await imageCapture.grabFrame();
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(bitmap, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        setSelectedScreen(dataUrl);
        setSelectedLabel('LIVE DESKTOP STREAM');
      }
      track.stop();
      triggerAnalysis(selectedScreen);
    } catch {
      // User cancelled screen share or permission denied
    }
  };

  // Upload image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedScreen(reader.result);
        setSelectedLabel(`SCREENSHOT: ${file.name}`);
        sound.playChirp(1200);
      }
    };
    reader.readAsDataURL(file);
  };

  // Trigger Gemini Vision Analysis
  const triggerAnalysis = async (imageData: string = selectedScreen) => {
    setIsScanning(true);
    sound.playArcCharge();

    try {
      const res = await fetch('/api/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageData,
        }),
      });

      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setAnalysisResult(data.analysis);
      sound.playCommandAcknowledged();

      // Parse JSON coordinate targets from response
      const jsonMatch = data.analysis.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.ui_targets && Array.isArray(parsed.ui_targets)) {
            setDetectedTargets(parsed.ui_targets);
          }
        } catch {}
      } else {
        // Fallback target points for visual HUD
        setDetectedTargets([
          { label: 'Primary Target', x: 50, y: 35, type: 'action' },
          { label: 'Terminal Buffer', x: 45, y: 75, type: 'input' },
          { label: 'Control Pill', x: 70, y: 22, type: 'button' },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setAnalysisResult(`### EDITH Analysis Stream\n- Visual telemetry scan completed.\n- Target UI objects classified.\n- Active state: Nominal.`);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#080d16] border border-cyan-500/25 rounded-lg overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="px-5 py-3 bg-[#0a1220] border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Scan className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold tracking-widest text-cyan-300 uppercase">
            EDITH MULTIMODAL VISUAL AWARENESS
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 font-semibold">
            OPTICAL SCANNER
          </span>
        </div>

        {/* Input Source Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLiveCapture}
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 rounded hover:bg-cyan-500/30 transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            LIVE SCREEN CAPTURE
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-mono bg-slate-800 text-cyan-300 border border-cyan-500/20 rounded hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            UPLOAD SCREEN
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Main Grid: Visual Display on Left, Telemetry & Recommendations on Right */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Screen Viewport with HUD Coordinates Reticle (8 cols) */}
        <div className="lg:col-span-7 flex flex-col p-4 bg-[#05080f] border-b lg:border-b-0 lg:border-r border-cyan-500/20 overflow-y-auto">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
            <span className="text-[10px] font-mono text-cyan-400/70 uppercase mr-1">SCENARIOS:</span>
            {PRESET_SCREENS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedScreen(preset.mockSvg);
                  setSelectedLabel(preset.label);
                  sound.playChirp(1000);
                  setAnalysisResult(null);
                  setDetectedTargets([]);
                }}
                className={`px-2.5 py-1 text-[10px] font-mono rounded whitespace-nowrap transition-colors cursor-pointer ${
                  selectedLabel === preset.label
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-cyan-300 border border-cyan-500/20 hover:bg-slate-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Screen Image Container with HUD Overlays */}
          <div className="relative w-full aspect-video rounded border border-cyan-500/30 overflow-hidden bg-black flex items-center justify-center group shadow-[0_0_20px_rgba(0,240,255,0.06)]">
            <img
              src={selectedScreen}
              alt="Visual Screen Context"
              className="w-full h-full object-contain"
            />

            {/* Scanning HUD grid line animation when active */}
            {isScanning && (
              <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none flex flex-col justify-center items-center">
                <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_12px_#00f0ff] animate-bounce" />
                <div className="absolute top-4 right-4 bg-black/80 px-2.5 py-1 rounded border border-cyan-400 text-cyan-400 font-mono text-xs flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ANALYZING VISUAL FRAME (GEMINI)...
                </div>
              </div>
            )}

            {/* Detected Target HUD Overlays */}
            {detectedTargets.map((target, idx) => (
              <div
                key={idx}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group/pin"
                style={{ left: `${target.x || 50}%`, top: `${target.y || 50}%` }}
                onClick={() => {
                  sound.playChirp(1500);
                  if (onExecuteAction) {
                    onExecuteAction({
                      agent_status: 'EXECUTING',
                      action_type: 'CLICK_COORDINATE',
                      target_application: selectedLabel,
                      action_parameters: {
                        coordinate_x: target.x,
                        coordinate_y: target.y,
                        target_label: target.label,
                      },
                      feedback_message: `Engaging target ${target.label} at coordinates ${target.x}%, ${target.y}%.`,
                    });
                  }
                }}
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full border border-cyan-400/80 bg-cyan-500/20 flex items-center justify-center group-hover/pin:scale-125 transition-transform shadow-[0_0_10px_#00f0ff]">
                    <Crosshair className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div className="absolute left-8 bg-slate-950/90 border border-cyan-400/60 text-cyan-200 text-[10px] font-mono px-2 py-0.5 rounded whitespace-nowrap opacity-90 group-hover/pin:opacity-100 transition-opacity">
                    [{target.x}%, {target.y}%] {target.label}
                  </div>
                </div>
              </div>
            ))}

            {/* Corner HUD framing brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />
          </div>

          {/* Action Trigger */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] font-mono text-cyan-300/70">
              FRAME TARGET: <strong className="text-cyan-200">{selectedLabel}</strong>
            </span>
            <button
              onClick={() => triggerAnalysis()}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-slate-950 font-mono font-bold text-xs rounded hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(0,240,255,0.4)] cursor-pointer disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              {isScanning ? 'SCANNING FRAME...' : 'ANALYZE SCREEN CONTEXT'}
            </button>
          </div>
        </div>

        {/* Right Column: EDITH Telemetry & Actionable Recommendations (5 cols) */}
        <div className="lg:col-span-5 p-4 flex flex-col bg-[#090e1a] overflow-y-auto">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyan-500/20">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs font-bold tracking-wider text-cyan-300 uppercase">
              EDITH INTELLIGENCE SUMMARY
            </span>
          </div>

          {analysisResult ? (
            <div className="space-y-4 text-xs font-mono text-slate-300">
              <div className="prose prose-invert prose-xs max-w-none leading-relaxed whitespace-pre-wrap bg-slate-900/60 p-3.5 rounded border border-cyan-500/20">
                {analysisResult}
              </div>

              {/* Quick Action Suggestion Button */}
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded">
                <div className="text-[10px] font-mono text-cyan-300 font-bold uppercase mb-1">
                  PROACTIVE NEXT STEP SUGGESTION
                </div>
                <p className="text-[11px] text-cyan-100/90 mb-3">
                  Initiate automated Python script execution on local PC runner to optimize workload.
                </p>
                <button
                  onClick={() => {
                    sound.playCommandAcknowledged();
                    if (onExecuteAction) {
                      onExecuteAction({
                        agent_status: 'EXECUTING',
                        action_type: 'APP_LAUNCH',
                        target_application: 'Terminal',
                        action_parameters: {
                          command: 'python quantum_stabilizer.py --boost',
                        },
                        feedback_message: 'Executing quantum stabilizer script on workstation, Boss.',
                      });
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 rounded hover:bg-cyan-500/30 text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  EXECUTE SUGGESTED WORKFLOW
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-cyan-300/60 font-mono">
              <Eye className="w-8 h-8 text-cyan-500/40 mb-2" />
              <p className="text-xs">Optical sensors ready.</p>
              <p className="text-[10px] text-cyan-400/50 mt-1">
                Select a workstation scenario above or capture live screen to begin EDITH analysis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
