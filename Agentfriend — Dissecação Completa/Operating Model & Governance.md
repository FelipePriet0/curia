# Operating Model & Governance

Modelo Operacional
- Camadas: Orquestração (query, executor), Tools/Skills, Permissões/Sandbox, Transports/Bridge, Telemetria/Perf, Extensões (MCP/Plugins/KAIROS/Ultraplan).
- Ambientes: Dev (flags liberais, logs ricos), Staging (PII‑min, sampling), Prod (opt‑out corporativo, gates/políticas estritas).

Governança
- Steering: aprova roadmap, budgets de tokens/latências, políticas de privilégio mínimo.
- Architecture Review: decisões de design (tools mutáveis, shells, MCP) e threat modeling.
- Release Board: estratégia de feature flags, canários e rollback.

Processos
- Design Review → Security Review → Impl → Testes (segurança/concorrência/abort) → Observabilidade → Release.
- Change Advisory: mudanças de política/permissões/sandbox exigem CR com evidências.

Controles
- Flags/gates centralizados; política de permissões versionada; kill‑switch corporativo.
- Auditoria: logs sem PII de decisões (allow/ask/deny), versão de regras, origem da decisão (hook/host/classifier).

