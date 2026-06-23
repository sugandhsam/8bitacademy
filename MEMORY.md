# MEMORY

## Stack
- Language: HTML5 + CSS3 (static, hand-authored)
- Framework: none
- Package manager: none
- Database: none
- Testing: none (manual visual review in browser)
- Styling: single shared `academy.css` — Syne (display) + DM Mono (body), dark theme

## Invariants
- **No build step.** Plain static files served as-is. Never introduce a bundler/framework without explicit ask.
- **Level colors must match the gexpro indicator exactly** (ceiling #017d67, floor #df8f00, magnet #028f76, trapdoor #e73528, vol-zone #ff8100, charm #ab47bc, flip dashed #f23645). The academy teaches the chart; colors are the contract.
- **Level definitions are sourced from the `gexgreeks` skill**, not invented. Edits to level meaning must trace back to that skill.
- **No fabricated stats.** Probabilities are qualitative scenario trees (High/Med/Low + tells), never invented win-rates.
- Brand = **8BitTrading Academy**. The gexpro indicator keeps its own 8BF/[8B] branding (separate repo `indicators`).

## Decisions
- **2026-06-23 — Custom domain live.** Site serves at https://8bittrading.com (apex = primary URL) via GitHub Pages. DNS at Porkbun: apex `ALIAS` + `www` `CNAME`, both → `sugandhsam.github.io` (Porkbun's default parking ALIAS/CNAME were removed first). `www` 301-redirects to apex; HTTP→HTTPS enforced (Let's Encrypt cert auto-provisioned). The `CNAME` repo file + domain were set via the Pages API (server-side, bypasses the locked-`main` hook). Not yet GitHub domain-verified (optional TXT-record hardening, low priority).
- **2026-06-23 — Split into its own repo.** Moved the academy out of `indicators/tradingview/gex-pipeline/docs/academy/` into a standalone repo at `~/Projects/8bitacademy` for independent GitHub hosting (Pages). Rejected: keeping it inside `indicators` (couples the public site to the indicator repo's release flow).
- **Multi-page mini-site** (index + 5 pages + shared CSS), not a single scrolling doc. Rejected single-page: too long for a from-zero teaching artifact.
- The superseded original `greeks-playbook.html` stays in the `indicators` repo as a tracked backup; not carried over.
