 # Modes, Results e Killswitch — Dissecado

 Arquivos: `PermissionMode.ts`, `PermissionResult.ts`, `bypassPermissionsKillswitch.ts`

 PermissionMode
 - Define o espaço de modos (default/ask/allow/deny/auto/plan/bypassPermissions, etc.).
 - Conversões: `permissionModeFromString`, `toExternalPermissionMode` (remove nomes internos antes de sincronizar com SDK/CCR), `permissionModeTitle` para UX.
 - Integração com AppState: mudanças notificam `notifySessionMetadataChanged` e `notifyPermissionModeChanged` (ver onChangeAppState).

 PermissionResult
 - `PermissionDecision`: allow | deny | ask — com razão (`PermissionDecisionReason`), mensagens, `updatedInput` e `updatedPermissions`.
 - `PermissionAskDecision`: estrutura para “ask” com sugestões e caminhos (e.g., input sanitized).

 Killswitch (bypassPermissionsKillswitch)
 - Funções para verificar/forçar desativação de `bypassPermissions` e `auto mode` com base em política/flags GrowthBook/ambiente.
 - Hooks de UI: chamadas de verificação em REPL (`checkAndDisableBypassPermissionsIfNeeded`, `checkAndDisableAutoModeIfNeeded`) para avisar o usuário, reverter e manter coerência.

 Q&A
 - Q: Por que “toExternalPermissionMode”?
   A: Evita expor nomes internos (bubble/ungated auto) em metadados externos; mantém contratos estáveis com SDK/CCR.
 - Q: Como refletir o modo no início da sessão?
   A: Em main.tsx, antes de render, define o modo e persiste em settings se o usuário escolher via CLI ou interação.

