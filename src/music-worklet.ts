// AudioWorklet processor: runs the OPL music synth on the audio thread so the
// main thread pays nothing for music (it was ~25% of a core through the old
// ScriptProcessorNode). GENMIDI arrives once via processorOptions; each track's
// MUS score arrives as a port message. Output is mono; generate() fills whatever
// block size the audio system hands us (typically 128 frames).

import { MusicPlayer } from './music.js';

// AudioWorkletGlobalScope declarations (not in the DOM lib).
declare const sampleRate: number;
declare function registerProcessor(name: string, ctor: unknown): void;
declare abstract class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor();
}

interface PlayMsg { type: 'play'; score: ArrayBuffer; loop: boolean }
interface StopMsg { type: 'stop' }

class MusicProcessor extends AudioWorkletProcessor {
  private player: MusicPlayer;

  constructor(options: { processorOptions: { genmidi: Uint8Array } }) {
    super();
    this.player = new MusicPlayer(options.processorOptions.genmidi, sampleRate);
    this.port.onmessage = (e: MessageEvent<PlayMsg | StopMsg>): void => {
      const m = e.data;
      if (m.type === 'play') this.player.play({ score: new Uint8Array(m.score), instruments: [] }, m.loop);
      else this.player.stop();
    };
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const ch = outputs[0]?.[0];
    if (ch) this.player.generate(ch);
    return true; // keep the processor alive across track changes
  }
}

registerProcessor('music-processor', MusicProcessor);
