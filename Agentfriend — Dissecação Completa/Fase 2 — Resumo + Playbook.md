 # Fase 2 — Resumo + Playbook Prático

 Objetivo: condensar os conceitos do loop principal, estado e orquestração em lições-chave e um roteiro implementável para construir um agente com qualidade profissional.

 Lições-chave (como eles pensam)
 - Generator como núcleo: o loop `query()` é um generator async que produz eventos/mensagens incrementalmente, o que reduz latência percebida e simplifica orquestração assíncrona (stream do modelo, ferramentas, anexos) sem “callback hell”.
 - Estado por iteração: um `State` imutável entre pontos de continuação e reatribuído nos “continue sites” mantém clareza e evita efeitos colaterais difíceis de depurar.
 - Turns explícitos: cada tool_use inicia um subturno; entre turns, o contexto pode mudar (refresh de tools/MCP, anexos, prefetches), depois o loop recursa até Terminal.
 - Recuperação antes do erro: compactação/colapso reagem a prompt-too-long, com withholding inteligente; max_output_tokens tenta escalonamento e “resume directly” antes de desistir; fallback de modelo limpa artefatos e reexecuta.
 - Permissão race: decisão de permissão corre em paralelo (hooks vs host) e vence por corrida; decisões são deduplicadas por tool_use_id; anexos/diálogos integram-se ao fluxo sem bloquear indevidamente.
 - Composição de anexos: fila de comandos → attachments (prompt/task-notification), memórias, skill discovery; só remove da fila o que foi realmente consumido (evita inconsistências).
 - Extensibilidade dinâmica: tools podem “aparecer” no meio do turno (MCP); `refreshTools()` permite que o próximo turno já usufrua.
 - Telemetria e perf: checkpoints finos, eventos de orquestração e limites (token budget, task_budget) com decisões explícitas e rastreáveis.

 Playbook — como replicar esse loop no seu agente
 1) Tipos e protocolo
 - Defina tipos para `Message`, `StreamEvent`, `RequestStartEvent`, `ToolUseBlock`, `ToolResult`, `TombstoneMessage`.
 - Modele `ToolUseContext` com: `options` (tools, modelo, verbose), `abortController`, `getAppState/setAppState`, e extensões (prompt UI, notificações) conforme necessário.

 2) Esqueleto do generator
 ```ts
 export async function* query(params: QueryParams): AsyncGenerator<EventOrMessage, Terminal> {
   // state inicial
   let state: State = { messages: params.messages, toolUseContext: params.toolUseContext, turnCount: 1, /* … */ }
   while (true) {
     // 1) snapshot + prefetches (memória/skills)
     // 2) microcompact/collapse (stubs inicialmente)
     // 3) autocompact (opcional): emita boundaries se necessário
     // 4) checagens de bloqueio (prompt-too-long)
     // 5) resolver modelo atual e abrir streaming
     yield { type: 'stream_request_start' }
     const { assistantMessages, toolUseBlocks, needsFollowUp } = await streamModelOnce(state)

     // 6) erros: fallback / withheld max_output_tokens / API errors
     const recovered = await maybeRecoverOrFallback(/* … */)
     if (recovered === 'continue') { state = nextStateAfterRecovery; continue }

     // 7) interrupção
     if (state.toolUseContext.abortController.signal.aborted) {
       yield interruptionMessage();
       return { reason: 'aborted_streaming' }
     }

     // 8) stop hooks + token budget
     const stopDecision = await handleStopHooksAndBudget(/* … */)
     if (stopDecision.done) return { reason: stopDecision.reason }

     // 9) executar ferramentas
     const toolResults = await runToolsOrStream(toolUseBlocks, assistantMessages, state.toolUseContext)
     for (const m of toolResults.messages) yield m

     // 10) anexos (fila de comandos, memórias, skills)
     for await (const att of attachmentsForTurn(/* … */)) yield att

     // 11) refresh tools e next turn
     if (hasReachedMaxTurns()) { yield maxTurnsAttachment(); return { reason: 'max_turns' } }
     state = nextTurnState(/* concat mensagens + toolResults */)
   }
 }
 ```

 3) Execução de ferramentas
 - Comece com `runTools(toolUseBlocks, …)` sequencial; depois evolua para um “StreamingToolExecutor” que consome tool_use conforme chegam e emite `tool_result` assim que disponíveis.
 - `canUseTool`: implemente o race entre hooks e host (UI), com cancel cooperativo (AbortController) e deduplicação por `tool_use_id`.

 4) Compactação/colapso (evolução por camadas)
 - V0: sem compactação; apenas trate 413 como erro amigável.
 - V1: microcompact leve (ex.: truncar longos outputs ou sumarizar blocos triviais) antes da chamada.
 - V2: autocompact com “boundary messages” (antes/depois) e tracking de tokens para telemetria; recupere de 413 sem derrubar sessão.
 - V3: context-collapse (commit log + projeção) para preservar granularidade e reduzir sumarizações agressivas.

 5) Recuperações e fallback
 - `prompt-too-long`: tente collapse→reactive compact; se falhar, emita erro.
 - `max_output_tokens`: escalone limite uma vez; senão, injete mensagem meta “resume directly” por N tentativas e só então emita o erro.
 - Fallback de modelo: limpe buffers relacionados (assistant/toolResults), ajuste `toolUseContext.options.mainLoopModel`, strip de thinking blocks assinados (se aplicável) e reexecute.

 6) Anexos e filas
 - Modele filas de comandos (prompt/task-notification). Converta em attachments no fim do turno e remova só os consumidos.
 - Prefetch de memórias e skill discovery podem começar como “no-ops” e evoluir para pipelines reais.

 7) Estado e UI
 - AppStateStore simples (verbose, permissionMode, tools, tasks, notifications…).
 - Um `onChangeAppState` central dispara efeitos: sync de `permission_mode` com canais externos, persistência de modelo/verbose, reaplicar env.
 - UI (REPL) cria ToolUseContext, chama `query()`, renderiza mensagens, diálogos de permissão e trata abort/interrupt.

 8) Telemetria e perf
 - Checkpoints leves (antes/depois de streaming, ferramentas, anexos).
 - Eventos com campos que permitam reconstituir decisões (chainId/depth, razões de transição, contagens de tokens/turnos).

 Roadmap incremental
 - Semana 1: generator básico + streaming + ferramentas sequenciais + UI simples (sem compactação) + permissões síncronas.
 - Semana 2: permissões com race hook/UI + anexos de fila + interrupção + telemetria básica.
 - Semana 3: microcompact + recuperação max_output_tokens + fallback de modelo.
 - Semana 4: autocompact + context-collapse + executor de ferramentas em streaming + refresh dinâmico de tools/MCP.

