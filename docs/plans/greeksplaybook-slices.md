# Slices — greeksplaybook (07-playbook.html)

Tracer-bullet vertical slices for the PRD (`greeksplaybook-prd.md`). One branch (`sam/greeksplaybook`), one PR; each slice = a reviewable commit. Manual browser review per slice (`open 07-playbook.html`). Check boxes as they land.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done. Exec: **hitl** = review each step · **afk** = batchable.

---

## Slice 1 — Design-remap shell (exec:hitl)
Stand up the page so it looks native and is reachable, before any logic.
- [ ] Create `07-playbook.html` scaffold: `<head>` links `academy.css`, Syne + DM Mono, favicon links, OG/Twitter meta (title/desc/url), inline `<style>` block for tool-specific CSS.
- [ ] Port the prototype's page chrome (header, footer, layout grid) remapped to academy tokens — Fraunces→Syne, JetBrains Mono→DM Mono, brand green `#26a17b`, dark theme.
- [ ] Add "Playbook" nav link to all 8 pages (`index`, `01`–`06`, and `07` itself).
- [ ] `index.html`: learning-path step 6 ("Put it together") + Section 07 hub card.
- **Review:** page opens, looks native, nav link resolves from every page, home shows step 6 + card, favicon + OG present (view-source). No tool logic yet — empty-state placeholder is fine.

## Slice 2 — Inputs rebuild, ES-only (exec:hitl)
The form the learner fills in — correct fields, correct grouping, no SPX.
- [ ] Day-of-week picker (auto-detect current day, overridable).
- [ ] Ramp structure: 4 buttons relabeled to the canonical ramp classes; selection stored.
- [ ] Net-vanna sign toggle (positive / negative).
- [ ] Optional VIX% field (kept — see PRD; feeds V1–V4 + soft note only).
- [ ] Level inputs grouped: **Walls** (ceiling/floor/magnet) · **Regime** (flip) · **Vol** (trapdoor/squeeze/vol-zone) · **Charm** (charm-pin/charm-fade). Each optional, each with a 🧿 confluence toggle. "Current ES" required.
- [ ] Strip all SPX: no `currentSpx`/`fvOffset`/`toES()`/"SPX·ES" display anywhere.
- [ ] localStorage autosave/restore wired to the new field set.
- **Review:** every field present and grouped correctly; no SPX field exists; 🧿 toggles work; refresh preserves inputs; current ES is the only required field.

## Slice 3 — Output engine (exec:hitl) — the rebuilt brain
Turn inputs into an academy-voiced plan. This is the core of the rebuild.
- [ ] `deriveDayType(ramp, netVannaSign, hasTrapdoor)` → candidate Day Type (6 canonical) + regime color; render with confirm/override control.
- [ ] `vannaContextLine(netVannaSign)` → one-line context read (context, not a computed regime).
- [ ] Vol-event judgment **note** (soft) — replaces the old red override banner; VIX never abandons the plan.
- [ ] ES levels table: academy level types + 🧿 flags + short academy descriptions; magnet and charm-pin are SEPARATE rows (no "largest GEX = pin").
- [ ] `selectPlays(dayType, levelsPresent, charmPhase, netVannaSign, vixPct?)` → plays mapped 1:1 to `05-plays` (starter + G/C/V + optional V1–V4), each action + tell + High/Med/Low. No fabricated stats, no "size up."
- **Review:** each ramp → sensible Day Type; override works; levels table matches academy copy + colors; plays are all traceable to `05-plays`; VIX high value shows a note, never an override; voice is academy-correct.

## Slice 4 — Session clock, daily-charm rework (exec:hitl)
- [ ] `sessionClock(now, dayOfWeek)` → daily spine: gamma AM → noon switch → charm PM drift → 3:30 exit. NOT Wed/Fri-only.
- [ ] Per-day accents (Fri pins hardest + OPEX note; Thu vanna lean; etc.).
- [ ] Highlight the current-time row.
- **Review:** clock shows every-day charm; noon switch present; current row highlighted at real time; Fri/Thu accents correct.

## Slice 5 — Invalidations + watch-for (exec:hitl)
- [ ] Invalidations block: flip / trapdoor / squeeze breaks.
- [ ] Watch-for block: conflict signals, confluence callouts, pin-distance — academy framing.
- **Review:** invalidations reflect the levels actually entered; watch-for is academy-toned and conditional on inputs.

## Slice 6 — Polish + provenance (exec:afk)
- [ ] "Load example" → academy-consistent scenario (updated from the prototype's old example).
- [ ] Print stylesheet clean (plan prints, form chrome hidden).
- [ ] Empty-state copy tells the user what to do first.
- [ ] Optional dev-only guarded console-assertion block for the pure functions (no framework, never in the render path).
- [ ] `MEMORY.md`: add the greeksplaybook `## Decisions` entry.
- [ ] Prototype disposition: confirm with Sam — delete `prototype/es-morning-prep.html` or keep as tracked backup.
- [ ] Generate OG description for the page (if not already in slice 1).
- **Review:** example loads a full coherent plan; print is clean; empty-state clear; MEMORY.md updated; decision on prototype recorded.

---

### Files touched (whole PR)
- **New:** `07-playbook.html`
- **Edit (nav ×7 + self):** `index.html`, `01-gamma`…`06-indicators.html`, `07-playbook.html`
- **Edit (home):** `index.html` (learning-path step 6 + Section 07 card)
- **Edit:** `MEMORY.md` (Decisions entry)
- **Assets:** reuse shared favicon/OG image `public/assets/avat-big.png`; add per-page OG title/desc/url + favicon links to `07-playbook.html`
- **Maybe delete:** `prototype/es-morning-prep.html` (confirm with Sam)

### Definition of done
All 6 slices reviewed; page live-equivalent locally; every concept traces to the academy or `gexgreeks/SKILL.md`; color contract holds; no SPX; no fabricated stats; PR opened against `main` from the worktree.
