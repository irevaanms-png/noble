import React, { useState } from 'react';
import { sound } from '../services/audio';
import {
  Activity,
  Zap,
  Thermometer,
  ShieldAlert,
  Wind,
  Lock,
  Unlock,
  Sliders,
  Cpu,
  Brain,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface SmartDevice {
  id: string;
  name: string;
  category: 'energy' | 'climate' | 'security' | 'nanotech';
  status: 'active' | 'standby' | 'alert';
  value: string | number;
  unit: string;
  isToggleable?: boolean;
  isOn?: boolean;
}

export const SmartHomeMatrix: React.FC = () => {
  const [devices, setDevices] = useState<SmartDevice[]>([
    { id: 'dev-1', name: 'Arc Reactor Core Pacing', category: 'energy', status: 'active', value: 98.4, unit: '%', isToggleable: true, isOn: true },
    { id: 'dev-2', name: 'Substation Cryo-Cooling', category: 'energy', status: 'active', value: 4.2, unit: 'bar', isToggleable: true, isOn: true },
    { id: 'dev-3', name: 'Compound HVAC Lab Climate', category: 'climate', status: 'active', value: 21.5, unit: '°C', isToggleable: true, isOn: true },
    { id: 'dev-4', name: 'Air Particulate Filtration (HEPA-X)', category: 'climate', status: 'active', value: 99.9, unit: '% AQI', isToggleable: true, isOn: true },
    { id: 'dev-5', name: 'Biometric Access Gates', category: 'security', status: 'active', value: 'LOCKED', unit: 'SECURE', isToggleable: true, isOn: true },
    { id: 'dev-6', name: 'Perimeter Laser Defense Grid', category: 'security', status: 'active', value: 'ACTIVE', unit: '360°', isToggleable: true, isOn: true },
    { id: 'dev-7', name: 'Nanotech Forge Fluid Chamber', category: 'nanotech', status: 'standby', value: 84.1, unit: '% Capacity', isToggleable: true, isOn: false },
    { id: 'dev-8', name: 'Neural Server Rack Array', category: 'energy', status: 'active', value: 38.6, unit: '°C', isToggleable: true, isOn: true },
  ]);

  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionData, setPredictionData] = useState<any>(null);

  const toggleDevice = (id: string) => {
    sound.playChirp(1300);
    setDevices((prev) =>
      prev.map((dev) =>
        dev.id === id
          ? {
              ...dev,
              isOn: !dev.isOn,
              status: !dev.isOn ? 'active' : 'standby',
              value: typeof dev.value === 'string' ? (!dev.isOn ? 'LOCKED' : 'DISENGAGED') : dev.value,
            }
          : dev
      )
    );
  };

  const runPredictiveML = async () => {
    setIsPredicting(true);
    sound.playArcCharge();

    try {
      const telemetryPayload = devices.map((d) => ({
        device: d.name,
        category: d.category,
        current_reading: `${d.value} ${d.unit}`,
        state: d.isOn ? 'ONLINE' : 'OFFLINE',
      }));

      const res = await fetch('/api/iot/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telemetry: telemetryPayload }),
      });

      if (!res.ok) throw new Error('ML Prediction failed');
      const data = await res.json();
      setPredictionData(data);
      sound.playCommandAcknowledged();
    } catch {
      // Fallback telemetry brief if backend route is busy
      setPredictionData({
        system_efficiency: 98.7,
        risk_assessment: 'NOMINAL',
        anomalies_predicted: [
          'Cryo-coolant thermal drift expected around 16:00 (-1.2°C).',
          'Compound power grid demand forecasted to peak during nanotech synthesis.',
        ],
        automated_actions: [
          { target: 'Substation Cryo-Cooling', action: 'Pre-chill thermal manifolds by 2°C', benefit: 'Prevents arc reactor core throttling' },
          { target: 'Air Particulate Filtration', action: 'Increase cycle rate to 100%', benefit: 'Maintains sterile laboratory atmosphere' },
        ],
        voice_briefing: 'All smart home and IoT systems are operating within optimal parameters, Boss. No critical anomalies detected.',
      });
      sound.playCommandAcknowledged();
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#070c16] border border-cyan-500/25 rounded-lg overflow-hidden font-sans">
      {/* Top Header */}
      <div className="px-5 py-3 bg-[#0a1120] border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold tracking-widest text-cyan-300 uppercase">
            IOT SENSOR MATRIX & PREDICTIVE AUTOMATION
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 font-semibold">
            TELEMETRY: LIVE
          </span>
        </div>

        {/* Predictive AI Button */}
        <button
          onClick={runPredictiveML}
          disabled={isPredicting}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-cyan-500 text-slate-950 font-mono font-bold text-xs rounded hover:bg-cyan-400 transition-colors shadow-[0_0_12px_rgba(0,240,255,0.4)] cursor-pointer disabled:opacity-50"
        >
          <Brain className="w-4 h-4" />
          {isPredicting ? 'RUNNING ML PREDICTION...' : 'RUN PREDICTIVE ML ANALYSIS'}
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto p-4 gap-4">
        {/* Left Column: Smart Devices Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>CONNECTED SENSORS & ACTUATORS ({devices.length})</span>
            <span className="text-slate-400 font-normal">MESH PROTOCOL: ZIGBEE / MQTT SECURE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`p-3.5 rounded border transition-all ${
                  device.isOn
                    ? 'bg-[#0d1627] border-cyan-500/30 shadow-[0_0_10px_rgba(0,240,255,0.05)]'
                    : 'bg-[#0a0f1b] border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {device.category === 'energy' && <Zap className="w-4 h-4 text-amber-400" />}
                    {device.category === 'climate' && <Wind className="w-4 h-4 text-cyan-400" />}
                    {device.category === 'security' && <ShieldAlert className="w-4 h-4 text-emerald-400" />}
                    {device.category === 'nanotech' && <Cpu className="w-4 h-4 text-purple-400" />}
                    <span className="text-xs font-mono font-bold text-slate-200">{device.name}</span>
                  </div>

                  {device.isToggleable && (
                    <button
                      onClick={() => toggleDevice(device.id)}
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        device.isOn
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {device.isOn ? 'ONLINE' : 'OFFLINE'}
                    </button>
                  )}
                </div>

                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">READING:</span>
                  <div className="font-mono text-base font-bold text-cyan-300">
                    {device.value}{' '}
                    <span className="text-[10px] font-normal text-cyan-400/70">{device.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Predictive ML Forecast Intelligence (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">
            PREDICTIVE AUTOMATION INTELLIGENCE
          </div>

          {predictionData ? (
            <div className="space-y-3 font-mono text-xs">
              {/* Efficiency Score Card */}
              <div className="p-4 bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-500/40 rounded flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-cyan-400/80 uppercase">SYSTEM EFFICIENCY INDEX</div>
                  <div className="text-2xl font-bold text-cyan-200 mt-0.5">
                    {predictionData.system_efficiency}%
                  </div>
                </div>
                <div className="px-3 py-1 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 font-bold text-xs uppercase">
                  {predictionData.risk_assessment || 'NOMINAL'}
                </div>
              </div>

              {/* Predicted Anomalies */}
              <div className="p-3.5 bg-slate-900/80 border border-cyan-500/20 rounded">
                <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  PREDICTED 4-HOUR FORECAST DRIFT
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  {predictionData.anomalies_predicted?.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-400">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Automated Interventions */}
              <div className="p-3.5 bg-slate-900/80 border border-cyan-500/20 rounded">
                <div className="flex items-center gap-1.5 text-cyan-300 text-[10px] font-bold uppercase mb-2">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                  AUTOMATED DISPATCH PROPOSALS
                </div>
                <div className="space-y-2">
                  {predictionData.automated_actions?.map((action: any, i: number) => (
                    <div key={i} className="p-2 bg-black/40 rounded border border-cyan-500/15">
                      <div className="font-bold text-cyan-200 text-[11px]">{action.target}</div>
                      <div className="text-slate-300 text-[10px]">{action.action}</div>
                      <div className="text-emerald-400/80 text-[9px] mt-0.5">Benefit: {action.benefit}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verbal Briefing Note */}
              <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded text-[11px] text-cyan-100 italic">
                "{predictionData.voice_briefing}"
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center p-6 bg-slate-950/60 border border-cyan-500/20 rounded text-center text-cyan-400/60 font-mono">
              <Brain className="w-8 h-8 text-cyan-500/30 mb-2" />
              <p className="text-xs">Machine Learning Predictor Standing By.</p>
              <p className="text-[10px] text-cyan-400/50 mt-1">
                Click "Run Predictive ML Analysis" to forecast thermal and electrical load variance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
