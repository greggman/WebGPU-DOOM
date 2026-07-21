// Decodes the GENMIDI lump — DOOM's table of OPL2 instrument patches, one per
// General MIDI program (128 melodic) plus the percussion voices (128..174).
// Each patch is two operators (a modulator and a carrier) of raw OPL register
// bytes, which the music player loads into a channel when a note starts.

export interface OplVoice {
  mod: OplOp;
  car: OplOp;
  feedback: number;  // reg 0xC0 (feedback<<1 | connection)
  noteOffset: number; // s16, added to the MIDI note
}
export interface OplOp {
  char: number;   // reg 0x20 (tremolo/vibrato/sustain/ksr/mult)
  attack: number; // reg 0x60
  sustain: number; // reg 0x80
  wave: number;   // reg 0xE0
  scale: number;  // GENMIDI "scale" byte: KSL already in bits 6-7 (reg 0x40 top)
  level: number;  // output level, reg 0x40 bottom 6 bits
}

export interface Instrument {
  flags: number;   // bit0 = fixed pitch, bit2 = double voice
  fineTune: number;
  fixedNote: number;
  voices: OplVoice[]; // 1 or 2 (double voice)
}

function readOp(d: DataView, o: number): OplOp {
  return {
    char: d.getUint8(o),
    attack: d.getUint8(o + 1),
    sustain: d.getUint8(o + 2),
    wave: d.getUint8(o + 3),
    scale: d.getUint8(o + 4),
    level: d.getUint8(o + 5),
  };
}

function readVoice(d: DataView, o: number): OplVoice {
  return {
    mod: readOp(d, o),
    feedback: d.getUint8(o + 6),
    car: readOp(d, o + 7),
    // byte 13 unused; 14..15 the signed note offset.
    noteOffset: d.getInt16(o + 14, true),
  };
}

export function parseGenmidi(lump: Uint8Array): Instrument[] {
  const d = new DataView(lump.buffer, lump.byteOffset, lump.byteLength);
  // 8-byte "#OPL_II#" header, then 175 records of 36 bytes.
  const out: Instrument[] = [];
  for (let i = 0; i < 175; i++) {
    const base = 8 + i * 36;
    const flags = d.getUint16(base, true);
    const inst: Instrument = {
      flags,
      fineTune: d.getUint8(base + 2),
      fixedNote: d.getUint8(base + 3),
      voices: [readVoice(d, base + 4)],
    };
    if (flags & 4) inst.voices.push(readVoice(d, base + 20)); // double voice
    out.push(inst);
  }
  return out;
}
