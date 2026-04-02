# Permissões — Infra Interna

Objetivo: sintetizar os módulos de infraestrutura de permissões além dos playbooks (Fase 4), cobrindo loaders, parsing e classificadores.

Módulos Principais
- Regras: `PermissionRule.ts`, `permissionRuleParser.ts` — representação e parsing (exact/prefix/wildcard), normalização por shell.
- Loader/Setup: `permissionsLoader.ts`, `permissionSetup.ts`, `permissions.ts` — carregamento de regras por escopo (workspace/user/project/policy), merges e lookups (`getRuleByContentsForTool`).
- Matching: `shellRuleMatching.ts`, `shadowedRuleDetection.ts` — matching case‑sensitive/insensitive por shell, detecção de regras sombreadas.
- Modos: `PermissionMode.ts`, `autoModeState.ts`, `getNextPermissionMode.ts`, `bypassPermissionsKillswitch.ts`.
- Classificadores: `bashClassifier.ts`, `yoloClassifier.ts`, `classifierShared.ts`, `classifierDecision.ts` — decisões automáticas e heurísticas.
- Filesystem: `filesystem.ts`, `pathValidation.ts` — políticas de leitura/escrita, zonas protegidas, validação de paths.
- Tracking/Explainer: `denialTracking.ts`, `permissionExplainer.ts`, `PermissionPromptToolResultSchema.ts` — UX e telemetria.

Padrões
- Regras e matching sempre normalizados (aliases, canônicos, whitespace) para evitar bypass.
- Deny/ask em parse failure; modos influenciam fallback, mas kill‑switch nunca deve silenciosamente permitir ações perigosas.

