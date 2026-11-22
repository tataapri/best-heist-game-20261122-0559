// Keyboard and mouse input. WASD or arrows move, Shift sneaks, E interacts,
// R restarts the level, and a click throws a coin at that floor position.
// The canvas reports clicks in world coordinates so the game never has to
// know about the page's scaling.

export function createInput(canvas, toWorld) {
  const keys = new Set();
  const pressed = new Set();
  let coinTarget = null;
  let interactPressed = false;
  let restartPressed = false;
  let anyKeyPressed = false;

  const keyName = (event) => {
    const key = event.key.toLowerCase();
    if (key === ' ') return 'space';
    return key;
  };

  window.addEventListener('keydown', (event) => {
    const key = keyName(event);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      event.preventDefault();
    }
    if (!keys.has(key)) pressed.add(key);
    keys.add(key);
    anyKeyPressed = true;
    if (key === 'e') interactPressed = true;
    if (key === 'r') restartPressed = true;
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(keyName(event));
  });
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const point = toWorld(event.clientX - rect.left, event.clientY - rect.top);
    if (point) coinTarget = point;
    anyKeyPressed = true;
  });

  function movementVector() {
    let x = 0;
    let y = 0;
    if (keys.has('a') || keys.has('arrowleft')) x -= 1;
    if (keys.has('d') || keys.has('arrowright')) x += 1;
    if (keys.has('w') || keys.has('arrowup')) y -= 1;
    if (keys.has('s') || keys.has('arrowdown')) y += 1;
    if (x !== 0 && y !== 0) {
      const length = Math.hypot(x, y);
      x /= length;
      y /= length;
    }
    return { x, y };
  }

  return {
    movementVector,
    isSneaking() {
      return keys.has('shift');
    },
    wasPressed(key) {
      return pressed.has(key);
    },
    takeCoinTarget() {
      const target = coinTarget;
      coinTarget = null;
      return target;
    },
    takeInteract() {
      const value = interactPressed;
      interactPressed = false;
      return value;
    },
    takeRestart() {
      const value = restartPressed;
      restartPressed = false;
      return value;
    },
    takeAnyKey() {
      const value = anyKeyPressed;
      anyKeyPressed = false;
      return value;
    },
    endFrame() {
      pressed.clear();
    },
  };
}
