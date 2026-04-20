# Architecture Documentation

This directory contains documentation for **integrators** — people extending IAM Client OS with custom functionality.

## What's here

- **[ADMIN_PANEL_INTEGRATION.md](ADMIN_PANEL_INTEGRATION.md)** — Complete guide to extending the admin panel with Extensions (plugins). Covers the `extensions/` directory system, manifest format, component contract, data persistence, capability gating, and a working real-world example.

## What's not here

Platform internals — how the MCP tool registry, data layer, notification router, and permission system work under the hood — are documented in `memory/ARCHITECTURE.md` and in code comments at the relevant files. Those are for AI agents working on the platform core, not for people integrating with it.

## When to add a document here

Add a new document to this directory only when:

1. It describes a **stable integration contract** that third parties use (e.g., a new plugin system for dashboard tabs).
2. The contract is unlikely to change without a version bump.
3. The information is not already covered by `memory/ARCHITECTURE.md`.

Internal implementation notes, refactoring plans, and brainstorms belong elsewhere:

- `memory/ARCHITECTURE.md` — platform architecture for AI agents working on the core
- `ariel-workflow/roadmaps/` — implementation plans and roadmaps
- `ariel-workflow/specifications/` — architecture specifications
- `ariel-workflow/handoffs/` — session handoffs and incident reports
