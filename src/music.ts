// The MUS-to-OPL sequencer: walks a MUS score at 140 Hz, allocating the chip's
// eighteen (OPL3) voices to notes and loading GENMIDI patches, as DMX's OPL
// driver did. Double-voice patches take two voices; note-off stops both.
// generate() renders straight into a Float32 buffer for Web Audio.

import { OPL3 } from './opl3.js';
import { parseGenmidi, type Instrument, type OplVoice } from './genmidi.js';
import { parseMus, type MusScore } from './mus.js';

const MUS_RATE = 140; // MUS scores tick at 140 Hz
const OPL_MOD = [0x00, 0x01, 0x02, 0x08, 0x09, 0x0a, 0x10, 0x11, 0x12];
const OPL_CAR = [0x03, 0x04, 0x05, 0x0b, 0x0c, 0x0d, 0x13, 0x14, 0x15];
// DOOM's "Sound Blaster"/"AdLib" music is an OPL2 (YM3812): 9 voices, single
// register bank, no OPL3 "new" bit or stereo routing. (Sound Blaster Pro2/16
// would be the 18-voice OPL3 — a different target.)
const NVOICES = 9;
const bankOf = (_v: number): number => 0;
const chIn = (v: number): number => v;
const PERCUSSION = 15; // MUS channel 15 is the drum kit

// DMX's logarithmic MIDI-volume → attenuation curve (from Chocolate Doom's
// i_oplmusic.c). Indexed 0..127; used for both note and channel volume.
const VOLUME_MAP = [
  0, 1, 3, 5, 6, 8, 10, 11, 13, 14, 16, 17, 19, 20, 22, 23,
  25, 26, 27, 29, 30, 32, 33, 34, 36, 37, 39, 41, 43, 45, 47, 49,
  50, 52, 54, 55, 57, 59, 60, 61, 63, 64, 66, 67, 68, 69, 71, 72,
  73, 74, 75, 76, 77, 79, 80, 81, 82, 83, 84, 84, 85, 86, 87, 88,
  89, 90, 91, 92, 92, 93, 94, 95, 96, 96, 97, 98, 99, 99, 100, 101,
  101, 102, 103, 103, 104, 105, 105, 106, 107, 107, 108, 109, 109, 110, 110, 111,
  112, 112, 113, 113, 114, 114, 115, 115, 116, 117, 117, 118, 118, 119, 119, 120,
  120, 121, 121, 122, 122, 123, 123, 123, 124, 124, 125, 125, 126, 126, 127, 127,
];

