// The room itself: building a level's live state from its layout, moving a
// circle through solid rectangles, and testing whether a straight line of
// sight is blocked by a wall or a display case.

import {
  CAMERA_CONE_RANGE,
  GUARD_CONE_RANGE,
  LEVELS,
  LOOT_VALUES,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './config.js';

export function buildLevelState(levelIndex, random) {
  const layout = LEVELS[levelIndex];
  const solids = [...layout.walls, ...layout.cases];
  return {
    levelIndex,
    layout,
    solids,
    loot: layout.loot.map((piece) => ({ ...piece, taken: false, value: LOOT_VALUES[piece.kind] })),
    guards: layout.guards.map((guard, i) => ({
      id: i,
      x: guard.waypoints[0][0],
      y: guard.waypoints[0][1],
      waypoints: guard.waypoints,
      waypointIndex: 1,
      angle: 0,
      mode: 'patrol', // patrol | investigate | chase
      investigateX: 0,
      investigateY: 0,
      investigateTimer: 0,
      pauseTimer: 0,
      phase: random() * Math.PI * 2,
    })),
    cameras: layout.cameras.map((camera) => ({
      ...camera,
      angle: camera.baseAngle,
      time: random() * 10,
    })),
    thief: {
      x: layout.thiefStart.x,
      y: layout.thiefStart.y,
      angle: -Math.PI / 2,
      sneaking: false,
      moving: false,
    },
    exit: { ...layout.exit },
    coins: [],
    coinsLeft: 3,
    alarm: 0,
    seenNow: false,
    lootCollected: 0,
    lootValue: 0,
    timeInLevel: 0,
  };
}

export function allLootTaken(level) {
  return level.loot.every((piece) => piece.taken);
}

export function circleHitsSolid(x, y, radius, solids) {
  for (const rect of solids) {
    const nearestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
    const nearestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
    const dx = x - nearestX;
    const dy = y - nearestY;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}

// Slide a circle along the walls: try the full step, then each axis alone.
export function moveCircle(body, dx, dy, radius, solids) {
  const nextX = Math.max(radius, Math.min(WORLD_WIDTH - radius, body.x + dx));
  const nextY = Math.max(radius, Math.min(WORLD_HEIGHT - radius, body.y + dy));
  if (!circleHitsSolid(nextX, nextY, radius, solids)) {
    body.x = nextX;
    body.y = nextY;
    return;
  }
  if (!circleHitsSolid(nextX, body.y, radius, solids)) body.x = nextX;
  if (!circleHitsSolid(body.x, nextY, radius, solids)) body.y = nextY;
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Slab test: does the segment cross the rectangle's interior?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  for (const [origin, delta, low, high] of [
    [x1, dx, rect.x, rect.x + rect.w],
    [y1, dy, rect.y, rect.y + rect.h],
  ]) {
    if (Math.abs(delta) < 1e-9) {
      if (origin < low || origin > high) return false;
    } else {
      let t1 = (low - origin) / delta;
      let t2 = (high - origin) / delta;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

export function lineOfSightBlocked(x1, y1, x2, y2, solids) {
  for (const rect of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return true;
  }
  return false;
}

// Is the thief inside a watcher's cone (range, angle, clear sight line)?
export function thiefInsideCone(watcherX, watcherY, watcherAngle, halfAngle, range, thief, solids) {
  const dx = thief.x - watcherX;
  const dy = thief.y - watcherY;
  const distance = Math.hypot(dx, dy);
  if (distance > range) return { seen: false, closeness: 0 };
  let angleDiff = Math.atan2(dy, dx) - watcherAngle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  if (Math.abs(angleDiff) > halfAngle) return { seen: false, closeness: 0 };
  if (lineOfSightBlocked(watcherX, watcherY, thief.x, thief.y, solids)) {
    return { seen: false, closeness: 0 };
  }
  return { seen: true, closeness: 1 - distance / range };
}

export { GUARD_CONE_RANGE, CAMERA_CONE_RANGE };
