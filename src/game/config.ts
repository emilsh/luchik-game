// Константы мира и физики. Подобраны под шестилетнего игрока:
// прыжок ~160 px в высоту и ~250 px в длину на полной скорости,
// поэтому все ямы в уровнях не шире 170 px, а ступени не выше 115 px.

export const WORLD_H = 720;
export const GROUND_Y = 600;
/** Насколько ниже экрана нужно упасть, чтобы вернуться на контрольную точку. */
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
  /** Прыжок ещё разрешён спустя столько мс после схода с края. */
  coyoteMs: 120,
  /** Нажатие прыжка до приземления запоминается на столько мс. */
  jumpBufferMs: 160,
};

export const PLAYER_BODY = { w: 40, h: 82 };

/** Разрешение растеризации SVG-спрайтов (кратно логическому размеру). */
export const TEX_RES = 3;

/** Радиус, в котором лампа подбирает звёзды и предметы. */
export const PICKUP_RADIUS = 52;
