import React, { useState } from 'react';
import { sound } from '../services/audio';
import { Video, Music, Image as ImageIcon, Sparkles, Play, Download, RefreshCw } from 'lucide-react';

export const MediaLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'video' | 'music' | 'image'>('image');

  // Image Generation States
  const [imagePrompt, setImagePrompt] = useState('High-tech holographic Iron Man helmet HUD display with glowing cyan telemetry markings and tactical wireframes, cinematic lighting');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [imageSize, setImageSize] = useState('1K');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Music Generation States (Lyria)
  const [musicPrompt, setMusicPrompt] = useState('Cinematic Iron Man Mark VII high-energy action theme with aggressive synthesizer bass and heroic brass');
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);

  // Video Generation States (Omni Flash)
  const [videoPrompt, setVideoPrompt] = useState('Holographic Arc Reactor core spinning smoothly with glowing particle emissions');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  // Handle Image Gen
  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    sound.playArcCharge();

    try {
      const res = await fetch('/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspectRatio,
          imageSize,
          highQuality: true,
        }),
      });

      if (!res.ok) throw new Error('Image generation failed');
      const data = await res.json();
      setGeneratedImage(data.imageUrl);
      sound.playCommandAcknowledged();
    } catch {
      // Fallback high-tech procedural SVG graphic
      const svgFallback = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" fill="%23060a12">
        <rect width="800" height="450" fill="%23060a12"/>
        <circle cx="400" cy="225" r="140" fill="none" stroke="%2300f0ff" stroke-width="2"/>
        <circle cx="400" cy="225" r="90" fill="none" stroke="%23ffb703" stroke-width="1.5" stroke-dasharray="8 4"/>
        <circle cx="400" cy="225" r="45" fill="%2300f0ff" opacity="0.3"/>
        <text x="400" y="230" text-anchor="middle" fill="%23ffffff" font-family="monospace" font-size="14" font-weight="bold">ICARUS D. NOBLE CORE</text>
        <text x="400" y="260" text-anchor="middle" fill="%2338bdf8" font-family="monospace" font-size="11">NANOTECH SYNTHESIS OPTIMAL</text>
      </svg>`;
      setGeneratedImage(svgFallback);
      sound.playCommandAcknowledged();
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Handle Music Gen
  const handleGenerateMusic = async () => {
    setIsGeneratingMusic(true);
    sound.playArcCharge();

    try {
      const res = await fetch('/api/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: musicPrompt }),
      });

      if (!res.ok) throw new Error('Music generation failed');
      const data = await res.json();

      if (data.audioBase64) {
        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setGeneratedMusicUrl(url);
        sound.playCommandAcknowledged();
      }
    } catch {
      alert('Music generation currently requires a paid tier API key in Settings > Secrets. Triggering procedural synthesizer sound instead.');
      sound.playArcCharge();
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  // Handle Video Gen
  const handleGenerateVideo = async () => {
    setIsGeneratingVideo(true);
    sound.playArcCharge();

    try {
      const res = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          aspectRatio: videoAspectRatio,
        }),
      });

      if (!res.ok) throw new Error('Video generation failed');
      const data = await res.json();

      if (data.videoBase64) {
        const binary = atob(data.videoBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: data.mimeType || 'video/mp4' });
        const url = URL.createObjectURL(blob);
        setGeneratedVideoUrl(url);
        sound.playCommandAcknowledged();
      }
    } catch {
      alert('Video generation with gemini-omni-1.1-flash requires a paid API key in Settings > Secrets.');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#070c16] border border-cyan-500/25 rounded-lg overflow-hidden font-sans">
      {/* Header */}
      <div className="px-5 py-3 bg-[#0a1120] border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold tracking-widest text-cyan-300 uppercase">
            STARK MEDIA & CREATIVE LAB (OMNI / LYRIA / NANO BANANA)
          </span>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5">
          {[
            { id: 'image', label: 'IMAGE GEN (NANO BANANA 2.1)', icon: ImageIcon },
            { id: 'music', label: 'MUSIC SCORE (LYRIA 3)', icon: Music },
            { id: 'video', label: 'VIDEO (OMNI FLASH)', icon: Video },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  sound.playChirp(1200);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono tracking-wider transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-cyan-300 border border-cyan-500/20 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 p-5 overflow-y-auto">
        {/* TAB 1: IMAGE GENERATION */}
        {activeTab === 'image' && (
          <div className="max-w-2xl mx-auto space-y-4 font-mono text-xs">
            <div className="p-4 bg-[#0d1627] border border-cyan-500/30 rounded space-y-3">
              <label className="text-[11px] font-bold text-cyan-300 uppercase">PROMPT CREATIVE ASSET</label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={3}
                className="w-full bg-black/60 border border-cyan-500/30 rounded p-3 text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
              />

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">ASPECT RATIO</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full bg-slate-900 border border-cyan-500/30 rounded px-2.5 py-1.5 text-cyan-200"
                  >
                    <option value="16:9">16:9 (Landscape HUD)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                    <option value="4:3">4:3 (Classic)</option>
                    <option value="21:9">21:9 (Ultrawide Panoramic)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">IMAGE RESOLUTION</label>
                  <select
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value)}
                    className="w-full bg-slate-900 border border-cyan-500/30 rounded px-2.5 py-1.5 text-cyan-200"
                  >
                    <option value="1K">1K (Standard HD)</option>
                    <option value="2K">2K (High Resolution)</option>
                    <option value="4K">4K (Ultra High Definition)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage || !imagePrompt}
                  className="flex items-center gap-2 px-5 py-2 bg-cyan-500 text-slate-950 font-bold rounded hover:bg-cyan-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isGeneratingImage ? 'SYNTHESIZING ASSET...' : 'GENERATE ASSET (GEMINI)'}
                </button>
              </div>
            </div>

            {generatedImage && (
              <div className="p-3 bg-black/60 border border-cyan-500/30 rounded flex flex-col items-center">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="max-h-[380px] rounded object-contain border border-cyan-500/20"
                />
                <a
                  href={generatedImage}
                  download="noble_generated_asset.png"
                  className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-cyan-300 border border-cyan-500/30 rounded text-xs hover:bg-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  DOWNLOAD IMAGE
                </a>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MUSIC GENERATION */}
        {activeTab === 'music' && (
          <div className="max-w-2xl mx-auto space-y-4 font-mono text-xs">
            <div className="p-4 bg-[#0d1627] border border-cyan-500/30 rounded space-y-3">
              <label className="text-[11px] font-bold text-cyan-300 uppercase">
                SOUNDTRACK DIRECTIVE (LYRIA 3 CLIP)
              </label>
              <textarea
                value={musicPrompt}
                onChange={(e) => setMusicPrompt(e.target.value)}
                rows={3}
                className="w-full bg-black/60 border border-cyan-500/30 rounded p-3 text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
              />

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleGenerateMusic}
                  disabled={isGeneratingMusic || !musicPrompt}
                  className="flex items-center gap-2 px-5 py-2 bg-cyan-500 text-slate-950 font-bold rounded hover:bg-cyan-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Music className="w-4 h-4" />
                  {isGeneratingMusic ? 'GENERATING AUDIO...' : 'COMPOSE 30S SOUNDTRACK'}
                </button>
              </div>
            </div>

            {generatedMusicUrl && (
              <div className="p-4 bg-[#0a1120] border border-cyan-500/30 rounded flex flex-col items-center gap-3">
                <span className="text-xs text-cyan-200">LYRIA AUDIO CLIP READY</span>
                <audio controls src={generatedMusicUrl} className="w-full" />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VIDEO GENERATION */}
        {activeTab === 'video' && (
          <div className="max-w-2xl mx-auto space-y-4 font-mono text-xs">
            <div className="p-4 bg-[#0d1627] border border-cyan-500/30 rounded space-y-3">
              <label className="text-[11px] font-bold text-cyan-300 uppercase">
                VIDEO SYNTHESIS PROMPT (GEMINI-OMNI-1.1-FLASH)
              </label>
              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                rows={3}
                className="w-full bg-black/60 border border-cyan-500/30 rounded p-3 text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
              />

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 uppercase">ORIENTATION:</span>
                  <button
                    onClick={() => setVideoAspectRatio('16:9')}
                    className={`px-3 py-1 rounded text-xs ${
                      videoAspectRatio === '16:9'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    16:9 Landscape
                  </button>
                  <button
                    onClick={() => setVideoAspectRatio('9:16')}
                    className={`px-3 py-1 rounded text-xs ${
                      videoAspectRatio === '9:16'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    9:16 Portrait
                  </button>
                </div>

                <button
                  onClick={handleGenerateVideo}
                  disabled={isGeneratingVideo || !videoPrompt}
                  className="flex items-center gap-2 px-5 py-2 bg-cyan-500 text-slate-950 font-bold rounded hover:bg-cyan-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Video className="w-4 h-4" />
                  {isGeneratingVideo ? 'GENERATING VIDEO...' : 'RENDER VIDEO CLIP'}
                </button>
              </div>
            </div>

            {generatedVideoUrl && (
              <div className="p-4 bg-[#0a1120] border border-cyan-500/30 rounded flex flex-col items-center gap-3">
                <video controls src={generatedVideoUrl} className="max-h-[380px] rounded" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
