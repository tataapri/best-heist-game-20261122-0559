// All drawing: the velvet-and-brass museum at night, drawn procedurally on
// one canvas — floor, walls, cones, loot, the thief, and the HUD with its
// alarm meter. Nothing is loaded from a file; every shape is code.

import {
  ALARM_CHASE_THRESHOLD,
  CAMERA_CONE_HALF_ANGLE,
  CAMERA_CONE_RANGE,
  GUARD_CONE_HALF_ANGLE,
  GUARD_CONE_RANGE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './config.js';
import { allLootTaken } from './world.js';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    scale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    offsetX = (width - WORLD_WIDTH * scale) / 2;
    offsetY = (height - WORLD_HEIGHT * scale) / 2;
  }

  function toWorld(clientX, clientY) {
    const x = (clientX - offsetX) / scale;
    const y = (clientY - offsetY) / scale;
    if (x < 0 || y < 0 || x > WORLD_WIDTH || y > WORLD_HEIGHT) return null;
    return { x, y };
  }

  function drawCone(x, y, angle, halfAngle, range, color) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawFloor(time) {
    ctx.fillStyle = '#241a12';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    // Parquet tiles.
    ctx.strokeStyle = 'rgba(255, 220, 160, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < WORLD_WIDTH; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < WORLD_HEIGHT; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_WIDTH, y);
      ctx.stroke();
    }
    // Velvet carpet runner down the middle of the room.
    ctx.fillStyle = '#5e1220';
    ctx.fillRect(0, 318, WORLD_WIDTH, 84);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 318, WORLD_WIDTH, 84);
    // Soft light pools from the ceiling lamps.
    const shimmer = 0.05 + 0.02 * Math.sin(time * 1.4);
    ctx.fillStyle = `rgba(255, 214, 130, ${shimmer})`;
    for (const lampX of [240, 640, 1040]) {
      ctx.beginPath();
      ctx.ellipse(lampX, 360, 150, 90, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawWallsAndCases(level) {
    for (const wall of level.layout.walls) {
      ctx.fillStyle = '#3a2c1e';
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 2;
      ctx.strokeRect(wall.x + 1, wall.y + 1, wall.w - 2, wall.h - 2);
    }
    for (const displayCase of level.layout.cases) {
      ctx.fillStyle = '#1d2f3a';
      ctx.fillRect(displayCase.x, displayCase.y, displayCase.w, displayCase.h);
      ctx.fillStyle = 'rgba(150, 220, 255, 0.18)';
      ctx.fillRect(displayCase.x + 6, displayCase.y + 6, displayCase.w - 12, displayCase.h - 12);
      ctx.strokeStyle = '#7fb3c8';
      ctx.lineWidth = 2;
      ctx.strokeRect(displayCase.x, displayCase.y, displayCase.w, displayCase.h);
    }
    // Outer frame.
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, WORLD_WIDTH - 6, WORLD_HEIGHT - 6);
  }

  function drawLoot(level, time) {
    for (const piece of level.loot) {
      if (piece.taken) continue;
      const pulse = 1 + 0.12 * Math.sin(time * 3 + piece.x);
      // Pedestal.
      ctx.fillStyle = '#4a3a28';
      ctx.beginPath();
      ctx.arc(piece.x, piece.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 2;
      ctx.stroke();
      // The jewel itself.
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.scale(pulse, pulse);
      ctx.rotate(Math.PI / 4);
      const size = piece.kind === 'diamond' ? 13 : piece.kind === 'gold' ? 11 : 9;
      ctx.fillStyle = piece.kind === 'diamond' ? '#eaf6ff' : piece.kind === 'gold' ? '#ffd24a' : '#59e3d4';
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-size / 2, -size / 2, size, size);
      ctx.restore();
      // Sparkle.
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(piece.x + 10, piece.y - 10, 2 + Math.sin(time * 5) * 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawExit(level) {
    const unlocked = allLootTaken(level);
    const exit = level.exit;
    ctx.save();
    ctx.translate(exit.x, exit.y);
    ctx.fillStyle = unlocked ? '#1f7a3a' : '#5a1d1d';
    ctx.fillRect(-26, -34, 52, 68);
    ctx.strokeStyle = unlocked ? '#7dff9e' : '#ff7d7d';
    ctx.lineWidth = 3;
    ctx.strokeRect(-26, -34, 52, 68);
    ctx.fillStyle = '#f5e9c8';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(unlocked ? 'EXIT' : 'LOCKED', 0, -40);
    if (unlocked) {
      ctx.fillStyle = `rgba(125, 255, 158, ${0.25 + 0.15 * Math.sin(Date.now() / 300)})`;
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCoins(level) {
    for (const coin of level.coins) {
      ctx.fillStyle = '#ffd24a';
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8a6d1f';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawGuards(level) {
    for (const guard of level.guards) {
      const alerted = guard.mode === 'chase';
      const coneColor = alerted ? 'rgba(255, 60, 60, 0.30)' : 'rgba(255, 214, 90, 0.22)';
      drawCone(guard.x, guard.y, guard.angle, GUARD_CONE_HALF_ANGLE, GUARD_CONE_RANGE, coneColor);
      // Body: navy uniform, brass badge.
      ctx.fillStyle = '#22355e';
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = alerted ? '#ff5040' : '#d8c27a';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Facing tick and flashlight dot.
      ctx.strokeStyle = '#ffe9a8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(guard.x, guard.y);
      ctx.lineTo(guard.x + Math.cos(guard.angle) * 22, guard.y + Math.sin(guard.angle) * 22);
      ctx.stroke();
      ctx.fillStyle = '#fff6cf';
      ctx.beginPath();
      ctx.arc(guard.x + Math.cos(guard.angle) * 24, guard.y + Math.sin(guard.angle) * 24, 3, 0, Math.PI * 2);
      ctx.fill();
      // "!" when chasing.
      if (alerted) {
        ctx.fillStyle = '#ff5040';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', guard.x, guard.y - 24);
      }
    }
  }

  function drawCameras(level, time) {
    for (const camera of level.cameras) {
      drawCone(camera.x, camera.y, camera.angle, CAMERA_CONE_HALF_ANGLE, CAMERA_CONE_RANGE, 'rgba(255, 140, 60, 0.20)');
      // Wall mount and lens.
      ctx.fillStyle = '#333a40';
      ctx.beginPath();
      ctx.arc(camera.x, camera.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff8c3c';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = Math.sin(time * 6) > 0 ? '#ff3b30' : '#7a1d16';
      ctx.beginPath();
      ctx.arc(camera.x, camera.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffb37a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(camera.x, camera.y);
      ctx.lineTo(camera.x + Math.cos(camera.angle) * 20, camera.y + Math.sin(camera.angle) * 20);
      ctx.stroke();
    }
  }

  function drawThief(level) {
    const thief = level.thief;
    // Hooded cloak.
    ctx.fillStyle = '#17131f';
    ctx.beginPath();
    ctx.moveTo(thief.x, thief.y - 18);
    ctx.lineTo(thief.x + 14, thief.y + 12);
    ctx.lineTo(thief.x - 14, thief.y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8f7bd8';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Head.
    ctx.fillStyle = '#2c2140';
    ctx.beginPath();
    ctx.arc(thief.x, thief.y - 4, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8ddff';
    ctx.beginPath();
    ctx.arc(thief.x + Math.cos(thief.angle) * 4, thief.y - 4 + Math.sin(thief.angle) * 4, 3, 0, Math.PI * 2);
    ctx.fill();
    if (thief.sneaking) {
      ctx.fillStyle = '#b7a6ff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SNEAK', thief.x, thief.y - 26);
    }
  }

  function drawAlarmMeter(alarm) {
    const x = 470;
    const y = 14;
    const width = 340;
    const height = 22;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(x - 8, y - 6, width + 76, height + 12);
    ctx.fillStyle = '#f5e9c8';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ALARM', x - 64, y + 17);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x, y, width, height);
    const fraction = Math.max(0, Math.min(1, alarm / 100));
    const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
    gradient.addColorStop(0, '#3fae5a');
    gradient.addColorStop(0.6, '#e8b93c');
    gradient.addColorStop(1, '#e8382a');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width * fraction, height);
    ctx.strokeStyle = '#f5e9c8';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    // Chase threshold tick.
    ctx.strokeStyle = '#ff5040';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + width * (ALARM_CHASE_THRESHOLD / 100), y - 3);
    ctx.lineTo(x + width * (ALARM_CHASE_THRESHOLD / 100), y + height + 3);
    ctx.stroke();
    ctx.fillStyle = alarm >= ALARM_CHASE_THRESHOLD ? '#ff6b5e' : '#f5e9c8';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`${Math.round(alarm)}%`, x + width + 10, y + 17);
  }

  function drawHud(game) {
    const level = game.level;
    ctx.fillStyle = 'rgba(10, 8, 14, 0.82)';
    ctx.fillRect(0, 0, WORLD_WIDTH, 48);
    ctx.fillStyle = '#c9a227';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('THE VELVET VAULT', 14, 22);
    ctx.fillStyle = '#f5e9c8';
    ctx.font = '14px sans-serif';
    ctx.fillText(level.layout.name, 14, 42);
    drawAlarmMeter(level.alarm);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd24a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`LOOT ${level.lootCollected}/${level.loot.length}  ·  $${level.lootValue}`, WORLD_WIDTH - 14, 22);
    ctx.fillStyle = '#f5e9c8';
    ctx.font = '14px sans-serif';
    const minutes = Math.floor(game.elapsed / 60);
    const seconds = Math.floor(game.elapsed % 60).toString().padStart(2, '0');
    ctx.fillText(
      `SCORE ${game.score}   TIME ${minutes}:${seconds}   COINS ${level.coinsLeft}`,
      WORLD_WIDTH - 14,
      42,
    );
    // Objective line under the bar.
    ctx.textAlign = 'left';
    ctx.fillStyle = level.seenNow ? '#ff8a7a' : '#d8c9a0';
    ctx.font = 'bold 14px sans-serif';
    const objective = allLootTaken(level)
      ? 'Semua jarahan didapat — kabur ke pintu EXIT!'
      : `Kumpulkan ${level.loot.length - level.lootCollected} jarahan lagi, lalu kabur. Shift = mengendap, klik = lempar koin.`;
    ctx.fillText(level.seenNow ? 'TERLIHAT! Sembunyi di balik dinding!' : objective, 14, 68);
  }

  function drawCenterPanel(title, lines, accent) {
    ctx.fillStyle = 'rgba(8, 6, 12, 0.78)';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    const panelWidth = 640;
    const panelHeight = 150 + lines.length * 30;
    const panelX = (WORLD_WIDTH - panelWidth) / 2;
    const panelY = (WORLD_HEIGHT - panelHeight) / 2;
    ctx.fillStyle = '#1c1420';
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
    ctx.fillStyle = accent;
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, WORLD_WIDTH / 2, panelY + 58);
    ctx.fillStyle = '#f5e9c8';
    ctx.font = '17px sans-serif';
    lines.forEach((line, i) => {
      ctx.fillText(line, WORLD_WIDTH / 2, panelY + 102 + i * 30);
    });
  }

  function render(game, time) {
    resize();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b0810';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    const level = game.level;
    if (game.screen === 'title') {
      drawFloor(time);
      drawWallsAndCases(level);
      drawLoot(level, time);
      drawGuards(level);
      drawCameras(level, time);
      drawThief(level);
      drawHud(game);
      drawCenterPanel('THE VELVET VAULT', [
        'Pencuri ulung. Satu museum. Tiga ruangan.',
        'WASD / panah bergerak · Shift mengendap · E interaksi · R ulangi ruangan',
        'Klik untuk melempar koin dan memancing penjaga menjauh.',
        'Tekan tombol apa saja untuk mulai merampok.',
      ], '#c9a227');
      return;
    }
    drawFloor(time);
    drawWallsAndCases(level);
    drawExit(level);
    drawLoot(level, time);
    drawCoins(level);
    drawGuards(level);
    drawCameras(level, time);
    drawThief(level);
    drawHud(game);
    if (game.screen === 'intro') {
      drawCenterPanel(level.layout.name, [level.layout.intro, 'Tekan tombol apa saja untuk masuk.'], '#c9a227');
    } else if (game.screen === 'levelclear') {
      drawCenterPanel('RUANGAN BERSIH!', [
        `Jarahan ruangan ini: $${game.lastLevelLoot}   Bonus waktu: $${game.lastTimeBonus}`,
        'Tekan tombol apa saja untuk masuk ruangan berikutnya.',
      ], '#7dff9e');
    } else if (game.screen === 'caught') {
      drawCenterPanel('TERTANGKAP!', [
        'Alarm mencapai 100% — penjaga mengepungmu.',
        'Tekan R atau tombol apa saja untuk mencoba ruangan ini lagi.',
      ], '#ff5040');
    } else if (game.screen === 'win') {
      drawCenterPanel('PERAMPOKAN SEMPURNA!', [
        `Semua berlian dan emas berhasil dibawa kabur.`,
        `Skor akhir: ${game.score}   Waktu: ${Math.floor(game.elapsed / 60)}:${Math.floor(game.elapsed % 60).toString().padStart(2, '0')}`,
        'Tekan R untuk merampok lagi dari awal.',
      ], '#ffd24a');
    }
  }

  return { render, resize, toWorld };
}
