 # `services/compact/compact.ts` — Compactação principal

 Função: motor de compactação que ativa pre/post hooks, estimativas de tokens, resume via summarizer fork, injeta boundaries e rehidrata anexos críticos (skills, arquivos, deltas MCP), protegendo pares tool_use/result e blocos de thinking.

 Destaques
 - Entradas: mensagens, `toolUseContext`, `querySource`, ferramentas, `canUseTool`, config de modelo.
 - Heurística de segurança: `getMessagesAfterCompactBoundary()` e inspeções de ids (`getToolResultIds`, `hasToolUseWithIds`) evitam cortar tool_use/result; mensagens com mesmo `message.id` (chunks streamados) são mantidas coesas para merge em `normalizeMessagesForAPI`.
 - Grouping: `groupMessagesByApiRound` produz janelas estáveis por round de API; compact atua por grupo.
 - Prompts de compact: `getCompactPrompt`, `getPartialCompactPrompt`, `getCompactUserSummaryMessage` instruem summarizer; há variantes para parciales “up_to”.
 - Execução: chama `queryModelWithStreaming` com `COMPACT_MAX_OUTPUT_TOKENS` e tracking de uso (`getTokenUsage`/`tokenCountFromLastAPIResponse`). Trampa PROMPT_TOO_LONG com `getPromptTooLongTokenGap` para decidir fallback/partial.
 - Reidratação: pós-compacto injeta anexos essenciais: referências de arquivos (`generateFileAttachment`), `getDeferredToolsDeltaAttachment`/`getMcpInstructionsDeltaAttachment`, tool search, skills e “agent listing delta”. Limita número de arquivos (`POST_COMPACT_MAX_FILES_TO_RESTORE`) e budget por arquivo.
 - Boundaries e limpeza: `createCompactBoundaryMessage` e `markPostCompaction`; `runPostCompactCleanup(querySource)` reseta caches/stores corretos (contextCollapse, getUserContext cache, memory files, etc.).
 - Crescimento seguro: `roughTokenCountEstimation`/`analyzeContext`; telemetria via `logEvent` com métricas detalhadas (pre/post tokens, cache creation/read tokens, compactionTotalTokens, chainId/depth).

 Q&A
 - Q: Como evitar duplicar ou perder blocos streamados?
   A: Grupos por assistant.id e merge final por `normalizeMessagesForAPI`; heurísticas específicas para preservar thinking e tool_use/result.
 - Q: Quando reintroduzir arquivos/skills grandes?
   A: Pós-compacto, com budgets e truncamentos para manter contexto enxuto, priorizando cabeçalhos e instruções iniciais.

