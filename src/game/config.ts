// World and physics constants. Tuned for a six-year-old player:
// a jump is ~160 px high and ~250 px long at full speed,
// so all pits in levels are no wider than 170 px and steps no taller than 115 px.

export const WORLD_H = 720;
export const GROUND_Y = 600;
/** How far below the screen the player must fall to return to the checkpoint. */
export const FALL_LIMIT = WORLD_H + 140;

export const PHYS = {
  gravity: 1500,
  runSpeed: 270,
  accelGround: 2400,
  accelAir: 1600,
  decelGround: 2800,
  decelAir: 1000,
  jumpVelocity: 690,
  maxFall: 950,
  /** A jump is still allowed this many ms after walking off an edge. */
  coyoteMs: 120,
  /** A jump press before landing is remembered for this many ms. */
  jumpBufferMs: 160,
};

export const PLAYER_BODY = { w: 40, h: 82 };

/** Rasterization resolution of SVG sprites (a multiple of the logical size). */
export const TEX_RES = 3;

/** Radius within which the lamp picks up stars and items. */
export const PICKUP_RADIUS = 52;
