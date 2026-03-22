# MVP HAPPY PATH — What Must Work End-to-End

*This document describes the shortest complete path from visitor → working result → potential payment.*
*It is not a full product vision doc. It is the minimum path that proves the product works.*

---

## 1. CURRENT MVP MONEY PATH (Website System)

This is the current practical path that can generate money first:

```text
1. User visits iamrunning.online
   ↓
2. Enters Interactive flow (or is guided there from landing CTA)
   ↓
3. Chooses niche / style / blocks / company data
   ↓
4. Sees assembled preview
   ↓
5. Signs up or logs in
   ↓
6. Project is saved to account
   ↓
7. Opens project in Craft.js editor and customizes it
   ↓
8. Deploys to subdomain
   ↓
9. Gets live website
   ↓
10. Pays to continue editing / using the system professionally
```

This is still the **primary shipping MVP path** for the current product.

---

## 2. WHY THIS PATH MATTERS

This path proves that the system can already do something valuable end-to-end:
- attract a visitor
- convert idea into structured site contract
- assemble a real project
- persist it into account storage
- allow deeper editing
- deploy a live result

If this path is smooth, the product already has commercial value.

---

## 3. CURRENT STATUS OF EACH STEP

| Step | Status | Notes / Risks |
|------|--------|---------------|
| 1. Landing entry | ✅ Working | Needs stronger positioning and pricing clarity |
| 2. Interactive entry | ✅ Working | Step 1 redesigned on 22.03.2026 |
| 3. Niche / style / block selection | ✅ Working | Step structure exists; future restructure still planned |
| 4. Preview of assembled site | ✅ Working | Positioning/overlap issues may still appear in some cases |
| 5. Sign up / login | ✅ Working | Anonymous → signup restore flow still imperfect |
| 6. Save project to account | ✅ Working | Authenticated save path exists |
| 7. Editor customization | ✅ Working | Full Craft.js editor available |
| 8. Deploy to subdomain | ✅ Working | SSR deployed sites, pixel-perfect target |
| 9. Live website result | ✅ Working | Depends on deploy/runtime stability |
| 10. Payment / access control | ❌ Incomplete | Stripe + route protection still blocker |

---

## 4. PRIMARY MVP BLOCKERS

These are the blockers for a clean launch of the current monetizable path:

### Must Have Before Launch
- [ ] Stripe integration (checkout + webhook + subscription/role upgrade)
- [ ] Route protection so editor access is actually tied to payment/entitlement
- [ ] Anonymous → signup restore flow fixed reliably
- [ ] Interactive component positioning / overlap issues reduced
- [ ] Landing page pricing/demo CTA strong enough to convert

### Important But Not Absolute Launch Blockers
- [ ] Interactive i18n (ru/he)
- [ ] Better onboarding from landing → interactive → account
- [ ] Clearer pricing / package logic in subscription flow
- [ ] Better explanation of what happens after deploy

### After First Revenue
- [ ] More component families
- [ ] More business-specific component verticals
- [ ] Agency plans
- [ ] Extra hosting/managed offers
- [ ] Additional auth/account UX blocks

---

## 5. CURRENT TECHNICAL HAPPY PATH (CONFIRMED SHAPE)

### A. Visitor path
1. User lands on public page
2. User enters Interactive
3. User chooses a niche
4. Niche maps to preset
5. User selects style/blocks/company name
6. Contract is assembled into Craft structure
7. Preview renders in read-only mode

### B. Account path
1. User signs up or logs in
2. Project payload is saved in Supabase
3. Project appears in dashboard
4. User can reopen it in editor

### C. Editing path
1. Project loads from stored Craft data
2. Editor deserializes compressed page data
3. User customizes content/layout/theme
4. Save writes compressed Craft pages back to project data

### D. Deploy path
1. User triggers deploy
2. Project gets slug / published state
3. Site is served on subdomain
4. Site renders via SiteRenderer in read-only Craft mode

This is the actual MVP operational chain that must stay healthy.

---

## 6. SECONDARY HAPPY PATH (Operational / Dev)

There is also a second path that matters internally, even if it is not yet the primary public MVP:

```text
1. Operator/admin enters dev console
   ↓
2. Reads or edits project files
   ↓
3. Runs AI/dev-agent task
   ↓
4. Reviews git history / deploys / rolls back
   ↓
5. System evolves faster with lower engineering friction
```

This path is important because it reduces development time and raises delivery speed.
It is not yet the public commercial path, but it is part of the platform advantage.

---

## 7. EMERGING PRODUCT DIRECTION (IMPORTANT, BUT NOT THE CURRENT MVP)

A major insight discovered on 22.03.2026:

The project should no longer be thought of only as a website builder/editor.
It is increasingly an **AI-native business operating system** with:
- website layer
- operational/admin layer
- AI access layer
- long-term documentation memory (`context-core`)

This does **not** replace the current MVP money path.
Instead:
- current MVP = website system that can be sold first
- emerging product direction = reusable AI-native business system template

So the strategy becomes:
1. make the website-system MVP work cleanly
2. document the runtime core properly
3. extract the reusable platform/template from this system

---

## 8. WHAT MUST NEVER BREAK

If any of these fail, the MVP path is effectively broken:
- interactive can no longer assemble a valid preview
- saved project cannot be reopened in editor
- editor cannot save back into project data
- deploy cannot produce a live site
- auth/signup flow loses the project
- payment/entitlement cannot gate access once monetization is active

---

## 9. MVP SUCCESS DEFINITION

Current MVP is successful when:
- a new user can go from idea → preview → saved project → editor → live deployed site
- without manual developer intervention
- and the system can charge or gate editing access reliably

That is enough to justify launch of the first commercial version.

---

## 10. NEXT DOCUMENTS TO ALIGN WITH THIS

After any major change to this path, also update:
- `PROGRESS.md`
- `ARCHITECTURE.md`
- `ENGINEERING_MEMORY.md`
- `DEBUG_MAP.md` if a new failure mode is discovered

---

*Updated: 22.03.2026*