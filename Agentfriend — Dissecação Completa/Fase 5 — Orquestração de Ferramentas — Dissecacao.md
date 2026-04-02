 # Orquestração de Ferramentas — StreamingToolExecutor e toolOrchestration

 StreamingToolExecutor
 - Papel: executar ferramentas conforme tool_use blocks chegam no streaming do modelo, com controle de concorrência e ordenação de saída.
 - Modelo de dados:
   - TrackedTool: id, block, assistantMessage, status, isConcurrencySafe, results buffer, pendingProgress, contextModifiers.
   - ToolStatus: queued | executing | completed | yielded.
 - Conexões importantes:
   - child abortController (irmão): em erro do Bash, aborta subprocessos irmãos para não desperdiçar tempo.
   - canUseTool: funil de permissão antes de executar cada tool.
 - Execução:
   - Tools concorrência segura (read-only) podem rodar em paralelo; não-seguras são serializadas.
   - `getRemainingResults()`: drena resultados pendentes (mensagens e progressos) — usado em aborts/turn end.
   - `discard()`: evita vazamento quando ocorre fallback de modelo.
 - Ordenação e contexto:
   - Resultados são emitidos na ordem de chegada dos tool_use; updates podem incluir `contextModifier` para atualizar ToolUseContext.

 toolOrchestration
 - `partitionToolCalls`: agrupa tool_use em batches: múltiplas read-only consecutivas ou uma única não read-only.
 - `runToolsSerially`: executa serialmente, marcando IDs in-progress e completando no final.
 - `runToolsConcurrently`: executa em paralelo com limite `getMaxToolUseConcurrency()`; marca in-progress/completed corretamente.
 - Integração com query.ts: depois do streaming, decide se usa executor em streaming (gated) ou o caminho batch.

 Padrões
 - Classificar “concurrency safe” com `tool.isConcurrencySafe(input)`; se erro, trate como não-segura (conservador).
 - Manter set de `inProgressToolUseIDs` no contexto para UI e controle.
 - Bufferizar mensagens e progredir com `pendingProgress` para UX responsiva.

