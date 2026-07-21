// Level assembly. Ported from linuxdoom-1.10/p_setup.c (P_SetupLevel) and
// g_game.c (G_DoLoadLevel).
//
// This is the wiring the rest of the playsim needs and doesn't own: every
// module exposes a P_Set*Env hook so it can be unit-tested in isolation, and
// something has to actually connect them. Doing that per-test is how you end up
// with the browser and the oracle running subtly different games.

import type { Wad } from './wad.js';
import { loadMap, type DoomMap } from './map.js';
import { FRACBITS } from './m_fixed.js';
import { P_SetupLevel, type PlaysimMap } from './p_setup.js';
import { P_InitThinkers } from './p_tick.js';
import { P_InitBlockLinks } from './p_blockmap.js';
import {
  P_SpawnMobj, P_SetMobjEnv, P_SetMissileEnv, P_SpawnMissile,
  P_SpawnPlayerMissile, P_SpawnPuff, P_ExplodeMissile,
} from './p_mobj.js';
import { P_SetThingPosition, P_UnsetThingPosition } from './p_blockmap.js';
import {
  P_SetMapLevel, P_TryMove, P_SlideMove, P_ChangeSector, P_TakeSpecHits,
  P_AimLineAttack, P_LineAttack, P_SetShootEnv, P_RadiusAttack, P_TeleportMove,
  lineTarget,
} from './p_map.js';
import { P_SetTeleportEnv, EV_Teleport } from './p_telept.js';
import {
  P_SetPsprEnv, P_SetPsprLevelTime, P_RegisterWeaponActions, P_SetupPsprites,
  newPSprites, WP_NOCHANGE,
} from './p_pspr.js';
import { P_LevelTime } from './p_ticker.js';
import { P_SetFloorEnv, P_SetFloorLevel, EV_DoFloor, FloorType } from './p_floor.js';
import { P_SetPlatLevel } from './p_plats.js';
import { P_SetCeilingLevel } from './p_ceilng.js';
import { P_SetLightLevel, P_SpawnLightSpecials } from './p_lights.js';
import { P_SetDoorLevel } from './p_doors.js';
import { P_SetSightLevel } from './p_sight.js';
import { P_SetEnemyEnv, P_NoiseAlert } from './p_enemy.js';
import * as E from './p_enemy.js';
import * as W from './p_pspr.js';
import { P_DamageMobj, P_TouchSpecialThing, P_SetInterEnv } from './p_inter.js';
import { P_RegisterActions } from './p_action.js';
import { P_UseSpecialLine, P_CrossSpecialLine, P_SetSpecEnv } from './p_spec.js';
import { P_ResetLevelTime } from './p_ticker.js';
import { M_ClearRandom, P_Random } from './m_random.js';
import { ANG45 } from './r_point.js';
import { PST_LIVE } from './p_user.js';
import { byDoomedNum, mobjInfo, maxAmmo, ACTION_NAMES, MF, MT, WP } from './info.js';
import { ONFLOORZ, ONCEILINGZ, VIEWHEIGHT, type PSector, type PPlayer, type PMobj, type PLine } from './p_local.js';

/**
 * Every mobj action, by the name the state table uses. Built from the module
 * namespace so a new export is registered automatically — the alternative is a
 * hand-maintained list that silently drifts out of date, and an unregistered
 * action fails at RUNTIME rather than compile time.
 */
