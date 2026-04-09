# AI NATIVE BUSINESS OPERATION SYSTEM BUILD PLAN

*Practical build plan for the first installable pilot version.*
*Created: 22.03.2026*

---

## 1. PURPOSE

This document translates strategy into build order.

It answers:
- what to reuse from current I AM RUNNING
- what to build first
- what to postpone
- what the first pilot user should see
- what counts as "ready enough" for first installation

This is not a long-term roadmap.
This is the shortest path to an installable pilot.

---

## 2. BUILD PHILOSOPHY

The first version must be:
- narrow
- fast to assemble
- good enough to use
- structured enough to impress
- simple enough to support manually

The goal is **not** to build a giant platform first.
The goal is to create:

# one installable single-operator AI business system

---

## 3. WHAT WE ALREADY HAVE

Current I AM RUNNING already contains reusable core pieces:

### Reusable immediately
- `context-core` documentation memory model
- MCP access layer concept and routes
- Dev Console / operational tooling concept
- admin auth/security model
- browser-based app shell
- Supabase auth/session infrastructure
- project/runtime thinking
- deployment mindset and server-hosted workflow

### Reusable with adaptation
- dashboard patterns
- admin panel patterns
- some auth flows
- existing documentation discipline
- operational tooling and file-oriented workflows

### Existing vertical module
- website system (interactive + editor + deploy)

This means the first pilot should be built by **reusing the core**, not by starting from zero.

---

## 4. WHAT THE FIRST PILOT MUST FEEL LIKE

The pilot user should feel that they entered:
- a real system
- built for work
- with memory
- with AI access
- with structure
- with continuity between sessions

It must **not** feel like:
- a random chat wrapper
- a prompt collection
- a vague prototype with no next step

---

## 5. FIRST PILOT USER FLOW

### Entry flow
1. User logs in / enters the system
2. User sees a very clear starting surface
3. User understands in under 30 seconds what this system is for
4. User is prompted to define what they want to build / solve
5. AI helps structure the goal
6. The result is stored in the workspace/docs
7. User can continue from that state later

This flow is more important than feature count.

---

## 6. FIRST SCREEN REQUIREMENTS

The first screen for the pilot should include:

### Must have
- short system explanation
- obvious primary action
- AI entry point
- visible workspace/project context
- visible next step or guided starting prompt

### Should have
- recent work / recent artifacts
- quick links to key docs/workspace sections
- very small friction to start

### Must avoid
- too many buttons
- too many modules
- empty dashboard with no guidance
- enterprise-looking complexity

The first screen should answer:
- what is this?
- what do I do first?
- where does my work go?

---

## 7. FIRST WORKING SURFACE

The first working surface should be one of these:

### Preferred
A dedicated operator workspace/dashboard page with:
- AI chat entry
- project/workspace documents
- recent outputs
- guided action flow

### Acceptable for first version
A simplified dashboard plus linked AI workflow and docs

### Not ideal
Throwing the pilot user directly into Dev Console or raw admin tooling

Why:
- Dev Console is powerful, but too operator/developer-facing for the first business pilot
- first pilot needs clarity more than raw power

---

## 8. RECOMMENDED MVP MODULE STACK

### Layer 1 — Access & Identity
Build/Reuse:
- login/auth
- one operator account
- secure session handling

### Layer 2 — Operator Workspace
Build:
- one focused landing/workspace for the pilot
- recent docs/artifacts
- primary action CTA
- minimal navigation

### Layer 3 — AI Interaction
Build/Reuse:
- AI entry path
- clear prompt bootstrap
- context-aware assistance
- stable continuity with docs

### Layer 4 — Document/Artifact Persistence
Build/Reuse:
- storage area for key outputs
- persistent working docs
- simple templates for briefs/plans/ideas

### Layer 5 — Admin/Founder Back Surface
Reuse:
- admin/dev tooling
- context-core maintenance
- operational visibility
- manual support flow

This stack is enough for the first install.

---

## 9. FIRST DOCUMENT TEMPLATES TO CREATE

The first pilot should not start with blank chaos.
It should include pre-made templates.

