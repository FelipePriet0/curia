# One-Pager — Executive Summary, Roadmap & SLOs

Purpose
- Establish an enterprise-grade agent pattern (security, UX, performance), replicable across projects without code reuse.

Scope & Principles
- Core: async generator main loop, streaming tool executor (RO parallel, RW serial), fail-closed permissions, resilient transports (WS + batched POST).
- Support: minimal telemetry with budgets, feature-flag governance, privacy by design (PII-minimization), platform-aware security.

4-Week Roadmap (MVP Secure)
- Week 1: Tool API + streaming executor + RO tools (Glob/Grep/FileRead/LSP) + REPL + Transports (WS/Hybrid/StructuredIO).
- Week 2: Permissions & FS policy integrated; permission race (hooks vs host); basic attachments/queues.
- Week 3: Shell RO minimal + micro/auto-compact + model fallback/recovery (413/max_output_tokens/429/5xx).
- Week 4: FileEdit (safe diffs) + MCP basics + minimal telemetry (events/budgets) + hardening + security checklists.

SLOs (Targets) & SLIs
- TTI (cold path) p95: < 300 ms (dev), < 500 ms (prod with gates).
- Permission prompt latency p95: < 2 s; RW tool execution p95: < 5 s (medium repos).
- Transport reliability: retries/drops p95 < 1%; 0 unauthorized shell executions.
- Error budget tracking for 413/429/5xx per 1k queries and recovery success rate.

KPIs
- Adoption of RO tools in MVP; PR throughput improvement with agent assistance; REPL CSAT trend.

Top Risks & Mitigations
- Windows native shells (no POSIX sandbox): deny by policy; prefer WSL; strict PS providers.
- FS exfiltration: path validation, .git/** & secrets/** protections, symlink/UNC guards.
- Bridge/Remote: short-lived tokens, min-version, replays + jittered backoff, flush-before-non-stream.
- Supply chain (MCP/Plugins): whitelist, strong schemas, homograph block, base-path enforcement.
- Privacy/Telemetry: minimal events, pseudonymized IDs, corporate opt-out.

Go/No-Go Gates (per milestone)
- M1: Stable RO E2E + TTI p95 < 300 ms.
- M2: Deterministic permissions; RO parallel / RW serial validated.
- M3: Compact + recovery effective; Shell RO safe (timeouts/abort-tree).
- M4: Telemetry + security checklists “green”.

Ownership
- Accountable: Tech Lead; Responsible: Core/Tools devs; Consulted: Security/SRE; Informed: Product/Legal.