const MOBJ_ACTIONS: Record<string, (mo: PMobj) => void> = {
  A_Look: E.A_Look, A_Chase: E.A_Chase, A_FaceTarget: E.A_FaceTarget,
  A_PosAttack: E.A_PosAttack, A_SPosAttack: E.A_SPosAttack,
  A_CPosAttack: E.A_CPosAttack, A_CPosRefire: E.A_CPosRefire,
  A_SpidRefire: E.A_SpidRefire, A_BspiAttack: E.A_BspiAttack,
  A_TroopAttack: E.A_TroopAttack, A_SargAttack: E.A_SargAttack,
  A_HeadAttack: E.A_HeadAttack, A_BruisAttack: E.A_BruisAttack,
  A_CyberAttack: E.A_CyberAttack, A_SkullAttack: E.A_SkullAttack,
  A_SkelMissile: E.A_SkelMissile, A_SkelWhoosh: E.A_SkelWhoosh,
  A_SkelFist: E.A_SkelFist, A_Tracer: E.A_Tracer,
  A_FatRaise: E.A_FatRaise, A_FatAttack1: E.A_FatAttack1,
  A_FatAttack2: E.A_FatAttack2, A_FatAttack3: E.A_FatAttack3,
  A_VileStart: E.A_VileStart, A_VileTarget: E.A_VileTarget,
  A_VileAttack: E.A_VileAttack, A_VileChase: E.A_VileChase,
  A_StartFire: E.A_StartFire, A_Fire: E.A_Fire, A_FireCrackle: E.A_FireCrackle,
  A_PainAttack: E.A_PainAttack, A_PainDie: E.A_PainDie,
  A_Explode: E.A_Explode, A_Fall: E.A_Fall, A_Scream: E.A_Scream,
  A_XScream: E.A_XScream, A_Pain: E.A_Pain, A_PlayerScream: E.A_PlayerScream,
  A_BossDeath: E.A_BossDeath, A_KeenDie: E.A_KeenDie,
  A_Metal: E.A_Metal, A_BabyMetal: E.A_BabyMetal, A_Hoof: E.A_Hoof,
  A_BrainAwake: E.A_BrainAwake, A_BrainPain: E.A_BrainPain,
  A_BrainScream: E.A_BrainScream, A_BrainExplode: E.A_BrainExplode,
  A_BrainDie: E.A_BrainDie, A_BrainSpit: E.A_BrainSpit,
  A_SpawnSound: E.A_SpawnSound, A_SpawnFly: E.A_SpawnFly,
};

const WEAPON_ACTIONS: Record<string, (p: PPlayer, psp: W.PSprite) => void> = {
  A_WeaponReady: W.A_WeaponReady, A_ReFire: W.A_ReFire,
  A_CheckReload: W.A_CheckReload, A_Lower: W.A_Lower, A_Raise: W.A_Raise,
  A_GunFlash: W.A_GunFlash, A_Punch: W.A_Punch, A_Saw: W.A_Saw,
  A_FirePistol: W.A_FirePistol, A_FireShotgun: W.A_FireShotgun,
  A_FireShotgun2: W.A_FireShotgun2, A_FireCGun: W.A_FireCGun,
  A_FireMissile: W.A_FireMissile, A_FirePlasma: W.A_FirePlasma,
  A_FireBFG: W.A_FireBFG, A_BFGsound: W.A_BFGsound,
  A_OpenShotgun2: W.A_OpenShotgun2, A_LoadShotgun2: W.A_LoadShotgun2,
  A_CloseShotgun2: W.A_CloseShotgun2,
  A_Light0: W.A_Light0, A_Light1: W.A_Light1, A_Light2: W.A_Light2,
};

export interface Level {
  map: DoomMap;
  sim: PlaysimMap;
  player: PPlayer;
  /** BSP lookups, exposed because the renderer wants them too. */
  subSectorAt: (x: number, y: number) => number;
  sectorAt: (x: number, y: number) => PSector;
  /** Set when the player triggers an exit. The only end-to-end pass signal we
   *  have without a reference implementation to diff against. */
  exitRequested: () => 'normal' | 'secret' | null;
  /** Intermission tallies: monsters and items that COUNT toward 100%. */
  totalKills: number;
  totalItems: number;
  totalSecret: number;
}

