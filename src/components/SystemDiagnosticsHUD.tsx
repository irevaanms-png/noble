import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Zap,
  Thermometer,
  RefreshCw,
  Pause,
  Play,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { sound } from '../services/audio';

interface TelemetryPoint {
  time: Date;
  cpu: number;
  cpuTemp: number;
  ramUsed: number; // GB
  ramTotal: number; // GB
  netRx: number; // KB/s
  netTx: number; // KB/s
  busVoltage: number; // V
}

interface SystemDiagnosticsHUDProps {
  powerLevel?: number;
  theme?: 'cyan' | 'gold' | 'crimson' | 'violet';
  visible?: boolean;
  onToggleVisibility?: () => void;
}

const THEME_COLORS = {
  cyan: {
    primary: '#00f0ff',
    secondary: '#0ea5e9',
    glow: 'rgba(0, 240, 255, 0.4)',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-950/40',
  },
  gold: {
    primary: '#ffb703',
    secondary: '#fb8500',
    glow: 'rgba(255, 183, 3, 0.4)',
    border: 'border-amber-500/30',
    bg: 'bg-amber-950/40',
  },
  crimson: {
    primary: '#ef233c',
    secondary: '#d90429',
    glow: 'rgba(239, 35, 60, 0.4)',
    border: 'border-rose-500/30',
    bg: 'bg-rose-950/40',
  },
  violet: {
    primary: '#a855f7',
    secondary: '#7c3aed',
    glow: 'rgba(168, 85, 247, 0.4)',
    border: 'border-purple-500/30',
    bg: 'bg-purple-950/40',
  },
};

