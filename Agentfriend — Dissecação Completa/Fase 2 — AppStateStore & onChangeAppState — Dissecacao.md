 # AppStateStore.ts + onChangeAppState.ts — Estado e Efeitos

 AppState: visão geral
 - Núcleo reativo do CLI: preferências, modos, ferramentas/MCP/plugins, tarefas, notificações, memória, prompts, painéis (tmux/browser), permissões, fast mode/advisor/esforço, hooks, especulação, auth, mensagem inicial, etc.
 - Remote/Bridge: campos dedicados a sessões remotas/bridge (conectividade, URLs, erros, contagem de tasks, explicit/connected/sessionActive/reconnecting), além de callouts.
 - Permissões: `toolPermissionContext` com `mode` e regras (allow/deny/ask) + diretórios adicionais — seeded por `getEmptyToolPermissionContext()` e ajustado no bootstrap para teammates/plan.
 - Plugins/MCP: estrutura detalhada de clientes/tools/recursos, comandos e erros; `pluginReconnectKey` para forçar efeitos.
 - Tarefas/Agentes: `tasks` (por taskId) + registry `agentNameRegistry` (name→AgentId) e foreground/viewing para UI de equipe.
 - Inbox/elicitation: filas para mensagens e eliciações (MCP URL elicitations) e worker sandbox permission queues.
 - Prompt Suggestion e Speculation: configurações, timers, resultados e contadores; tool-use summaries e tips.

 Defaults (getDefaultAppState)
 - Inicializa centenas de campos com defaults cuidadosos: verbose=false, expandedView none, kairosEnabled=false, remoteConnectionStatus=connecting, bridge flags falsos, etc.
 - thinkingEnabled: `shouldEnableThinkingByDefault()`; promptSuggestionEnabled: `shouldEnablePromptSuggestion()`.
 - toolPermissionContext.mode inicial: teammates com `plan_mode_required` entram em 'plan', senão 'default'.

 onChangeAppState: single choke point para side-effects
 - Permissão (modo): sincroniza com CCR/SDK
   - Compara prev/new mode; traduz para “external mode” (sem nomes internos) e chama `notifySessionMetadataChanged` (CCR) apenas se mudou externamente; sempre chama `notifyPermissionModeChanged` (SDK) com modo raw.
   - Ultraplan: envia `is_ultraplan_mode` somente na transição inicial para 'plan'.
 - Modelo principal: quando `mainLoopModel` muda para null → remove dos settings e limpa override; quando define valor → salva em settings e set override.
 - expandedView: persistência retrocompatível em globalConfig (todos/spinnerTree).
 - verbose: persiste em globalConfig.
 - tmux panel (ant-only): espelha em globalConfig.
 - settings: se mudou → limpa caches de credenciais (apiKey/AWS/GCP) e reaplica env se `settings.env` mudou.

 Q&A interno
 - Q: Por que um único lugar para efeitos?
   A: Evita bugs de sincronização e casos esquecidos; qualquer mudança em AppState passa por um dif que dispara efeitos consistentes.
 - Q: Onde viveram antes os avisos de modo?
   A: Espalhados. Consolidar aqui garante que Shift+Tab, dialogs, slash commands e bridge alterem de forma consistente e avisem CCR/SDK.