// DMX's frequency lookup (Chocolate Doom i_oplmusic.c). Indexed by freq-index
// (64 + 32·note + bend); entries below 284 are full fnum|block values, the rest
// are one octave the block is shifted onto.
const FREQ_CURVE = [
  0x133, 0x133, 0x134, 0x134, 0x135, 0x136, 0x136, 0x137, 0x137, 0x138, 0x138, 0x139, 0x139, 0x13a, 0x13b, 0x13b,
  0x13c, 0x13c, 0x13d, 0x13d, 0x13e, 0x13f, 0x13f, 0x140, 0x140, 0x141, 0x142, 0x142, 0x143, 0x143, 0x144, 0x144,
  0x145, 0x146, 0x146, 0x147, 0x147, 0x148, 0x149, 0x149, 0x14a, 0x14a, 0x14b, 0x14c, 0x14c, 0x14d, 0x14d, 0x14e,
  0x14f, 0x14f, 0x150, 0x150, 0x151, 0x152, 0x152, 0x153, 0x153, 0x154, 0x155, 0x155, 0x156, 0x157, 0x157, 0x158,
  0x158, 0x159, 0x15a, 0x15a, 0x15b, 0x15b, 0x15c, 0x15d, 0x15d, 0x15e, 0x15f, 0x15f, 0x160, 0x161, 0x161, 0x162,
  0x162, 0x163, 0x164, 0x164, 0x165, 0x166, 0x166, 0x167, 0x168, 0x168, 0x169, 0x16a, 0x16a, 0x16b, 0x16c, 0x16c,
  0x16d, 0x16e, 0x16e, 0x16f, 0x170, 0x170, 0x171, 0x172, 0x172, 0x173, 0x174, 0x174, 0x175, 0x176, 0x176, 0x177,
  0x178, 0x178, 0x179, 0x17a, 0x17a, 0x17b, 0x17c, 0x17c, 0x17d, 0x17e, 0x17e, 0x17f, 0x180, 0x181, 0x181, 0x182,
  0x183, 0x183, 0x184, 0x185, 0x185, 0x186, 0x187, 0x188, 0x188, 0x189, 0x18a, 0x18a, 0x18b, 0x18c, 0x18d, 0x18d,
  0x18e, 0x18f, 0x18f, 0x190, 0x191, 0x192, 0x192, 0x193, 0x194, 0x194, 0x195, 0x196, 0x197, 0x197, 0x198, 0x199,
  0x19a, 0x19a, 0x19b, 0x19c, 0x19d, 0x19d, 0x19e, 0x19f, 0x1a0, 0x1a0, 0x1a1, 0x1a2, 0x1a3, 0x1a3, 0x1a4, 0x1a5,
  0x1a6, 0x1a6, 0x1a7, 0x1a8, 0x1a9, 0x1a9, 0x1aa, 0x1ab, 0x1ac, 0x1ad, 0x1ad, 0x1ae, 0x1af, 0x1b0, 0x1b0, 0x1b1,
  0x1b2, 0x1b3, 0x1b4, 0x1b4, 0x1b5, 0x1b6, 0x1b7, 0x1b8, 0x1b8, 0x1b9, 0x1ba, 0x1bb, 0x1bc, 0x1bc, 0x1bd, 0x1be,
  0x1bf, 0x1c0, 0x1c0, 0x1c1, 0x1c2, 0x1c3, 0x1c4, 0x1c4, 0x1c5, 0x1c6, 0x1c7, 0x1c8, 0x1c9, 0x1c9, 0x1ca, 0x1cb,
  0x1cc, 0x1cd, 0x1ce, 0x1ce, 0x1cf, 0x1d0, 0x1d1, 0x1d2, 0x1d3, 0x1d3, 0x1d4, 0x1d5, 0x1d6, 0x1d7, 0x1d8, 0x1d8,
  0x1d9, 0x1da, 0x1db, 0x1dc, 0x1dd, 0x1de, 0x1de, 0x1df, 0x1e0, 0x1e1, 0x1e2, 0x1e3, 0x1e4, 0x1e5, 0x1e5, 0x1e6,
  0x1e7, 0x1e8, 0x1e9, 0x1ea, 0x1eb, 0x1ec, 0x1ed, 0x1ed, 0x1ee, 0x1ef, 0x1f0, 0x1f1, 0x1f2, 0x1f3, 0x1f4, 0x1f5,
  0x1f6, 0x1f6, 0x1f7, 0x1f8, 0x1f9, 0x1fa, 0x1fb, 0x1fc, 0x1fd, 0x1fe, 0x1ff, 0x200, 0x201, 0x201, 0x202, 0x203,
  0x204, 0x205, 0x206, 0x207, 0x208, 0x209, 0x20a, 0x20b, 0x20c, 0x20d, 0x20e, 0x20f, 0x210, 0x210, 0x211, 0x212,
  0x213, 0x214, 0x215, 0x216, 0x217, 0x218, 0x219, 0x21a, 0x21b, 0x21c, 0x21d, 0x21e, 0x21f, 0x220, 0x221, 0x222,
  0x223, 0x224, 0x225, 0x226, 0x227, 0x228, 0x229, 0x22a, 0x22b, 0x22c, 0x22d, 0x22e, 0x22f, 0x230, 0x231, 0x232,
  0x233, 0x234, 0x235, 0x236, 0x237, 0x238, 0x239, 0x23a, 0x23b, 0x23c, 0x23d, 0x23e, 0x23f, 0x240, 0x241, 0x242,
  0x244, 0x245, 0x246, 0x247, 0x248, 0x249, 0x24a, 0x24b, 0x24c, 0x24d, 0x24e, 0x24f, 0x250, 0x251, 0x252, 0x253,
  0x254, 0x256, 0x257, 0x258, 0x259, 0x25a, 0x25b, 0x25c, 0x25d, 0x25e, 0x25f, 0x260, 0x262, 0x263, 0x264, 0x265,
  0x266, 0x267, 0x268, 0x269, 0x26a, 0x26c, 0x26d, 0x26e, 0x26f, 0x270, 0x271, 0x272, 0x273, 0x275, 0x276, 0x277,
  0x278, 0x279, 0x27a, 0x27b, 0x27d, 0x27e, 0x27f, 0x280, 0x281, 0x282, 0x284, 0x285, 0x286, 0x287, 0x288, 0x289,
  0x28b, 0x28c, 0x28d, 0x28e, 0x28f, 0x290, 0x292, 0x293, 0x294, 0x295, 0x296, 0x298, 0x299, 0x29a, 0x29b, 0x29c,
  0x29e, 0x29f, 0x2a0, 0x2a1, 0x2a2, 0x2a4, 0x2a5, 0x2a6, 0x2a7, 0x2a9, 0x2aa, 0x2ab, 0x2ac, 0x2ae, 0x2af, 0x2b0,
  0x2b1, 0x2b2, 0x2b4, 0x2b5, 0x2b6, 0x2b7, 0x2b9, 0x2ba, 0x2bb, 0x2bd, 0x2be, 0x2bf, 0x2c0, 0x2c2, 0x2c3, 0x2c4,
  0x2c5, 0x2c7, 0x2c8, 0x2c9, 0x2cb, 0x2cc, 0x2cd, 0x2ce, 0x2d0, 0x2d1, 0x2d2, 0x2d4, 0x2d5, 0x2d6, 0x2d8, 0x2d9,
  0x2da, 0x2dc, 0x2dd, 0x2de, 0x2e0, 0x2e1, 0x2e2, 0x2e4, 0x2e5, 0x2e6, 0x2e8, 0x2e9, 0x2ea, 0x2ec, 0x2ed, 0x2ee,
  0x2f0, 0x2f1, 0x2f2, 0x2f4, 0x2f5, 0x2f6, 0x2f8, 0x2f9, 0x2fb, 0x2fc, 0x2fd, 0x2ff, 0x300, 0x302, 0x303, 0x304,
  0x306, 0x307, 0x309, 0x30a, 0x30b, 0x30d, 0x30e, 0x310, 0x311, 0x312, 0x314, 0x315, 0x317, 0x318, 0x31a, 0x31b,
  0x31c, 0x31e, 0x31f, 0x321, 0x322, 0x324, 0x325, 0x327, 0x328, 0x329, 0x32b, 0x32c, 0x32e, 0x32f, 0x331, 0x332,
  0x334, 0x335, 0x337, 0x338, 0x33a, 0x33b, 0x33d, 0x33e, 0x340, 0x341, 0x343, 0x344, 0x346, 0x347, 0x349, 0x34a,
  0x34c, 0x34d, 0x34f, 0x350, 0x352, 0x353, 0x355, 0x357, 0x358, 0x35a, 0x35b, 0x35d, 0x35e, 0x360, 0x361, 0x363,
  0x365, 0x366, 0x368, 0x369, 0x36b, 0x36c, 0x36e, 0x370, 0x371, 0x373, 0x374, 0x376, 0x378, 0x379, 0x37b, 0x37c,
  0x37e, 0x380, 0x381, 0x383, 0x384, 0x386, 0x388, 0x389, 0x38b, 0x38d, 0x38e, 0x390, 0x392, 0x393, 0x395, 0x397,
  0x398, 0x39a, 0x39c, 0x39d, 0x39f, 0x3a1, 0x3a2, 0x3a4, 0x3a6, 0x3a7, 0x3a9, 0x3ab, 0x3ac, 0x3ae, 0x3b0, 0x3b1,
  0x3b3, 0x3b5, 0x3b7, 0x3b8, 0x3ba, 0x3bc, 0x3bd, 0x3bf, 0x3c1, 0x3c3, 0x3c4, 0x3c6, 0x3c8, 0x3ca, 0x3cb, 0x3cd,
  0x3cf, 0x3d1, 0x3d2, 0x3d4, 0x3d6, 0x3d8, 0x3da, 0x3db, 0x3dd, 0x3df, 0x3e1, 0x3e3, 0x3e4, 0x3e6, 0x3e8, 0x3ea,
  0x3ec, 0x3ed, 0x3ef, 0x3f1, 0x3f3, 0x3f5, 0x3f6, 0x3f8, 0x3fa, 0x3fc, 0x3fe, 0x36c,
];