export const SystemDiagnosticsHUD: React.FC<SystemDiagnosticsHUDProps> = ({
  powerLevel = 100,
  theme = 'cyan',
  visible = true,
  onToggleVisibility,
}) => {
  // Streaming state
  const [isPaused, setIsPaused] = useState(false);
  const [samplingRate, setSamplingRate] = useState<number>(1000); // ms
  const [leftWingCollapsed, setLeftWingCollapsed] = useState(false);
  const [rightWingCollapsed, setRightWingCollapsed] = useState(false);

  // Live telemetry history (last 30 points)
  const [history, setHistory] = useState<TelemetryPoint[]>(() => {
    const initial: TelemetryPoint[] = [];
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      initial.push({
        time: new Date(now - i * 1000),
        cpu: Math.floor(Math.random() * 25) + 35,
        cpuTemp: Math.floor(Math.random() * 8) + 46,
        ramUsed: 16.8 + Math.random() * 2.2,
        ramTotal: 32,
        netRx: Math.floor(Math.random() * 3200) + 1200,
        netTx: Math.floor(Math.random() * 1400) + 400,
        busVoltage: 380 + Math.random() * 4,
      });
    }
    return initial;
  });

  // Current CPU core loads (8 cores)
  const [coreLoads, setCoreLoads] = useState<number[]>([
    42, 68, 35, 80, 52, 38, 74, 49,
  ]);

  // Synthetic spike multiplier
  const spikeMultiplierRef = useRef(1);

  // D3 Chart Refs
  const cpuChartRef = useRef<SVGSVGElement | null>(null);
  const ramChartRef = useRef<SVGSVGElement | null>(null);
  const netChartRef = useRef<SVGSVGElement | null>(null);

  const activeTheme = THEME_COLORS[theme] || THEME_COLORS.cyan;

  // Stream Telemetry Data
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const mult = spikeMultiplierRef.current;
      if (mult > 1) {
        spikeMultiplierRef.current = Math.max(1, mult - 0.25);
      }

      const powerBias = (powerLevel / 100) * 8;
      const newCpu = Math.min(
        99,
        Math.floor((Math.random() * 20 + 30 + powerBias) * mult)
      );
      const newTemp = Math.min(
        88,
        Math.floor((Math.random() * 4 + 48 + powerBias * 0.4) * (mult > 1 ? 1.2 : 1))
      );
      const newRam = Math.min(
        31.2,
        Math.max(12, 16.5 + (newCpu / 100) * 9 + (Math.random() * 0.8 - 0.4))
      );
      const newRx = Math.floor((Math.random() * 4000 + 1500) * mult);
      const newTx = Math.floor((Math.random() * 1800 + 600) * mult);
      const newVoltage = 380 + (powerLevel - 100) * 0.2 + (Math.random() * 3 - 1.5);

      const newPoint: TelemetryPoint = {
        time: new Date(),
        cpu: newCpu,
        cpuTemp: newTemp,
        ramUsed: Number(newRam.toFixed(2)),
        ramTotal: 32,
        netRx: newRx,
        netTx: newTx,
        busVoltage: Number(newVoltage.toFixed(1)),
      };

      setHistory((prev) => [...prev.slice(1), newPoint]);

      // Update core loads
      setCoreLoads((prev) =>
        prev.map(() =>
          Math.min(
            99,
            Math.max(
              15,
              Math.floor((newCpu + (Math.random() * 30 - 15)) * (mult > 1 ? 1.2 : 1))
            )
          )
        )
      );
    }, samplingRate);

    return () => clearInterval(interval);
  }, [isPaused, samplingRate, powerLevel]);

  // Render D3 CPU Area Chart
  useEffect(() => {
    if (!cpuChartRef.current || history.length === 0) return;

    const svg = d3.select(cpuChartRef.current);
    svg.selectAll('*').remove();

    const width = 230;
    const height = 80;
    const margin = { top: 8, right: 10, bottom: 18, left: 28 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(history, (d) => d.time) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

    // Gradient
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'cpu-area-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', activeTheme.primary)
      .attr('stop-opacity', 0.55);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', activeTheme.primary)
      .attr('stop-opacity', 0.03);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(3)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', 'rgba(255,255,255,0.06)')
      .attr('stroke-dasharray', '2,2');

    g.select('.grid .domain').remove();

    // Area generator
    const areaGen = d3
      .area<TelemetryPoint>()
      .x((d) => xScale(d.time))
      .y0(innerHeight)
      .y1((d) => yScale(d.cpu))
      .curve(d3.curveMonotoneX);

    // Line generator
    const lineGen = d3
      .line<TelemetryPoint>()
      .x((d) => xScale(d.time))
      .y((d) => yScale(d.cpu))
      .curve(d3.curveMonotoneX);

    // Render area
    g.append('path')
      .datum(history)
      .attr('fill', 'url(#cpu-area-grad)')
      .attr('d', areaGen);

    // Render line
    g.append('path')
      .datum(history)
      .attr('fill', 'none')
      .attr('stroke', activeTheme.primary)
      .attr('stroke-width', 1.8)
      .attr('d', lineGen)
      .style('filter', `drop-shadow(0px 0px 4px ${activeTheme.primary})`);

    // Latest pulse point
    const lastPoint = history[history.length - 1];
    if (lastPoint) {
      g.append('circle')
        .attr('cx', xScale(lastPoint.time))
        .attr('cy', yScale(lastPoint.cpu))
        .attr('r', 3)
        .attr('fill', '#ffffff')
        .attr('stroke', activeTheme.primary)
        .attr('stroke-width', 2);
    }

    // Axes
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(3)
      .tickFormat((d) => `${d}%`);

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('font-size', '8px')
      .attr('fill', 'rgba(255,255,255,0.5)')
      .attr('font-family', 'monospace');

    g.selectAll('.domain').attr('stroke', 'rgba(255,255,255,0.15)');
    g.selectAll('line').attr('stroke', 'rgba(255,255,255,0.15)');
  }, [history, activeTheme]);

  // Render D3 RAM Donut Arc Gauge
  useEffect(() => {
    if (!ramChartRef.current || history.length === 0) return;

    const currentPoint = history[history.length - 1];
    const used = currentPoint?.ramUsed || 16;
    const total = currentPoint?.ramTotal || 32;
    const percentage = Math.round((used / total) * 100);

    const svg = d3.select(ramChartRef.current);
    svg.selectAll('*').remove();

    const width = 110;
    const height = 110;
    const radius = Math.min(width, height) / 2;

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Background track arc
    const arcBg = d3
      .arc()
      .innerRadius(36)
      .outerRadius(46)
      .startAngle(0)
      .endAngle(Math.PI * 2);

    g.append('path')
      .attr('d', arcBg as any)
      .attr('fill', 'rgba(255, 255, 255, 0.08)');

    // Foreground active arc
    const arcFg = d3
      .arc()
      .innerRadius(36)
      .outerRadius(46)
      .startAngle(0)
      .endAngle((percentage / 100) * Math.PI * 2)
      .cornerRadius(4);

    const arcColor =
      percentage > 85 ? '#ef4444' : percentage > 70 ? '#f59e0b' : activeTheme.primary;

    g.append('path')
      .attr('d', arcFg as any)
      .attr('fill', arcColor)
      .style('filter', `drop-shadow(0 0 6px ${arcColor})`);

    // Center Text percentage
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.1em')
      .attr('fill', '#ffffff')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text(`${percentage}%`);

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.4em')
      .attr('fill', 'rgba(255,255,255,0.6)')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .text('RAM ALLOC');
  }, [history, activeTheme]);

  // Render D3 Network Multi-line Chart
  useEffect(() => {
    if (!netChartRef.current || history.length === 0) return;

    const svg = d3.select(netChartRef.current);
    svg.selectAll('*').remove();

    const width = 230;
    const height = 80;
    const margin = { top: 8, right: 10, bottom: 18, left: 32 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const maxThroughput = Math.max(
      d3.max(history, (d) => Math.max(d.netRx, d.netTx)) || 4000,
      1000
    );

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(history, (d) => d.time) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, maxThroughput])
      .range([innerHeight, 0]);

    // Grid lines
    g.append('g')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(3)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', 'rgba(255,255,255,0.06)')
      .attr('stroke-dasharray', '2,2');

    g.select('.domain').remove();

    // RX Line (Inbound) - Cyan / Theme
    const rxLineGen = d3
      .line<TelemetryPoint>()
      .x((d) => xScale(d.time))
      .y((d) => yScale(d.netRx))
      .curve(d3.curveMonotoneX);

    // TX Line (Outbound) - Emerald / Amber
    const txLineGen = d3
      .line<TelemetryPoint>()
      .x((d) => xScale(d.time))
      .y((d) => yScale(d.netTx))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(history)
      .attr('fill', 'none')
      .attr('stroke', activeTheme.primary)
      .attr('stroke-width', 1.8)
      .attr('d', rxLineGen)
      .style('filter', `drop-shadow(0 0 4px ${activeTheme.primary})`);

    g.append('path')
      .datum(history)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,2')
      .attr('d', txLineGen)
      .style('filter', 'drop-shadow(0 0 3px #10b981)');

    // Y Axis format
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(3)
      .tickFormat((d) => {
        const val = Number(d);
        return val >= 1024 ? `${(val / 1024).toFixed(0)}M` : `${val.toFixed(0)}K`;
      });

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('font-size', '8px')
      .attr('fill', 'rgba(255,255,255,0.5)')
      .attr('font-family', 'monospace');

    g.selectAll('.domain').attr('stroke', 'rgba(255,255,255,0.15)');
    g.selectAll('line').attr('stroke', 'rgba(255,255,255,0.15)');
  }, [history, activeTheme]);

  // Synthetic Load Spike Trigger
  const triggerSyntheticSpike = () => {
    sound.playArcCharge();
    spikeMultiplierRef.current = 1.95;
  };

  const current = history[history.length - 1] || {
    cpu: 45,
    cpuTemp: 52,
    ramUsed: 17.5,
    ramTotal: 32,
    netRx: 2450,
    netTx: 920,
    busVoltage: 381.2,
  };

  if (!visible) {
    return (
      <div className="absolute top-4 right-4 z-20 pointer-events-auto">
        <button
          onClick={onToggleVisibility}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 text-cyan-300 border border-cyan-500/40 rounded text-xs font-mono font-bold hover:bg-slate-800 transition-colors shadow-[0_0_12px_rgba(0,240,255,0.3)] cursor-pointer"
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>EXPAND SYSTEM DIAGNOSTICS</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex justify-between p-4 z-20 overflow-hidden font-mono select-none">
      {/* ============================================================== */}
      {/* LEFT WING: CPU ACTIVITY & MEMORY ARCHITECTURE                  */}
      {/* ============================================================== */}
      <div
        className={`pointer-events-auto flex flex-col transition-all duration-300 max-h-full ${
          leftWingCollapsed ? 'w-10' : 'w-72 md:w-80'
        }`}
      >
        <div className="bg-[#080e1b]/90 border border-cyan-500/35 backdrop-blur-md rounded-lg p-3.5 shadow-[0_0_25px_rgba(0,240,255,0.15)] flex flex-col gap-3 relative overflow-hidden">
          {/* Holographic Header Bar */}
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              {!leftWingCollapsed && (
                <div>
                  <span className="text-xs font-bold text-cyan-300 tracking-wider">
                    CORE TELEMETRY
                  </span>
                  <span className="text-[9px] text-slate-400 block -mt-0.5">
                    JARVIS KERNEL MK VII
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                sound.playChirp(1200);
                setLeftWingCollapsed(!leftWingCollapsed);
              }}
              className="p-1 text-cyan-400 hover:text-cyan-200 bg-slate-950/80 rounded border border-cyan-500/30 cursor-pointer"
              title={leftWingCollapsed ? 'Expand Panel' : 'Collapse Panel'}
            >
              {leftWingCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {!leftWingCollapsed && (
            <>
              {/* D3 CPU Area Chart */}
              <div className="bg-black/50 border border-cyan-500/20 rounded p-2 relative">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span className="flex items-center gap-1 font-bold text-cyan-200">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    CPU UTILIZATION (60s)
                  </span>
                  <span className="text-cyan-300 font-bold">{current.cpu}% LOAD</span>
                </div>
                <svg ref={cpuChartRef} className="w-full h-20" />
                <div className="flex justify-between items-center text-[9px] text-slate-400 mt-1 pt-1 border-t border-cyan-500/15">
                  <span>FREQ: 4.82 GHz</span>
                  <span className="text-emerald-400">THREADS: 16 ONLINE</span>
                  <span
                    className={`font-bold ${
                      current.cpuTemp > 75
                        ? 'text-rose-400'
                        : current.cpuTemp > 65
                        ? 'text-amber-400'
                        : 'text-cyan-300'
                    }`}
                  >
                    TEMP: {current.cpuTemp}°C
                  </span>
                </div>
              </div>

              {/* Multi-core Load Matrix */}
              <div className="bg-black/40 border border-cyan-500/15 rounded p-2">
                <div className="text-[9px] text-slate-400 mb-1 font-bold uppercase tracking-wider flex justify-between">
                  <span>8-CORE DISTRIBUTION</span>
                  <span className="text-cyan-400 font-semibold">ALL ACTIVE</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {coreLoads.map((load, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/80 p-1 rounded border border-cyan-500/10 text-center"
                    >
                      <div className="text-[8px] text-slate-500">C{idx}</div>
                      <div
                        className={`text-[9px] font-bold ${
                          load > 80
                            ? 'text-rose-400'
                            : load > 60
                            ? 'text-amber-400'
                            : 'text-cyan-300'
                        }`}
                      >
                        {load}%
                      </div>
                      <div className="w-full bg-slate-900 h-1 rounded-full mt-0.5 overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 transition-all duration-300"
                          style={{ width: `${load}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RAM Allocation Donut Gauge & Metrics */}
              <div className="bg-black/50 border border-cyan-500/20 rounded p-2 flex items-center justify-between gap-3">
                <div className="shrink-0">
                  <svg ref={ramChartRef} className="w-24 h-24" />
                </div>
                <div className="flex-1 space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">COMMITTED:</span>
                    <span className="text-cyan-300 font-bold">{current.ramUsed} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">PHYSICAL TOTAL:</span>
                    <span className="text-slate-200">{current.ramTotal} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">PAGE CACHE:</span>
                    <span className="text-emerald-400">4.8 GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">SWAP BUFFER:</span>
                    <span className="text-slate-400">0.0 GB (RAM-ONLY)</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT WING: NETWORK THROUGHPUT & THERMAL BUS                   */}
      {/* ============================================================== */}
      <div
        className={`pointer-events-auto flex flex-col transition-all duration-300 max-h-full ${
          rightWingCollapsed ? 'w-10' : 'w-72 md:w-80'
        }`}
      >
        <div className="bg-[#080e1b]/90 border border-cyan-500/35 backdrop-blur-md rounded-lg p-3.5 shadow-[0_0_25px_rgba(0,240,255,0.15)] flex flex-col gap-3 relative overflow-hidden">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
            <button
              onClick={() => {
                sound.playChirp(1200);
                setRightWingCollapsed(!rightWingCollapsed);
              }}
              className="p-1 text-cyan-400 hover:text-cyan-200 bg-slate-950/80 rounded border border-cyan-500/30 cursor-pointer"
              title={rightWingCollapsed ? 'Expand Panel' : 'Collapse Panel'}
            >
              {rightWingCollapsed ? (
                <ChevronLeft className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            <div className="flex items-center gap-2">
              {!rightWingCollapsed && (
                <div className="text-right">
                  <span className="text-xs font-bold text-cyan-300 tracking-wider">
                    BANDWIDTH & BUS
                  </span>
                  <span className="text-[9px] text-slate-400 block -mt-0.5">
                    FIBER UPLINK // SECURE
                  </span>
                </div>
              )}
              <Wifi className="w-4 h-4 text-cyan-400" />
            </div>
          </div>

          {!rightWingCollapsed && (
            <>
              {/* D3 Network Dual Stream Line Chart */}
              <div className="bg-black/50 border border-cyan-500/20 rounded p-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span className="font-bold text-cyan-200">THROUGHPUT DYNAMICS</span>
                  <div className="flex items-center gap-2 text-[9px]">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" /> RX
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> TX
                    </span>
                  </div>
                </div>
                <svg ref={netChartRef} className="w-full h-20" />
                <div className="flex justify-between items-center text-[9px] mt-1 pt-1 border-t border-cyan-500/15">
                  <div className="flex items-center gap-1 text-cyan-300 font-bold">
                    <span>RX:</span>
                    <span>{(current.netRx / 1024).toFixed(2)} MB/s</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 font-bold">
                    <span>TX:</span>
                    <span>{(current.netTx / 1024).toFixed(2)} MB/s</span>
                  </div>
                  <div className="text-slate-400">LATENCY: 2.1 ms</div>
                </div>
              </div>

              {/* Arc Reactor Power Bus & Voltage Telemetry */}
              <div className="bg-black/40 border border-cyan-500/15 rounded p-2.5 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-cyan-400">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    ARC BUS DYNAMICS
                  </span>
                  <span className="text-emerald-400">SYNCHRONIZED</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 bg-slate-950/80 rounded border border-cyan-500/10">
                    <div className="text-slate-400 text-[9px]">BUS VOLTAGE</div>
                    <div className="text-cyan-300 font-bold text-xs">{current.busVoltage} V</div>
                    <div className="text-[8px] text-slate-500">NOMINAL 380V</div>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded border border-cyan-500/10">
                    <div className="text-slate-400 text-[9px]">ENERGY DRAW</div>
                    <div className="text-cyan-300 font-bold text-xs">
                      {Math.round(current.busVoltage * 1.12)} W
                    </div>
                    <div className="text-[8px] text-emerald-400">EFFICIENCY 99.4%</div>
                  </div>
                </div>
              </div>

              {/* Diagnostics Sampling & Control Bar */}
              <div className="p-2 bg-slate-950/90 border border-cyan-500/20 rounded flex items-center justify-between text-[10px] gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setIsPaused(!isPaused);
                      sound.playChirp(1100);
                    }}
                    className={`p-1 rounded border text-[9px] flex items-center gap-1 cursor-pointer ${
                      isPaused
                        ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                        : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60'
                    }`}
                    title={isPaused ? 'Resume Streaming' : 'Pause Streaming'}
                  >
                    {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
                  </button>

                  {/* Sampling Speed */}
                  <select
                    value={samplingRate}
                    onChange={(e) => setSamplingRate(Number(e.target.value))}
                    className="bg-black/70 border border-cyan-500/30 rounded px-1.5 py-0.5 text-[9px] text-cyan-200 cursor-pointer"
                  >
                    <option value={500}>500ms</option>
                    <option value={1000}>1.0s</option>
                    <option value={2000}>2.0s</option>
                  </select>
                </div>

                {/* Induce Synthetic Spike */}
                <button
                  onClick={triggerSyntheticSpike}
                  className="px-2 py-1 bg-cyan-500 text-slate-950 font-bold text-[9px] rounded hover:bg-cyan-400 transition-colors shadow-[0_0_8px_rgba(0,240,255,0.4)] cursor-pointer flex items-center gap-1"
                  title="Simulate compute spike to observe D3 dynamic scaling"
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>SPIKE</span>
                </button>
              </div>

              {/* Close HUD */}
              {onToggleVisibility && (
                <button
                  onClick={onToggleVisibility}
                  className="w-full py-1 text-center text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer border-t border-cyan-500/10 pt-1"
                >
                  HIDE DIAGNOSTICS OVERLAY
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
