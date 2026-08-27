/**
 * Studio-Grade Audio DSP (Digital Signal Processing) & Voice Isolation Engine
 * Uses Web Audio API filter graph and dynamics compression for crystal vocal clarity.
 */

export interface AudioDspOptions {
  enableIsolation?: boolean;
  enableCompressor?: boolean;
  enableVocalBoost?: boolean;
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
   * Process a raw microphone MediaStream through the Studio DSP pipeline
   */
  static processMicrophoneStream(
    rawStream: MediaStream,
    options: AudioDspOptions = { enableIsolation: true, enableCompressor: true, enableVocalBoost: true }
  ): {
    processedStream: MediaStream;
    analyser: AnalyserNode;
    getVolumeLevel: () => number;
    cleanup: () => void;
  } {
    const ctx = this.getContext();
    const source = ctx.createMediaStreamSource(rawStream);
    const destination = ctx.createMediaStreamDestination();

    // 1. High-Pass Filter (Cuts sub-85Hz low frequency rumble, fan hum, AC drone, desk bumps)
    const highpassFilter = ctx.createBiquadFilter();
    highpassFilter.type = 'highpass';
    highpassFilter.frequency.setValueAtTime(85, ctx.currentTime);
    highpassFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    // 2. Vocal Presence Boost Filter (Enhances speech intelligibility at 3kHz)
    const vocalBoostFilter = ctx.createBiquadFilter();
    vocalBoostFilter.type = 'peaking';
    vocalBoostFilter.frequency.setValueAtTime(3000, ctx.currentTime);
    vocalBoostFilter.Q.setValueAtTime(1.2, ctx.currentTime);
    vocalBoostFilter.gain.setValueAtTime(options.enableVocalBoost ? 2.5 : 0, ctx.currentTime);

    // 3. High-Cut Filter (Removes high-frequency electromagnetic hiss above 12kHz)
    const highCutFilter = ctx.createBiquadFilter();
    highCutFilter.type = 'lowpass';
    highCutFilter.frequency.setValueAtTime(12000, ctx.currentTime);

    // 4. Studio Dynamics Compressor (Levels voice loudness - boosts soft whispers, tames loud shouts)
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, ctx.currentTime);
    compressor.knee.setValueAtTime(30, ctx.currentTime);
    compressor.ratio.setValueAtTime(8, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);

    // 5. Analyser Node for Live VU Meter
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.8;

    // Connect DSP Audio Graph
    if (options.enableIsolation) {
      source.connect(highpassFilter);
      highpassFilter.connect(vocalBoostFilter);
      vocalBoostFilter.connect(highCutFilter);

      if (options.enableCompressor) {
        highCutFilter.connect(compressor);
        compressor.connect(analyser);
        analyser.connect(destination);
      } else {
        highCutFilter.connect(analyser);
        analyser.connect(destination);
      }
    } else {
      source.connect(analyser);
      analyser.connect(destination);
    }

    // Keep any video tracks untouched and append the processed audio track
    const processedTracks = destination.stream.getAudioTracks();
    const outputStream = new MediaStream([
      ...processedTracks,
      ...rawStream.getVideoTracks(),
    ]);

    // Data array for volume level inspection
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const getVolumeLevel = (): number => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      return Math.min(100, Math.round((avg / 128) * 100));
    };

    const cleanup = () => {
      try {
        source.disconnect();
        highpassFilter.disconnect();
        vocalBoostFilter.disconnect();
        highCutFilter.disconnect();
        compressor.disconnect();
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