interface Voice {
  midiCh: number;   // which MUS channel owns it, or -1 = free
  note: number;
  age: number;      // for stealing the oldest
  b0: number;       // last 0xB0 value (block+fnum), for a clean key-off
  useNote: number;   // note fed to freqForVoice (after offset/fixed), for re-bending
  fineOffset: number; // freq-index detune for the double-voice second voice
}
interface MidiCh {
  instrument: number; // GENMIDI index
  volume: number;     // 0..127
  pitch: number;      // pitch-bend in freq-index units (32/semitone), DMX-style
}

export class MusicPlayer {
  private opl: OPL3;
  private instruments: Instrument[];
  private readonly samplesPerTick: number;
  private tickAcc = 0;

  private score: Uint8Array = new Uint8Array(0);
  private pos = 0;
  private delay = 0;      // ticks until the next event group
  private playing = false;
  private loop = true;
  private ageCounter = 0;

  private voices: Voice[] = [];
  private chans: MidiCh[] = [];

  constructor(genmidi: Uint8Array, outputRate: number) {
    this.opl = new OPL3(outputRate);
    this.instruments = parseGenmidi(genmidi);
    this.samplesPerTick = outputRate / MUS_RATE;
    for (let i = 0; i < NVOICES; i++) this.voices.push({ midiCh: -1, note: 0, age: 0, b0: 0, useNote: 0, fineOffset: 0 });
    for (let i = 0; i < 16; i++) this.chans.push({ instrument: 0, volume: 100, pitch: 0 });
  }

