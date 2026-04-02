 # Playbook de Compactação & Memória

 Objetivo
 - Integrar microcompact, autocompact, session-memory compact e anexos de forma segura, cache‑friendly e observável.
 - Minimizar custo de tokens mantendo contexto útil e integridade (pares tool_use/result, chunks com mesmo message.id).

 Gatilhos (quando disparar)
 - Microcompact (pré‑chamada):
   - Sempre leve: limpeza de tool_results antigos de baixo valor.
   - Time‑based: se `now - lastAssistantTs >= cfg.gapThresholdMinutes` (ex.: 60m), manter apenas `keepRecent` tool_results.
 - Autocompact (sumário):
   - Se `estimateTokens(messagesForQuery) >= getAutoCompactThreshold(model)` (ex.: ~80% da janela efetiva).
   - Se prompt‑too‑long detectado (413): reexecutar via autocompact.
 - Session memory compact:
   - Se `sessionTokens >= minTokens` e `textBlocks >= minTextBlockMessages` (GB config), visando `maxTokens`.

 Pseudocódigo — integração no loop
 ```ts
 // 0) Pré-cálculo
 const cfgT = getTimeBasedMCConfig()

 // 1) Microcompact (antes do API call)
 const mc = await microcompactMessages(messages, ctx, querySource)
 messagesForQuery = mc.messages

 // 2) Context collapse (se existir) — opcional
 messagesForQuery = await maybeCollapse(messagesForQuery)

 // 3) Autocompact (quando necessário)
 const { compactionResult, consecutiveFailures } = await autocompact(
   messagesForQuery,
   ctx,
   { systemPrompt, userContext, systemContext },
   querySource,
   tracking,
   snipTokensFreed,
 )
 if (compactionResult) {
   for (const m of buildPostCompactMessages(compactionResult)) yield m
   messagesForQuery = postCompactMessages
 }

 // 4) API call + stream + ferramentas …
 // 5) Pós-stream: reactive compact / collapses se 413 retido
 ```

 Pseudocódigo — decisão de autocompact
 ```ts
 function shouldAutoCompact(tokens, model): boolean {
   const threshold = getAutoCompactThreshold(model) // e.g., 0.8 * effective window
   return tokens >= threshold
 }
 ```

 Pseudocódigo — time‑based microcompact
 ```ts
 const tcfg = getTimeBasedMCConfig() // {enabled, gapThresholdMinutes, keepRecent}
 if (tcfg.enabled && now - lastAssistantTs >= tcfg.gapThresholdMinutes) {
   pruneOldToolResults(messages, tcfg.keepRecent)
   recordCacheEdits()
 }
 ```

 Orçamentos recomendados (iniciais)
 - Memória por arquivo: ~4KB (MAX_MEMORY_BYTES) e ~200 linhas (MAX_MEMORY_LINES)
 - Memória por sessão: ~60KB (MAX_SESSION_BYTES)
 - Pós‑compact: `POST_COMPACT_TOKEN_BUDGET ≈ 50k` e `POST_COMPACT_MAX_FILES_TO_RESTORE ≈ 5`, `POST_COMPACT_MAX_TOKENS_PER_FILE ≈ 5k`
 - KeepRecent time‑based microcompact: 5–10 tool_results (ajuste por produto)

 Escolha da variante de prompt
 - Compact completo: histórico inteiro precisa de sumário, sem janela estável.
 - Parcial RECENT: sumário somente do sufixo recente após um prefixo que deve ser preservado.
 - Parcial UP_TO (cache‑friendly): sumário colocado no topo; novas mensagens vêm depois (não vistas). Maximiza reuso de prefixo no cache.

 Pós‑compact — ordem dos passos
 1) `SystemCompactBoundaryMessage` (pre/post/truePost, tool ids)
 2) Mensagem de sumário (assistant/system) nas seções exigidas
 3) Reidratar anexos essenciais: refs de arquivos, deltas MCP, deltas de ferramentas/skills, listagem de agentes
 4) `markPostCompaction()` + `runPostCompactCleanup(querySource)`

 Integridade
 - Nunca cortar pares `tool_use`/`tool_result`: se kept possui `tool_result`, inclua `assistant` com o `tool_use` correspondente.
 - Manter coesos chunks com mesmo `message.id` (thinking/tool_use streaming) para `normalizeMessagesForAPI` mergear corretamente.
 - Usar `groupMessagesByApiRound` como fronteira segura.

 Telemetria (eventos mínimos)
 - microcompact:
   - `tengu_cached_microcompact` {deleted_ids, kept_recent, tokens_estimate}
   - `tengu_time_based_microcompact` {gap_minutes, keepRecent}
 - autocompact/compact:
   - start/end: `tengu_compact` | `tengu_partial_compact` {preTokens, postTokens, truePostTokens, cache_read_tokens, cache_creation_tokens}
   - falhas: `tengu_compact_failed` {reason}, `tengu_compact_ptl_retry`, `tengu_compact_streaming_retry`
   - cache sharing: `tengu_compact_cache_sharing_success|fallback`
 - session memory: `tengu_sm_compact_*` (flag_check, threshold_exceeded, error)

 Configuração (via flags/GB)
 - `tengu_slate_heron`: time‑based microcompact {enabled, gapThresholdMinutes, keepRecent}
 - `tengu_cobalt_raccoon`: UX de aviso/thresholds (auto-compact warnings)
 - `tengu_sm_compact_config`: {minTokens, minTextBlockMessages, maxTokens}

 Táticas de recuperação
 - 413 (prompt‑too‑long): colapsos → reactive compact → autocompact; se parcial retida, use PARTIAL_UP_TO.
 - max_output_tokens: escalar para `ESCALATED_MAX_TOKENS` 1x; senão, injetar “resume directly” (meta) até N tentativas.
 - Fallback de modelo: limpar buffers (assistant/toolResults), strip de thinking assinados (quando aplicável), e reexecutar.

 Boas práticas
 - Trabalhar com `estimateMessageTokens` antes do call — decisões baratas.
 - Padrão “up_to” quando possível para cache: sumário de prefixo fixo + sufixo intacto.
 - Instrumentar `transition.reason` nos “continue sites” para auditoria do loop.

 Testes (sanidade)
 - Malformações: conversa com tool_use sem tool_result → não quebrar; compact/summarizer deve reparar via boundaries corretos.
 - Média/longa duração: atingir múltiplos compacts sem duplicar anexos e sem inflar memórias (ver MAX_SESSION_BYTES).
 - Tempo: simular gap > threshold e verificar microcompact time‑based executando apenas no main thread.

