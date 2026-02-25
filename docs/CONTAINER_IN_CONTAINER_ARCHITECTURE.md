# Container-in-Container Architecture

## Overview

The Craft.js editor uses a three-level hierarchy for section-based components:

- **SectionBlock** — Section wrapper: background, padding, section height, animation, `data-block-type`. Reads theme from ThemeContext.
- **LayoutBlock** — Grid/flex container: columns, gap, alignment. Accepts CardBlock children.
- **CardBlock** — Resizable card (re-resizable). Content is **props only**, not separate Craft.js nodes.

Specialized cards (e.g. **PricingCardBlock**) follow the same rule: all text and list content are props; no inner Text/Container nodes.

## Multi-page scaling

- **Unit of scale:** One page = one canvas = one serialized JSON (plus optional separate `mobileData`).
- **Storage:** `projects.pages[]` with `desktopData` and `mobileData` per page. Load/save is per page.
- **Future:** Export/build can output one file per page (e.g. `page-home.json`, `page-catalog.json`). No change to node format required.

## Node limit and content-as-props

- **Craft.js limit:** ~300–500 editable nodes per page for stable performance.
- **Rule:** Card content (titles, descriptions, lists) must be **props**, not separate Craft.js nodes. Use contentEditable on props with throttle (e.g. 1000 ms) for inline editing.
- **Effect:** One pricing section = 1 SectionBlock + 1 LayoutBlock + N PricingCardBlock = 2 + N nodes, regardless of text length. Without this rule, each text field would add a node and the limit would be hit quickly.

## ThemeContext

- **ThemeContext** provides `accentColor` and `colorScheme` (dark/light) to CiC components.
- **Provider** wraps editor content inside `<Editor>` so canvas components can use `useTheme()`.
- **Toolbar** updates theme (e.g. Dark/Light in preview, future color presets) via ThemeContext; legacy Tron nodes still get theme via existing `setProp` iteration where needed.

## Files

- `lib/craft/context/ThemeContext.tsx` — Theme state and provider.
- `lib/craft/components/blocks/SectionBlock.tsx` — Section primitive.
- `lib/craft/components/blocks/LayoutBlock.tsx` — Layout primitive.
- `lib/craft/components/blocks/CardBlock.tsx` — Generic resizable card.
- `lib/craft/components/blocks/PricingCardBlock.tsx` — Pricing card (content-as-props, re-resizable).

Preset **"Pricing (CiC)"** in Toolbox adds SectionBlock → LayoutBlock → 3× PricingCardBlock in one click.