  /** Begin recording every OPL register write (offline reference tool only). */
  enableCapture(): { t: number; reg: number; val: number }[] {
    this.opl.capture = [];
    return this.opl.capture;
  }

  play(mus: MusScore, loop: boolean): void {
    this.score = mus.score;
    this.pos = 0;
    this.delay = 0;
    this.loop = loop;
    this.playing = true;
    // OPL2 chip init: 0xBD = 0 (DMX clears it → shallow vibrato/tremolo depth; the
    // lead's "wail" is the pitch bend, not chip vibrato). No OPL3 "new" bit — this
    // is a 9-voice YM3812.
    this.opl.write(0xbd, 0x00);
    this.allNotesOff();
    for (const c of this.chans) { c.volume = 100; c.pitch = 0; c.instrument = 0; }
  }
  stop(): void { this.playing = false; this.allNotesOff(); }

  private allNotesOff(): void {
    for (let i = 0; i < NVOICES; i++) {
      this.opl.write(bankOf(i) | (0xb0 + chIn(i)), 0); // key off, clear block
      this.voices[i].midiCh = -1;
    }
  }

  // --- OPL voice management ------------------------------------------------
  private alloc(midiCh: number, note: number): number {
    // Prefer a free voice, taking the one released LONGEST ago (smallest age) so a
    // just-released note keeps ringing. When none are free, steal like DMX's
    // ReplaceExistingVoice: the highest-numbered MIDI channel (ties → later voice),
    // so the drum kit (channel 15) is sacrificed before the melodic parts.
    let bestFree = -1, steal = -1;
    for (let i = 0; i < NVOICES; i++) {
      if (this.voices[i].midiCh === -1) {
        if (bestFree < 0 || this.voices[i].age < this.voices[bestFree].age) bestFree = i;
      } else if (steal < 0 || this.voices[i].midiCh >= this.voices[steal].midiCh) {
        steal = i;
      }
    }
    const v = bestFree >= 0 ? bestFree : steal;
    this.voices[v] = { midiCh, note, age: ++this.ageCounter, b0: 0, useNote: note, fineOffset: 0 };
    return v;
  }

