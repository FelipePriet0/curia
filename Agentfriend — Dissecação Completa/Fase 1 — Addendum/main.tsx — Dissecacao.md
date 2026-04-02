 # Addendum — `main.tsx` (Dissecação linha a linha)

Objetivo: detalhar o bootstrap do CLI completo — efeitos colaterais críticos de startup, parsing de argv avançado, inicialização de telemetria/config/políticas, construção do Commander, opções e validações, e prefetches assíncronos.

1) Efeitos colaterais antes de tudo
- `profileCheckpoint('main_tsx_entry')`: marca o início antes dos imports pesados.
- `startMdmRawRead()`: dispara sub‐processos MDM em paralelo para não bloquear imports.
- `startKeychainPrefetch()`: dispara leituras de keychain (macOS) em paralelo; evita leituras sequenciais custosas (~65ms) posteriores.
- Racional: esconder custo de IO atrás do tempo de imports e capturar benchmarks com `startupProfiler`.

2) Imports e serviços base
- Commander (`@commander-js/extra-typings`), `chalk`, lodash-es utilitários; constantes de OAuth/Product; contextos `getSystemContext/getUserContext`.
- `init` e `initializeTelemetryAfterTrust` do entrypoints; `launchRepl` e GrowthBook; APIs (bootstrap/filesApi/referral), MCP registry, policy limits, remote managed settings.
- Ferramentas: `getTools`, SyntheticOutputTool; recursos como advisor, agent swarms, auth (assinaturas/Bedrock/GCP), config, earlyInput, fastMode/effort, mensagens, plataforma, renderOptions, sessionIngress, settings/skills change detectors, slowOperations, swarm reconnection, warnings, worktree flag, etc.
- Nota: o arquivo concentra o “wiring” de praticamente todo subsistema necessário ao CLI.

3) Checagem de debug/inspect (defensiva)
- `isBeingDebugged()`: detecta `--inspect`/`--debug` em `execArgv`/`NODE_OPTIONS` e via `inspector.url()` (quando disponível). Trata diferença Bun vs Node.
- Se detectado, encerra o processo cedo. Motivo: garantir medição/ambiente estável e evitar interferências nas execuções de produção.

4) Telemetria de sessão e startup
- `logSessionTelemetry()`: registra skills/plugins carregados (com contexto de janela/token) e erros de plugins.
- `getCertEnvVarTelemetry()`: sintetiza flags de ambiente relacionadas a certificados (NODE_EXTRA_CA_CERTS, client cert, --use-system-ca/openssl-ca).
- `logStartupTelemetry()`: agrega Git/worktree/GH auth/Sandbox/auto-updater/reduced-motion e certificados. Gated por `isAnalyticsDisabled()`.

5) Migrações sincronas e assíncronas
- `CURRENT_MIGRATION_VERSION = 11`: se `getGlobalConfig().migrationVersion` diverge, roda o conjunto de migrações (modelos, flags, ponte, etc.).
- Sempre dispara `migrateChangelogFromConfig()` assíncrono e ignora erros (repetirá no próximo startup).

6) Prefetch seguro de contexto do sistema
- `prefetchSystemContextIfSafe()`: só roda `getSystemContext()` se sessão não-interativa (confiança implícita) ou se o usuário já aceitou o trust dialog. Evita rodar `git` em diretórios não confiáveis.

7) Prefetches diferidos pós-primeiro render
- `startDeferredPrefetches()`:
  - Skipa tudo em `CLAUDE_CODE_EXIT_AFTER_FIRST_RENDER` ou `--bare` (medições e headless).
  - Dispara `initUser/getUserContext`, prefetch de credenciais Bedrock/Vertex se seguros, `countFilesRoundedRg` com timeout 3s, initialize analytics gates, prefetch registry MCP, refresh de capabilities de modelo, `settingsChangeDetector/skillChangeDetector` e detector de “event loop stall” (gated).
- Filosofia: não competir com o “critical path” até a primeira pintura do TUI.

8) Flags de settings — carregamento antecipado
- `eagerLoadSettings()`:
  - Analisa `--settings`: se JSON literal, valida e escreve em arquivo temporário com caminho baseado no hash do conteúdo (evita bust no prompt cache); se path, valida legibilidade. Define `setFlagSettingsPath` e `resetSettingsCache()`.
  - Analisa `--setting-sources` para filtrar fontes e também reseta cache.
- Motivo: filtros aplicados desde o início da init, garantindo consistência.

9) Definição de entrypoint
- `initializeEntrypoint(isNonInteractive)`: respeita valores já definidos (p.ex. SDK) e define `CLAUDE_CODE_ENTRYPOINT` como `'mcp'`, `'claude-code-github-action'`, `'sdk-cli'` ou `'cli'` conforme flags/ambiente.

10) Reescrita de argv para caminhos especiais
- `DIRECT_CONNECT` (`cc://`/`cc+unix://`): parse da URL e rewrite de `process.argv` para `open` no modo headless, ou stash em `_pendingConnect` e strip flags no interativo.
- `LODESTONE` (deep links): `--handle-uri` e handler macOS via `__CFBundleIdentifier`; carrega `enableConfigs()` e sai com o código apropriado.
- `KAIROS` (assistant chat): `claude assistant [sessionId]` — remove o subcomando do argv e guarda no `_pendingAssistantChat` para o REPL interativo.
- `SSH_REMOTE`: parsing cuidadoso de flags (permission-mode, dangerously-skip-permissions, -c/--continue/--resume/--model) antes dos posicionais; valida que `-p/--print` não é suportado; reescreve argv e stasha host/cwd/opções para o branch do REPL.

