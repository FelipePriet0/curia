# Plugins — Loader & Policy

Objetivo: entender descoberta, validação, política e carregamento de plugins.

Componentes
- Loader: `utils/plugins/pluginLoader.ts` — descobre, valida e carrega plugins (marketplace e sessão via --plugin-dir/SDK).
- Policy: `utils/plugins/pluginPolicy.ts` — políticas de origem (blocklist/allowlist, nomes oficiais reservados, homograph protection, fonte oficial).
- Schemas: `utils/plugins/schemas.ts` — zod para manifest, hooks, comandos, MCP bundles (mcpb/dxt), paths relativas.
- Diretórios/Cache: `pluginDirectories.ts`, `zipCache.ts`, `pluginVersioning.ts`, `installedPluginsManager.ts`.

Fluxo
- Fontes: (1) marketplace (plugin@marketplace), (2) plugins de sessão (diretórios/SDK).
- Estrutura: plugin.json (opcional), commands/, agents/, hooks/hooks.json.
- Loader executa: valida manifest, carrega hooks e resolve variáveis, detecta nomes duplicados, gerencia enable/disable e coleta erros.

Políticas
- Nomes oficiais: bloqueia impersonação; reserved names exigem origem org oficial (`github.com/anthropics/…`).
- Non‑ASCII: bloqueado para impedir homographs em marketplaces; blocklist por pattern; allowlist explícita.
- Origem: valida `source` (github/git/url) e compatibilidade com nome/ID.

Cache/Empacotamento
- zipCache: converte diretórios em zip em local de cache (session cache) e extrai quando necessário; habilitação via flag.
- Versionamento: `calculatePluginVersion` para deduplicação e atualização; reconciliador trata colisões.

Erros/Telemetry
- `fetchTelemetry` classifica erros de fetch; `gitAvailability` valida ambiente; erros são registrados (logForDebugging/logError) e propagados ao UX.

Boas práticas
- Validar manifest e hooks com schemas; respeitar política de nomes/origens; preferir marketplaces oficiais.
- Sempre isolar plugins por diretório raiz validado e evitar paths fora da base (`validatePathWithinBase`).

