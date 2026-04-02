# Implementation Roadmap & Workstreams

Workstreams
- WS1 Core Loop & Executor (query, streaming executor, partition, concurrency caps).
- WS2 Permissions & FS Policy (rules, parser, ask/allow/deny, path safety).
- WS3 RO Tools (Glob/Grep/FileRead/LSP) e REPL/Transports (WS/Hybrid/StructuredIO).
- WS4 Shell & Edit (Bash/PS RO; FileEdit diff seguro; abort/timeouts).
- WS5 Compactação & Recovery (micro/auto, fallback de modelo, 413/429/5xx).
- WS6 MCP/Skills/AgentTool; Telemetria mínima.
- WS7 Bridge/CCR; KAIROS/Brief; Plugins/Marketplace.

Timeline (4 semanas → MVP)
- Sem 1: WS1+WS3
- Sem 2: WS2 + permissões integradas no executor
- Sem 3: WS4 + WS5
- Sem 4: WS6 (telemetria) + hardening e checklists

Milestones de Go/No‑Go
- M1: RO end‑to‑end estável; TTI < 300ms.
- M2: Permissões determinísticas; RO paralelo/RW serial comprovado.
- M3: Compactação + recovery; shell RO seguro.
- M4: Telemetria e checklists “security by default”.

