# Implementation Plan: System Diagnostics & Voice Command Reference

## 1. Overview
This update introduces two advanced tactical subsystems into Icarus D. Noble ("Noble"):
1. **D3-Powered System Diagnostics Component (`SystemDiagnosticsHUD.tsx`)**: Mounted within the 3D Arc Reactor screen as dual holographic side panels flanking the rotating Mark VII core. Provides real-time interactive telemetry charts for CPU load (multi-core temporal line/area chart), RAM allocation (reactive arc gauge and buffer breakdown), and Network throughput (bi-directional TX/RX real-time streaming sparklines).
2. **Interactive Command Reference Matrix Overlay (`CommandReferenceOverlay.tsx`)**: An interactive HUD matrix integrated directly into `ConsoleChat.tsx`. Features categorized voice-triggerable commands (Core System, Workspace & Comms, EDITH Vision, Security Vault, IoT Mesh, and Media Generation) with one-click voice command dispatching, search filtering, and phonetic syntax guides.

---

## 2. Architecture & Components

### A. Dependencies
* Install `d3` and dev dependency `@types/d3` for rendering high-precision SVG/canvas visualization paths, scales, and generators.

### B. Subsystem 1: Real-Time Hardware Performance Diagnostics (`src/components/SystemDiagnosticsHUD.tsx`)
* **Layout:** Dual holographic side panels framing the 3D Arc Reactor core (Left wing: CPU Core Load & RAM Allocation; Right wing: Network Throughput TX/RX & Thermal Bus Telemetry).
* **D3 Visualizations:**
  * **CPU Activity Monitor:** Real-time multi-point SVG area chart using `d3.line()` and `d3.area()` with cyan glow filter, tracking rolling CPU utilization over the last 60 seconds with live frequency tracking.
  * **RAM Memory Allocation:** Interactive D3 circular arc gauge (`d3.arc()`) displaying committed vs available memory, cache buffers, and heap consumption with amber/emerald warning thresholds.
  * **Network Throughput Matrix:** Dual-stream D3 bandwidth graph displaying real-time incoming (RX) and outgoing (TX) data throughput in KB/s and MB/s with packet rate telemetry.
  * **System Telemetry HUD controls:** Sampling rate adjusters (500ms, 1s, 2s), pause/resume streaming, and synthetic stress test spikes.

### C. Subsystem 2: Voice Command Reference Matrix (`src/components/CommandReferenceOverlay.tsx`)
* **Layout:** High-tech modal/dockable holographic matrix overlay within `ConsoleChat.tsx`.
* **Features:**
  * **Categories:**
    1. *Arc Reactor & System Core* (e.g. "Noble, set reactor power to 200%", "Toggle exploded view", "Switch to stealth theme")
    2. *Google Workspace & Communications* (e.g. "Check my unread emails", "Open Google Picker", "Schedule a meeting with Stark", "Create briefing document")
    3. *EDITH Screen Vision* (e.g. "Analyze current screen", "Detect UI buttons", "Recommend proactive action")
    4. *Security Enclave & Cryptography* (e.g. "I am Iron Man", "Decrypt secret key", "Emergency memory purge")
    5. *Smart Home & IoT Mesh* (e.g. "Activate lab cooling", "Dim workshop lighting", "Run predictive telemetry")
    6. *Generative Media Lab* (e.g. "Compose orchestral suite", "Generate Iron Man Mark VII schematic video")
  * **One-Click Voice Dispatch:** Clicking any command automatically populates the input, activates Noble's speech/voice trigger flow, and simulates natural vocal execution.
  * **Search & Filter:** Real-time search by keyword or category pill.
  * **Voice Syntax Guide:** Displays phonetics, aliases, and parameter variables for each command.

---

## 3. Step-by-Step Implementation Flow

1. **Install Dependencies:**
   * Run `install_applet_package` for `d3` and `@types/d3`.

2. **Develop `src/components/SystemDiagnosticsHUD.tsx`:**
   * Build modular D3 line, area, and arc chart generators.
   * Maintain sliding time-series telemetry state (CPU, RAM, Network TX/RX, Thermals).
   * Style with Stark Industries cyberpunk aesthetic (semi-transparent slate/black, neon cyan, radar gridlines).

3. **Integrate Diagnostics into `src/components/ArcReactorCanvas.tsx`:**
   * Position the dual side panels around the 3D canvas viewport without obstructing Arc Reactor rotation or exploded view manipulations.
   * Provide an explicit HUD visibility toggle so the user can show/hide the telemetry panels at will.

4. **Develop `src/components/CommandReferenceOverlay.tsx`:**
   * Build the categorized command catalog with descriptions, spoken phrases, and parameter definitions.
   * Provide search filtering and category chips.
   * Add an "Execute Command" button next to each item that triggers the callback in `ConsoleChat.tsx`.

5. **Integrate Command Reference into `src/components/ConsoleChat.tsx`:**
   * Add a prominent "COMMAND MATRIX" button in the chat header.
   * Wire the execution handler so selecting a command either dispatches it immediately or populates the chat prompt.

6. **Validation & Testing:**
   * Run `compile_applet` to confirm zero TypeScript compilation errors.
   * Run `lint_applet` to verify clean build state.
   * Verify audio feedback and visual harmony.
