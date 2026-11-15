# Sanctuary — a little place to focus, grow and breathe

A personal study web app that feels like sitting in a quiet public park. The park photograph is the experience; the tools are small glass companions around the edges.

Built with React, Vite, TypeScript, Tailwind CSS v4, Framer Motion and Lucide. No backend, no accounts — everything is stored in your browser's LocalStorage.

## Run it

```bash
npm install
npm run dev        # development server
npm run build      # type-check + production build
npm run preview    # serve the production build
```

## Status

| Phase | Feature | State |
|---|---|---|
| 1 | Park scene, floating toolbar, panels, clock, settings, 3 modes | Done |
| 1.1 | Liquid Glass interface | Done |
| 2.1 | To-do list | Done |
| 2.x | Stopwatch & focus timer, notes | Planned |
| 3+ | Music, ambient sounds, garden, companion, park explorer | Planned |

## Park photographs

Scenes live in `src/components/environment/ParkScene.tsx` (`SCENES`). Put your photos in `public/parks/`:

- `park-01.png` (default), `park-02.jpg`, `park-03.jpg`

If a file is missing, a soft green gradient is shown instead. Use photos you own or that are licensed for this use, and record credits in `public/parks/CREDITS.md`. To add a scene, append an entry to `SCENES`. Per-scene image position (left–right, up–down) is set in **Settings**.

## Features

- **Clock** — HH:MM:SS, 12/24-hour, optional date. Updates on real second boundaries and pauses while the tab is hidden.
- **Modes** — Focus, Workspace, Relax change which tools appear in the toolbar.
- **Panels** — one at a time; close with Escape, the X, or the toolbar icon. Bottom sheet on tablet portrait.
- **Settings** — clock format, date, reduced motion, scene, image position. Persisted.
- **To-do list**
  - Type a task and press Enter (or tap +) to add it.
  - Tap a task's text to edit; Enter saves, Escape cancels.
  - Tap the circle to complete; the trash icon deletes.
  - Completed tasks are listed separately; "Clear completed" removes them; the footer shows how many remain.
  - Saved automatically under `sanctuary:todos`. Invalid or corrupted stored data is ignored safely.

## Project layout

```
src/
  components/
    environment/ParkScene.tsx      background scenes + crossfade
    interface/                     toolbar, clock, panel shell, settings, mode selector
    tools/TodoPanel.tsx            to-do list
  hooks/                           useClock, useLocalStorage (optional sanitizer)
  types/index.ts
  constants.ts                     defaults, per-mode tool lists
  styles/globals.css               Liquid Glass tokens and layout
public/parks/                      your photographs
```

## Storage keys

`sanctuary:settings` (interface preferences), `sanctuary:todos` (tasks).

## Browser notes

Liquid Glass uses `backdrop-filter` (with the `-webkit-` prefix for Safari/iPad) and falls back to a more opaque surface when unsupported. `prefers-reduced-motion` and the in-app "Reduce motion" setting both disable non-essential motion.
