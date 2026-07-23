// Category IDs written into the G-buffer so post-process effects can recolour by
// kind (enemies vs pickups vs the HUD, etc.). The category is packed (with the
// mobj type, flip, and rotation) into the rgba16uint meta target — see
// game.ts buildSprites and the pass shaders — and read point-sampled in
// post-process via iSpriteCategory(uv) / iSpriteType(uv) / iSpriteFlip(uv).
// Integer + point-sampled, so the ids are exact and crisp at silhouettes.
export const SID_WORLD = 1;   // walls / floors / sky (unit normal)
export const SID_ENEMY = 2;   // monsters (MF_COUNTKILL)
export const SID_POWERUP = 3; // pickups / powerups (MF_SPECIAL)
export const SID_EFFECT = 4;  // puffs, blood, projectiles, fog, decorations
export const SID_HUD = 5;     // status bar background / face / arms / keys
export const SID_HUDNUM = 6;  // status-bar digits
export const SID_WEAPON = 7;  // the player's on-screen weapon (psprite)
