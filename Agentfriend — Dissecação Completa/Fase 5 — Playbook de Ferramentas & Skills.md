 # Playbook de Ferramentas & Skills

 Objetivo: guia prático para criar ferramentas seguras, rápidas e integradas ao loop.

 Interface de ferramenta
 - Implemente `Tool<Input, Output, Progress>` com:
   - `inputSchema` (zod) e `validateInput()`
   - `description()`, `userFacingName()`, `getActivityDescription()`
   - `checkPermissions(input, context)` (regra específica)
   - `call(args, context, canUseTool, parentMessage, onProgress?)`
   - `mapToolResultToToolResultBlockParam(output, toolUseID)`
   - `renderToolUseMessage()` e opcional `renderToolResultMessage()`
   - `isConcurrencySafe(input)` para habilitar paralelismo
   - `toAutoClassifierInput(input)` para classifier

 Permissões
 - Use `hasPermissionsToUseTool` antes de executar; forneça `getActivityDescription` amigável.
 - Especifique regras de path/padrões (bash/powershell) e trate casos perigosos antes do classifier.

 Concurrency & Orquestração
 - Retorne `isConcurrencySafe(input)` true para read-only; false para mutações.
 - Emita `onProgress` granular para UX (mensagens “condensed” no transcript).
 - Forneça `contextModifier` quando a tool muda o contexto (ex.: alterar cwd, registrar recursos).

 Segurança
 - Validar paths com `safeResolvePath` e políticas (deny escapes/symlinks perigosos).
 - Para leitura, respeitar orçamentos (bytes/linhas/tokens) e sinalizar truncation.
 - Para edição, dry-run/preview/diff e mensagens claras; abort respeitado.

 Telemetria
 - Eventos mínimos: start/end/failed com campos úteis (durations, sizes, concurrency, input classifications) — sanitize de nomes.
 - Para skills, logar source (bundled/oficial/3P), marketplace, profundidade, descobertas.

 Integração MCP
 - Validar configs (zod) e escopos; usar `MCPConnectionManager` para listar tools e recursos.
 - Respeitar `channelPermissions` e sandbox; reportar erros de conexão/execução de forma clara.

 Testes
 - Concurrency: interleave de read-only e mutáveis conforme batches.
 - Abort: cancelar subprocessos irmãos quando apropriado (bash errors).
 - Permissão: corrida hooks vs SDK; negativa repetida → fallback prompting.

