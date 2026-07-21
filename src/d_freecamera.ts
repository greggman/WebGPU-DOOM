// Browser-only free-fly ("spectator") camera: detach the view from the player
// and fly around a level. WASD moves, the mouse looks (pointer lock), Q/E drop
// and rise, Shift flies faster. Toggled from the console (`freecam`).
//
// It only reads the render camera's coordinate convention and writes an eye /
// target for the renderer — it never touches playsim state, so the simulation
// keeps ticking underneath and demos are unaffected. Unlike DOOM's software
// renderer this pipeline is true 3D, so the free camera can pitch up and down.

type Vec3 = [number, number, number];

const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ShiftLeft', 'ShiftRight']);

export interface FreeCamera {
  active: boolean;
  /** Toggle on/off. When enabling, start from the given eye and yaw (radians). */
  toggle(eye: Vec3, yawRad: number): void;
  /** Feed a movement key. Returns true if consumed (only while active). */
  key(code: string, down: boolean): boolean;
  /** Feed a relative mouse move (pointer lock) for look. */
  mouse(dx: number, dy: number): void;
  /** Advance by dt seconds (applies held movement keys). */
  update(dtSec: number): void;
  /** Eye and look-at target for the renderer's lookAt. */
  view(): { eye: Vec3; target: Vec3 };
}

export function createFreeCamera(): FreeCamera {
  const pos: Vec3 = [0, 0, 0];
  let yaw = 0, pitch = 0;
  const held = new Set<string>();

  const fam: FreeCamera = {
    active: false,
    toggle(eye, yawRad) {
      fam.active = !fam.active;
      if (fam.active) {
        pos[0] = eye[0]; pos[1] = eye[1]; pos[2] = eye[2];
        yaw = yawRad; pitch = 0;
        held.clear();
      }
    },
    key(code, down) {
      if (!fam.active || !MOVE_KEYS.has(code)) return false;
      if (down) held.add(code); else held.delete(code);
      return true;
    },
    mouse(dx, dy) {
      if (!fam.active) return;
      yaw -= dx * 0.002;
      pitch -= dy * 0.002;
      const lim = Math.PI / 2 - 0.01;
      pitch = Math.max(-lim, Math.min(lim, pitch));
    },
    update(dt) {
      if (!fam.active) return;
      const fast = held.has('ShiftLeft') || held.has('ShiftRight');
      const speed = (fast ? 900 : 400) * dt; // map units / second
      // Match the renderer's forward (cos yaw, 0, -sin yaw); right is +90°.
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      let f = 0, r = 0, u = 0;
      if (held.has('KeyW')) f += 1;
      if (held.has('KeyS')) f -= 1;
      if (held.has('KeyD')) r += 1;
      if (held.has('KeyA')) r -= 1;
      if (held.has('KeyE')) u += 1;
      if (held.has('KeyQ')) u -= 1;
      pos[0] += (cy * f + sy * r) * speed;
      pos[2] += (-sy * f + cy * r) * speed;
      pos[1] += u * speed;
    },
    view() {
      const cp = Math.cos(pitch), sp = Math.sin(pitch);
      const fx = Math.cos(yaw) * cp, fy = sp, fz = -Math.sin(yaw) * cp;
      return { eye: [pos[0], pos[1], pos[2]], target: [pos[0] + fx, pos[1] + fy, pos[2] + fz] };
    },
  };
  return fam;
}
