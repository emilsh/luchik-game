# Lamp Quest

An educational browser platformer for children aged 5–7. The player controls Luchik the lamp:
they play through 12 levels in two chapters, collect stars, and solve tasks on reading,
counting, English words, patterns, event order, and commands for a robot.

- **Chapter 1. Light of the Valley** (levels 1–4): Green Valley, Bridge of Numbers, English
  Forest, Workshop.
- **Chapter 2. In Search of the Lost Light** (levels 5–12): Enchanted Forest, Crystal Cave,
  Sky Islands, Library of Time, Robot Factory, Ice Mountain, Underwater City, Observatory of
  Light. Each level gives one shard of the Crystal of Light; the crystal is assembled on
  level 12.

Stack: Vite 5, React 18, TypeScript, Phaser 3.80. There is no server; data is stored in
`localStorage`.

## Running on a computer

Requires Node.js 18 or newer (tested on 20.11).

```bash
npm install
npm run dev
```

Open http://localhost:5173.

### Opening on an iPad on your home network

`npm run dev` starts the server with the `--host` flag, so the terminal prints a line like
`Network: http://192.168.x.x:5173`. Open that address in Safari on the iPad (the computer and
the iPad must be on the same Wi‑Fi network).

To play full screen, tap "Share" → "Add to Home Screen" in Safari. The game will then open
from an icon without the address bar.

If there is no sound, check that silent mode is off on the iPad.

## Building for publication

```bash
npm run build      # type check + build into the dist/ folder
npm run preview    # local check of the built version
```

The `dist/` folder is a ready-made static site. The build uses `base: './'`, so it can be
placed in any folder on any static hosting: GitHub Pages, Netlify, Vercel, Cloudflare Pages,
or just a web server. No server-side code is needed. After loading, the game does not contact
any external services.

## Tests

```bash
npx playwright install chromium webkit   # once
npm run test:e2e
```

The tests build the project, start `vite preview`, and check the game in two configurations:
desktop Chromium and iPad emulation (WebKit with touch support).

- `tests/levels.spec.ts` — data checks without a browser. For each level a graph of surfaces
  is built, taking into account jump physics, trampolines, air currents, lifts, and gates, and
  the level is "played through" using the data: every task, goal, star, and the portal must
  be reachable. It also checks that tasks have a single unambiguous answer (robot program,
  bug finding, route, arithmetic). Run this file after any change to the levels.
- `tests/variants.spec.ts` — the task generator: all variants are valid (12 levels × 3
  difficulty tiers × 40 seeds), consistent with each other, varied, never repeated back to
  back, and the difficulty adapts.
- `tests/replay.spec.ts` — in the browser: a restart and a page reload produce new tasks, the
  screen shows exactly the variant that was drawn, and successes are recorded.
- `tests/game.spec.ts` — menu, saving, controls, and levels 1–4.
- `tests/chapter2.spec.ts` — migration of old saves, the 4 → 5 transition, a full
  playthrough of levels 5–12 (with a wrong answer first at every station), the new
  mechanics, pause, and resource cleanup.

If you open the game with the `?debug` parameter (`http://localhost:5173/?debug`), the
`window.__LQ` object becomes available in the browser console. The tests use it to read the
game state and move the lamp.

## Controls

| Action | iPad | Keyboard |
| --- | --- | --- |
| Walk | ◀ ▶ buttons at the bottom left (hold; you can slide a finger from one to the other) | ← → or A / D |
| Jump | large button at the bottom right | Space, ↑ or W |
| Pause | ⏸ button | Esc |

## Project structure

```
src/
  app/            App.tsx (screen switching), routes.ts, useProgress.ts
  components/     React screens and overlays: menu, level select, game screen, HUD,
                  touch buttons, task card, pause, level complete, collection,
                  parent dashboard
  data/           questions.ts (all tasks), vocabulary.ts, stories.ts, rewards.ts
  game/
    gameHost.ts   the single Phaser.Game instance (creation, resize, level launching)
    events.ts     Phaser ↔ React event bus
    config.ts     physics and world constants
    art/          original SVG sprites and their rasterization into textures
    entities/     LampPlayer, Platform, Collectible, WorldObjects (portal, gates, NPCs…)
    levels/       level1–4.ts — levels as data
    scenes/       BootScene, LevelScene (one scene builds any level from data)
    systems/      InputController, QuestionManager, ProgressManager, AudioManager, Speech
    world/        themes, parallax backgrounds, platform rendering
  storage/        saveManager.ts — reading, validating, and writing the save
  styles/         global.css, game.css
  types/          game.ts — shared types
tests/            Playwright tests
```

### Saving

The `localStorage` key is `lampquest.save.v1`. Format version 2 added 12 levels, chapters,
and shards. Old saves (version 1) are read and migrated automatically: progress, rewards,
and statistics are kept, and level 5 is unlocked once level 4 is completed.

### Variable tasks

Tasks do not repeat when a level is played again. A task at a station is a **slot**
(`src/game/systems/variants/slots.ts`). The reward and the effect on the world are fixed
for the slot: bridge, gate, lift. The content is built anew before every level launch.

- **What changes:** stories and notes (`banks.ts`), the question about a story, the form of
  the task (an equation, a word problem, a missing number, "more" or "less", two or three
  numbers), the pattern rule, the route map, the track and the bug in the robot program, the
  English word (only from the signs already shown), the description to search for, and the
  order of the options.
- **No repeats:** the last 4 variants of each slot are stored in the save (`variantHistory`),
  and the generator avoids them. A task from the previous playthrough is never repeated.
- **Difficulty 1–3** is chosen per skill from the most recent answers (`mastery`). If the
  child solves tasks on the first try, the tasks get slightly harder; if hints are needed,
  they get easier. Numbers never exceed the level's ceiling: 10 in chapter 1, 15 on levels
  5, 6, 10, 11, and 20 on the rest.
- **Linked tasks:** the lanterns that were counted carry over into the equation, the second
  step of the gate continues the first, two questions about one story use the same text, the
  helper robot runs the child's program, and the machine is assembled in the order from the
  instruction.
- **Validation:** every generated task goes through a validator (`validate.ts`); on failure,
  the original task from `src/data/questions.ts` is used.
- **Replaying a specific set:** open the game with `?seed=N` and the tasks will be the same.

### Platform mechanics (the `kind` field and other `PlatformDef` fields)

`ground`, `ledge`, `cloud`, `bridge`, `mushroom`, `crystal`, `shelf`, `books`, `island` —
regular; `bouncy` (trampoline, `bounce` field), `ice` (ice), `conveyor` (the `conveyor` field
is the speed), `block` (a solid block or ceiling); `move: { dx }` or `move: { dy }` — a moving
platform or lift; `showWhen` — the platform appears after a flag is set. Air currents are
`winds`, the helper robot is `helpers`, spinning decorations are `decor`, and soft gravity is
`physics`.

### How to add a task or a level

- **Task.** Add an object to `src/data/questions.ts` and put its `id` in the `questions`
  field of the station on the desired level.
- **Chapter 2 task.** Types: choosing an answer or a picture, event order (`order`), robot
  program (`program`), bug finding (`visual.kind = 'code'`), sequence (`sequence`), route
  (`grid`), energy problem (`energy`), finding an object in the world (a `find` station, by
  English word or by description).
- **Level.** Describe it following the example of `src/game/levels/level5.ts`: platforms,
  stars, stations, goals, and the portal. Then add it to `src/game/levels/index.ts` and
  `src/data/chapters.ts`. No separate game code needs to be written for it. After making
  changes, run `npx playwright test tests/levels.spec.ts --project=desktop-chromium`.
