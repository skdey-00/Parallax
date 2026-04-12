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
  FRICTION: 0.80,
  MAX_HEALTH: 3,
  INVULNERABILITY_TIME: 2.0,  // Seconds of invincibility after damage
  DAMAGE_COOLDOWN: 0.5       // Minimum time between damage from same enemy
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

export const INTRO_SLIDES: Slide[] = [
  {
    title: 'ANOMALY DETECTED',
    subtitle: 'Sector 7 // Deep Space Monitoring Array',
    content: [
      'Date: 2147.08.15',
      'Something appeared in the void between stars.',
      'Not matter. Not energy.',
      'Something... else.'
    ],
    color: '#40C0FF',
    effect: 'typewriter'
  },
  {
    title: 'THE VEIL',
    subtitle: 'It exists between layers of reality',
    content: [
      'We cannot touch it directly.',
      'We cannot see it with normal sensors.',
      'It only reveals itself when we',
      'change our perspective.'
    ],
    color: '#FFB000',
    effect: 'glitch'
  },
  {
    title: 'CONVERGENCE',
    subtitle: 'The only way to fight back',
    content: [
      'By aligning our perception with its position',
      'we can force it into our reality.',
      'Where it can be destroyed.',
      'This is the Parallax Protocol.'
    ],
    color: '#FF0040',
    effect: 'fade'
  },
  {
    title: 'YOU ARE THE WEAPON',
    subtitle: 'Pilot // Convergence Engine',
    content: [
      'Your movement through space aligns the sensors.',
      'Your awareness detects the anomalies.',
      'Your fire destroys the threat.',
      'The Veil cannot hide forever.'
    ],
    color: '#40C0FF',
    effect: 'typewriter'
  },
  {
    title: 'INITIALIZE',
    subtitle: 'Press SPACE or CLICK to begin',
    content: [
      'The fate of all reality depends on',
      'your ability to see the truth.',
      '',
      'Good luck, Pilot.'
    ],
    color: '#FFB000',
    effect: 'glitch'
  }
];

export interface Slide {
  title: string;
  subtitle: string;
  content: string[];
  color: string;
  effect: 'none' | 'glitch' | 'typewriter' | 'fade';
}

export const INTRO_TIMING = {
  SLIDE_DURATION: 6000,
  TYPEWRITER_SPEED: 30,
  FADE_DURATION: 1000
};
