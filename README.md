# Custody: dashboard

The case officer's view. Next.js App Router. Part of **Custody**, ICSC 2026 Track H; the
backend and the full project README are in `hackathonBackend`.

All data shown is synthetic.

## Running

The API must be running first, on port 4000.

```bash
npm install
npm run dev        # http://localhost:3000
```

`.env.local` holds the API address:

```
API_BASE=http://localhost:4000              # server components
NEXT_PUBLIC_API_BASE=http://localhost:4000  # the verify button, in the browser
```

Both are needed: pages are rendered on the server, but verification is triggered from the
browser so that the officer sees it happen rather than waiting on a page load.

## Screens

| Route | What it shows |
|---|---|
| `/` | case list, with an integrity summary per case as at the last verification |
| `/cases/[ref]` | items in the case, and the case level chain check |
| `/items/[ref]` | item detail, verification, the chunk map, and the custody timeline |

## The two things worth looking at

**The custody timeline** renders the chain as a line running down the side of the events, so a
break is a visibly severed line at the exact link rather than a red word somewhere on the page.
Everything above the break stays green, because everything above the break is still verified.

**The chunk map** is a row of blocks, green for matching and red for altered. It is the
strongest visual in the project: it turns "the hash does not match" into "this part of the
file, these bytes". Hover a block for its byte range.

Pages are `force-dynamic` and fetch with `cache: "no-store"`. An integrity dashboard that
serves a stale "intact" is worse than one that is slow.
