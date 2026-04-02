# KPIs, SLIs & SLOs

SLIs (Medições)
- TTI (CLI cold path), p95.
- Latência de prompt de permissão (ask), p95.
- Sucesso de execução de tools (RO/RW) e taxa de abort/timeout.
- Retries/drops em transport/batching.
- Erros 413/429/5xx por 1k queries.

SLOs (Alvos)
- TTI p95 < 300ms (dev), < 500ms (prod com gates).
- Permissão p95 < 2s; tool RW p95 < 5s (projetos medianos).
- Retries/drops < 1% p95; 0 incidentes de shell não autorizado.

KPIs (Negócio/Técnico)
- Adoção de tools RO no MVP; tempo de entrega por PR com agente; feedback CSAT do REPL.

Alertas
- Regressão TTI > +20% semanal; permissão > 3s p95; drops > 2%.

