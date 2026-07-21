// Ported from linuxdoom-1.10/w_wad.c
//
// Vanilla mmaps the file and hands out pointers into it. We keep the whole WAD
// as one ArrayBuffer and hand out subarray views — no copy per lump, and the
// views stay valid for the life of the WAD.

export interface Lump {
  name: string;
  pos: number;
  size: number;
}

export class Wad {
  readonly lumps: Lump[] = [];
  // Uint8Array<ArrayBuffer>, not the default Uint8Array<ArrayBufferLike>:
  // queue.writeTexture rejects a possibly-shared buffer, and subarray()
  // propagates whichever we pick here.
  private readonly bytes: Uint8Array<ArrayBuffer>;
  private readonly index = new Map<string, number>();

  constructor(buffer: ArrayBuffer) {
    this.bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);

    const magic = String.fromCharCode(...this.bytes.subarray(0, 4));
    if (magic !== 'IWAD' && magic !== 'PWAD') {
      throw new Error(`not a WAD (magic "${magic}")`);
    }

    const numLumps = view.getInt32(4, true);
    const dirOfs = view.getInt32(8, true);

    for (let i = 0; i < numLumps; i++) {
      const e = dirOfs + i * 16;
      // Lump names are 8 bytes, NUL-padded, and case-insensitive in vanilla.
      let name = '';
      for (let c = 0; c < 8; c++) {
        const ch = this.bytes[e + 8 + c];
        if (ch === 0) break;
        name += String.fromCharCode(ch);
      }
      name = name.toUpperCase();
      this.lumps.push({ name, pos: view.getInt32(e, true), size: view.getInt32(e + 4, true) });
      // Later lumps override earlier ones (w_wad.c: W_CheckNumForName scans
      // backwards), so an unconditional set leaves the last one winning.
      this.index.set(name, i);
    }
  }

  /** W_CheckNumForName — returns -1 if absent. */
  checkNumForName(name: string): number {
    const i = this.index.get(name.toUpperCase());
    return i === undefined ? -1 : i;
  }

  /** W_GetNumForName — throws if absent. */
  getNumForName(name: string): number {
    const i = this.checkNumForName(name);
    if (i < 0) throw new Error(`W_GetNumForName: ${name} not found`);
    return i;
  }

  /** W_CacheLumpNum — a view into the WAD, not a copy. Do not mutate. */
  lumpNum(num: number): Uint8Array<ArrayBuffer> {
    const l = this.lumps[num];
    if (!l) throw new Error(`W_CacheLumpNum: ${num} out of range`);
    return this.bytes.subarray(l.pos, l.pos + l.size);
  }

  /** W_CacheLumpName */
  lump(name: string): Uint8Array<ArrayBuffer> {
    return this.lumpNum(this.getNumForName(name));
  }
}
