// Parses a MUS lump header. MUS is DOOM's compact MIDI-like score format: a
// 16-byte header, an instrument list, then a byte stream of events the player
// walks at 140 Hz. We only pull the header here; the player reads events
// straight from the score bytes with a cursor.

export interface MusScore {
  score: Uint8Array;   // the event stream (starts at scoreStart)
  instruments: number[];
}

export function parseMus(lump: Uint8Array): MusScore | null {
  if (lump.length < 16 || lump[0] !== 0x4d || lump[1] !== 0x55 || lump[2] !== 0x53) return null; // "MUS"
  const d = new DataView(lump.buffer, lump.byteOffset, lump.byteLength);
  const scoreLen = d.getUint16(4, true);
  const scoreStart = d.getUint16(6, true);
  const instrCount = d.getUint16(12, true);

  const instruments: number[] = [];
  for (let i = 0; i < instrCount; i++) instruments.push(d.getUint16(16 + i * 2, true));

  return {
    score: lump.subarray(scoreStart, scoreStart + scoreLen),
    instruments,
  };
}
