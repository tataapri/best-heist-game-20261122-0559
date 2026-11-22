// The Velvet Vault — game loop and state machine.
// Screens: title → intro → playing → levelclear → intro … → win, plus
// caught. The loop updates the thief, the guards and the cameras, raises
// the alarm while the thief is seen, and hands loot and the exit to the
// player. A ?shot= query stages a fixed scene instead of playing.

import {
  ALARM_CAUGHT,
  ALARM_CHASE_THRESHOLD,
  ALARM_DECAY_RATE,
  CAMERA_ALARM_RATE,
  COINS_PER_LEVEL,
  COIN_THROW_RANGE,
  GUARD_ALARM_RATE,
  LEVELS,
  THIEF_RADIUS,
  THIEF_SNEAK_SPEED,
  THIEF_WALK_SPEED,
} from './config.js';
import { makeSeededRandom } from './random.js';
import { allLootTaken, buildLevelState, moveCircle } from './world.js';
import { cameraSeesThief, updateCameras } from './cameras.js';
import {
  distractGuardsWithCoin,
  guardCaughtThief,
  guardSeesThief,
  startChase,
  updateGuards,
} from './guards.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer } from './render.js';
import { markShotReady, parseShotQuery, stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const renderer = createRenderer(canvas);
const input = createInput(canvas, (x, y) => renderer.toWorld(x, y));
const audio = createAudio();

const game = {
  screen: 'title', // title | intro | playing | levelclear | caught | win
  levelIndex: 0,
  level: null,
  score: 0,
  elapsed: 0,
  lastLevelLoot: 0,
  lastTimeBonus: 0,
  shotMode: null,
};

function startLevel(levelIndex) {
  game.levelIndex = levelIndex;
  game.level = buildLevelState(levelIndex, makeSeededRandom(1000 + levelIndex));
  game.level.coinsLeft = COINS_PER_LEVEL;
  game.screen = 'intro';
}

function startGame() {
  game.score = 0;
  game.elapsed = 0;
  startLevel(0);
}

function updateThief(level, dt) {
  const vector = input.movementVector();
  const thief = level.thief;
  thief.sneaking = input.isSneaking();
  thief.moving = vector.x !== 0 || vector.y !== 0;
  if (thief.moving) {
    thief.angle = Math.atan2(vector.y, vector.x);
    const speed = thief.sneaking ? THIEF_SNEAK_SPEED : THIEF_WALK_SPEED;
    moveCircle(thief, vector.x * speed * dt, vector.y * speed * dt, THIEF_RADIUS, level.solids);
  }
  // Pick up loot by walking over its pedestal.
  for (const piece of level.loot) {
    if (piece.taken) continue;
    if (Math.hypot(piece.x - thief.x, piece.y - thief.y) < 30) {
      piece.taken = true;
      level.lootCollected += 1;
      level.lootValue += piece.value;
      game.score += piece.value;
      audio.pickup();
    }
  }
}

function throwCoinIfClicked(level) {
  const target = input.takeCoinTarget();
  if (!target || level.coinsLeft <= 0) return;
  const thief = level.thief;
  const distance = Math.hypot(target.x - thief.x, target.y - thief.y);
  if (distance > COIN_THROW_RANGE) return;
  level.coins.push({ x: target.x, y: target.y, age: 0 });
  level.coinsLeft -= 1;
  audio.coin();
  distractGuardsWithCoin(level, target.x, target.y);
}

function updateAlarm(level, dt) {
  const thief = level.thief;
  const sneakFactor = thief.sneaking ? 0.5 : 1;
  let seenStrength = 0;
  let seen = false;
  for (const guard of level.guards) {
    const result = guardSeesThief(guard, level);
    if (result.seen) {
      seen = true;
      seenStrength = Math.max(seenStrength, GUARD_ALARM_RATE * (0.35 + 0.65 * result.closeness));
    }
  }
  for (const camera of level.cameras) {
    const result = cameraSeesThief(camera, level);
    if (result.seen) {
      seen = true;
      seenStrength = Math.max(seenStrength, CAMERA_ALARM_RATE * (0.35 + 0.65 * result.closeness));
    }
  }
  level.seenNow = seen;
  if (seen) {
    const wasCalm = level.alarm < ALARM_CHASE_THRESHOLD;
    level.alarm = Math.min(ALARM_CAUGHT, level.alarm + seenStrength * sneakFactor * dt);
    if (wasCalm && level.alarm >= ALARM_CHASE_THRESHOLD) {
      startChase(level);
      audio.spotted();
      audio.startAlarmLoop();
    }
  } else {
    level.alarm = Math.max(0, level.alarm - ALARM_DECAY_RATE * dt);
    if (level.alarm < ALARM_CHASE_THRESHOLD) audio.stopAlarmLoop();
  }
}

function updatePlaying(dt) {
  const level = game.level;
  level.timeInLevel += dt;
  game.elapsed += dt;
  updateThief(level, dt);
  throwCoinIfClicked(level);
  updateGuards(level, dt);
  updateCameras(level, dt);
  updateAlarm(level, dt);
  for (const coin of level.coins) coin.age += dt;
  level.coins = level.coins.filter((coin) => coin.age < 6);

  if (level.alarm >= ALARM_CAUGHT || guardCaughtThief(level)) {
    game.screen = 'caught';
    audio.stopAlarmLoop();
    audio.caught();
    return;
  }
  // Escape through the exit once every loot piece is taken.
  if (allLootTaken(level)) {
    const exitDistance = Math.hypot(level.exit.x - level.thief.x, level.exit.y - level.thief.y);
    if (exitDistance < 44) {
      const timeBonus = Math.max(0, Math.round(600 - level.timeInLevel * 2));
      game.score += timeBonus;
      game.lastLevelLoot = level.lootValue;
      game.lastTimeBonus = timeBonus;
      audio.stopAlarmLoop();
      if (game.levelIndex + 1 >= LEVELS.length) {
        game.screen = 'win';
        audio.win();
      } else {
        game.screen = 'levelclear';
        audio.levelClear();
      }
    }
  }
}

function handleScreenKeys() {
  if (input.takeRestart()) {
    // The R press itself set the any-key flag too; drain it so it does not
    // also advance the fresh intro screen in the very next frame.
    input.takeAnyKey();
    if (game.screen === 'playing' || game.screen === 'caught') {
      audio.stopAlarmLoop();
      startLevel(game.levelIndex);
    } else if (game.screen === 'win') {
      startGame();
    }
    return;
  }
  if (!input.takeAnyKey()) return;
  audio.unlock();
  if (game.screen === 'title') {
    startGame();
  } else if (game.screen === 'intro') {
    game.screen = 'playing';
  } else if (game.screen === 'levelclear') {
    startLevel(game.levelIndex + 1);
  } else if (game.screen === 'caught') {
    audio.stopAlarmLoop();
    startLevel(game.levelIndex);
  } else if (game.screen === 'win') {
    startGame();
  }
}

function announceStatus() {
  const level = game.level;
  if (!level || !statusLine) return;
  statusLine.textContent =
    `${game.screen}: ${level.layout.name}. Loot ${level.lootCollected} of ${level.loot.length}. ` +
    `Alarm ${Math.round(level.alarm)} percent. Score ${game.score}.`;
}

function frameLoop(time) {
  const dt = Math.min(0.05, (time - frameLoop.lastTime) / 1000 || 0.016);
  frameLoop.lastTime = time;
  if (game.shotMode) {
    // A staged shot never plays: one settled render, then report readiness.
    renderer.render(game, time / 1000);
    if (!frameLoop.shotReported) {
      frameLoop.shotReported = true;
      markShotReady();
    }
    return;
  }
  if (game.screen === 'playing') {
    updatePlaying(dt);
    if (input.takeRestart()) {
      audio.stopAlarmLoop();
      startLevel(game.levelIndex);
    }
    // Drain key and click presses made during play (movement keys included):
    // a press from the playing screen must not instantly advance the next
    // screen (caught, level clear, win) before the player has seen it.
    input.takeAnyKey();
    input.takeInteract();
  } else {
    handleScreenKeys();
  }
  renderer.render(game, time / 1000);
  announceStatus();
  input.endFrame();
  requestAnimationFrame(frameLoop);
}
frameLoop.lastTime = 0;
frameLoop.shotReported = false;

function boot() {
  const shot = parseShotQuery();
  if (shot) {
    game.shotMode = shot.shot;
    const random = makeSeededRandom(shot.seed);
    stageShot(game, shot.shot, random);
    window.__game = game;
    renderer.render(game, 1.2);
    // Let the canvas paint once before reporting readiness.
    requestAnimationFrame(() => {
      renderer.render(game, 1.6);
      markShotReady();
    });
    return;
  }
  game.level = buildLevelState(0, makeSeededRandom(7));
  game.screen = 'title';
  window.__game = game;
  requestAnimationFrame(frameLoop);
}

boot();
