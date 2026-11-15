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
| 2.2 | CMU Regular typography (Thai) | Done |
| 2.2 | Stopwatch & focus timer | Done |
| 2.2.1 | Timer display refinement (MM:SS / H:MM:SS) | Done |
| 3 | YouTube music player + saved library | Done |
| 2.x | Notes | Planned |
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

- **Stopwatch & focus timer**
  - Stopwatch: start, pause, resume, reset, laps (split + total, fastest/slowest marked when there are two or more laps).
  - Focus timer: Focus 25 / Short break 5 / Long break 15, with a custom duration (1–180 min) per preset, a circular progress ring and a completion state.
  - Accurate by design: state stores timestamps (`startedAt`, `endAt`), never a per-second counter, so time is correct after closing the panel, switching tools, refreshing, or a throttled/hidden tab. A countdown that expired while the page was closed shows as complete on return.
  - The engine (`src/services/timerStore.ts`) lives outside React, so timers keep running when the panel is closed. A small dot on the toolbar icon shows that one is running.
  - Completion: a glass toast appears (dismissable). The browser Notification API is used only if permission was already granted; Sanctuary never requests it.
  - Saved under `sanctuary:timer`; stored data is validated and clamped before use.

- **YouTube music player** (Music tool)
  - Paste a YouTube video or playlist link; press Enter or Play. Links are parsed strictly (youtube.com, youtu.be, music.youtube.com, youtube-nocookie.com only) and reduced to a validated video/playlist ID. Auto-generated "mix" playlists cannot be embedded and are ignored. A watch link that also contains a playlist plays the playlist.
  - Uses only the official YouTube IFrame Player API. No audio is extracted, nothing is searched or scraped, ads and restrictions are untouched, and no video IDs are built in; you supply every link.
  - Saved library (`sanctuary:youtube`): label, category (Rain, Forest, Birds & nature, Water, Lofi study, Piano & instrumental, Other), type, remove, select-to-play, category filter. Only IDs are stored; entries are validated on load and labels are rendered as plain text.
  - One persistent player (`src/services/youtubeService.ts` + `YouTubeHost`) mounted at the app root, so playback continues when the panel closes or you open other tools or change modes. The IFrame API script is loaded once and only after you first press play.
  - After a refresh nothing plays automatically: your library, volume and last item are restored, and "Resume" requires a click.
  - The video stays visible (bottom-right on desktop and iPad landscape, top-left on tablet portrait) at 356×200, which respects YouTube's 200×200 minimum player size. Stop closes it.
  - Toolbar dots show activity: one for a running stopwatch/timer, one for playing music; both can show together.
  - Limits: some videos disable embedding (you'll see a message); ads and availability are controlled by YouTube; iPad/iPhone ignore programmatic volume (use the device volume); autoplay always needs a user gesture.

## Typography

- **Thai script:** CMU Regular, registered with `@font-face` in `src/styles/globals.css` as family `CMU`, weight 400 (also served for 500 so nothing is synthetically bolded), `font-display: swap`.
- **File:** `public/fonts/CMU-Regular.woff2` (about 20 KB, 241 glyphs: Basic Latin plus the full Thai block U+0E01–0E5B, with `mark`/`mkmk` positioning for vowels and tone marks).
- **Scope:** the face is limited by `unicode-range: U+0E00-0E7F`, so the browser downloads it only when Thai text appears (for example a Thai to-do item or a Thai date). Latin text and the clock digits keep Cormorant Garamond and Inter.
- **Fallbacks:** `Leelawadee UI` (Windows), `Thonburi` (Apple), `Noto Sans Thai`, then the generic family.
- **Source and licence:** the font's embedded metadata reads "Version 1.00 2025 by Fontcraft: Jutipong Poosumas. Exclusive for Corporate Communication and Alumni Relations Center, Chiang Mai University", with "All rights reserved" (www.fontcraftstudio.com). It is not an open-source licence. Confirm you are permitted to redistribute it before keeping it in a public repository or publishing the app.

## Project layout

```
src/
  components/
    environment/ParkScene.tsx      background scenes + crossfade
    interface/                     toolbar, clock, panel shell, settings, mode selector
    tools/TodoPanel.tsx            to-do list
    tools/TimerPanel.tsx           stopwatch + focus timer UI
    tools/TimerToast.tsx           completion toast
    entertainment/MusicPanel.tsx   YouTube link field, controls, saved library
    entertainment/YouTubeHost.tsx  persistent player container (always mounted)
  services/timerStore.ts           timer engine (persistence, completion, hooks)
  services/youtubeService.ts       link parsing, library, persistent IFrame player
  hooks/                           useClock, useLocalStorage (optional sanitizer)
  types/index.ts
  constants.ts                     defaults, per-mode tool lists
  styles/globals.css               Liquid Glass tokens and layout
public/parks/                      your photographs
public/fonts/CMU-Regular.woff2     Thai typeface
```

## Storage keys

`sanctuary:settings` (interface preferences), `sanctuary:todos` (tasks), `sanctuary:timer` (stopwatch and countdown), `sanctuary:youtube` (saved links, volume, last item).

## Browser notes

Liquid Glass uses `backdrop-filter` (with the `-webkit-` prefix for Safari/iPad) and falls back to a more opaque surface when unsupported. `prefers-reduced-motion` and the in-app "Reduce motion" setting both disable non-essential motion.
