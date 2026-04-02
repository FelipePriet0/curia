# Fase 2.5 — Modos Especiais — KAIROS, Brief, Dream, Ultraplan

Objetivo: documentar modos/rotinas especiais de orquestração com implicações de UX, orçamento e segurança.

KAIROS (assistente persistente)
- Comportamento: decide em < 15s; evita interromper fluxo; fala em "Brief Mode" (conciso).
- Ferramentas exclusivas: SendUserFile, PushNotification, SubscribePR (gates fortes).
- Estado: flags `kairosEnabled`, `briefMode`; integração com AppStateStore/onChangeAppState.
- Mitigações: budgets de bloqueio, throttling, logs mínimos, prompts sem PII.

Brief Mode
- Saídas curtas, sem diffs longos; links para detalhes; telemetria de concisão.

Dream/autoDream (consolidação de memória)
- Gatilhos: 3-portas (tempo ≥24h, ≥5 sessões, lock de consolidação).
- Fases: Orient → Gather → Consolidate → Prune & Index.
- Mitigações: lock para concorrência; budgets de tokens/bytes; cap de tamanho de MEMORY.md; conversão de datas relativas.

Ultraplan (planejamento remoto)
- Fluxo: abre sessão CCR (até 30 min), polling a cada ~3s, aprovação no browser, teleporte `__ULTRAPLAN_TELEPORT_LOCAL__` de volta.
- Mitigações: autenticação forte; gating por feature; quotas; expirabilidade; limpar sentinelas.

Checklist
- [ ] Budgets claros (tempo/tokens/bytes) por modo
- [ ] Gates/flags e opt-in explícito
- [ ] Locking e idempotência em rotinas (Dream)
- [ ] Padrões de saída concisa (Brief)

