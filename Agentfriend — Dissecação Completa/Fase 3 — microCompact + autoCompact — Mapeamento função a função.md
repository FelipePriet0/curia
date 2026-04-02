 # microCompact + autoCompact — Mapeamento função a função, Diagramas e Telemetria

 Fonte: `services/compact/microCompact.ts`, `services/compact/autoCompact.ts`

 microCompact.ts — funções principais
 - getCachedMCModule(): carrega módulo de microcompact em cache (cachedMicrocompact.js) e retorna tipos/estado.
 - ensureCachedMCState(): inicializa o estado de cache caso não exista.
 - consumePendingCacheEdits(): expõe difs de cache (“pending edits”) e zera a fila — usado para boundary pós‑request.
 - getPinnedCacheEdits(): retorna edits “pinados” (mantidos) para inspeção/telemetria.
 - pinCacheEdits(edits): fixa edits específicos (não voláteis) — suporte a delta de cache.
 - markToolsSentToAPIState(): marca que tool blocks já foram enviados na requisição (coordena microcompact com orquestração de tools).
 - resetMicrocompactState(): reseta estado interno (chamado em post‑compact cleanup).
 - calculateToolResultTokens(block): estima tokens de um tool_result block (para orçamento de limpeza).
 - estimateMessageTokens(messages): estimativa rápida de tokens por mensagem (pré‑chamada, sem custos de API).
 - collectCompactableToolIds(messages): extrai IDs de tool_use/tool_result elegíveis para limpeza.
 - isMainThreadSource(querySource): true se for main thread (regras de time-based microcompact só no main thread).
 - microcompactMessages(messages, context, querySource): pipeline de microcompactação (limpa tool_results antigos, aplica thresholds, coordena com cache edits). Retorna { messages, compactionInfo } e sinaliza cache edits para boundary posterior.
 - cachedMicrocompactPath(...): caminho de execução que prioriza cache edits (quando presentes) com telemetria.
 - evaluateTimeBasedTrigger(now, lastAssistantTs, cfg): aplica regra tempo‑baseado (gap > threshold) e retorna decisão + keepRecent.
 - maybeTimeBasedMicrocompact(messages, querySource): se trigger ativo, aplica microcompact focusing nos tool_results antigos além do keepRecent.

 autoCompact.ts — funções principais
 - getEffectiveContextWindowSize(model): janela de contexto real considerada para thresholds.
 - getAutoCompactThreshold(model): define limite de autocompact (tokens) por modelo.
 - calculateTokenWarningState(tokens, model): classifica estado (warning/blocking) para UX e decisões.
 - isAutoCompactEnabled(): verifica gates e modo para habilitar autocompact.
 - shouldAutoCompact(messages, context): decide se autocompact deve ocorrer (via thresholds/estados/flags e GB).
 - autoCompactIfNeeded(messages, toolUseContext, querySource, ...): executa autocompact, coleta métricas (pre/post/truePost), produz compactionResult e consecutiveFailures; integra com buildPostCompactMessages no loop.

 Diagrama — microCompact (alto nível)
 ```mermaid
 flowchart TD
   A[Input messages] --> B[ensureCachedMCState]
   B --> C[collectCompactableToolIds]
   C --> D{time-based trigger?}
   D -- yes --> E[prune old tool_results (keepRecent)]
   D -- no --> F[heuristic light prune]
   E --> G[record cache edits]
   F --> G
   G --> H{return {messages, compactionInfo}}
 ```

 Diagrama — autoCompact (alto nível)
 ```mermaid
 flowchart TD
   A[Estimate tokens] --> B{>= threshold?}
   B -- no --> C[skip]
   B -- yes --> D[run compact (summarizer)]
   D --> E[compute pre/post/truePost tokens]
   E --> F[emit boundary + summary + rehydrate attachments]
   F --> G[post-compact cleanup + metrics]
 ```

 Telemetria — eventos a copiar
 - microCompact:
   - `tengu_cached_microcompact` (quando usa caminho de cache edit)
   - `tengu_time_based_microcompact` (gatilho por tempo)
 - autoCompact/compact (executado dentro de compact.ts):
   - `tengu_compact` / `tengu_partial_compact`
   - `tengu_compact_failed` / `tengu_partial_compact_failed`
   - `tengu_compact_ptl_retry` (prompt-too-long retry)
   - `tengu_compact_streaming_retry` (nova tentativa após erro em streaming)
   - `tengu_compact_cache_sharing_success|fallback` (cache sharing path)
 - sessionMemoryCompact:
   - `tengu_sm_compact_flag_check`, `tengu_sm_compact_threshold_exceeded`, `tengu_sm_compact_error`, etc.

 Sinais auxiliares/GB flags
 - `getFeatureValue_CACHED_MAY_BE_STALE(...)` em autoCompact/compact/sessionMemoryCompact/timeBasedMCConfig para toggles e rollouts controlados.
 - compactWarningState: suprimir aviso logo após sucesso e reativar no próximo ciclo.

 Dicas de implementação
 - Comece com eventos mínimos: `..._start`, `..._end`, `..._failed`, com campos (pre/post tokens, cache_read/creation, deleted tool ids, chainId, depth).
 - Adicione “reason” em transições (e.g., `transition: { reason: 'next_turn' }`) para facilitar auditoria de loops.

