# Fase 5 — Índice Consolidado & Checklist de Replicação

Índice (Fase 5)
- Orquestração: StreamingToolExecutor, toolOrchestration (batches, concurrency, ordering)
- Shells: BashTool, PowerShellTool (sandbox, permissões, read‑only/classifiers, paths)
- FS: FileReadTool, FileEditTool, FileWriteTool (read-before-write, diffs, LSP)
- Navegação: LSPTool, GrepTool, GlobTool
- Web: WebSearchTool, WebFetchTool, Playbook Web
- Notebooks: NotebookEditTool
- Agentes/Skills: AgentTool, SkillTool (+ telemetria)
- MCP: ConnectionManager + Tools (MCPTool, Read/List, Auth)
- Gestão: Tasks (Create/List/Get/Update/Stop/Output), Teams (Create/Delete)
- Diversos: SendMessageTool, ToolSearchTool, TodoWriteTool, RemoteTrigger, ScheduleCron, Sleep, SyntheticOutput, Plan/Worktree

Checklist de Replicação (por projeto)
- Tool API
  - Implementada com schemas, validateInput, checkPermissions, call, mapper para tool_result e UX consistente.
- Executor
  - Streaming com lotes: read‑only em paralelo, mutáveis em série; ordenação e progress.
- Permissões/Sandbox
  - Regras exact/prefix/wildcard; FS policy (.git, secrets, UNC); sandbox policy (recusar em Windows nativo quando obrigatório).
- Shells
  - Classificação read‑only conservadora; bloqueios de comandos perigosos; path validation; background/abort.
- FS/Editar
  - Read-before-write; diffs; LSP notificações; persistência de outputs grandes.
- Busca/Navegação
  - LSP + Grep/Glob com limites/paginação e relativização de paths.
- Web
  - Search→Fetch; preapproved/allowlist de domínios; redirects controlados; prompts para markdown.
- Notebooks
  - .ipynb com validações de célula e reset de execução.
- Agentes/Skills
  - Fork/telemetria; origem sanitizada (bundled/oficial/3P) e discovery.
- MCP
  - Conexões por escopo/transport; auth via pseudo‑tool; resources e tools expostos.
- Gestão/Agendamento
  - Tasks/Teams CRUD; cron com validação; notificações de output (path) e uso de Read.
- UX
  - getActivityDescription; mensagens legíveis; truncation e paginação; highlights e links de path.
- Testes/Telemetria
  - Concorrência/aborts/timeouts; permissões deny/ask/allow; eventos start/end/fail (durations, sizes, concurrency).

