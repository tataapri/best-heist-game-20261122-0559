// Security cameras: wall-mounted, sweeping their cone back and forth on a
// fixed rhythm. A camera never moves, but its cone is wider and it raises
// the alarm faster than a guard, so its sweep has to be timed.

import {
  CAMERA_CONE_HALF_ANGLE,
  CAMERA_CONE_RANGE,
} from './config.js';
import { thiefInsideCone } from './world.js';

export function updateCameras(level, dt) {
  for (const camera of level.cameras) {
    camera.time += dt;
    camera.angle = camera.baseAngle + Math.sin(camera.time * camera.speed) * camera.sweep;
  }
}

// A camera spots the thief; returns how strongly (0 when unseen).
export function cameraSeesThief(camera, level) {
  return thiefInsideCone(
    camera.x, camera.y, camera.angle,
    CAMERA_CONE_HALF_ANGLE, CAMERA_CONE_RANGE,
    level.thief, level.solids,
  );
}