  // DMX's exact note→register mapping (Chocolate Doom FrequencyForVoice). Returns
  // the raw value: low 10 bits = F-number, bits 10-12 = block. `bend` is in
  // freq-index units (32 per semitone). A hand-rolled formula gave the right
  // pitch to my old synth but the WRONG block for a real OPL, shifting the whole
  // score an octave and mis-keyscaling it — the table is authoritative.
  private freqForVoice(note: number, bend: number): number {
    let n = note;
    while (n < 0) n += 12;
    while (n > 95) n -= 12;
    let fi = 64 + 32 * n + bend;
    if (fi < 0) fi = 0;
    if (fi < 284) return FREQ_CURVE[fi];
    const sub = (fi - 284) % (12 * 32);
    let oct = Math.floor((fi - 284) / (12 * 32));
    if (oct >= 7) oct = 7;
    return FREQ_CURVE[sub + 284] | (oct << 10);
  }

  private startNote(midiCh: number, note: number, vol: number): void {
    const ch = this.chans[midiCh];
    // Percussion: the note itself selects the drum patch (GENMIDI 128 + note-35).
    let instIdx = ch.instrument;
    let playNote = note;
    if (midiCh === PERCUSSION) {
      instIdx = 128 + (note - 35);
      if (instIdx < 128 || instIdx > 174) return;
    }
    const inst = this.instruments[instIdx];
    if (!inst) return;

    // DMX volume curve: fold note-volume and channel-volume through the log
    // mapping table, giving the carrier attenuation (0..0x3f, 0 = loudest). The
    // modulator stays at its patch level (that's timbre, not loudness).
    const midiVol = 2 * (VOLUME_MAP[ch.volume & 0x7f] + 1);
    const full = (VOLUME_MAP[vol & 0x7f] * midiVol) >> 9; // 0..0x3f
    const carVolume = 0x3f - full; // carrier level register (attenuation)
    // Double-voice instruments (flag bit 2) stack two voices; DMX detunes the
    // second by (fineTune/2 - 64) freq-index units for the chorused fullness.
    for (let vi = 0; vi < inst.voices.length; vi++) {
      const voice = inst.voices[vi];
      const fineOffset = vi === 1 ? (inst.fineTune >> 1) - 64 : 0;
      this.loadVoice(midiCh, note, voice, inst, playNote, ch, carVolume, fineOffset);
    }
  }

  private loadVoice(midiCh: number, note: number, voice: OplVoice, inst: Instrument,
                    playNote: number, ch: MidiCh, carVolume: number, fineOffset: number): void {
    const v = this.alloc(midiCh, note);
    const bank = bankOf(v), c = chIn(v);
    const mSlot = bank | OPL_MOD[c], cSlot = bank | OPL_CAR[c];

    this.opl.write(0x20 + mSlot, voice.mod.char);
    // Reg 0x40 = KSL (scale byte bits 6-7) | output level (bits 0-5).
    this.opl.write(0x40 + mSlot, (voice.mod.scale & 0xc0) | (voice.mod.level & 0x3f));
    this.opl.write(0x60 + mSlot, voice.mod.attack);
    this.opl.write(0x80 + mSlot, voice.mod.sustain);
    this.opl.write(0xe0 + mSlot, voice.mod.wave);
    this.opl.write(0x20 + cSlot, voice.car.char);
    this.opl.write(0x40 + cSlot, (voice.car.scale & 0xc0) | (carVolume & 0x3f));
    this.opl.write(0x60 + cSlot, voice.car.attack);
    this.opl.write(0x80 + cSlot, voice.car.sustain);
    this.opl.write(0xe0 + cSlot, voice.car.wave);
    // Feedback/connection. (No L/R bits — OPL2 has no stereo routing; the channel
    // always outputs.)
    this.opl.write(bank | (0xc0 + c), voice.feedback);

    const useNote = (inst.flags & 1) ? inst.fixedNote : (playNote + voice.noteOffset);
    this.voices[v].useNote = useNote;
    this.voices[v].fineOffset = fineOffset;
    this.writeVoiceFreq(v, ch, true);
  }

