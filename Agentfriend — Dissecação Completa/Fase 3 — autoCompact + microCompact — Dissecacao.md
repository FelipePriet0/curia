 # AutoCompact + MicroCompact — Estratégias e Segurança

 `autoCompact.ts`
 - Papel: decidir QUANDO compactar automaticamente e consolidar resultados em mensagens pós-compact.
 - Integração: retorna `compactionResult` com métricas (pre/post/truePost), `summaryMessages`, `attachments` e `hookResults` para `buildPostCompactMessages` em query.ts.
 - Circuit breaker: `consecutiveFailures` evita laços de retry infindáveis.
 - Warning UX: `compactWarningState`/hook suprimem alerta “context left until autocompact” logo após sucesso, reativando no próximo ciclo com medição fresca.

 `microCompact.ts`
 - Papel: “varredura leve” antes da chamada — remove tool_results antigos/volumosos, limita ruído, e aplica time-based microcompact (cache TTL expirado).
 - Config tempo: `timeBasedMCConfig.ts` ativa quando gap desde última assistant > threshold (ex.: 60 min), mantendo os N mais recentes.
 - Reset controlado: `resetMicrocompactState()` é chamado em `postCompactCleanup`.
 - Segurança: microcompact nunca deve quebrar pares; usa as mesmas heurísticas/agrupamento de `groupMessagesByApiRound`.

 Q&A
 - Q: Por que duas camadas de compactação?
   A: microcompact é local, leve e antes da chamada; autocompact resume contexto com boundary explícito, telemetria e rehidratação — são complementares.
 - Q: Quando disparar microcompact por tempo?
   A: Quando a chance de cache expirado é alta (gap >> TTL). Assim, reduz-se regravação do prefixo antes do pedido, poupando tokens.

