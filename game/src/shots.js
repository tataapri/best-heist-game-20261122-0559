// Deterministic screenshot staging: a ?shot= query arranges one fixed scene
// (thief, guards, loot, alarm) and reports readiness through
// window.__shotReady, so the same shot can be retaken byte for byte.

import { ALARM_CHASE_THRESHOLD } from './config.js';
import { buildLevelState } from './world.js';
import { startChase } from './guards.js';

export function parseShotQuery() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return null;
  const seed = Number.parseInt(params.get('seed') ?? '1', 10);
  return { shot, seed: Number.isFinite(seed) ? seed : 1 };
}

// Stage the game for one named shot and return the screen to show.
export function stageShot(game, kind, random) {
  if (kind === 'start') {
    game.level = buildLevelState(0, random);
    game.screen = 'title';
    game.level.guards[0].x = 530;
    game.level.guards[0].y = 320;
    game.level.guards[0].angle = Math.PI / 2;
    game.level.guards[1].x = 980;
    game.level.guards[1].y = 330;
    game.level.guards[1].angle = 0;
    game.level.thief.x = 430;
    game.level.thief.y = 480;
    game.level.thief.angle = Math.PI / 4;
    game.level.alarm = 12;
    return;
  }
  if (kind === 'play') {
    game.level = buildLevelState(1, random);
    game.screen = 'playing';
    // Thief mid-room, sneaking past the gallery patrol.
    game.level.thief.x = 420;
    game.level.thief.y = 300;
    game.level.thief.angle = -Math.PI / 2;
    game.level.thief.sneaking = true;
    game.level.guards[0].x = 450;
    game.level.guards[0].y = 200;
    game.level.guards[0].angle = Math.PI / 2;
    game.level.guards[1].x = 800;
    game.level.guards[1].y = 380;
    game.level.guards[1].angle = Math.PI;
    game.level.guards[2].x = 1130;
    game.level.guards[2].y = 240;
    game.level.guards[2].angle = Math.PI / 2;
    game.level.loot[0].taken = true;
    game.level.lootCollected = 1;
    game.level.lootValue = 100;
    game.score = 100;
    game.elapsed = 47;
    game.level.alarm = 24;
    return;
  }
  if (kind === 'alarm') {
    game.level = buildLevelState(2, random);
    game.screen = 'playing';
    // Caught in the open: alarm high, guards converging on the thief.
    game.level.thief.x = 620;
    game.level.thief.y = 420;
    game.level.thief.angle = Math.PI;
    game.level.guards[0].x = 520;
    game.level.guards[0].y = 380;
    game.level.guards[0].angle = 0.5;
    game.level.guards[1].x = 690;
    game.level.guards[1].y = 330;
    game.level.guards[1].angle = Math.PI / 2;
    game.level.guards[2].x = 980;
    game.level.guards[2].y = 330;
    game.level.guards[2].angle = Math.PI;
    game.level.guards[3].x = 1170;
    game.level.guards[3].y = 480;
    game.level.guards[3].angle = -Math.PI / 2;
    game.level.loot[0].taken = true;
    game.level.loot[1].taken = true;
    game.level.lootCollected = 2;
    game.level.lootValue = 250;
    game.score = 250;
    game.elapsed = 132;
    game.level.alarm = 78;
    game.level.seenNow = true;
    startChase(game.level);
    return;
  }
  if (kind === 'win') {
    game.level = buildLevelState(2, random);
    game.screen = 'win';
    for (const piece of game.level.loot) piece.taken = true;
    game.level.lootCollected = 5;
    game.level.lootValue = 750;
    game.level.thief.x = 1210;
    game.level.thief.y = 110;
    game.score = 5240;
    game.elapsed = 268;
    game.level.alarm = 8;
    return;
  }
  // Unknown shot name: fall back to the title screen.
  game.level = buildLevelState(0, random);
  game.screen = 'title';
}

export function markShotReady() {
  window.__shotReady = true;
}
