 # `utils/permissions/permissions.ts` — Dissecado

 Papel: ponto único de decisão de permissão para tool calls. Combina modo, regras, classifier (quando habilitado), hooks e host SDK. Persiste updates (always allow/deny/ask) e integra sandbox.

 Fluxo por etapas
 - Normalização: resolve nome da ferramenta (aliases, MCP), extrai redireções de saída (bash), detecta ambiente/sandbox, prepara contexto.
 - Modo: `PermissionMode.ts` define `default|ask|allow|deny|auto|plan|bypassPermissions` etc.; `permissionModeTitle()` para UX.
 - Regras: carrega regras (managed + user), parse de padrões (bash glob, skill), validação de paths; detecção de conflitos/sombreamento.
 - Classifier (gated TRANSCRIPT_CLASSIFIER):
   - `classifierDecisionModule` julga transcript/entrada; métricas (cache read/creation/input/output tokens) registradas.
   - `denialTracking` acumula negativas e pode forçar fallback para prompting.
 - Hooks: `executePermissionRequestHooks` avalia hooks assíncronos; pode decidir allow/deny e gerar PermissionUpdates (persistência com `persistPermissionUpdates` + `applyPermissionUpdates`).
 - Host SDK: `structuredIO.sendRequest` subtype `can_use_tool` exibe diálogo com sumário `getActivityDescription` e coleta decisão do usuário; deduplicação por `tool_use_id`.
 - Resultado: `PermissionDecision` — allow (com `updatedInput` possível), deny (mensagem padronizada) ou ask (quando aplicável).

 Persistência e Updates
 - `PermissionUpdate.ts`: aplica/persiste decisões (always allow/deny/ask) por source/destino; integra com settings e `permissionsLoader`.
 - `permissionRuleParser.ts`: parse e strings de regras (`Bash(git *)`, etc.), com matcher especializado opcional do tool.

 Sandboxing e Ambiente
 - `SandboxManager`: influencia se pode auto‑permitir bash/powershell sem prompt; gating para ambientes protegidos.
 - “Sandbox Network Access”: pedidos de rede são tratados como ferramenta sintética via SDK (StructuredIO `createSandboxNetworkPermissionChecker`).

 Telemetria
 - `logEvent`: registro detalhado para classifier/decisões, custos/tokens, e fontes (settings source display name).
 - `logForDebugging`: trilhas de depuração (sem PII sensível) para entender caminhos de decisão.

 Q&A
 - Q: Como evitar prompting infinito?
   A: Denial tracking limita negativas consecutivas/total e força fallback para prompting.
 - Q: Onde o “ask” vira decisão?
   A: No race hook vs host; o ganhador define, e o perdedor é abortado para UX responsiva.
 - Q: Como atualizar regras de forma segura?
   A: Via PermissionUpdates com validação de esquemas e reconciliation em `permissionsLoader`.

