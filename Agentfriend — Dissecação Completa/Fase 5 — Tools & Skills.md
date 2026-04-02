 # Fase 5 — Tools & Skills

 Objetivo: dissecar as principais ferramentas (Bash, FileRead, FileEdit, Skill, Agent) e a orquestração/execução em streaming, além da integração MCP. Entregar um playbook para construir ferramentas seguras, rápidas e fáceis de depurar.

 Mapa
 - Orquestração: `services/tools/{StreamingToolExecutor.ts, toolOrchestration.ts}`
 - Bash: `tools/BashTool/*`
 - FileRead: `tools/FileReadTool/FileReadTool.ts`
 - FileEdit: `tools/FileEditTool/FileEditTool.ts`
 - Agent: `tools/AgentTool/loadAgentsDir.ts`
 - Skill: `tools/SkillTool/SkillTool.ts`
 - MCP: `services/mcp/*` (ConnectionManager, types, config, channel permissions)

Destaques
 - Execução em streaming com paralelismo seguro (read-only em lotes concorrentes) e serial para ferramentas mutáveis.
 - Bash com sandbox heurístico (excluded commands do usuário, wrappers/env) e integração com permissões.
 - FileRead com limites de tokens/bytes e mecanismo de anexos.
 - FileEdit com foco em segurança e aplicação de diffs controlados.
 - Skill executa prompt em subagente forkado com telemetria completa.
 - MCP fornece servidores de ferramenta externos com vários transports (stdio/ws/http/sse/sdk) e escopos (local/user/project/dynamic/enterprise).

Security by Default — Checklist (embutido)
- RO paralelo apenas; RW serializado; abortabilidade com kill da árvore de processos.
- Timeouts e truncation configuráveis; persistência de outputs grandes em arquivo.
- Validação de input com schemas; `checkPermissions` obrigatório; diff seguro em FileEdit.
- Shells: classificação RO conservadora; bloqueio de IEX/encoded/COM e download cradles.
- LSP/FS: caps por bytes/linhas, relativização de paths, paginação.
