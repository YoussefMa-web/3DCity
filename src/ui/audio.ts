/**
 * Lightweight Web Audio Synthesizer for high-tech HUD tactile feedback.
 * Uses zero external audio files and handles autoplay / audio context suspension smoothly.
 */
class SoundManager {
  private ctx: AudioContext | null = null
  private muted = false

  constructor() {
    this.muted = localStorage.getItem('netis_muted') === 'true'
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
  }

  get isMuted() {
    return this.muted
  }

  toggleMute(): boolean {
    this.muted = !this.muted
    localStorage.setItem('netis_muted', String(this.muted))
    if (!this.muted) {
      this.playChime()
    }
    return this.muted
  }

  playClick() {
    if (this.muted) return
    try {
      this.initCtx()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, now)
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.04)

      gain.gain.setValueAtTime(0.04, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.05)
    } catch {
      // Ignore audio failure
    }
  }

  playStep() {
    if (this.muted) return
    try {
      this.initCtx()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(520, now)
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08)

      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.09)
    } catch {
      // Ignore audio failure
    }
  }

  playWhoosh() {
    if (this.muted) return
    try {
      this.initCtx()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(220, now)
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.2)
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.45)

      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.05, now + 0.15)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.45)
    } catch {
      // Ignore audio failure
    }
  }

  playChime() {
    if (this.muted) return
    try {
      this.initCtx()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const notes = [587.33, 880, 1174.66] // D5, A5, D6 chord
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator()
        const gain = this.ctx!.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.05)
        gain.gain.setValueAtTime(0.04, now + idx * 0.05)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.35)
        osc.connect(gain)
        gain.connect(this.ctx!.destination)
        osc.start(now + idx * 0.05)
        osc.stop(now + idx * 0.05 + 0.35)
      })
    } catch {
      // Ignore audio failure
    }
  }
}

export const sound = new SoundManager()
