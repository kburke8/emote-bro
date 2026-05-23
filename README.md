# EmoteBros 🎮

A multiplayer collector-tycoon prototype: buy funny little characters, place them in your base, earn money, steal from your rivals, and defend your loot.

This repo contains two artifacts:

| File | What it is |
| ---- | ---------- |
| **[`index.html`](index.html)** | Interactive game design spec (27 sections, sortable tables, SVG diagrams, MVP progress tracker). |
| **[`game.html`](game.html)** | Playable browser prototype — 1 human vs. 3 AI rivals, all 20 MVP features implemented. |

## Play it

The simplest way: **double-click `game.html`** — it runs locally from `file://` (scripts are classic, not modules).

Or serve with any static server:

```bash
python -m http.server 8000
# then open http://localhost:8000/game.html
```

## Controls

| Key | Action |
| --- | ------ |
| `WASD` / arrows | Move |
| `E` | Interact (buy bro, open shop, pull lever, steal, lock base) |
| `Space` | Swing mace (stun nearby player) |
| `T` | Teleport home |
| `G` | Daily spin (when ready) |
| `L` | Lock base (when on lock slab) |
| `?` | Help |

## What's built

All 20 MVP features from the spec ship in the prototype:

- 4-player lobby (you + 3 AI), 4 bases, 12 slots each
- Carpet path with spawning EmoteBros + lever to flip direction
- Buy → walk-to-base → income → money slab → collect
- 30s base lock (compressed from 2 min for testing)
- Steal mechanic with carry/drop/recover
- Mace, teleport-home, guard suit, bow guard, teleport guard
- Pet shop (income multiplier), mount shop (speed), lucky blocks (rarity rolls), evolution altar
- Daily spin wheel, hourly events (compressed to 60s), VIP buyable
- Auto-save to localStorage every 15s

See **[`index.html`](index.html)** § 21 for the full feature checklist.

## File layout

```
game.html        shell + HUD + modals
game.css         styling
js/
├── config.js    data-driven defs (bros, pets, mounts, lucky tables, world geometry, tuning)
├── state.js     single source of truth + save/load
├── systems.js   gameplay rules — movement, stealing, guards, income, events
├── ai.js        AI plan/execute loop
├── render.js    canvas drawing
├── ui.js        input + DOM HUD + modals + toasts
└── main.js      boot + game loop
```

## Tuning

Compressed timings for prototype testing live in `js/config.js → TUNE`:

| Constant | Prototype | Spec |
| -------- | --------- | ---- |
| `BASE_LOCK_SECONDS` | 30 | 120 |
| `EVENT_INTERVAL_SECONDS` | 60 | 3600 |
| `SPIN_COOLDOWN_SECONDS` | 120 | 86400 |

Change these to spec-accurate values when you want the real cadence.

## Status

Prototype complete, ~2,600 LOC across 8 files. Built from the spec in [`spec.md`](spec.md), which was also rendered to [`index.html`](index.html).
