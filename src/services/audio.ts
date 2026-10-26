/**
 * Web Audio API procedural sound synthesizer & Web Speech Synthesis engine
 * Formatted for Icarus D. Noble (Jarvis-inspired cadence, zero external audio dependencies).
 */

export interface SpeechOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
  voiceName?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.cachedVoices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
    return this.cachedVoices;
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSpeaking();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public isSpeaking(): boolean {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.speaking;
    }
    return false;
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }

  // Tactical click / keypress chirp
  public playChirp(freq = 1200, duration = 0.04) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  // Command Acknowledged Chime (dual-tone harmonic chime)
  public playCommandAcknowledged() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [880, 1320, 1760].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.06, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.22);
      });
    } catch {}
  }

  // Alert / Warning Siren
  public playAlert() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(850, now + 0.15);
      osc.frequency.linearRampToValueAtTime(650, now + 0.3);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch {}
  }

  // Arc Reactor Repulsor Charge Pulse
  public playArcCharge() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {}
  }

  // Play WAV base64 from Gemini TTS
  public async playWavBase64(base64: string): Promise<void> {
    if (this.isMuted) return;
    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio(`data:audio/wav;base64,${base64}`);
        audio.onended = () => resolve();
        audio.onerror = (e) => reject(e);
        audio.play().catch(reject);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Primary Web Speech Synthesis API implementation.
   * Cleans text of raw markdown & JSON blocks to ensure Noble's speech sounds
   * natural, calm, and executive with Jarvis persona.
   */
  public speakWithWebSpeech(text: string, options?: SpeechOptions): Promise<void> {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (options?.onEnd) options.onEnd();
      return Promise.resolve();
    }

    // Clean text: strip markdown code blocks, json payloads, bold asterisks, headers, bullets
    const cleanText = text
      .replace(/```json[\s\S]*?```/gi, '')
      .replace(/```[\s\S]*?```/gi, '')
      .replace(/\[AIS_METADATA_SECTION_START\][\s\S]*?\[AIS_METADATA_SECTION_END\]/gi, '')
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*{1,3}/g, '')
      .replace(/^[\s-•*]+/gm, '')
      .replace(/[\n\r]+/g, ' ')
      .trim();

    if (!cleanText) {
      if (options?.onEnd) options.onEnd();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.pitch = options?.pitch ?? 0.92; // Slightly deeper, refined Jarvis tone
      utterance.rate = options?.rate ?? 1.02; // Crisply paced
      utterance.volume = options?.volume ?? 1.0;

      const voices = this.getVoices();
      let chosenVoice: SpeechSynthesisVoice | undefined;

      if (options?.voiceName) {
        chosenVoice = voices.find((v) => v.name === options.voiceName);
      }

      if (!chosenVoice) {
        // Preferred order: British / UK English male voices matching Jarvis
        chosenVoice =
          voices.find((v) => v.name.includes('Daniel') || v.name.includes('Oliver') || v.name.includes('Arthur')) ||
          voices.find((v) => v.name.includes('Google UK English Male')) ||
          voices.find((v) => v.lang === 'en-GB' || v.lang.startsWith('en-GB')) ||
          voices.find((v) => v.lang.startsWith('en')) ||
          voices[0];
      }

      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      utterance.onstart = () => {
        if (options?.onStart) options.onStart();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        if (options?.onEnd) options.onEnd();
        resolve();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        if (options?.onError) options.onError(e);
        if (options?.onEnd) options.onEnd();
        resolve();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }

  // Compatibility fallback
  public speakFallback(text: string, voiceName?: string): Promise<void> {
    return this.speakWithWebSpeech(text, { voiceName });
  }
}

export const sound = new SoundSynthesizer();