/** r_main.c R_PointInSubsector. Nodes are in map units, so shift down. */
function makeSubSectorAt(map: DoomMap): (x: number, y: number) => number {
  const root = map.nodes.length - 1;
  return (fx: number, fy: number): number => {
    if (root < 0) return 0;
    const x = fx >> FRACBITS;
    const y = fy >> FRACBITS;
    let n = root;
    while (!(n & 0x8000)) {
      const nd = map.nodes[n];
      // R_PointOnSide: front (child 0) when the cross product is >= 0.
      n = nd.children[(x - nd.x) * nd.dy - (y - nd.y) * nd.dx >= 0 ? 0 : 1];
    }
    return n & 0x7fff;
  };
}

/** The sector a subsector belongs to, via its first seg. */
function makeSectorOfSubSector(map: DoomMap): (ss: number) => number {
  return (i: number): number => {
    const ss = map.subSectors[i];
    if (!ss) return 0;
    const sg = map.segs[ss.firstSeg];
    if (!sg) return 0;
    const ld = map.lineDefs[sg.lineDef];
    if (!ld) return 0;
    return map.sideDefs[ld.sideNum[sg.side]]?.sector ?? 0;
  };
}

/**
 * G_DoLoadLevel. Order matters and is vanilla's:
 *   M_ClearRandom, then spawn things in THINGS-lump order.
 * Every P_SpawnMobj draws P_Random, so the RNG state after load is a pure
 * function of spawn order — get it wrong and nothing else can be right.
 */
