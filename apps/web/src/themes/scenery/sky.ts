import { SEASONS, type Season, type Sky } from '../seasons';

/**
 * The sky behind the scenery, drawn by one WebGL2 fragment shader (no library): a gradient from
 * the season's top colour to its horizon, then the season's own light —
 * spring: soft clouds drifting; summer: clouds and the sun's glow; autumn: the low sun and long
 * streaks of cloud; winter: stars twinkling and an aurora rippling.
 */
const VERTEX = `#version 300 es
in vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform int u_season;
uniform vec3 u_top;
uniform vec3 u_horizon;
out vec4 color;

// A hash without sin: stable on phones' GPUs.
float hash(vec2 p) {
  p = fract(p * vec2(0.1031, 0.1030));
  p += dot(p, p.yx + 33.33);
  return fract((p.x + p.y) * p.x);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Fractal noise: as many octaves as the detail needs (fewer is cheaper).
float fbm(vec2 p, int octaves) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    if (i >= octaves) break;
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec3 col = mix(u_horizon, u_top, smoothstep(0.05, 1.0, uv.y));

  if (u_season == 3) {
    // Winter dusk: stars twinkling high up, an aurora rippling in three soft bands.
    vec2 grid = uv * vec2(aspect, 1.0) * 140.0;
    float s = hash(floor(grid));
    // Round stars, whatever the canvas's resolution.
    float dist = length(fract(grid) - 0.5);
    float star = step(0.9965, s) * smoothstep(0.18, 0.05, dist) * (0.55 + 0.45 * sin(u_time * 2.0 + s * 60.0));
    col += vec3(star) * smoothstep(0.4, 0.85, uv.y);
    float band = 0.0;
    // Below the aurora, nothing to compute.
    if (uv.y > 0.5) for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float y = 0.66 + 0.07 * fi + 0.05 * sin(uv.x * 3.0 + u_time * 0.15 + fi * 1.7)
              + 0.05 * fbm(vec2(uv.x * 2.0 + u_time * 0.05, fi), 3);
      float d = uv.y - y;
      float curtain = exp(-d * d * 500.0) + 0.6 * exp(-max(d, 0.0) * 18.0) * step(0.0, d) * 0.4;
      band += curtain * (0.45 + 0.55 * fbm(vec2(uv.x * 7.0 - u_time * 0.12, fi * 3.0), 4));
    }
    col += band * mix(vec3(0.25, 0.95, 0.65), vec3(0.6, 0.45, 0.95), uv.x) * 0.5;
  } else if (u_season == 2) {
    // Autumn sunset: a low sun, its glow, long streaks of pink cloud.
    vec2 d = (uv - vec2(0.78, 0.52)) * vec2(aspect, 1.0);
    float r = length(d);
    col += vec3(1.0, 0.72, 0.38) * exp(-r * 2.5) * 0.7;
    col = mix(col, vec3(1.0, 0.92, 0.7), smoothstep(0.075, 0.065, r));
    float c = uv.y > 0.45 ? fbm(vec2(uv.x * 2.5 + u_time * 0.008, uv.y * 14.0), 4) : 0.0;
    col = mix(col, vec3(0.98, 0.66, 0.62), smoothstep(0.55, 0.8, c) * smoothstep(0.45, 0.8, uv.y) * 0.55);
  } else {
    // Spring and summer: soft round clouds drifting across.
    if (uv.y > 0.38) {
      vec2 p = vec2(uv.x * aspect * 1.4 + u_time * 0.01, uv.y * 2.6) * 0.8;
      float f = fbm(p, 4);
      // Flat cartoon clouds: a crisp edge, a soft shade underneath.
      float fade = smoothstep(0.38, 0.85, uv.y);
      float cloud = smoothstep(0.47, 0.51, f) * fade;
      float shade = smoothstep(0.47, 0.6, f) * (1.0 - smoothstep(0.55, 0.7, f));
      col = mix(col, vec3(1.0), cloud * 0.95);
      col = mix(col, vec3(0.86, 0.9, 0.97), shade * cloud * 0.35);
    }
    if (u_season == 1) {
      // Summer: the sun's warm glow, high on the left.
      float r = length((uv - vec2(0.1, 0.86)) * vec2(aspect, 1.0));
      col += vec3(1.0, 0.94, 0.7) * exp(-r * 4.0) * 0.45;
    }
  }
  color = vec4(col, 1.0);
}`;

const rgb = (hex: string): [number, number, number] => {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export interface SkyPainter {
  /** Draws one frame at `seconds`. */
  draw(seconds: number): void;
  setSeason(season: Season, sky: Sky): void;
  resize(width: number, height: number): void;
  destroy(): void;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** The sky's painter on `canvas`, or null where WebGL2 is missing (a CSS gradient stands in). */
export function createSkyPainter(canvas: HTMLCanvasElement): SkyPainter | null {
  if (typeof WebGL2RenderingContext === 'undefined') return null;
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
  if (!gl) return null;
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  const fail = () => {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    gl.deleteProgram(program);
    return null;
  };
  if (!vertex || !fragment || !program) return fail();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return fail();
  gl.useProgram(program);

  // One triangle covering the screen.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const at = (name: string) => gl.getUniformLocation(program, name);
  const u = {
    res: at('u_res'),
    time: at('u_time'),
    season: at('u_season'),
    top: at('u_top'),
    horizon: at('u_horizon'),
  };

  // Everything is set again on each frame (a few uniforms are cheap): a painter rebuilt by a
  // remount, or a context's program changed, never draws with a missing size or season.
  let width = 1;
  let height = 1;
  let state: { index: number; top: [number, number, number]; horizon: [number, number, number] } = {
    index: 0,
    top: [0, 0, 0],
    horizon: [0, 0, 0],
  };

  return {
    draw(seconds) {
      gl.useProgram(program);
      gl.uniform2f(u.res, width, height);
      gl.uniform1i(u.season, state.index);
      gl.uniform3fv(u.top, state.top);
      gl.uniform3fv(u.horizon, state.horizon);
      gl.uniform1f(u.time, seconds);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.dataset.painted = '';
    },
    setSeason(season, sky) {
      state = { index: SEASONS.indexOf(season), top: rgb(sky.top), horizon: rgb(sky.horizon) };
    },
    resize(w, h) {
      width = w;
      height = h;
      // A new size clears the canvas: only when it really changed.
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    },
    destroy() {
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteBuffer(buffer);
    },
  };
}
