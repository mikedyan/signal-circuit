# Day 82 Spec — Shareable Circuit Snapshot Cards

**Roadmap item:** Cycle 3 BUILD Day 1  
**Feature title:** Shareable Circuit Snapshot Cards  
**Status:** Complete — verified via raw CDP on localhost (`?v=1779811200`, SW v56)

## Problem

Signal Circuit already has two partial social primitives:

1. Day 31 share-card modal: generates a branded 1200×630 image, but the right side is generic decorative circuitry.
2. Day 43 level previews: saves real solved-circuit geometry after completion, but only uses it as small thumbnails on level-select cards.

The Cycle 2 review recommends a social hook. The cheapest credible version is to merge these two existing surfaces: the share image should show the actual solved circuit.

## User Story

After solving a campaign level, I click `📸 Share Card` and get a polished image that includes my stars, gate count, solve time, aesthetics score, and a real snapshot of the circuit I just built. I can save the image, copy it to clipboard, or use native share when the browser supports it.

## Scope

### In

- Update share-card modal controls:
  - `💾 Save Image`
  - `📋 Copy Image`
  - `🔗 Share`
  - Close
- Draw a framed “Solved circuit” panel on the generated card.
- Use `gameState.getPreview(level.id)` + existing `_renderPreviewCanvas()` when preview data exists.
- Provide deterministic abstract fallback when no preview is available.
- Keep old campaign-only visibility behavior for `share-card-btn`.
- Add modal status text for copy/share outcomes.
- Cache bust to `?v=1779811200`; SW to `signal-circuit-v56`.

### Out

- No external network posting.
- No real social API integration.
- No new top-level level-select buttons.
- No changes to preview storage schema.

## Implementation Notes

- Add helper methods on `UI`:
  - `_drawCircuitSnapshotOnShareCard(ctx, level, area)`
  - `_drawShareCardFallbackCircuit(ctx, area, seed)`
  - `_roundRectPath(ctx, x, y, w, h, r)`
  - `_copyShareCardImage(btn, status)`
  - `_nativeShareCard(btn, status)`
  - `_setShareCardStatus(status, text, tone)`
- `generateShareCard()` sets `this._lastShareCardMeta` so native share has stable title/text.
- Clipboard image copy uses `ClipboardItem` when available, falling back to copying the page URL/text rather than throwing.
- The share-card canvas stays same output size: 1200×630.

## QA Plan

1. Syntax-check changed JS: `node -c js/ui.js`.
2. Start local server on `:8901`.
3. CDP browser verification:
   - clear localStorage and caches/SW
   - start level 1
   - build AND solution
   - run simulation to completion
   - assert share card button visible
   - click/generate share card
   - assert modal visible
   - assert canvas dimensions = 1200×630
   - assert right-side snapshot panel has non-background pixel diversity
   - assert copy/share/download/close controls exist
   - assert `gameState.getPreview(1)` exists
   - assert 0 console errors
4. Regression:
   - level select still starts with 2 visible non-level buttons
   - Day 78/80 share-independent surfaces unchanged enough for cold-start smoke

## Success Criteria

- ✅ Share card visibly contains the solved circuit, not random decoration.
- ✅ Completion flow still works.
- ✅ Console error count remains 0.
- ✅ No open bugs added.

## QA Result

See `qa-reports/day-82-qa.md`.

- L1 solved with 1 AND gate + 3 wires via Quick Test.
- Preview persisted: 1 gate, 3 wires, 3 IO nodes.
- Share-card modal opened with Save / Copy / Share / Close controls visible.
- Canvas remained 1200×630 and right-side snapshot panel had non-background pixel diversity (`nonDark=4750`, `tealish=977`).
