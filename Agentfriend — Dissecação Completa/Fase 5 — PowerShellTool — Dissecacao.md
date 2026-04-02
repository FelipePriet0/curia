# PowerShellTool — Segurança, Permissões e Execução

Objetivo: mapear a implementação da ferramenta PowerShell (Windows/WSL/macOS/Linux) com seus guard-rails de segurança, pipeline de permissões, heurísticas de UX e integração com a orquestração de tools.

Componentes
- `PowerShellTool.tsx`: implementação principal (schema, validate, call, progress, render, backgrounding).
- `readOnlyValidation.ts`: detecção de comandos somente‑leitura (concurrency safe) e vazamentos de valor.
- `pathValidation.ts`: validação de caminhos/curingas/colons, `.git` e glob base; deny de providers não‑FS (`env:`, `HKLM:` etc.).
- `powershellSecurity.ts`: checks AST focados em exfiltração/execução dinâmica (Invoke‑Expression, encodedCommand, download cradles, Add‑Type, COM, Start‑Process, scriptblock injection etc.).
- `modeValidation.ts`: modos de permissão (aceita/nega edições), symlinks, invariantes de cmdlets.
- `gitSafety.ts`: proteção contra gravações em paths internos do Git e TOCTOU com extratores de arquivo.
- `powershellPermissions.ts`: agregador de decisão de permissão (regras, matching case‑insensitive, sugestões de updates).
- `UI.tsx`: render de tool_use/result, filas/queued e mensagens de progresso.
- `prompt.ts`: instruções para o modelo (timeout, background, uso de env vars, edition detection).

Schema e Entradas/Saídas
- Input (`fullInputSchema`): `command`, `timeout?`, `description?`, `run_in_background?`, `dangerouslyDisableSandbox?`.
- Output: `stdout`, `stderr`, `interrupted`, `returnCodeInterpretation?`, `isImage?`, `persistedOutputPath?`, `persistedOutputSize?`, `backgroundTaskId?`, `backgroundedByUser?`, `assistantAutoBackgrounded?`.
- `inputSchema` condicional: quando background tasks desabilitadas por env, oculta `run_in_background` (mas o tipo trata o campo).

Segurança (multi‑camadas)
- Sandbox/Policy: em Windows nativo não há sandbox POSIX; se política exigir sandbox e não permitir unsandboxed, recusa com mensagem explícita (guard em `validateInput` e, principalmente, em `call`).
- Somente‑leitura: `readOnlyValidation` classifica comandos/cmdlets/flags seguras; erros → conservador (não‑seguro). Evita paralelismo perigoso.
- AST security: `powershellSecurity` bloqueia exec/dowload dinâmico, encoded payloads, IEX, Add‑Type perigoso, COM e equivalente; inspeções por nós do AST e nomes canônicos.
- Paths: `pathValidation` valida resolução segura, nega providers não‑FS, controla curinga/colon e paths destrutivos; integra com `.git` via `gitSafety`.
- Git/TOCTOU: cmdlets/externos que podem depositar arquivos (tar/7z/unzip/expand‑archive) antes de `git` forçam prompt/deny; checks de caminhos internos (`hooks/`, `refs/`, `objects/`, `HEAD`).

Permissões
- `powershellPermissions`:
  - Normaliza nomes para canônicos (case‑insensitive), preserva módulo em allows (evita over‑match), e expande para prefix/wildcards.
  - Usa parser PowerShell para extrair nome e argumentos de forma robusta.
  - Sugestões: evita gerar regra exata para multi‑linha ou com `*` (round‑trip inseguro); propõe prefix quando adequado.
- `modeValidation`: respeita modo (aceita edições) e identifica cmdlets que criam symlink/alteram item type.
- Integração com pipeline global: `hasPermissionsToUseTool` (ask/deny/allow) antes do spawn; `getActivityDescription` claro.

Execução e Orquestração
- `call()`: guarda de política, invoca `runPowerShellCommand` (generator), emite `onProgress` com `PowerShellProgress` (bytes/linhas/elapsed/taskId), e retorna `Out` com persistência quando output grande.
- Concurrency: `isConcurrencySafe(input)`: usa read‑only classification; tools seguras podem rodar em paralelo (executor em streaming), mutáveis são serializadas.
- Backgrounding: auto‑background após `ASSISTANT_BLOCKING_BUDGET_MS` em modo assistant (exceto comandos proibidos ex.: Start‑Sleep). Suporta Ctrl+B e `run_in_background` com TaskOutput.
- CWD: somente thread principal ajusta/reset cwd (`resetCwdIfOutsideProject`); sub‑agentes isolam cwd.
- Telemetria: `getCommandTypeForLogging` classifica comandos comuns; `trackGitOperations` antes de early‑return de background.

UX e Heurísticas
- Colapsar leitura/busca: `isSearchOrReadPowerShellCommand` detecta comandos de consulta/visualização e compacta no transcript (equivalente ao Bash).
- Sleep bloqueante: `detectBlockedSleepPattern` identifica `Start‑Sleep N` inicial e aplica orientação/auto‑background.
- Render: `renderToolUseMessage`, `renderToolResultMessage`, `renderToolUseProgressMessage`, `renderToolUseQueuedMessage` — ordenação consistente com executor de streaming.
- Tratamento de interrupção: diferencia `interrupt` do usuário de timeouts/erros para decidir se lança `ShellError`.

Padrões e Armadilhas
- Matching canônico: nomes de cmdlets/aliases em lowercase; cuidado com módulos (`Module\Verb‑Noun`).
- Normalização de espaço entre comando e args para avaliação de regras (evita bypass por tabs).
- Preferir negar quando parse falha ou tipo do argumento não é inspecionável (conservador).
- Não confundir “preferência do usuário” (ex.: excluded commands) com “segurança efetiva”: sandbox/permissions são a barreira real.

