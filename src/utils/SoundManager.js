class SoundManager {
  constructor() {
    this.ctx = null;
    this.swipePitch = 0;
    this.swipeTimeout = null;
    
    // Check if sound is muted in localStorage
    const savedMuted = localStorage.getItem('soundMuted');
    this.isMuted = savedMuted === 'true';
    this.isEnabled = true; // Overall toggle
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      } else {
        this.isEnabled = false; // Fallback if Web Audio API not supported
      }
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('soundMuted', this.isMuted);
    if (!this.isMuted) {
      this.init();
      // Resume context if it was suspended (autoplay policy)
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
    return this.isMuted;
  }

  playTone(freq, type, duration, vol, delay = 0) {
    if (this.isMuted || !this.isEnabled) return;
    this.init();
    if (!this.ctx) return;
    
    // Resume context if suspended (e.g. initial load before user interaction)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
      
      gain.gain.setValueAtTime(vol, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + duration);
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  }

  playMenuClick() {
    // Subtle low pop
    this.playTone(150, 'sine', 0.1, 0.3);
  }

  playSwipe() {
    const baseFreq = 220; 
    const freq = baseFreq * Math.pow(1.05946309, this.swipePitch); 
    
    this.playTone(freq, 'sine', 0.3, 0.4);
    this.playTone(freq * 2, 'triangle', 0.2, 0.1);
    
    this.swipePitch += 1;
    clearTimeout(this.swipeTimeout);
    this.swipeTimeout = setTimeout(() => { this.swipePitch = 0; }, 1000); 
  }

  resetSwipe() {
    this.swipePitch = 0;
  }

  playSuccess(points) {
    // Determine level based on points
    let level = 1;
    if (points >= 101) level = 4;
    else if (points >= 51) level = 3;
    else if (points >= 21) level = 2;

    if (level === 1) {
      this.playTone(440, 'sine', 0.4, 0.5); 
      this.playTone(880, 'sine', 0.6, 0.2); 
    } else if (level === 2) {
      this.playTone(440, 'sine', 0.3, 0.4, 0); 
      this.playTone(554.37, 'sine', 0.5, 0.4, 0.1); 
    } else if (level === 3) {
      this.playTone(440, 'sine', 0.3, 0.3, 0); 
      this.playTone(554.37, 'sine', 0.3, 0.3, 0.08); 
      this.playTone(659.25, 'sine', 0.6, 0.4, 0.16); 
    } else if (level === 4) {
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        this.playTone(freq, 'sine', 1.5, 0.3, i * 0.05);
        this.playTone(freq/2, 'triangle', 1.5, 0.2, i * 0.05);
      });
    }
  }

  playError() {
    // Dull Thud
    if (this.isMuted || !this.isEnabled) return;
    this.init();
    if (!this.ctx || this.ctx.state === 'suspended') return;
    
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch(e) {}
  }

  playTick() {
    // Sharp short click
    if (this.isMuted || !this.isEnabled) return;
    this.init();
    if (!this.ctx || this.ctx.state === 'suspended') return;
    
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch(e) {}
  }
}

export const soundManager = new SoundManager();
