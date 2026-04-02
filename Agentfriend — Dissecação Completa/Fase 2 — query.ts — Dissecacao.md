 # `query.ts` — Loop Principal (Dissecação minuciosa)

 Intenção: laço robusto que coordena streaming do modelo, uso de ferramentas, recuperação de erros (prompt-too-long, max_output_tokens), compactação/colapso de contexto, orçamentos e anexos (memória/skills/comandos), até chegar ao estado terminal.

 Entradas principais
 - `QueryParams`: mensagens acumuladas, systemPrompt (tipado), user/systemContext, `canUseTool`, `toolUseContext`, modelo de fallback, `querySource`, limites (maxTurns, maxOutputTokensOverride), orçamentos (`taskBudget`), dependências (injetáveis).
 - `ToolUseContext`: opções (tools, debug, modelo efetivo, MCP), abortController, acesso a AppState, hooks de UI (notificações, appendSystemMessage), tracking de cadeia (chainId/depth), estados auxiliares (fileRead, contentReplacement, denialTracking, etc.).

 Estrutura do loop
 - `query()` é um generator async que delega para `queryLoop()` e, ao final normal, emite `notifyCommandLifecycle(..., 'completed')` para comandos consumidos durante o turno.
 - `queryLoop()` mantém um `State` mutável por iteração: mensagens, toolUseContext, tracking de compactação, contadores de recuperação de max tokens, flags de tentativa de reactive compact, pendências de sumário de ferramentas, stop hook ativo, contador de turnos e `transition` (telemetria testável).

 Pipeline por iteração
 1) Preparação
 - Congela snapshot `config = buildQueryConfig()`; dispara prefetch de memórias `startRelevantMemoryPrefetch()` com using/dispose.
 - Clona `messagesForQuery` de `getMessagesAfterCompactBoundary(messages)` — ignora histórico anterior a um boundary de compactação.
 - Prefetch de descoberta de skills (assíncrono), emitido mais tarde.
 - Emite `{type:'stream_request_start'}` e checkpoints de profiler.
 - Configura `queryTracking` (chainId/depth) e injeta no `toolUseContext` (relevante p/ telemetria e orquestração).

 2) Microcompact e Context Collapse
 - `deps.microcompact(...)`: reduz janelas imediatamente antes de chamada, guarda `pendingCacheEdits` (quando gated) para boundary posterior com tokens reais deletados reportados pela API.
 - `contextCollapse.applyCollapsesIfNeeded(...)` (gated): projeta visão colapsada do histórico e comita mais colapsos se necessário — mantém granularidade quando possível, antes da autocompactação.

 3) Autocompactação (proativa)
 - `deps.autocompact(...)`: quando dispara, registra métricas (pre/post tokens), ajusta `taskBudgetRemaining` (pré-compaction final window), reseta tracking de turno (novo `turnId`), emite mensagens de boundary e substitui `messagesForQuery` pelos pós-compact.
 - Falha: propaga `consecutiveFailures` para circuito anti-retentativas.

 4) Checagens de bloqueio de contexto
 - Se não há compactação recente e contexto ultrapassa limite “bloqueante” (e não é query de compact/session_memory): emite `createAssistantAPIErrorMessage(PROMPT_TOO_LONG_ERROR_MESSAGE)` e encerra.
 - Reactive Compact/Context Collapse: withholding + recuperação assíncrona coordenadas para não “engolir” mensagens.

 5) Escolha do modelo atual e executor de ferramentas
 - Resolve `currentModel = getRuntimeMainLoopModel(...)` considerando `permissionMode`, tokens >200k em plan mode e fallback.
 - Cria `StreamingToolExecutor` quando gate habilita — executa ferramentas durante o streaming, emitindo tool_results assim que ficam prontos; caso contrário, usa `runTools()` após streaming.

 6) Streaming do modelo e follow-up
 - Inicia stream; coleta `assistantMessages`, junta `tool_use` em `toolUseBlocks`, detecta `needsFollowUp`.
 - Durante o stream: entrega resultados parciais de tools (no modo streaming) e, ao final, injeta boundary de microcompact com `cache_deleted_input_tokens` cumulativo (delta real vs baseline capturado).
 - `FallbackTriggeredError`: limpa buffers, troca `currentModel` por fallback, strip de thinking blocks assinados (quando ant), loga evento, emite aviso e `continue` para reexecutar a iteração.
 - Erros gerais: gera `tool_result` faltantes sintéticos, emite mensagem de erro assistente e retorna `model_error`.

 7) Pós-stream: hooks e interrupções
 - `executePostSamplingHooks(...)` em background.
 - Se abortado: consome `getRemainingResults()` do executor (gera tool_results sintéticos), emite `createUserInterruptionMessage` (exceto submit-interrupts), executa cleanup de MCP (gated) e retorna `aborted_streaming`.

 8) Withholding e recuperações
 - Max output tokens: retém mensagem de erro e tenta escalonar `ESCALATED_MAX_TOKENS` ou emitir um recovery `createUserMessage` “resume directly, no apology…”. Até `MAX_OUTPUT_TOKENS_RECOVERY_LIMIT`, senão entrega erro e encerra.
 - Stop hooks: `handleStopHooks(...)` decide `preventContinuation` ou injeta erros bloqueantes e continua a próxima iteração.
 - Token budget (gated): consulta `checkTokenBudget(...)`; pode continuar (injeta nudge meta message) ou registrar evento de completion e encerrar.

 9) Execução de ferramentas
 - Se há `tool_use_blocks`:
   - `StreamingToolExecutor.getRemainingResults()` ou `runTools(...)` (batch)
   - Para cada update: yield message e acumula em `toolResults`; captura `newContext` e atualiza `updatedToolUseContext` (inclui queryTracking).
   - Gera `ToolUseSummary` assíncrono (haiku) para a próxima iteração (emitido no início do próximo ciclo).

 10) Anexos e filas
 - Injeta anexos de comandos (prompt/task-notification) via `getAttachmentMessages(...)` e remove da fila apenas os consumidos; notifica lifecycle.
 - Consome prefetch de memórias se pronto (de-duplicando por `readFileState`) e skill discovery se disponível.

 11) Refresh de tools e recursão
 - `options.refreshTools()` para incorporar MCP conectados “no meio do turno”.
 - Checa `maxTurns` e emite `max_turns_reached` se preciso.
 - Prepara `next: State` e `continue` (mensagens = mensagens + assistant + toolResults; turnCount++). Loop até Terminal.

 Saídas (Terminal reasons)
 - `'completed'`, `'model_error'`, `'image_error'`, `'aborted_streaming'`, `'stop_hook_prevented'`, `'max_turns'`.

 Invariantes e porquês
 - Reserva ordem: sempre normaliza mensagens via `normalizeMessagesForAPI` ao empilhar resultados de tools.
 - Acoplamento cuidadoso com compaction/collapse: evita deadlocks e loops infinitos em recovery.
 - Orçamento e fallback: padrões claros de “continue” com mensagens meta e telemetria rastreável via `transition` e checkpoints.

 Q&A interno
 - Q: Por que recarregar ferramentas entre turnos?
   A: Servidores MCP podem conectar tardiamente; garante que ferramentas recém-disponíveis apareçam sem reiniciar sessão.
 - Q: Por que withholding para max tokens em vez de emitir erro direto?
   A: Evita encerrar sessões em hosts que abortam ao primeiro `error` — tenta recuperar silenciosamente primeiro.
 - Q: Como garantem consistência de anexos e comandos?
   A: Só remove da fila o que de fato virou attachment; lifecycle notificado por UUID.

