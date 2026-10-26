import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SystemDiagnosticsHUD } from './SystemDiagnosticsHUD';
import { Activity } from 'lucide-react';
import { sound } from '../services/audio';

interface ArcReactorCanvasProps {
  powerLevel?: number; // 0 to 300%
  colorTheme?: 'cyan' | 'gold' | 'crimson' | 'violet';
  isRotating?: boolean;
}

export const ArcReactorCanvas: React.FC<ArcReactorCanvasProps> = ({
  powerLevel = 100,
  colorTheme = 'cyan',
  isRotating = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [internalPower, setInternalPower] = useState(powerLevel);
  const [theme, setTheme] = useState(colorTheme);
  const [showDiagnostics, setShowDiagnostics] = useState(true);

  // Mutable animation state references
  const stateRef = useRef({
    power: powerLevel,
    theme: colorTheme,
    isRotating,
    explodedFactor: 0,
    targetExplodedFactor: 0,
    rotationSpeed: 0.008,
  });

  useEffect(() => {
    stateRef.current.power = internalPower;
  }, [internalPower]);

  useEffect(() => {
    stateRef.current.theme = theme;
  }, [theme]);

  useEffect(() => {
    stateRef.current.isRotating = isRotating;
  }, [isRotating]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL from renderer string (Three.js skill directive)
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const bgColor = new THREE.Color(0x06090e);
    scene.background = bgColor;
    scene.fog = new THREE.FogExp2(0x06090e, 0.06);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.2, 5.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Studio PBR Environment Map via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig (Warm Key Light + Cool Hemisphere Fill)
    const keyLight = new THREE.DirectionalLight(0xffeedd, 2.4);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x00d4ff, 0x050510, 1.2);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.8);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    // 5. Build Composite 3-12 Part Procedural Arc Reactor Model (THREE.Group)
    const reactorGroup = new THREE.Group();
    reactorGroup.position.set(0, 0, 0);
    scene.add(reactorGroup);

    // Theme Color Palettes
    const getPalette = (paletteTheme: string) => {
      switch (paletteTheme) {
        case 'gold':
          return {
            primary: 0xffb703,
            secondary: 0xfb8500,
            glow: 0xffe899,
          };
        case 'crimson':
          return {
            primary: 0xef233c,
            secondary: 0xd90429,
            glow: 0xff758f,
          };
        case 'violet':
          return {
            primary: 0x9d4edd,
            secondary: 0x7b2cbf,
            glow: 0xe0aaff,
          };
        case 'cyan':
        default:
          return {
            primary: 0x00f0ff,
            secondary: 0x0080ff,
            glow: 0x80ffff,
          };
      }
    };

    const currentPalette = getPalette(stateRef.current.theme);

    // Part 1: Outer Heavy Titanium Armor Ring (Primary Silhouette)
    const outerChassisGeo = new THREE.TorusGeometry(1.6, 0.18, 24, 64);
    const outerChassisMat = new THREE.MeshStandardMaterial({
      color: 0x1c2430,
      metalness: 0.92,
      roughness: 0.28,
    });
    const outerChassis = new THREE.Mesh(outerChassisGeo, outerChassisMat);
    outerChassis.castShadow = !isSoftwareGl;
    reactorGroup.add(outerChassis);

    // Part 2: Inner Palladium Conductor Collar
    const innerCollarGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.22, 48, 1, true);
    const innerCollarMat = new THREE.MeshStandardMaterial({
      color: 0xd6e2ea,
      metalness: 0.96,
      roughness: 0.12,
    });
    const innerCollar = new THREE.Mesh(innerCollarGeo, innerCollarMat);
    innerCollar.rotation.x = Math.PI / 2;
    reactorGroup.add(innerCollar);

    // Part 3: 10 Magnetic Copper Inductor Coils (Radial Array)
    const coilsGroup = new THREE.Group();
    const coilGeo = new THREE.BoxGeometry(0.18, 0.26, 0.32);
    const coilMat = new THREE.MeshStandardMaterial({
      color: 0xcc6633, // Copper finish
      metalness: 0.88,
      roughness: 0.35,
    });
    const coilCount = 10;
    const coilRadius = 1.42;

    for (let i = 0; i < coilCount; i++) {
      const angle = (i / coilCount) * Math.PI * 2;
      const coil = new THREE.Mesh(coilGeo, coilMat);
      coil.position.set(Math.cos(angle) * coilRadius, Math.sin(angle) * coilRadius, 0);
      coil.rotation.z = angle;
      coil.castShadow = !isSoftwareGl;
      coilsGroup.add(coil);
    }
    reactorGroup.add(coilsGroup);

    // Part 4: Central Luminescent Plasma Core (Quartz Lens)
    const coreDomeGeo = new THREE.SphereGeometry(0.68, 32, 24);
    const coreEmissiveMat = new THREE.MeshStandardMaterial({
      color: currentPalette.primary,
      emissive: currentPalette.primary,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88,
    });
    const coreDome = new THREE.Mesh(coreDomeGeo, coreEmissiveMat);
    reactorGroup.add(coreDome);

    // Part 5: Gimbal Ring Alpha (Outer Holographic Gyro)
    const gimbalAlphaGeo = new THREE.TorusGeometry(1.95, 0.025, 16, 64);
    const gimbalAlphaMat = new THREE.MeshBasicMaterial({
      color: currentPalette.primary,
      wireframe: false,
    });
    const gimbalAlpha = new THREE.Mesh(gimbalAlphaGeo, gimbalAlphaMat);
    scene.add(gimbalAlpha);

    // Part 6: Gimbal Ring Beta (Inner Gimbal Axis)
    const gimbalBetaGeo = new THREE.TorusGeometry(1.05, 0.02, 16, 48);
    const gimbalBetaMat = new THREE.MeshBasicMaterial({
      color: currentPalette.glow,
    });
    const gimbalBeta = new THREE.Mesh(gimbalBetaGeo, gimbalBetaMat);
    scene.add(gimbalBeta);

    // Part 7: Telemetry Reticle Arc Spokes
    const spokeGroup = new THREE.Group();
    const spokeCount = 3;
    for (let i = 0; i < spokeCount; i++) {
      const spokeGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 8);
      const spokeMat = new THREE.MeshBasicMaterial({ color: currentPalette.secondary });
      const spoke = new THREE.Mesh(spokeGeo, spokeMat);
      spoke.rotation.z = (i * Math.PI) / 3;
      spokeGroup.add(spoke);
    }
    reactorGroup.add(spokeGroup);

    // Part 8: Radial Particle Stream (Instanced Energy Field)
    const particleCount = 120;
    const particleGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: currentPalette.glow });
    const particleInstanced = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
    particleInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    const particleData: { angle: number; radius: number; speed: number; z: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.8 + Math.random() * 1.4;
      const speed = 0.01 + Math.random() * 0.02;
      const z = (Math.random() - 0.5) * 0.6;
      particleData.push({ angle, radius, speed, z });

      dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
      dummy.updateMatrix();
      particleInstanced.setMatrixAt(i, dummy.matrix);
    }
    particleInstanced.instanceMatrix.needsUpdate = true;
    reactorGroup.add(particleInstanced);

    // Part 9: Contact Shadow Grounding Plane (Zero-404 Grounding per Skill)
    const contactCanvas = document.createElement('canvas');
    contactCanvas.width = 128;
    contactCanvas.height = 128;
    const ctx = contactCanvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
    gradient.addColorStop(0.5, 'rgba(0, 100, 200, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const contactTexture = new THREE.CanvasTexture(contactCanvas);
    contactTexture.colorSpace = THREE.SRGBColorSpace;

    const shadowPlaneGeo = new THREE.PlaneGeometry(5.5, 5.5);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: contactTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.position.y = -2.1;
    shadowPlane.rotation.x = -Math.PI / 2;
    scene.add(shadowPlane);

    // 6. Animation and Render Loop with exponential damping & Software WebGL guard
    let frameId = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const glContext = renderer.getContext() as WebGL2RenderingContext;
      const sync = glContext.fenceSync(glContext.SYNC_GPU_COMMANDS_COMPLETE, 0);
      glContext.flush();
      const poll = () => {
        const state = sync && glContext.getSyncParameter(sync, glContext.SYNC_STATUS);
        if (state === glContext.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) glContext.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function renderLoop() {
      const dt = clock.getDelta();
      const p = getPalette(stateRef.current.theme);

      // Update palette colors
      coreEmissiveMat.color.setHex(p.primary);
      coreEmissiveMat.emissive.setHex(p.primary);
      coreEmissiveMat.emissiveIntensity = 1.2 + (stateRef.current.power / 100) * 1.5;
      gimbalAlphaMat.color.setHex(p.primary);
      gimbalBetaMat.color.setHex(p.glow);
      hemiLight.color.setHex(p.primary);

      // Damped exploded view separation
      stateRef.current.explodedFactor = THREE.MathUtils.damp(
        stateRef.current.explodedFactor,
        stateRef.current.targetExplodedFactor,
        4.0,
        dt
      );
      outerChassis.position.z = -stateRef.current.explodedFactor * 0.7;
      coilsGroup.position.z = stateRef.current.explodedFactor * 0.5;
      coreDome.position.z = stateRef.current.explodedFactor * 1.2;

      // Rotation
      if (stateRef.current.isRotating) {
        reactorGroup.rotation.z += stateRef.current.rotationSpeed * (stateRef.current.power / 100);
        gimbalAlpha.rotation.x += 0.012;
        gimbalAlpha.rotation.y += 0.008;
        gimbalBeta.rotation.y -= 0.018;
        gimbalBeta.rotation.z += 0.01;
      }

      // Update particles
      for (let i = 0; i < particleCount; i++) {
        const item = particleData[i];
        item.angle += item.speed * (stateRef.current.power / 100);
        dummy.position.set(
          Math.cos(item.angle) * item.radius,
          Math.sin(item.angle) * item.radius,
          item.z + Math.sin(clock.elapsedTime * 2 + i) * 0.05
        );
        dummy.updateMatrix();
        particleInstanced.setMatrixAt(i, dummy.matrix);
      }
      particleInstanced.instanceMatrix.needsUpdate = true;

      // Subtle breath floating movement on the Arc Core
      reactorGroup.position.y = Math.sin(clock.elapsedTime * 1.5) * 0.06;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(renderLoop);
      } else {
        frameId = requestAnimationFrame(renderLoop);
      }
    }

    renderLoop();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.dispose();
      outerChassisGeo.dispose();
      outerChassisMat.dispose();
      innerCollarGeo.dispose();
      innerCollarMat.dispose();
      coilGeo.dispose();
      coilMat.dispose();
      coreDomeGeo.dispose();
      coreEmissiveMat.dispose();
      gimbalAlphaGeo.dispose();
      gimbalAlphaMat.dispose();
      gimbalBetaGeo.dispose();
      gimbalBetaMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      shadowPlaneGeo.dispose();
      shadowPlaneMat.dispose();
      contactTexture.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[460px] bg-[#06090e] overflow-hidden select-none">
      {/* Three.js Canvas Container (Isolated mount ref) */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Top Telemetry Header & Diagnostics Toggle */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-30 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
          <div>
            <div className="text-[11px] font-mono tracking-widest text-cyan-400 font-semibold uppercase">
              ARC REACTOR CORE MARK VII
            </div>
            <div className="text-[9px] font-mono text-cyan-200/60 tracking-wider">
              OUTPUT: {internalPower}% | FLUX: NOMINAL | FREQ: 4.82 THz
            </div>
          </div>
        </div>

        {/* Top-Right Toggle Diagnostics Button */}
        <div className="pointer-events-auto">
          <button
            onClick={() => {
              sound.playChirp(1200);
              setShowDiagnostics(!showDiagnostics);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-[11px] font-mono border transition-all cursor-pointer ${
              showDiagnostics
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                : 'bg-slate-900/90 border-cyan-500/30 text-cyan-400/80 hover:bg-slate-800 hover:text-cyan-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showDiagnostics ? 'DIAGNOSTICS: ON' : 'DIAGNOSTICS: OFF'}</span>
          </button>
        </div>
      </div>

      {/* D3 Real-Time Hardware Performance Diagnostics (Dual Holographic Wings) */}
      <SystemDiagnosticsHUD
        powerLevel={internalPower}
        theme={theme}
        visible={showDiagnostics}
        onToggleVisibility={() => setShowDiagnostics(!showDiagnostics)}
      />

      {/* Unified Collapsible Bottom Dock (Consolidated controls, <=15% footprint, zero left/right occlusion per Skill) */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center transition-all duration-300"
        style={{
          width: 'min(900px, 94vw)',
          transform: isCollapsed ? 'translate(-50%, calc(100% - 28px))' : 'translate(-50%, 0)',
        }}
      >
        {/* Cinema / Zen Mode Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="px-4 py-1 mb-1 text-[10px] font-mono tracking-widest uppercase bg-[#0c131f]/90 text-cyan-300 border border-cyan-500/30 rounded-t hover:bg-cyan-950/80 transition-colors cursor-pointer"
        >
          {isCollapsed ? '▲ Expand HUD Controls' : '▼ Collapse To Cinema Mode'}
        </button>

        {/* Dock Controls Container (Solid/RGBA surfaces, no heavy blur over WebGL) */}
        <div className="w-full bg-[#0a101b]/95 border border-cyan-500/30 rounded-b p-3.5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          {/* Power Preset Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-cyan-300/70 tracking-wider uppercase">CORE POWER:</span>
            <div className="flex gap-1.5">
              {[
                { label: 'STANDBY', val: 25 },
                { label: 'ACTIVE 100%', val: 100 },
                { label: 'OVERDRIVE 300%', val: 300 },
              ].map((lvl) => (
                <button
                  key={lvl.label}
                  onClick={() => setInternalPower(lvl.val)}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded tracking-wider transition-colors cursor-pointer ${
                    internalPower === lvl.val
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                      : 'bg-slate-800/80 text-cyan-300 border border-cyan-500/20 hover:bg-slate-700/80'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Exploded View Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-cyan-300/70 tracking-wider uppercase">VIEW SCHEMATIC:</span>
            <button
              onClick={() => {
                stateRef.current.targetExplodedFactor = stateRef.current.targetExplodedFactor === 0 ? 1 : 0;
              }}
              className="px-2.5 py-1 text-[10px] font-mono bg-slate-800/80 text-cyan-200 border border-cyan-500/30 rounded hover:bg-cyan-900/40 transition-colors cursor-pointer"
            >
              TOGGLE EXPLODED VIEW
            </button>
          </div>

          {/* Color Matrix Theme */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-cyan-300/70 tracking-wider uppercase">FREQUENCY:</span>
            <div className="flex gap-1.5">
              {[
                { id: 'cyan', label: 'MARK VII', color: '#00f0ff' },
                { id: 'gold', label: 'STARK GOLD', color: '#ffb703' },
                { id: 'crimson', label: 'STEALTH', color: '#ef233c' },
                { id: 'violet', label: 'NANOTECH', color: '#9d4edd' },
              ].map((swatch) => (
                <button
                  key={swatch.id}
                  onClick={() => setTheme(swatch.id as any)}
                  className={`px-2 py-0.5 text-[9px] font-mono rounded flex items-center gap-1.5 border transition-all cursor-pointer ${
                    theme === swatch.id
                      ? 'border-white bg-slate-800 text-white font-bold'
                      : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: swatch.color }} />
                  {swatch.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
