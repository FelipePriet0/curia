 # BashTool — Sandbox, Segurança e Execução

 Componentes
 - `toolName.ts`: define `BASH_TOOL_NAME = 'Bash'` para evitar ciclos.
 - `shouldUseSandbox.ts`: lógica para aplicar sandbox com base em config/ambiente e padrões perigosos.
 - `BashTool.tsx`: implementação da ferramenta (input schema, description, call, progress, renderização; extenso).

 Heurísticas de sandbox (shouldUseSandbox)
 - `containsExcludedCommand(command)`: não é boundary de segurança, mas conveniência para respeitar preferências do usuário e flags internas.
   - Ant-only dynamic config `tengu_sandbox_disabled_commands` (commands/substrings).
   - Split de compostos (`a && b`) e remoção iterativa de env vars e wrappers seguros (timeout, env presets) para casar padrões.
   - Padrões suportados: prefix, exact, wildcard; parse robusto via `splitCommand_DEPRECATED`.
 - Integração com `SandboxManager` e settings do usuário.

 Execução (BashTool.tsx)
 - Validação de input (zod) e detecção de redireções.
 - Segurança de path/exec (pathValidation, filesystem) antes de spawn.
 - Progressos emitidos (stdout/stderr, status), mapeados para transcript.
 - Permissão: passa por `hasPermissionsToUseTool` antes de spawn; decisões “ask” exibem resumo legível com `getActivityDescription`.
 - Abortabilidade: respeita AbortSignals; em erro, executor aborta subprocessos irmãos.

 Padrões
 - Seja conservador: se parsing falhar, tratar como não-concurrency-safe.
 - Normalizar comandos compostos; aplicar stripping até ponto fixo para casar com regras do usuário.
 - Separar “preferência do usuário” de “segurança real” — sandbox permission é o controle efetivo.

