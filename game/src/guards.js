// Guards: they walk their patrol waypoints, pause at each end, turn to
// investigate a thrown coin, and chase the thief once the alarm is high.
// Their vision cone is checked here; the alarm itself is raised in main.js
// from what this module reports.

import {
  ALARM_CHASE_THRESHOLD,
  COIN_DISTRACT_RADIUS,
  GUARD_CHASE_SPEED,
  GUARD_CONE_HALF_ANGLE,
  GUARD_CONE_RANGE,
  GUARD_PATROL_SPEED,
  GUARD_RADIUS,
} from './config.js';
import { moveCircle, thiefInsideCone } from './world.js';

export function updateGuards(level, dt) {
  const thief = level.thief;
  for (const guard of level.guards) {
    if (guard.pauseTimer > 0) {
      guard.pauseTimer -= dt;
      continue;
    }
    if (guard.mode === 'chase') {
      const dx = thief.x - guard.x;
      const dy = thief.y - guard.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 4) {
        guard.angle = Math.atan2(dy, dx);
        moveCircle(guard, (dx / distance) * GUARD_CHASE_SPEED * dt, (dy / distance) * GUARD_CHASE_SPEED * dt, GUARD_RADIUS, level.solids);
      }
      if (level.alarm < ALARM_CHASE_THRESHOLD) guard.mode = 'patrol';
      continue;
    }
    if (guard.mode === 'investigate') {
      const dx = guard.investigateX - guard.x;
      const dy = guard.investigateY - guard.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 12) {
        guard.investigateTimer -= dt;
        guard.angle += dt * 2.2; // look around the spot
        if (guard.investigateTimer <= 0) guard.mode = 'patrol';
      } else {
        guard.angle = Math.atan2(dy, dx);
        moveCircle(guard, (dx / distance) * GUARD_PATROL_SPEED * 1.5 * dt, (dy / distance) * GUARD_PATROL_SPEED * 1.5 * dt, GUARD_RADIUS, level.solids);
      }
      continue;
    }
    // Patrol: walk toward the current waypoint, pause, then turn around.
    const target = guard.waypoints[guard.waypointIndex];
    const dx = target[0] - guard.x;
    const dy = target[1] - guard.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 8) {
      guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
      guard.pauseTimer = 0.9;
      continue;
    }
    guard.angle = Math.atan2(dy, dx);
    moveCircle(guard, (dx / distance) * GUARD_PATROL_SPEED * dt, (dy / distance) * GUARD_PATROL_SPEED * dt, GUARD_RADIUS, level.solids);
  }
}

// A guard spots the thief; returns how strongly (0 when unseen).
export function guardSeesThief(guard, level) {
  const result = thiefInsideCone(
    guard.x, guard.y, guard.angle,
    GUARD_CONE_HALF_ANGLE, GUARD_CONE_RANGE,
    level.thief, level.solids,
  );
  return result;
}

// Every guard close enough to hear the coin walks over to look at it.
export function distractGuardsWithCoin(level, coinX, coinY) {
  for (const guard of level.guards) {
    const distance = Math.hypot(guard.x - coinX, guard.y - coinY);
    if (distance < COIN_DISTRACT_RADIUS && guard.mode !== 'chase') {
      guard.mode = 'investigate';
      guard.investigateX = coinX;
      guard.investigateY = coinY;
      guard.investigateTimer = 3;
    }
  }
}

// When the alarm passes the chase threshold, every guard runs at the thief.
export function startChase(level) {
  for (const guard of level.guards) {
    if (guard.mode !== 'chase') guard.mode = 'chase';
  }
}

export function guardCaughtThief(level) {
  return level.guards.some(
    (guard) => Math.hypot(guard.x - level.thief.x, guard.y - level.thief.y) < GUARD_RADIUS + 14,
  );
}
