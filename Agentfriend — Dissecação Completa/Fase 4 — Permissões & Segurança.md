 # Fase 4 — Permissões & Segurança

 Objetivo: dissecar o fluxo de decisão de permissões (modes, regras, hooks, classifier, host/SDK) e a segurança operacional (bypass killswitch, sandbox de rede, sync líder/trabalhador), com telemetria e playbook.

 Mapa
 - Núcleo: `utils/permissions/permissions.ts`
 - Modos/resultados: `PermissionMode.ts`, `PermissionResult.ts`
 - Regras/updates: `permissionRuleParser.ts`, `PermissionUpdate.ts`, `permissionsLoader.ts`
 - Classifier / Auto mode: `classifierDecision.ts`, `yoloClassifier.ts`, `autoModeState.ts`, `denialTracking.ts`
 - Killswitch: `bypassPermissionsKillswitch.ts`
 - Sandbox/Swarm: `hooks/useSwarmPermissionPoller.ts`, `utils/swarm/{permissionSync.ts,leaderPermissionBridge.ts}`
 - UI: `components/permissions/PermissionRequest.tsx`

 Fluxo alto nível (Mermaid)
 ```mermaid
 flowchart TD
   A[Tool call] --> B{hasPermissionsToUseTool}
   B -->|allow/deny| C[return decision]
   B -->|ask| D[Race: hooks vs host]
   D -->|hook decides| E[apply updates + resolve]
   D -->|host decides| F[resolve via SDK]
   E --> G[execute or reject]
   F --> G
 ```

Destaques
 - Modo + regras + classifier -> converge em `PermissionDecision`.
 - “Ask” dispara corrida não‑bloqueante: hooks (locais) vs host (SDK/bridge). Abort cooperativo cancela o perdedor.
 - Denial tracking: se classifier negar repetidamente, cai em prompting para evitar loops.
 - Killswitch: desativa bypass/auto conforme política (GB/ambiente) e notifica UI.
 - Swarm: trabalhador envia pedido para líder; líder decide; resposta sincroniza via mailbox/polling.

Security by Default — Checklist (embutido)
- Política de permissões versionada e auditável.
- Fail‑closed em parse/validação e políticas indeterminadas.
- Killswitch para bypass/auto; logs sem PII das decisões.
- Prompt claro com `getActivityDescription`; latência p95 < 2s.
- Proteção `.git/**`, secrets/**, symlinks perigosos, UNC/NTLM; normalização de paths.
- Integração com Sandbox/Swarm conforme política.
