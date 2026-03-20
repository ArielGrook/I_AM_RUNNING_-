# INTERACTIVE PIPELINE — Technical Specification

## Overview
Interactive (Door A) is a 4-step wizard that creates a real Craft.js project from user selections.
No AI, no templates database, no API calls — assembly happens client-side in a hidden Craft.js Editor.

## Files
```
app/[locale]/interactive/page.tsx    — Wizard UI + Assembly + Preview
lib/craft/assembler/index.ts         — Maps block IDs → Tron components
```

## User Flow

```
Step 1: Choose Business Type (16 options)
  ↓
Step 2: Choose Style (6 options: dark/light/minimal/bold/elegant/neon)
  ↓
Step 3: Choose Sections (12 blocks, header/hero/footer required)
  ↓
Step 4: Enter Company Name
  ↓
🚀 "Create Website" button
  ↓
Assembly Phase (hidden Craft.js Editor):
  - buildElementsFromContract() maps block IDs → React.createElement(TronComponent)
  - Each element added via query.parseReactElement().toNodeTree() + actions.addNodeTree()
  - query.serialize() produces Craft.js JSON
  ↓
Preview Phase:
  - Full-screen render via <Editor enabled={false}> + <Frame data={craftJson}>
  - Scrollable, touch-compatible
  - Header: "← Back to edit" | Preview: {name} | "Save & Edit" / "Sign up to save"
  ↓
Save Phase:
  - Authenticated: lz.compress → Supabase projects table → redirect to editor
  - Anonymous: localStorage → redirect to signup with ?from=interactive
```

## Contract Structure
```json
{
  "businessType": "food",
  "style": "dark",
  "blocks": ["header", "hero", "about", "features", "contact", "footer"],
  "companyName": "My Restaurant"
}
```

## Block ID → Component Mapping

| Block ID | Component | Notes |
|----------|-----------|-------|
| header | HeaderTron | |
| hero | HeroTron | showGrid: true, spotlightIntensity: 15 |
| about | TronAbout | |
| services | TronFeatures | TronServices not yet built |
| features | TronFeatures | |
| portfolio | TronPortfolio | |
| stats | TronStats | |
| testimonials | TronTestimonials | |
| pricing | TronPricing | |
| faq | TronFAQ | |
| contact | TronContact | |
| footer | TronFooter | |

## Assembly Method

Assembly happens **client-side** inside a hidden `<Editor>` because Craft.js serialization requires a running React tree:

```tsx
// Hidden off-screen
<Editor resolver={resolver} enabled={true}>
  <AssemblerInner contract={contract} onAssembled={handleAssembled} />
  <Frame>
    <Element is={Container} canvas />
  </Frame>
</Editor>
```

`AssemblerInner` uses `useEditor()` to access `query` and `actions`, builds the tree, serializes, and calls `onAssembled(json)`.

## Data Format in Supabase

```json
{
  "user_id": "uuid",
  "name": "My Restaurant",
  "description": "food - dark",
  "source": "interactive",
  "data": {
    "craft": {
      "schemaVersion": 2,
      "pages": [{
        "id": "page-1",
        "name": "Home",
        "slug": "home",
        "data": null,
        "desktopData": "lz-compressed-base64-string",
        "mobileData": null
      }],
      "activePageId": "page-1"
    }
  }
}
```

## Known Issues
- Component positioning: sections may overlap if minHeight not set correctly
- No mobile-specific assembly (mobileData is null — uses responsive layout)
- Style choice doesn't yet map to specific color presets (all use #FF6B35 + dark/light)
- No animation preset selection in wizard
- services block falls back to TronFeatures (TronServices not built)

## Future Improvements
- Map style choices to specific COLOR_PRESETS (not just dark/light)
- Add animation selection step
- Generate mobileData separately
- Thumbnail previews for each block in step 3
- Business-specific default content (restaurant menu items, portfolio projects, etc.)
- Multi-page support (About page, Contact page as separate pages)
