 # `Tool.ts` — Contexto e Interface de Ferramentas

 Intenção: definir a interface completa de ferramentas, o contexto passado a cada chamada e utilidades para lookup/aliases, além de progressos e permissão.

 `ToolUseContext` (pontos-chave)
 - `options`: ferramentas, modelo, debug/verbose, MCP (clients/resources), agente principal, prompts custom/append, querySource e callback `refreshTools()`.
 - `abortController`: cancelamento cooperativo por turno (afetando streaming e ferramentas).
 - `getAppState/setAppState`: integração com estado global; `setAppStateForTasks` para infra de sessão (workers) que deve sempre alcançar a raiz.
 - Hooks de UI: `setToolJSX`, `addNotification`, `appendSystemMessage`, `sendOSNotification`, `openMessageSelector`.
 - MCP elicitations: `handleElicitation` para caminho SDK.
 - Leitura de arquivos: `readFileState` e limites; globLimits; overlay para speculation.
 - Segurança/permissões: `localDenialTracking`, `requireCanUseTool` (speculation), `toolDecisions` (traço de decisões por tool_use_id).
 - Persistência/telemetria: `contentReplacementState` (budget de tool results), `renderedSystemPrompt` (cache de prompt), `queryTracking`.

 Interface `Tool<Input, Output, P>`
 - Métodos obrigatórios:
   - `call(args, context, canUseTool, parentMessage, onProgress?)` → `ToolResult<Output>`
   - `description(input, options)` (UI/UX), `validateInput(input)` (zod), `mapToolResultToToolResultBlockParam(out, toolUseID)` (para API), `toAutoClassifierInput`, `prompt(options)` (menu do agente)
   - `renderToolUseMessage(...)` e opcionalmente `renderToolResultMessage(...)` + `extractSearchText` (index)
   - `checkPermissions(input, context)` com semântica de permissões específicas (rules/hook + modo)
 - Utilidades: aliases, `searchHint`, `getActivityDescription`, `isTransparentWrapper`, `isResultTruncated`, `getToolUseSummary`, permission matcher otimizado.

 Utilitários
 - `toolMatchesName` e `findToolByName` (suporte a aliases)
 - `filterToolProgressMessages` — filtra mensagens de progresso de hooks (mostra apenas progressos da ferramenta no transcript)
 - `getEmptyToolPermissionContext()` — seed para AppState

 Q&A interno
 - Q: Onde fica a “mágica” de permissões?
   A: A decisão geral vive em `permissions/*.ts`; cada tool tem `checkPermissions` para nuances (ex.: paths, glob, oper. perigosas).
 - Q: Onde Tool → Mensagem API?
   A: `mapToolResultToToolResultBlockParam` define o payload para `tool_result` na Anthropic API; UI pode renderizar diferente.
 - Q: Por que `renderedSystemPrompt` no contexto?
   A: Subagentes compartilham prompt cache do pai, evitando divergências e custos (GB cold→warm).