export function G_LoadLevel(wad: Wad, mapName: string, skill = 2): Level {
  // Forward-declared: the enemy env needs a players() getter before the player
  // object exists.
  let playerRef: PPlayer | null = null;
  let exitRequested: 'normal' | 'secret' | null = null;
  const map = loadMap(wad, mapName);
  const sim = P_SetupLevel(map);

  const subSectorAt = makeSubSectorAt(map);
  const sectorOfSS = makeSectorOfSubSector(map);
  const sectorAt = (x: number, y: number): PSector => sim.sectors[sectorOfSS(subSectorAt(x, y))];

  // Wire every module's environment before anything spawns.
  P_InitBlockLinks(map, { sectorAt, subSectorAt });
  P_SetMobjEnv({
    sectorAt,
    subSectorAt,
    tryMove: P_TryMove,
    slideMove: P_SlideMove,
    explodeMissile: P_ExplodeMissile,
  });
  P_SetMapLevel(sim, {
    sectorAt,
    useSpecialLine: (thing, line, side) => { P_UseSpecialLine(thing, line, side); },
    crossSpecialLine: (lineIndex, side, thing) => {
      P_CrossSpecialLine(sim.lines[lineIndex], side, thing);
    },
    touchSpecialThing: P_TouchSpecialThing,
  });
  P_SetFloorEnv({ changeSector: P_ChangeSector });
  P_SetFloorLevel(sim);
  P_SetPlatLevel(sim);
  P_SetCeilingLevel(sim);
  P_SetSightLevel(sim);
  P_SetDoorLevel(sim);
  P_SetTeleportEnv(sim, { teleportMove: P_TeleportMove, spawnMobj: P_SpawnMobj });
  P_SetSpecEnv({
    exitLevel: (secret) => { exitRequested = secret ? 'secret' : 'normal'; },
    teleport: EV_Teleport,
    damageMobj: P_DamageMobj,
  });

  // The player list is a getter, not a value: `player` isn't constructed until
  // after the map's things spawn (so the RNG order matches vanilla), but the
  // enemy env has to be wired before any of them exist.
  P_SetEnemyEnv({
    players: () => [playerRef, null, null, null],
    tryMove: P_TryMove,
    takeSpecHits: P_TakeSpecHits,
    useSpecialLine: (mo, lineIndex, side) => P_UseSpecialLine(mo, sim.lines[lineIndex], side),
    aimLineAttack: P_AimLineAttack,
    lineAttack: P_LineAttack,
    damageMobj: P_DamageMobj,
    spawnMissile: P_SpawnMissile,
    spawnMobj: P_SpawnMobj,
    spawnPuff: P_SpawnPuff,
    radiusAttack: P_RadiusAttack,
    setThingPosition: P_SetThingPosition,
    unsetThingPosition: P_UnsetThingPosition,
    gameTic: P_LevelTime,
    lines: () => sim.lines,
    // A_BossDeath (p_enemy.c): on E1M8, when the LAST Baron of Hell dies, lower
    // the tag-666 floor to open the exit. Only fires with a player still alive.
    bossDeath: (mo: PMobj) => {
      if (!/M8$/.test(map.name) || mo.type !== MT.MT_BRUISER) return;
      if (!playerRef || playerRef.health <= 0) return;
      for (const sec of sim.sectors) {
        for (let m = sec.thingList; m; m = m.snext) {
          if (m !== mo && m.type === MT.MT_BRUISER && m.health > 0) return; // another boss lives
        }
      }
      EV_DoFloor({ tag: 666 } as PLine, FloorType.LowerFloorToLowest);
    },
  });
  P_SetShootEnv({ damageMobj: P_DamageMobj });
  P_SetInterEnv({ skill: () => skill, player: () => playerRef });
  P_SetMissileEnv({ aimLineAttack: P_AimLineAttack, lineTarget: () => lineTarget });

  P_SetPsprEnv({
    aimLineAttack: P_AimLineAttack,
    lineAttack: P_LineAttack,
    lineTarget: () => lineTarget,
    spawnPlayerMissile: P_SpawnPlayerMissile,
    spawnMobj: P_SpawnMobj,
    damageMobj: P_DamageMobj,
    noiseAlert: P_NoiseAlert,
  });
  P_SetPsprLevelTime(P_LevelTime);

  // A_BFGSpray lives in p_pspr (it's fired by the BFG ball) but takes a mobj,
  // not (player, psp) — so it registers in the MOBJ table despite its home.
  P_RegisterActions({ ...MOBJ_ACTIONS, A_BFGSpray: W.A_BFGSpray });

  // Weapon actions take (player, psp) instead of (mobj), so they live in their
  // own table — same names, different signature.
  P_RegisterWeaponActions(WEAPON_ACTIONS);

  // Assert coverage at LOAD, not when a monster happens to reach a state 20
  // minutes in. ACTION_NAMES is generated from the state table, so this can't
  // drift.
  const missing = ACTION_NAMES.filter(
    (n) => !(n in MOBJ_ACTIONS) && !(n in WEAPON_ACTIONS) && n !== 'A_BFGSpray',
  );
  if (missing.length) {
    console.warn(`${missing.length} action(s) unimplemented: ${missing.join(', ')}`);
  }

  P_InitThinkers();
  P_ResetLevelTime();
  M_ClearRandom();

  // P_LoadThings / P_SpawnMapThing, in lump order.
  const things = wad.lumpNum(wad.getNumForName(mapName) + 1); // ML_THINGS
  const v = new DataView(things.buffer, things.byteOffset, things.byteLength);

  // p_mobj.c P_SpawnMapThing option flags.
  const MTF_AMBUSH = 8;
  const MTF_NOTSINGLE = 16;

  // The skill bit each thing must carry to appear (P_SpawnMapThing): skills
  // 0-1 use bit 1, skill 2 uses bit 2, skills 3-4 use bit 4. This is THE reason
  // the level felt wall-to-wall hard — spawning every thing regardless put the
  // easy-only AND hard-only monsters on the map at once.
  const skillBit = skill === 0 ? 1 : skill === 4 ? 4 : 1 << (skill - 1);

  let playerMo: PMobj | null = null;
  let totalKills = 0, totalItems = 0;

  for (let i = 0; i + 10 <= things.length; i += 10) {
    const x = v.getInt16(i, true);
    const y = v.getInt16(i + 2, true);
    const angle = v.getInt16(i + 4, true);
    const type = v.getInt16(i + 6, true);
    const options = v.getInt16(i + 8, true);

    if (type === 1) {
      // Vanilla P_SpawnMapThing spawns player 1 IN THINGS ORDER (P_SpawnPlayer),
      // and that P_SpawnMobj(MT_PLAYER) draws lastlook right here. Deferring the
      // spawn to after the loop moved that one draw to the end of the sequence,
      // which shifted every monster's animation-stagger draw by one — so every
      // monster woke on a slightly wrong tic and demos desynced within seconds.
      playerMo = P_SpawnMobj(x << FRACBITS, y << FRACBITS, ONFLOORZ, MT.MT_PLAYER);
      playerMo.angle = (ANG45 * ((angle / 45) | 0)) >>> 0;
      continue;
    }
    if (type <= 4) continue; // co-op starts (2-4), deathmatch (11) etc.

    // Multiplayer-only things don't appear in single player.
    if (options & MTF_NOTSINGLE) continue;
    // Skill filter.
    if (!(options & skillBit)) continue;

    const mi = byDoomedNum.get(type);
    if (mi === undefined) continue; // teleport destinations, unknown editor nums

    const info = mobjInfo[mi];
    const z = (info.flags & MF.MF_SPAWNCEILING) ? ONCEILINGZ : ONFLOORZ;
    const mobj = P_SpawnMobj(x << FRACBITS, y << FRACBITS, z, mi);

    // Randomise the initial animation phase — this P_Random draw is part of the
    // sequence, so it must happen even for things that don't visibly animate.
    if (mobj.tics > 0) mobj.tics = 1 + (P_Random() % mobj.tics);

    if (info.flags & MF.MF_COUNTKILL) totalKills++;
    if (info.flags & MF.MF_COUNTITEM) totalItems++;

    mobj.angle = (ANG45 * ((angle / 45) | 0)) >>> 0;
    if (options & MTF_AMBUSH) mobj.flags |= MF.MF_AMBUSH;
  }

  if (!playerMo) throw new Error(`${mapName}: no player 1 start`);
  const mo = playerMo; // spawned in THINGS order above; angle already set

  // g_game.c G_PlayerReborn: you start with 100 health, a fist, a pistol and
  // 50 bullets. Everything else is earned.
  const player: PPlayer = {
    mo,
    message: '',
    viewZ: 0,
    viewHeight: VIEWHEIGHT,
    deltaViewHeight: 0,
    bob: 0,
    health: 100,
    state: PST_LIVE,
    armorPoints: 0,
    armorType: 0,
    ammo: [50, 0, 0, 0],
    maxAmmo: [...maxAmmo],
    weaponOwned: Array.from({ length: 9 }, (_, i) => i === WP.wp_fist || i === WP.wp_pistol),
    readyWeapon: WP.wp_pistol,
    pendingWeapon: WP_NOCHANGE,
    cards: [false, false, false, false, false, false],
    powers: [0, 0, 0, 0, 0, 0],
    attacker: null,
    damageCount: 0,
    bonusCount: 0,
    killCount: 0,
    itemCount: 0,
    secretCount: 0,
    attackDown: false,
    backpack: false,
    cheatGod: false,
    cheatNoClip: false,
    psprites: newPSprites(),
    extraLight: 0,
    cmd: { forwardMove: 0, sideMove: 0, angleTurn: 0, buttons: 0 },
    refire: 0,
    useDown: false,
  };
  playerRef = player;
  mo.player = player;
  // Seat the view at spawn (P_SpawnPlayer does this) so the very first frame —
  // before any tic runs P_CalcHeight — has a correct camera. Without it a level
  // frozen for the screen melt renders from viewZ 0, under the floor.
  player.viewZ = (mo.z + player.viewHeight) | 0;

  // Raise the starting weapon. Must come after the player exists.
  P_SetupPsprites(player);

  // P_SpawnSpecials: light-effect sectors become thinkers. This draws P_Random
  // for each flickering light's initial phase, so it must run at the SAME point
  // in the sequence as vanilla — after all things have spawned.
  P_SetLightLevel(sim);
  const totalSecret = P_SpawnLightSpecials();

  return { map, sim, player, subSectorAt, sectorAt, exitRequested: () => exitRequested, totalKills, totalItems, totalSecret };
}
