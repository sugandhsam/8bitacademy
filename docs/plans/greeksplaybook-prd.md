# PRD — "greeksplaybook" (07-playbook.html)

**Status:** Locked spec, ready to build · **Date:** 2026-07-01 · **Repo:** `8bittrading` (live https://8bittrading.com)
**Process:** local-light — this PRD + `greeksplaybook-slices.md` are the plan of record; build in a worktree, manual browser review. No GitHub Project publish, no automated TDD (static/no-build site).
**Source of the spec:** grill session 2026-07-01 (handoff `~/Projects/AGENT/handoff/2026-07-01-greeksplaybook-grill-to-prd.md`). Spec is closed — do not re-open.

---

## Problem Statement

The academy has six teaching pages but no *capstone* — nothing that lets a learner take what they just read (day type, levels, vanna context, charm timing, the play library) and turn a real morning's ES numbers into an actual plan. An untracked prototype (`prototype/es-morning-prep.html`, built 20 May) tried to be that tool, but it was built on the **pre-PR#6 academy model the site has since explicitly repudiated**. It hard-codes three ideas the academy now teaches *against*:

- a `VIX ≥ ±5% → abandon playbook` hard override (academy: vol-event is *a judgment call, not a threshold*),
- a 4-regime VEX×VIX `getVannaRegime()` computation (academy: you *don't compute regimes* — read one line off the sign of net vanna),
- Wed/Fri-only charm scheduling (academy: with daily 0DTE, **charm runs every day**, switching around noon).

It also conflates magnet (gamma) with charm-pin (time-weighted charm), and assumes an SPX→ES offset users don't need (they already get ES off Discord). So "make the tool match the academy" means **rebuilding the tool's decision engine**, not restyling it — plus a full design remap to `academy.css`, and shipping it live as a native capstone page like the rest of the site.

## Solution

A new native academy page, **`07-playbook.html`** ("Playbook"), that reproduces the prototype's proven UX skeleton (day picker, choice buttons, plan blocks, session clock, levels table, empty-state, localStorage autosave, print, "Load example") but with:

1. a **decision engine rebuilt to the current academy** (academy = single source of truth),
2. **ES-only** manual input (no SPX field, no offset, no conversion),
3. the **full academy level set**, grouped and all-optional, each with a 🧿 confluence toggle,
4. output in **academy voice** — action + confirming *tell* + qualitative **High/Med/Low** odds, never fabricated win-rates,
5. a **design remap** to `academy.css` (Syne + DM Mono, brand green, gexpro level hues), tool-specific CSS inline in the page,
6. **native integration**: nav link on all 8 pages, learning-path step 6 + Section 07 hub card on `index.html`, favicon + OG tags.

The learner fills in whatever they have (only "current ES" is required) and the page renders a same-morning plan that speaks exactly the language the six lessons teach.

## User Stories

1. As a learner who just finished the six lessons, I want a single page that turns this morning's ES numbers into a plan, so that I can practice the whole workflow end-to-end.
2. As a trader, I want to enter only ES values (no SPX, no offset), so that I use the same numbers I already pull off Discord without converting anything.
3. As a user, I want to pick today's day-of-week (auto-detected, overridable), so that the plan applies the correct daily accents.
4. As a user, I want to choose one of four ramp structures and have the tool derive the Day Type, so that I don't have to classify the regime myself.
5. As a user, I want to confirm or override the derived Day Type, so that I keep judgment where the ramp class is ambiguous (net regime + trapdoor).
6. As a user, I want to set the net-vanna sign (positive/negative) and get one line of context, so that I read vanna the way the academy teaches — context, not a computed regime.
7. As a user, I want an *optional* VIX% field that only surfaces the advanced V1–V4 vanna plays plus a soft "vol event = judgment call" note, so that I get the advanced tier without any hard override of the playbook.
8. As a user, I want to enter each academy level (ceiling, floor, magnet, flip, trapdoor, squeeze, vol-zone, charm-pin, charm-fade) optionally, so that the plan renders only what I actually have.
9. As a user, I want the levels grouped (Walls / Regime / Vol / Charm), so that the form maps to how the academy organizes them.
10. As a user, I want a 🧿 confluence toggle per level, so that I can mark stacked-greek levels and have the plan weight them harder.
11. As a user, I want a colored Day-Type regime read at the top of the output, so that I see the day's character at a glance in the academy's color language.
12. As a user, I want a one-line vanna context read in the output, so that I know the mechanical tilt (falling VIX → mechanical buying is context, not a signal).
13. As a user, I want a vol-event judgment note *instead of* a red override banner, so that the tool never tells me to abandon the plan on a VIX threshold.
14. As a user, I want an ES levels table with academy level types, 🧿 flags, and short academy descriptions, so that I can read the board structure in plain language.
15. As a user, I want the active plays selected by Day Type × levels present × charm timing × vanna sign and mapped 1:1 to `05-plays`, so that the tool never invents a play the academy doesn't teach.
16. As a user, I want plays written in academy voice (action + tell + High/Med/Low), so that I get qualitative conviction, never fabricated stats or "size up."
17. As a user, I want a daily session clock (gamma AM → noon switch → charm PM drift → 3:30 exit) with per-day accents and the current time row highlighted, so that I know what regime governs *right now*.
18. As a user, I want invalidations (flip / trapdoor / squeeze breaks) listed, so that I know what kills the thesis.
19. As a user, I want a "watch-for" block (conflict signals, confluence callouts, pin distance) in academy framing, so that I know the tells to monitor.
20. As a user, I want my inputs autosaved to localStorage, so that a refresh doesn't wipe my morning setup.
21. As a user, I want a "Load example" button with an academy-consistent scenario, so that I can see a filled-in plan without typing.
22. As a user, I want to print the plan, so that I can keep a paper copy at my desk.
23. As a user, I want an empty-state before I fill anything in, so that the page tells me what to do first.
24. As a learner browsing the site, I want a "Playbook" nav link on every page, so that I can reach the capstone from anywhere.
25. As a learner on the home page, I want a learning-path step 6 ("Put it together") and a Section 07 hub card, so that the capstone is discoverable in the guided flow.
26. As a visitor sharing the page, I want favicon + Open Graph/Twitter tags on the playbook, so that the link previews correctly like every other page.
27. As a maintainer, I want the page to reuse `academy.css` tokens and the exact gexpro level colors, so that it stays visually consistent and the color contract holds.

## Implementation Decisions

### The 8 locked design decisions
1. **Academy = single source of truth.** Rebuild the tool's logic to it. Advanced VIX-timing plays (V1–V4) survive but as flagged "advanced" *outputs*, never a hard override.
2. **Manual entry + paste.** Manual level fields, plus a "Paste from Discord" box that parses the gexgreeks chart-string (`price|tag|size|sign|source|strength`) and auto-fills the fields (added 2026-07-01 at Sam's request — was originally deferred). Keeps the strongest instance per level type, splits `trapdoor` into trapdoor/squeeze by position vs the flip (or current ES), fills both component fields for confluence tags, and reads `Current:` if the full post is pasted. Manual editing still works after a paste.
3. **Day Type inferred from the ramp read + confirm/override.** The prototype's 4 ramp buttons map 1:1 to the skill's 4 gamma scenarios — keep them, relabel to the 6 canonical Day Types + regime colors. Exact label within a ramp class needs light judgment (net regime + trapdoor) → user confirms.
4. **Full academy level set, grouped + all-optional + 🧿 confluence toggle per level.** Groups: **Walls** (ceiling/floor/magnet) · **Regime** (flip) · **Vol** (trapdoor/squeeze/vol-zone) · **Charm** (charm-pin/charm-fade). Only "current ES" required; plan renders what you fill.
5. **ES-only.** No SPX field, no offset, no conversion. Strip `currentSpx`, `fvOffset`, `toES()`, "SPX·ES" display.
6. **Academy voice** — action + confirming **tell** + **High/Med/Low** qualitative odds. NO "size up," NO invented conviction/win-rates.
7. **Session clock kept, reworked to the daily-charm spine** — gamma AM → **noon switch** → charm PM drift → 3:30 exit, + per-day accents (Fri pins hardest + OPEX note; Thu vanna lean). Current-time row highlighted.
8. **Native capstone.** Filename `07-playbook.html`; nav on all 8 pages; learning-path step 6 + Section 07 hub card on `index.html`; favicon + OG tags.

### Confirmed micro-decisions (2026-07-01)
- **VIX% field: KEPT.** Optional. Feeds ONLY the advanced V1–V4 plays + a soft "vol event = judgment call" note. Never a threshold, never an override.
- **Nav label: "Playbook."** Sits next to the "Plays" lesson.

### What gets TORN OUT (from the prototype)
- 5% VIX override engine (banner, watchlist, `render()` override path).
- VEX×VIX 4-regime computation (`getVannaRegime`).
- Wed/Fri-only charm scheduling (`DAY_PRIMARY`, day clocks).
- SPX→ES offset (`currentSpx`, `fvOffset`, `toES()`, "SPX·ES" display).
- "Pin = largest abs GEX" → **split into magnet (gamma) + charm-pin (time-weighted charm)** as separate levels.

### Input → Output map (rebuilt tool)

**Inputs (all ES):**
- Day-of-week (auto-detect, override) — **accents only**, not the primary driver.
- Ramp structure (4 buttons) → **derives Day Type** (confirm/override).
- **Net-vanna sign** (pos/neg) — the one-line vanna context read (renamed from "VEX").
- *Optional* VIX% — feeds only advanced V1–V4 plays + soft vol-event note.
- Level set (ES): ceiling · floor · magnet · flip · trapdoor · squeeze · vol-zone · charm-pin · charm-fade, each with a 🧿 flag. Current ES required.

**Outputs (academy-toned):**
- Day-Type regime read (colored) + board structure + one-line vanna context.
- Vol-event judgment note (replaces the old red override banner).
- ES levels table — academy level types + 🧿 confluence + short academy descriptions.
- Active plays mapped 1:1 to `05-plays` (starter + G/C/V + advanced), selected by Day Type × levels present × charm-timing × vanna sign, in academy voice.
- Daily session clock + per-day accents.
- Invalidations — flip / trapdoor / squeeze breaks.
- Watch-for — conflict signals, confluence callouts, pin-distance — academy-framed.

### Modules (logical, all inline JS in one file — no bundler)
- **`deriveDayType(ramp, netVannaSign, hasTrapdoor)`** — 4 ramp classes → candidate Day Type (of the 6 canonical) + suggested regime color; caller confirms/overrides. Deep + pure → the one piece worth an isolated DOM-logic sanity check.
- **`selectPlays(dayType, levelsPresent, charmPhase, netVannaSign, vixPct?)`** — returns the ordered play list (starter + G/C/V + optional V1–V4) drawn from the `05-plays` library, each with action + tell + High/Med/Low. Pure.
- **`sessionClock(now, dayOfWeek)`** — returns the daily-charm timeline rows with the current row flagged and per-day accents. Pure given `now`.
- **`vannaContextLine(netVannaSign)`** — one-line context read. Pure.
- **`renderPlan(state)`** — orchestrates the above into DOM; no business logic of its own.
- **`persist()/restore()`** — localStorage autosave/rehydrate.

### Design remap
- Fonts **Syne (display) + DM Mono (body)** (prototype used Fraunces + JetBrains Mono — remap). Brand green `#26a17b`.
- gexpro level hues (the color contract, from `MEMORY.md` invariant): ceiling `#afafaf`, floor `#afafaf` (same grey — label distinguishes), magnet `#68a499`, trapdoor `#aa90c5`, vol-zone `#deb881`, charm `#ab47bc`, flip `#6b7cb8`.
- Day-Type colors (3-color mapping from PR#6): green `#2ECC71`, yellow `#F1C40F`, red `#E74C3C`.
- Tool-specific CSS **inline in `07-playbook.html`** on top of linked `academy.css` (consistent with `03-charm`/`05-plays`).
- Keep localStorage autosave, print, "Load example" (example updated to an academy-consistent scenario).

## Testing Decisions

- **No automated test harness.** The site is build-less static HTML/CSS/JS with `Testing: none (manual visual review)`. Introducing a JS test runner would violate the **no-build-step** invariant. Primary verification is **manual browser review** (`open 07-playbook.html`).
- **Good test = external behavior, not implementation.** The only logic worth an isolated check is the pure decision functions (`deriveDayType`, `selectPlays`, `sessionClock`, `vannaContextLine`). If a lightweight check is wanted, it's an inline dev-only console assertion block (guarded, never shipped in the render path) exercising: each of the 4 ramps → expected candidate Day Type; a levels-present matrix → expected play set; noon boundary → gamma-vs-charm phase flip. No framework, no new dependency.
- **Manual review checklist** (per slice, see slices doc): renders correctly with an empty form; "Load example" produces a coherent academy-consistent plan; ES-only (no SPX anywhere); colors match the contract; nav/home links resolve on all 8 pages; print layout is clean; OG/favicon present.

## Out of Scope

- ~~Chart-string paste parser~~ — **now implemented** (2026-07-01, see Implementation Decision 2). Raw Periscope greek-*table* parsing (the un-formatted board, not the chart-string) remains out.
- SPX support or any SPX↔ES conversion — permanently out (ES-only).
- Any live data / API / websocket feed — the tool is manual-input by design.
- Fabricated probabilities, win-rates, or position sizing — banned by invariant.
- Rebuilding or re-teaching the six lesson pages — this PRD only *reads* them as source of truth; their copy is not edited (except the required nav link on each).
- A build step, framework, or component library (shadcn N/A — hand-authored static site).

## Further Notes

**Ground-truth sources (read before touching level/greek/play logic — do not invent):**
- `~/.claude/skills/gexgreeks/SKILL.md` — canonical. `L158-166` (4 ramp→Day-Type), `L175-180` (6 Day Types), `L97-109` (levels incl. trapdoor/squeeze ±100 ES window, exclude ±5 of spot), `L85` (CHEX = top 10% weighted charm, always active), `L102` (charm-pin=+CHEX, charm-fade=−CHEX), `L214` (tag vocab, confluence joins with `+`), `L44` (GEX regime = sign of sum(GEX)).
- Academy pages: `02-vanna.html:76` (vanna one-line), `03-charm.html:96,111,113` (daily charm, Fri ×1.25, noon switch, 3:30 exit), `05-plays.html:287` (vol-event judgment) + V1–V4 tables (~L354-372) + starter plays + Today's Card, `04-levels.html` (level type anchors + confluence).
- Repo `MEMORY.md` — level color contract, "7 levels + regime flip + confluence 🧿" framing, vanna context-only, charm daily, no fabricated stats.
- Prototype `prototype/es-morning-prep.html` — read for the UX skeleton to preserve (day-picker, choice buttons, plan blocks, clock, levels table, empty-state, localStorage, print).

**Environment / workflow gotchas:**
- `main` is hook-locked. Branch + PR via a worktree: `wt new 8bittrading sam/<slug> --base main` → `~/Worktrees/8bittrading/sam--<slug>`. Edit in the worktree.
- Delete remote branch via `gh api -X DELETE repos/sugandhsam/8bitacademy/git/refs/heads/<branch>` (push --delete is hook-blocked).
- Merge agent PRs with an explicit "merge PR N" → `gh pr merge N --repo sugandhsam/8bitacademy --merge`.
- Post-merge `git pull --ff-only` can abort if the PR adds a path that exists locally untracked (`prototype/` is currently untracked — expect this if the prototype is committed/moved).
- Review = `open 07-playbook.html`. No build step.

**Prototype disposition (decide at build time):** delete `prototype/es-morning-prep.html` once superseded, or keep as a tracked backup (like the old `greeks-playbook.html`). Confirm with Sam before deleting.

**MEMORY.md:** add a `## Decisions` entry for the greeksplaybook rebuild when the work lands.
