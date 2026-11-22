# The Velvet Vault

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/tataapri/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/tataapri/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down stealth heist game that runs offline in a desktop browser from
static files. You are the thief in a velvet-and-brass museum at night: cross
three rooms, read the patrols, time the sweeping security cameras, grab every
piece of loot, and slip out the exit before the alarm hits 100%.

## How to play

- **Move:** WASD or arrow keys
- **Sneak:** hold Shift — slower, but guards and cameras spot you half as fast
- **Throw a coin:** click anywhere within range — nearby guards walk over to
  investigate the noise (3 coins per room)
- **Interact / advance:** E (also any key on the title and room screens)
- **Restart room:** R

Guards patrol fixed routes with visible vision cones; cameras sweep their
cones back and forth. Being seen raises the **alarm meter** at the top of the
screen — past 60% the guards chase you, at 100% you are caught and the room
restarts. Walls and display cases block sight, so plan your route behind
cover. Collect all the loot in a room to unlock its exit door.

## The three rooms

1. **Lobi Beludru** — two guards, one camera, three pieces of loot.
2. **Galeri Kaca** — three guards, two cameras, four pieces of loot.
3. **Sayap Berlian** — four guards, three cameras, five pieces of loot,
   including the diamond.

Score comes from loot value plus a time bonus for a fast, quiet getaway.

## Running it

Serve `game/` with any static server — for example `node serve.ts` — and
open http://localhost:8080. No build step, no network requests, no external
assets: all art is drawn procedurally on canvas and all sound is synthesized
with WebAudio.

Deterministic screenshot scenes: open the game with
`?shot=start|play|alarm|win&seed=1` to stage a fixed scene; the page sets
`window.__shotReady = true` once it has rendered.
