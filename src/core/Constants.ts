export const COLORS = {
  VOID_BLACK: 0x000000,
  WIREFRAME_WHITE: 0xffffff,
  AMBER: 0xFFB000,
  THREAT_RED: 0xFF0040,
  DEPTH_BLUE: 0x40C0FF,
  GRID_FAINT: 0x1a1a1a
};

export const DEPTH = {
  NEAR: -200,
  FAR: 80,
  PLAYER_Z: 0
};

export const CONVERGENCE = {
  THRESHOLD: 0.70,        // When to count as converged (lowered for easier aiming)
  LOCK_THRESHOLD: 0.50,   // When to show lock indicator
  HIT_ZONE: 0.35          // Hit zone radius (larger = easier to hit)
};

export const PLAYER = {
  SPEED: 400,
  SIZE: 2,
  FRICTION: 0.80
};

export const ENEMY = {
  BASE_SPEED: 15,
  BASE_Z_SPEED: 20,
  SIZE: 20
};

export const WAVES = {
  ACT_1_END: 3,
  ACT_2_END: 7
};

export const ACT_NARRATIONS = {
  1: [
    "INITIALIZE. The Veil has been detected in sector 7.",
    "Convergence sensors calibrated. Engage.",
    "Pattern detected. The Veil adapts to your approach."
  ],
  2: [
    "ESCALATION. The Veil is learning your convergence patterns.",
    "Multiple entities detected. Depth deception active.",
    "Warning: Echo signatures detected. The Veil is projecting decoys."
  ],
  3: [
    "COLLAPSE. Critical mass approaching. Full sensor array deployed.",
    "The Veil is everywhere. Trust only convergence.",
    "Final sector. The truth lies in alignment."
  ]
};
