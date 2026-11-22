// The Velvet Vault — shared constants and the three room layouts.
// Every room is a 1280x720 top-down floor plan: walls and display cases are
// solid rectangles, loot sits on pedestals, and the exit is a door the thief
// can only use once every loot piece in the room is collected.

export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

export const THIEF_RADIUS = 14;
export const THIEF_WALK_SPEED = 165;
export const THIEF_SNEAK_SPEED = 92;
export const GUARD_PATROL_SPEED = 68;
export const GUARD_CHASE_SPEED = 138;
export const GUARD_RADIUS = 15;

export const GUARD_CONE_RANGE = 195;
export const GUARD_CONE_HALF_ANGLE = 0.61; // ~35 degrees each side
export const CAMERA_CONE_RANGE = 235;
export const CAMERA_CONE_HALF_ANGLE = 0.52; // ~30 degrees each side

export const GUARD_ALARM_RATE = 30; // alarm points per second, point blank
export const CAMERA_ALARM_RATE = 36;
export const ALARM_DECAY_RATE = 7;
export const ALARM_CHASE_THRESHOLD = 60;
export const ALARM_CAUGHT = 100;

export const COIN_THROW_RANGE = 300;
export const COIN_DISTRACT_RADIUS = 220;
export const COINS_PER_LEVEL = 3;

export const LOOT_VALUES = { gem: 100, gold: 150, diamond: 250 };

export const LEVELS = [
  {
    name: 'Ruang 1 — Lobi Beludru',
    intro: 'Ambil semua jarahan, lalu kabur lewat pintu keluar.',
    walls: [
      { x: 320, y: 0, w: 24, h: 240 },
      { x: 320, y: 330, w: 24, h: 390 },
      { x: 700, y: 220, w: 24, h: 500 },
      { x: 860, y: 140, w: 260, h: 24 },
      { x: 160, y: 470, w: 210, h: 24 },
    ],
    cases: [
      { x: 800, y: 470, w: 120, h: 56 },
      { x: 1000, y: 540, w: 120, h: 56 },
    ],
    loot: [
      { x: 180, y: 110, kind: 'gem' },
      { x: 1100, y: 100, kind: 'gold' },
      { x: 940, y: 620, kind: 'gem' },
    ],
    guards: [
      { waypoints: [[530, 160], [530, 560]] },
      { waypoints: [[880, 330], [1180, 330]] },
    ],
    cameras: [
      { x: 640, y: 54, baseAngle: Math.PI / 2, sweep: 0.95, speed: 0.55 },
    ],
    thiefStart: { x: 70, y: 650 },
    exit: { x: 1200, y: 620 },
  },
  {
    name: 'Ruang 2 — Galeri Kaca',
    intro: 'Dua kamera menyapu galeri. Koin bisa memancing penjaga menjauh.',
    walls: [
      { x: 270, y: 0, w: 24, h: 200 },
      { x: 270, y: 290, w: 24, h: 430 },
      { x: 640, y: 160, w: 24, h: 560 },
      { x: 940, y: 0, w: 24, h: 330 },
      { x: 940, y: 420, w: 24, h: 300 },
      { x: 430, y: 530, w: 260, h: 24 },
      { x: 1010, y: 580, w: 200, h: 24 },
    ],
    cases: [
      { x: 110, y: 330, w: 90, h: 50 },
      { x: 750, y: 90, w: 100, h: 50 },
      { x: 1090, y: 460, w: 90, h: 50 },
    ],
    loot: [
      { x: 140, y: 100, kind: 'gem' },
      { x: 520, y: 100, kind: 'gold' },
      { x: 820, y: 620, kind: 'gem' },
      { x: 1170, y: 130, kind: 'diamond' },
    ],
    guards: [
      { waypoints: [[450, 140], [450, 480]] },
      { waypoints: [[760, 380], [880, 380]] },
      { waypoints: [[1130, 110], [1130, 380]] },
    ],
    cameras: [
      { x: 480, y: 54, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.6 },
      { x: 1226, y: 360, baseAngle: Math.PI, sweep: 0.8, speed: 0.7 },
    ],
    thiefStart: { x: 70, y: 650 },
    exit: { x: 1200, y: 650 },
  },
  {
    name: 'Ruang 3 — Sayap Berlian',
    intro: 'Berlian terakhir dijaga empat penjaga dan tiga kamera. Jangan terlihat.',
    walls: [
      { x: 210, y: 0, w: 24, h: 220 },
      { x: 210, y: 310, w: 24, h: 410 },
      { x: 530, y: 130, w: 24, h: 590 },
      { x: 850, y: 0, w: 24, h: 280 },
      { x: 850, y: 370, w: 24, h: 350 },
      { x: 1090, y: 220, w: 24, h: 500 },
      { x: 320, y: 570, w: 240, h: 24 },
      { x: 640, y: 90, w: 210, h: 24 },
    ],
    cases: [
      { x: 80, y: 460, w: 90, h: 50 },
      { x: 930, y: 520, w: 100, h: 50 },
      { x: 1150, y: 190, w: 70, h: 50 },
    ],
    loot: [
      { x: 120, y: 100, kind: 'gem' },
      { x: 400, y: 100, kind: 'gold' },
      { x: 740, y: 620, kind: 'gem' },
      { x: 990, y: 130, kind: 'gold' },
      { x: 1000, y: 640, kind: 'diamond' },
    ],
    guards: [
      { waypoints: [[370, 150], [370, 540]] },
      { waypoints: [[690, 220], [690, 600]] },
      { waypoints: [[980, 130], [980, 330]] },
      { waypoints: [[1170, 330], [1170, 600]] },
    ],
    cameras: [
      { x: 400, y: 54, baseAngle: Math.PI / 2, sweep: 0.95, speed: 0.6 },
      { x: 660, y: 666, baseAngle: -Math.PI / 2, sweep: 0.85, speed: 0.65 },
      { x: 1226, y: 220, baseAngle: Math.PI, sweep: 0.8, speed: 0.75 },
    ],
    thiefStart: { x: 70, y: 650 },
    exit: { x: 1210, y: 110 },
  },
];

export function levelLootTotal(levelIndex) {
  return LEVELS[levelIndex].loot.reduce((sum, piece) => sum + LOOT_VALUES[piece.kind], 0);
}
