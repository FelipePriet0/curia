 # REPL.tsx — Arquitetura e Integração do Loop

 Papel: Interface reativa (Ink) que coleta entrada do usuário, inicializa ToolUseContext (incluindo AppState hooks), chama `query()` e rende mensagens, anexos, diálogos de permissão, MCP, IDE, e banners.

 Pilares
 - Entrada: PromptInput, keybindings, search, scrolling, fullscreen, titles animados, notificações, integração IDE.
 - Estado: usa AppStateStore; compõe diversos hooks de notificação (LSP, Rate Limits, Deprecations, MCP connectivity, Fast Mode, etc.).
 - Sessões: integrações com Remote/Bridge (useRemoteSession), DirectConnect, backgrounding e tasks locais/teammates.
 - Permissões: PermissionRequest dialog, sandbox (rede) worker leader/worker bridges, bypass killswitches.
 - Anexos: queued commands → attachments, file history snapshot init, export, seleção de mensagens, transcript search.
 - Painéis: tmux (Tungsten), web browser tool (bagel), IDE hints.

 Fluxo de turnos (alto nível)
 - Ao enviar input: cria `ToolUseContext` com abortController novo; inicializa caches (`createFileStateCacheWithSizeLimit`), e dispara `query()` em um guard de corrida (QueryGuard).
 - Durante query:
   - Exibe spinner e atualiza título animado; injeta tool JSX quando wrapper; processa updates do StreamingToolExecutor como mensagens.
   - Processa diálogos de permissão (quando `canUseTool` resolve ‘ask’) e integra callbacks se em modo bridge/canais.
   - Injeta anexos (memórias/skills/commands) conforme recebidos do generator.
 - Ao terminar: encerra animação de título, notifica eventos e atualiza contadores de custo/tempo de hooks/tools.

 Interações com AppState
 - Lê e grava campos para: modos, permissões, fast/advisor/esforço, painéis, prompts iniciais, inbox/elicitation queues, etc.
 - onChangeAppState (externo) cuida de side-effects persistentes (modelo, verbose, configs, CCR/SDK).

 Q&A interno
 - Q: Onde ocorre “o loop”? No REPL ou em query.ts?
   A: REPL apenas orquestra UI e chama o generator; a lógica de turnos/continuação vive em `query.ts`.
 - Q: Como o REPL lida com fluxos remotos/bridge?
   A: Hooks especializados (useReplBridge, useRemoteSession) sincronizam estado e eventos; REPL continua sendo a “view”.

