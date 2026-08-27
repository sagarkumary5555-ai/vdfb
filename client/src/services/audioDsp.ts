/**
 * Studio-Grade Audio DSP & Dynamic Adaptive Noise Gate
 * Multi-stage spectral filtering, vocal presence enhancer, and dynamic noise gate
 * to eliminate background fans, room echo, keyboard typing, and ambient noise.
 */

export interface AudioDspOptions {
  enableIsolation?: boolean;
  enableCompressor?: boolean;
  enableVocalBoost?: boolean;
  gateThreshold?: number; // 0 to 100 (Default: 20)
}

export class AudioDspService {
  private static audioCtx: AudioContext | null = null;

  static getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass({ latencyHint: 'interactive' });
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Chromium & WebRTC Audio Constraints for aggressive hardware noise cancellation
   */
  static getOptimalAudioConstraints() {
    return {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 1,
      // Chromium / Android / Edge internal DSP flags
      googEchoCancellation: true,
      googAutoGainControl: true,
      googNoiseSuppression: true,
      googHighpassFilter: true,
      googTypingNoiseDetection: true,
    } as any;
  }

  /**
   * Process a microphone MediaStream through the multi-stage filter chain + dynamic noise gate
   */
  static processMicrophoneStream(
    rawStream: MediaStream,
    options: AudioDspOptions = {
      enableIsolation: true,
      enableCompressor: true,
      enableVocalBoost: true,
      gateThreshold: 18,
    }
  ): {
    processedStream: MediaStream;
    analyser: AnalyserNode;
    getVolumeLevel: () => number;
    cleanup: () => void;
  } {
    const ctx = this.getContext();
    const source = ctx.createMediaStreamSource(rawStream);
    const destination = ctx.createMediaStreamDestination();

    // 1. High-Pass Filter (100Hz steep cutoff for AC drone, fan rumble, desk vibrations)
    const highpassFilter = ctx.createBiquadFilter();
    highpassFilter.type = 'highpass';
    highpassFilter.frequency.setValueAtTime(100, ctx.currentTime);
    highpassFilter.Q.setValueAtTime(0.8, ctx.currentTime);

    // 2. 50Hz / 60Hz Power Hum Notch Filter
    const humNotchFilter = ctx.createBiquadFilter();
    humNotchFilter.type = 'notch';
    humNotchFilter.frequency.setValueAtTime(60, ctx.currentTime);
    humNotchFilter.Q.setValueAtTime(4.0, ctx.currentTime);

    // 3. Vocal Presence EQ Booster (2.8kHz presence for crisp intelligible speech)
    const vocalBoostFilter = ctx.createBiquadFilter();
    vocalBoostFilter.type = 'peaking';
    vocalBoostFilter.frequency.setValueAtTime(2800, ctx.currentTime);
    vocalBoostFilter.Q.setValueAtTime(1.4, ctx.currentTime);
    vocalBoostFilter.gain.setValueAtTime(options.enableVocalBoost !== false ? 3.5 : 0, ctx.currentTime);

    // 4. High-Frequency Hiss Cut (9.5kHz lowpass to eliminate electromagnetic hiss)
    const highCutFilter = ctx.createBiquadFilter();
    highCutFilter.type = 'lowpass';
    highCutFilter.frequency.setValueAtTime(9500, ctx.currentTime);
    highCutFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    // 5. Studio Dynamics Compressor (Levels voice loudness smoothly)
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-26, ctx.currentTime);
    compressor.knee.setValueAtTime(25, ctx.currentTime);
    compressor.ratio.setValueAtTime(10, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.2, ctx.currentTime);

    // 6. Dynamic Noise Gate Gain Node
    const noiseGateGain = ctx.createGain();
    noiseGateGain.gain.setValueAtTime(1.0, ctx.currentTime);

    // 7. Analyser Node for level detection & UI VU meter
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;

    // Connect Filter Graph
    if (options.enableIsolation !== false) {
      source.connect(highpassFilter);
      highpassFilter.connect(humNotchFilter);
      humNotchFilter.connect(vocalBoostFilter);
      vocalBoostFilter.connect(highCutFilter);

      if (options.enableCompressor !== false) {
        highCutFilter.connect(compressor);
        compressor.connect(noiseGateGain);
      } else {
        highCutFilter.connect(noiseGateGain);
      }

      noiseGateGain.connect(analyser);
      analyser.connect(destination);
    } else {
      source.connect(analyser);
      analyser.connect(destination);
    }

    // Active Dynamic Noise Gate Loop
    let isRunning = true;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const thresholdVal = (options.gateThreshold || 18) * 1.2;
    let isGateOpen = true;
    let holdCounter = 0;

    const noiseGateLoop = () => {
      if (!isRunning) return;

      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;

      if (options.enableIsolation !== false) {
        const now = ctx.currentTime;
        if (avg >= thresholdVal) {
          // Voice detected: Open gate rapidly
          holdCounter = 12; // Hold gate open for ~180ms to avoid cutting word endings
          if (!isGateOpen) {
            isGateOpen = true;
            noiseGateGain.gain.cancelScheduledValues(now);
            noiseGateGain.gain.linearRampToValueAtTime(1.0, now + 0.008);
          }
        } else {
          // Background noise / silence: Decrement hold counter
          if (holdCounter > 0) {
            holdCounter--;
          } else if (isGateOpen) {
            isGateOpen = false;
            // Smoothly attenuate background noise down to 5% (-26dB)
            noiseGateGain.gain.cancelScheduledValues(now);
            noiseGateGain.gain.linearRampToValueAtTime(0.05, now + 0.08);
          }
        }
      }

      requestAnimationFrame(noiseGateLoop);
    };

    requestAnimationFrame(noiseGateLoop);

    // Keep video tracks untouched
    const outputStream = new MediaStream([
      ...destination.stream.getAudioTracks(),
      ...rawStream.getVideoTracks(),
    ]);

    const getVolumeLevel = (): number => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      return Math.min(100, Math.round((avg / 120) * 100));
    };

    const cleanup = () => {
      isRunning = false;
      try {
        source.disconnect();
        highpassFilter.disconnect();
        humNotchFilter.disconnect();
        vocalBoostFilter.disconnect();
        highCutFilter.disconnect();
        compressor.disconnect();
        noiseGateGain.disconnect();
        analyser.disconnect();
        destination.disconnect();
      } catch (e) {
        // Safe ignore
      }
    };

    return {
      processedStream: outputStream,
      analyser,
      getVolumeLevel,
      cleanup,
    };
  }
}
