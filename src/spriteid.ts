// Category IDs written into the G-buffer so post-process effects can recolour by
// kind (enemies vs pickups vs the HUD, etc.). To avoid a whole extra render
// target, the category is encoded in the NORMAL VECTOR'S MAGNITUDE: world normals
// are unit length (SID_WORLD = 1), and sprites/HUD scale their normal by the
// category. The post-process harness recovers it as
//   iSpriteId(uv) = round(length(iNormal0(uv)))
// and iNormal0 callers already normalize, so shading is unaffected. (This extends
// the existing length-2 = "is a sprite" flag; iSprite stays `length > 1.5`.)
//
// Values 1..7 stay well within f16 precision at these magnitudes; a 1px seam at
// category boundaries (the linear sampler) is invisible.
export const SID_WORLD = 1;   // walls / floors / sky (unit normal)
export const SID_ENEMY = 2;   // monsters (MF_COUNTKILL)
export const SID_POWERUP = 3; // pickups / powerups (MF_SPECIAL)
export const SID_EFFECT = 4;  // puffs, blood, projectiles, fog, decorations
export const SID_HUD = 5;     // status bar background / face / arms / keys
export const SID_HUDNUM = 6;  // status-bar digits
export const SID_WEAPON = 7;  // the player's on-screen weapon (psprite)