### Required templates
- `SYSTEM_IDENTITY.md` or equivalent short explanation doc
- `CURRENT_GOAL.md`
- `IDEAS.md`
- `MVP_BRIEF.md`
- `NEXT_ACTIONS.md`
- `WEEKLY_PROGRESS.md`

### Why
These create immediate structure.
Without them, the system risks feeling like a chat with no operating surface.

---

## 10. WHAT TO BUILD FIRST (ORDER)

### Phase 1 — Define and expose the pilot surface
- create the first operator workspace concept
- define its entry point
- decide what the first screen shows
- define the primary CTA

### Phase 2 — Connect AI to structured workflow
- define first-session bootstrap prompt
- define how AI reads/uses system docs
- define where outputs are stored
- ensure continuity between sessions

### Phase 3 — Add artifact structure
- add starter docs/templates
- create the default document layout
- connect outputs to visible workspace

### Phase 4 — Validate manual founder-led usage
- simulate a real pilot flow
- test from zero to first artifact
- identify confusion points
- simplify onboarding

### Phase 5 — Prepare for first install
- define installation steps
- define support scope
- define what is configured per client
- define what stays fixed across all installs

---

## 11. WHAT TO POSTPONE DELIBERATELY

Do not spend early time on:
- teams
- roles/permissions matrix
- collaboration UX
- analytics suite
- heavy CRM depth
- automation marketplace
- polished multi-tenant architecture
- advanced billing complexity beyond what is needed for first pilot

These can be later modules or later platform layers.

---

## 12. WHAT TO REUSE VS WHAT TO BUILD NEW

### Reuse as-is or near as-is
- auth/security patterns
- docs discipline
- context-core structure
- admin operational model
- server-hosted thinking

### Build new for the pilot
- operator-facing first workspace
- pilot onboarding flow
- first-session bootstrap
- starter document templates
- first-run UX / guided CTA surface

### Keep optional
- website module / editor / interactive / deploy

That website stack should remain available as a powerful vertical, not as the first mandatory experience.

---

## 13. FIRST SUCCESSFUL BUILD STATE

The build is "pilot-ready" when:
- one operator can enter the system from browser
- the first screen clearly explains what to do
- the operator can describe a goal to AI
- AI helps structure that goal
- a visible artifact is created and stored
- the operator can return later and continue from that state

That is enough to begin founder-led installation.

---

## 14. MINIMUM INSTALLATION PACKAGE

For the first real pilot installation, the build should support:
- user access setup
- initial context/core creation
- starter docs/templates
- first workflow bootstrap
- founder-led adaptation to one use case
- ongoing monthly support

It does not need universal self-service setup yet.
Founder-led installation is acceptable and strategically useful.

---

## 15. BIGGEST BUILD RISKS

### Risk 1 — reusing too much raw internal tooling
The pilot user sees dev/operator surfaces instead of a clean operator experience.

### Risk 2 — not enough structure
The user enters and still has to invent the system alone.

### Risk 3 — overbuilding platform internals before pilot UX
Too much architecture, not enough user-visible value.

### Risk 4 — treating docs as background only
The docs are part of the system runtime and continuity model.

### Risk 5 — no visible artifact creation
If outputs are not clearly created and stored, value is unclear.

---

## 16. FIRST IMPLEMENTATION QUESTIONS

These need answers next:
- what exact route/page is the pilot home?
- does the pilot use a new dedicated page or adapt existing dashboard?
- what are the first 3 widgets/sections on that page?
- where does the AI interaction happen first?
- what exact templates are auto-created for a new pilot user?
- which current components can be repurposed quickly?

---

## 17. BUILD DECISION TAKEN ON 22.03.2026

The first build should optimize for:

# one operator, one entry surface, one AI flow, one persistent workspace, one real output

Not for:
- breadth
- team complexity
- multi-seat monetization
- enterprise polish

This is the correct build constraint.

---

## 18. SHORT INTERNAL SUMMARY

Build the smallest operator-facing system that:
- is web-accessible
- feels like a real working environment
- gives AI structured memory/context
- produces visible artifacts
- can be installed fast for a first paying pilot

That is the current build target.
