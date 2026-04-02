# Fase 1 — Telemetria & Perf Budgets

Objetivo: definir eventos mínimos, campos, orçamentos de performance (startup/TTI), amostragem e políticas de privacidade, para reproduzir UX/robustez sem vazar PII.

Eventos mínimos
- startup_begin/startup_end: duração total, checkpoints (entry import, main import, first render).
- model_stream_begin/end/fail: modelo, tokens in/out, erro categorizado.
- tool_begin/end/fail: nome, tipo (RO vs RW), duração, bytes/linhas, abort/timeout.
- permission_prompt: tool, regra aplicada, decisão, latência, origem (hook/host).
- transport_batch: tamanho, retries, descartes, latência média.

Campos essenciais
- chainId/depth, sessionId (pseudonimizado), clientType, entrypoint, feature flags ativas.
- budgets: token_budget, task_budget, max_turns.

Perf Budgets
- TTI (time-to-interactive): alvo < 300ms no caminho feliz; até 800ms com prefetches.
- main import: < 150ms (com DCE e lazy imports).
- first render: < 250ms; prefetches diferidos pós-primeira pintura.
- permission prompt: < 200ms para abrir; decisão total < 2s (com race hooks/host).

Amostragem e PII
- Amostragem: 100% para eventos críticos (fail), 10–25% para sucesso em produção.
- PII-minimization: sem paths completos, sem conteúdo de arquivos; hashing/pseudonimização para IDs.
- Opt-in por padrão em dev; opt-out em corp; documentar flags/env.

Alarmes e Health
- Regressão de TTI (> +20% semanal) e quedas de taxa de sucesso em tool/transport.
- Retries e descartes por lote acima de threshold.

Checklist
- [ ] Eventos mínimos emitidos e documentados
- [ ] PII removida/mascarada; opt-out suportado
- [ ] Perf budgets definidos e monitorados
- [ ] Prefetches só pós-first-render

