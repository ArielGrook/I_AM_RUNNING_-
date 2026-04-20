# MCP-as-a-Service — Architecture Spec (reviewed)
### 19.04.2026 | Reviewed by Opus, feedback applied

---

## Concept

iamrunning.ai becomes MCP Provider on dedicated VPS.
Web clients (iam-client-os) connect as MCP Clients.
They get: fine-tuned model inference, specialized tools, shared RAG.

## Architecture

```
Client's iam-client-os (web, on their VPS)
    └── MCP Client Panel → connects to Ariel's MCP endpoint
              │
              │ MCP over HTTPS, Bearer auth + tenant isolation
              ▼
Ariel's MCP Provider (VPS — Hetzner GEX44, $200/mo)
    ├── Cloudflare named tunnel
    ├── Custom MCP Server (@modelcontextprotocol/sdk)
    │    ├── ask_specialist_model → Ollama fine-tuned inference
    │    ├── explain_file → explains file in project context
    │    └── analyze_technical_debt → structured report
    ├── Ollama (Qwen2.5-Coder:14b + LoRA adapter later)
    └── Vectra (curated RAG knowledge base)
```

## Key Decisions (from Opus review)

1. **MCP Provider on VPS, not Electron.** Production needs uptime. Electron = dev only.
2. **Hetzner GEX44** — RTX 4000 Ada, 20GB VRAM, $200/mo. Holds 14B model. Serves 5-10 clients sequentially.
3. **Start with RAG only, no fine-tune.** Fine-tune after 500+ CoT pairs (3-6 months).
4. **Pay-per-use pricing** — included tier + metered overage. NOT flat $29/mo.
5. **Curated RAG** — Ariel populates shared RAG. Client data NOT federated (privacy).
6. **Fallback when offline** — client detects MCP unavailable → switches to local Gemini → shows banner.
7. **Success = 100+ tool calls/day** per engaged client. <30 = churn risk.
8. **One model, all clients.** Isolation via context (system prompt + tenant RAG chunks), not separate models.

## GPU Capacity Math

14B Q4 on RTX 4000 Ada: ~30-50 tokens/sec
Average tool call response: 200-500 tokens = 5-15 sec
Sequential capacity: ~6 calls/minute
With batching (3-4 parallel KV caches): ~20 calls/minute
5-10 clients × 100 calls/day ÷ 8 work hours = 60-125 calls/hour = 1-2 calls/min (ok)
Peak: 30-60 calls/min → queue 30-60 sec (tolerable for async tools)

## Phases

### Phase 1 — MCP Server + 2 tools (1-2 days)
- MCP server on VPS using SDK
- Bearer auth per tenant, usage counter in activity log
- Tool: `ask_specialist_model` (RAG-enhanced inference)
- Tool: `explain_file` (explain file in project context)

### Phase 2 — Client-side integration (2-3 days)
- MCP Client module in iam-client-os
- Admin Settings: "Connect to MCP Provider" (URL + token)
- Inject tool results into Gemini chat context

### Phase 3 — Curated RAG layer (2-3 days)
- Ariel populates shared knowledge base manually
- Clients search it via tools, cannot contribute (privacy)

### Phase 4 — Billing (when first paying client)
- Count calls per tenant, rate limits per tier
- PayPal subscription integration

### Phase 5 — Fine-tune (3-6 months out)
- Dataset from Activity Log V2 + EVOLUTION
- LoRA adapter on Qwen2.5-Coder:14b
- 500+ Chain-of-Thought pairs minimum

## Risks

1. **Latency** → warm model in memory, stream results
2. **GPU cost** → rate limits, start with included tier
3. **Model quality** → RAG first (proven value), fine-tune later
4. **Uptime** → VPS with monitoring, NOT Electron on Ariel's PC
5. **Privacy** → curated shared RAG, no client data federation in v1

---

*Phase 2 product. After 4-5 paying IAM Client OS clients.*