11) Determinação de modo interativo e tipo de cliente
- Detecta `-p/--print`, `--init-only`, `--sdk-url` e TTY para inferir `isNonInteractive`; chama `stopCapturingEarlyInput()` se necessário; marca `setIsInteractive()`.
- `initializeEntrypoint()` precisa rodar antes de telemetrias que dependem do entrypoint.
- Resolve `clientType`: github-action, sdk-ts/py/cli, claude-vscode/desktop, remote (token presente) ou cli.

12) Commander: programa, help e preAction
- `createSortedHelpConfig()`: define ordenação de opções por chave longa — ajuda previsível.
- `program = new CommanderCommand().configureHelp(...).enablePositionalOptions()` e `program.name('claude')...`: define descrição, opções de ajuda e opções globais.
- Hook `preAction` (executa apenas quando um comando é acionado):
  - Espera `ensureMdmSettingsLoaded()` e `ensureKeychainPrefetchCompleted()`; depois `init()` e define `process.title` (se não bloqueado por env).
  - `initSinks()` conecta sinks de telemetria (evita perder eventos em subcomandos que não chamam `setup()`).
  - Lê `--plugin-dir`, configura inline plugins e limpa cache; roda `runMigrations()`.
  - Dispara `loadRemoteManagedSettings()` e `loadPolicyLimits()` (não bloqueantes);
  - Se `UPLOAD_USER_SETTINGS` habilitado, dispara sync em background.

13) Opções globais e validações (amostras críticas)
- `--print`, `--bare`, `--debug[=filter]`, `--debug-to-stderr`, `--debug-file`, `--verbose`.
- Formatos: `--output-format text|json|stream-json`, `--input-format text|stream-json`, `--include-hook-events`, `--include-partial-messages`.
- Permissões: `--dangerously-skip-permissions`, `--allow-dangerously-skip-permissions`, `--permission-mode` (e auto mode sob gate TRANSCRIPT_CLASSIFIER).
- Pensamento: `--thinking enabled|adaptive|disabled` e flags legadas de tokens (deprecated).
- Worktree/tmux: valida dependência e ambiente (erro em Windows e quando tmux ausente), suporta referência de PRs via `parsePRReference`.
- Agent swarms: extrai opções de teammate; aplica `setDynamicTeamContext` e `setCliTeammateModeOverride` antes do snapshot de setup.
- SDK URL: auto define `input/output = stream-json`, `verbose=true`, `print=true` se não setados explicitamente.
- Teleport/Remote/RemoteControl: coleta e adia checagem de bridge até trust + GrowthBook.
- `--session-id`: valida UUID e existência local exceto quando com `--sdk-url` (IDs remotos taggeados). Conflitos com `--continue/--resume` sem `--fork-session` são rejeitados.
- `--file` downloads: exige token de ingress (`CLAUDE_CODE_SESSION_ACCESS_TOKEN`), monta `FilesApiConfig` com base em `ANTHROPIC_BASE_URL`/OAuth, inicia download assíncrono para aguardar antes do REPL.

14) Prompts de sistema
- `--system-prompt[(-file)]` e `--append-system-prompt[(-file)]` são mutuamente exclusivos nos pares; realiza leitura segura com mensagens de erro específicas ENOENT.
- Agent swarms: injeta `TEAMMATE_SYSTEM_PROMPT_ADDENDUM` ao append quando identidade de teammate presente.

15) Permissões e Auto Mode
- `initialPermissionModeFromCLI(...)`: deriva modo e notification; seta `setSessionBypassPermissionsMode` para o trust dialog.
- Sob TRANSCRIPT_CLASSIFIER, seta `autoModeFlagCli` quando há intenção explícita/implícita de auto mode.

16) MCP config dinâmico
- Parseia itens de `--mcp-config` como JSON literal ou arquivo; acumula `configs` e `errors` com `parseMcpConfig` e `expandVars` dentro do escopo dinâmico; aplica `filterAllowedSdkBetas` mais adiante no fluxo.

17) Segurança e sinais
- `process.env.NoDefaultCurrentDirectoryInExePath = '1'` (Windows): mitiga PATH hijacking no lookup de executáveis.
- Handlers de `exit` (resetCursor) e `SIGINT` (respeitando modo print para não preemptar o handler de streaming que aborta consulta e faz gracefulShutdown).

Racional de arquitetura
- “Orquestrador do orquestrador”: `main.tsx` centraliza invariantes de segurança, políticas, trust, telemetria, e constrói o CLI e seus subcomandos com inicialização progressiva e opportunistic prefetch.
- Antifrágil a ambientes: múltiplos caminhos de entrada (deep link, remote, ssh, assistant), todos convergem para o mesmo REPL/loop interativo uma vez que políticas/telemetria e trust estão garantidos.
- Performance consciente: side‐effects de IO paralelos, prefetch pós‐render e gates de “bare” para workloads não interativas.

Q&A interno
- Q: Por que reescrever `argv` em vez de subcomandos separados para `cc://`, `assistant`, e `ssh`?
  A: Evita duplicar o pipeline de inicialização e garante que todos passem pelo mesmo trust/telemetria/UI — com UX consistente.
- Q: Por que `--sdk-url` força stream-json e print/verbose?
  A: Integração SDK remota espera streaming bidirecional estruturado; manter coerência evita classes inteiras de bugs de IO e diagnósticos opacos.
- Q: Por que validar `--session-id` só localmente (sem `--sdk-url`)?
  A: IDs remotos são alocados/geridos pelo servidor e não são UUIDs simples; validação local geraria falsos positivos.
- Q: Por que `--bare` é tão agressivo em pular recursos?
  A: Minimizar latência e interferência: em headless não há janela de “usuário digitando” para esconder prefetch; custo seria puro overhead.

