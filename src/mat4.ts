// Just the 4x4 math this renderer uses: one perspective, one lookAt, one
// multiply. Column-major, WebGPU clip space (z in [0,1], not GL's [-1,1]).

export type Mat4 = Float32Array;

export function identity(): Mat4 {
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
}

/** Right-handed perspective with a [0,1] depth range. */
export function perspective(fovY: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0,  0,
    0,          f, 0,  0,
    0,          0, far * nf,        -1,
    0,          0, far * near * nf,  0,
  ]);
}

export function lookAt(eye: number[], target: number[], up: number[]): Mat4 {
  const z = norm(sub(eye, target));
  const x = norm(cross(up, z));
  const y = cross(z, x);
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
  ]);
}

export function multiply(a: Mat4, b: Mat4): Mat4 {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1]
                   + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

const sub = (a: number[], b: number[]): number[] => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const dot = (a: number[], b: ArrayLike<number>): number => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
const cross = (a: number[], b: number[]): number[] =>
  [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
function norm(v: number[]): number[] {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0]/l, v[1]/l, v[2]/l];
}