  /** (Re)program a voice's frequency registers from its note + the channel bend. */
  private writeVoiceFreq(v: number, ch: MidiCh, keyOn: boolean): void {
    const bank = bankOf(v), c = chIn(v);
    const vc = this.voices[v];
    const val = this.freqForVoice(vc.useNote, ch.pitch + vc.fineOffset);
    const b0 = (val >> 8) & 0x1f; // fnum-high(2) | block(3), no key bit
    vc.b0 = b0;
    this.opl.write(bank | (0xa0 + c), val & 0xff);
    this.opl.write(bank | (0xb0 + c), (keyOn ? 0x20 : 0) | b0);
  }

  /** A pitch-bend changed: re-tune every note currently held on this channel. */
  private bendChannel(midiCh: number): void {
    const ch = this.chans[midiCh];
    for (let i = 0; i < NVOICES; i++) {
      if (this.voices[i].midiCh === midiCh) this.writeVoiceFreq(i, ch, true);
    }
  }

  private stopNote(midiCh: number, note: number): void {
    // Stop EVERY voice for this note (a double-voice note holds two).
    for (let i = 0; i < NVOICES; i++) {
      if (this.voices[i].midiCh === midiCh && this.voices[i].note === note) {
        this.opl.write(bankOf(i) | (0xb0 + chIn(i)), this.voices[i].b0);
        this.voices[i].midiCh = -1;
        this.voices[i].age = ++this.ageCounter; // mark release time for FIFO reuse
      }
    }
  }

  // --- MUS event stream ----------------------------------------------------
  private readTick(): void {
    // Process every event in this group (until one flags a following delay).
    for (;;) {
      if (this.pos >= this.score.length) { this.restartOrStop(); return; }
      const ev = this.score[this.pos++];
      const type = (ev >> 4) & 7;
      const chn = ev & 0xf;
      switch (type) {
        case 0: { // release note
          const note = this.score[this.pos++] & 0x7f;
          this.stopNote(chn, note);
          break;
        }
        case 1: { // play note
          const b = this.score[this.pos++];
          const note = b & 0x7f;
          let vol = 100;
          if (b & 0x80) vol = this.score[this.pos++] & 0x7f;
          this.startNote(chn, note, vol);
          break;
        }
        case 2: { // pitch bend (0..255, 128 = centre = ±2 semitones range)
          const amt = this.score[this.pos++];
          this.chans[chn].pitch = (amt >> 1) - 64; // MUS wheel -> DMX bend units
          this.bendChannel(chn); // re-tune held notes so the bend/vibrato is heard
          break;
        }
        case 3: this.pos++; break;           // system event
        case 4: {                            // controller
          const ctrl = this.score[this.pos++];
          const val = this.score[this.pos++];
          this.controller(chn, ctrl, val);
          break;
        }
        case 5: break;                       // end of measure
        case 6: this.restartOrStop(); return; // score end
        case 7: this.pos++; break;
      }
      if (ev & 0x80) { // last event of the group: a delay follows
        let d = 0, b: number;
        do { b = this.score[this.pos++]; d = d * 128 + (b & 0x7f); } while (b & 0x80);
        this.delay = d;
        return;
      }
    }
  }

  private controller(chn: number, ctrl: number, val: number): void {
    switch (ctrl) {
      case 0: this.chans[chn].instrument = val; break; // instrument (program) change
      case 3: this.chans[chn].volume = val; break;     // channel volume
      // pan (4), expression, etc. omitted for a first pass.
    }
  }

  private restartOrStop(): void {
    if (this.loop) { this.pos = 0; this.delay = 0; this.allNotesOff(); }
    else this.playing = false;
  }

  /** Render `out.length` mono samples, driving the 140 Hz tick clock. */
  generate(out: Float32Array): void {
    if (!this.playing) { out.fill(0); return; }
    let i = 0;
    while (i < out.length) {
      if (this.tickAcc <= 0) {
        // Process every event group whose delay has elapsed (a group can carry a
        // zero delay, meaning "also happens this tick"), THEN spend one tick. The
        // processing must NOT itself burn a tick, or every group drags the score
        // one tick slower — which smears the fast lead runs.
        while (this.playing && this.delay <= 0) this.readTick();
        this.delay--;
        this.tickAcc += this.samplesPerTick;
      }
      const n = Math.min(out.length - i, Math.ceil(this.tickAcc));
      this.opl.generate(out.subarray(i, i + n));
      i += n;
      this.tickAcc -= n;
    }
  }
}
