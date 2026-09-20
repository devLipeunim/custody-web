# Custody Dashboard

Case officer's view of the Custody chain of custody system. Displays cases and evidence items,
renders the custody timeline, runs verification and shows which part of a file changed.

Part of **Custody**, ICSC 2026 Universities Hackathon, Track H, by Team Captain.
The API and the project overview are in [`hackathonBackend`](../hackathonBackend).

---

## Contents

- [Overview](#overview)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Routes](#routes)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Implementation notes](#implementation-notes)

---

## Overview

Three things are worth knowing before reading the code.

**File integrity and chain integrity are always reported separately.** A file can be intact
while its handling record has been edited, and the reverse. The UI never collapses them into
one indicator.

**The custody timeline draws the chain as a line.** A break renders as a visibly severed link
at the exact point it occurs, with every event above it still marked verified.

**The chunk map is the primary visual.** One block per 4MB chunk, green for matching and red
for altered, turning a hash mismatch into a byte range a non technical reader can see.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15, App Router |
| Language | TypeScript, `strict` |
| UI | React 19, plain CSS |
| Data | Custody API over `fetch` |

No CSS framework and no component library. Fonts are system fonts: an offline first system
should not fetch typefaces from a CDN.

---

## Prerequisites

- Node.js 20 or later
- The Custody API running on port 4000

---

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

The API must be running first. If it is not, the case list renders an explanatory panel rather
than an error.

---

## Configuration

`.env.local`:

```ini
API_BASE=http://localhost:4000              # server components
NEXT_PUBLIC_API_BASE=http://localhost:4000  # browser: the verify controls
```

Both are required. Pages are rendered on the server, but verification is triggered from the
browser so the officer watches it happen rather than waiting on a page load. If
`NEXT_PUBLIC_API_BASE` is missing, the verify button silently does nothing; a test asserts it
is compiled into the client bundle.

If the dashboard is opened from another machine, `NEXT_PUBLIC_API_BASE` must be the API's LAN
address, since it resolves in the viewer's browser.

---

## Routes

| Route | Description |
| --- | --- |
| `/` | Case list, totals, and an integrity summary as at the last verification |
| `/cases/[reference]` | Items in the case, and the case level chain check |
| `/items/[reference]` | Item detail, verification, chunk map, custody timeline |

`/items/[reference]?verify=1` runs verification on arrival, so a result can be shared as a URL.

All routes are `force-dynamic` and fetch with `cache: "no-store"`. An integrity dashboard that
serves a stale "intact" is worse than one that is slow.

---

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Development server on `0.0.0.0:3000` |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |

The dashboard's test suite lives with the backend: `npm run test:web` in `hackathonBackend`,
with both servers running. It asserts against served HTML, including that no raw database enum
or ISO timestamp reaches the page.

---

## Project structure

```
app/
  page.tsx                  case list
  cases/[id]/page.tsx       case detail
  items/[id]/page.tsx       item detail and custody timeline
  */loading.tsx             route level skeletons
  not-found.tsx             unknown reference
  globals.css               design tokens, layout, motion
components/
  VerifyPanel.tsx           verification and the chunk map
  CaseChainCheck.tsx        case level chain check
  Skeleton.tsx              loading placeholders
lib/api.ts                  fetch wrapper and formatting
types/api.ts                API response types
```

---

## Implementation notes

**Types mirror the API.** `types/api.ts` states the response contract once, so a field that
moves on the server is a compile error here rather than an `undefined` at runtime. It is kept
in step with `hackathonBackend/src` by the backend's contract suite.

**TypeScript is pinned to 5.x.** Next 15.5's config loader calls `ts.sys`, which TypeScript 7
no longer exposes, so `next.config.ts` fails to transpile under it.

**Motion is used to explain, not decorate.** One easing curve and three durations, everything
under 500ms, and all of it disabled under `prefers-reduced-motion`. Skeletons are shaped like
the content they replace so nothing shifts when data lands; the verification skeleton includes
the chunk row for the same reason.

**Detail routes answer `200`, not `404`, for an unknown reference.** `loading.tsx` places a
Suspense boundary around them, so the shell streams before the data arrives and the status line
is already sent by the time `notFound()` runs. The page still renders "No such record".
Removing `app/**/loading.tsx` restores the `404` and loses the skeletons.

All data displayed is synthetic. See the backend README for provenance.
