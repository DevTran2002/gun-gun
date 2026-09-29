// Audio Manager using Web Audio API and Kenney Sound Assets

class SoundManager {
    constructor() {
        this.ctx = null;
        this.buffers = {};
        this.enabled = true;
        this.musicEnabled = true;
        this.masterVolume = 0.8;
        this.musicVolume = 0.35;
        this.sounds = {
            blaster: 'assets/sounds/blaster.ogg',
            repeater: 'assets/sounds/blaster_repeater.ogg',
            enemyAttack: 'assets/sounds/enemy_attack.ogg',
            enemyDestroy: 'assets/sounds/enemy_destroy.ogg',
            enemyHurt: 'assets/sounds/enemy_hurt.ogg',
            jump: 'assets/sounds/jump_a.ogg',
            land: 'assets/sounds/land.ogg',
            step: 'assets/sounds/walking.ogg',
            switchWeapon: 'assets/sounds/weapon_change.ogg'
        };
        this.isMusicPlaying = false;
        this.musicInterval = null;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.masterVolume;
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this.musicVolume;
        this.musicGain.connect(this.masterGain);

        this.loadAllSounds();
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    async loadAllSounds() {
        for (const [key, path] of Object.entries(this.sounds)) {
            try {
                const response = await fetch(path);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
                this.buffers[key] = audioBuffer;
            } catch (err) {
                console.warn(`Could not load audio [${key}] from ${path}:`, err);
            }
        }
    }

    play(name, options = {}) {
        if (!this.enabled || !this.ctx) return;
        this.resume();

        const buffer = this.buffers[name];
        if (!buffer) return;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.ctx.createGain();
        const vol = (options.volume !== undefined ? options.volume : 1.0);
        gainNode.gain.value = vol;

        const pitchVariation = options.pitchVariation !== undefined ? options.pitchVariation : 0.08;
        const rate = (options.rate !== undefined ? options.rate : 1.0) + (Math.random() - 0.5) * pitchVariation;
        source.playbackRate.value = Math.max(0.5, Math.min(2.0, rate));

        source.connect(gainNode);
        gainNode.connect(this.masterGain);

        source.start(0);
        return source;
    }

    playShot(weaponType = 'blaster') {
        if (weaponType === 'repeater') {
            this.play('repeater', { volume: 0.7, pitchVariation: 0.1 });
        } else if (weaponType === 'scatter') {
            this.play('blaster', { volume: 0.9, rate: 0.8, pitchVariation: 0.15 });
            this.play('repeater', { volume: 0.5, rate: 0.7, pitchVariation: 0.1 });
        } else {
            this.play('blaster', { volume: 0.85, pitchVariation: 0.08 });
        }
    }

    playHitMarker(isCrit = false) {
        if (!this.enabled || !this.ctx) return;
        this.resume();

        // Synth crisp hit beep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = isCrit ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(isCrit ? 1400 : 950, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(isCrit ? 600 : 400, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(isCrit ? 0.35 : 0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playShieldDamage() {
        if (!this.enabled || !this.ctx) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playPickup(type = 'health') {
        if (!this.enabled || !this.ctx) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const baseFreq = type === 'health' ? 523.25 : type === 'shield' ? 659.25 : 783.99;
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    // Procedural Cyberpunk Bass & Synth Music Track
    startMusic() {
        if (!this.musicEnabled || this.isMusicPlaying || !this.ctx) return;
        this.resume();
        this.isMusicPlaying = true;

        const bpm = 124;
        const stepTime = (60 / bpm) / 4; // 16th note
        let step = 0;

        const bassNotes = [36, 36, 48, 36, 41, 36, 44, 43]; // MIDI notes (C2, etc.)
        const leadNotes = [60, 63, 67, 70, 72, 70, 67, 63];

        const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

        this.musicInterval = setInterval(() => {
            if (!this.musicEnabled || !this.ctx) return;
            const t = this.ctx.currentTime;

            // Kick drum on beats 0, 4, 8, 12
            if (step % 4 === 0) {
                const kickOsc = this.ctx.createOscillator();
                const kickGain = this.ctx.createGain();
                kickOsc.type = 'sine';
                kickOsc.frequency.setValueAtTime(130, t);
                kickOsc.frequency.exponentialRampToValueAtTime(35, t + 0.1);
                kickGain.gain.setValueAtTime(0.4, t);
                kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                kickOsc.connect(kickGain);
                kickGain.connect(this.musicGain);
                kickOsc.start(t);
                kickOsc.stop(t + 0.15);
            }

            // Hi-hat on every off-beat
            if (step % 2 === 1) {
                const bSize = this.ctx.sampleRate * 0.03;
                const buffer = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bSize * 0.3));
                }
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;
                const noiseFilter = this.ctx.createBiquadFilter();
                noiseFilter.type = 'highpass';
                noiseFilter.frequency.value = 7000;
                const hGain = this.ctx.createGain();
                hGain.gain.value = 0.08;
                noise.connect(noiseFilter);
                noiseFilter.connect(hGain);
                hGain.connect(this.musicGain);
                noise.start(t);
            }

            // Bass pulse
            if (step % 2 === 0) {
                const noteIdx = Math.floor(step / 2) % bassNotes.length;
                const freq = midiToFreq(bassNotes[noteIdx]);
                const bOsc = this.ctx.createOscillator();
                const bFilter = this.ctx.createBiquadFilter();
                const bGain = this.ctx.createGain();

                bOsc.type = 'sawtooth';
                bOsc.frequency.setValueAtTime(freq, t);

                bFilter.type = 'lowpass';
                bFilter.frequency.setValueAtTime(600, t);
                bFilter.frequency.exponentialRampToValueAtTime(200, t + 0.12);

                bGain.gain.setValueAtTime(0.22, t);
                bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

                bOsc.connect(bFilter);
                bFilter.connect(bGain);
                bGain.connect(this.musicGain);
                bOsc.start(t);
                bOsc.stop(t + 0.14);
            }

            // Arpeggio synth lead
            if (step % 4 === 2) {
                const lIdx = Math.floor(step / 4) % leadNotes.length;
                const freq = midiToFreq(leadNotes[lIdx]);
                const lOsc = this.ctx.createOscillator();
                const lGain = this.ctx.createGain();
                lOsc.type = 'square';
                lOsc.frequency.setValueAtTime(freq, t);
                lGain.gain.setValueAtTime(0.07, t);
                lGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
                lOsc.connect(lGain);
                lGain.connect(this.musicGain);
                lOsc.start(t);
                lOsc.stop(t + 0.2);
            }

            step = (step + 1) % 32;
        }, stepTime * 1000);
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
        this.isMusicPlaying = false;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) {
            this.stopMusic();
        } else {
            this.startMusic();
        }
        return this.musicEnabled;
    }

    toggleAudio() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopMusic();
        } else if (this.musicEnabled) {
            this.startMusic();
        }
        return this.enabled;
    }
}

export const sounds = new SoundManager();
