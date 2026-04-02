# Plugins — Marketplace & Instalação

Objetivo: documentar gestão de marketplaces, instalação/atualização e verificação.

Componentes
- services/plugins: `PluginInstallationManager.ts`, `pluginOperations.ts`, `pluginCliCommands.ts`.
- utils/plugins: `marketplaceManager.ts`, `officialMarketplace*.ts`, `reconciler.ts`, `refresh.ts`, `pluginInstallationHelpers.ts`.

Marketplace
- `loadKnownMarketplacesConfigSafe()`: carrega config de marketplaces conhecidos; suporte a cache‑only.
- Oficiais: integração com GCS/GitHub; startup checks (oficial/entitlements) e bloqueios (blocklist de marketplaces).
- Identidade: `parsePluginIdentifier` (plugin@marketplace), exibição `formatSourceForDisplay`.

Instalação/Atualização
- Fluxos de fetch (git/github/http) com telemetria `logPluginFetch` e classificação de erros (`classifyFetchError`).
- Reconciliation: evita duplicatas, aplica políticas, e resolve conflitos de versão com `calculatePluginVersion` e `reconciler`.
- Autoupdate: política em `pluginAutoupdate.ts`; checks em `performStartupChecks.tsx`.

Políticas de Segurança
- `pluginPolicy.ts`: nomes reservados/oficiais e verificação de origem; proteção contra homograph; blocklist/allowlist.
- `validatePathWithinBase`: impede escapes durante instalação/extração.

Boas práticas
- Preferir marketplaces oficiais; manter logs e checks em startup; falhas devem degradar graciosamente sem quebrar sessão.

