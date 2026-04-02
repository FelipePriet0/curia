# Tasks & Teams — Criação, Listagem, Atualização e Encerramento

Objetivo: documentar o conjunto de ferramentas de tarefas e equipes para orquestrar trabalhos assíncronos e organização de agentes/time.

Tasks
- Tools: TaskCreateTool, TaskListTool, TaskGetTool, TaskUpdateTool, TaskStopTool, TaskOutputTool (deprecada em favor de Read no output path).
- Comum
  - Input schemas com zod e mensagens de uso em UI.tsx; `userFacingName`/`getToolUseSummary` para transcript limpo.
  - Integração com `utils/tasks.ts` (createTask, deleteTask, getTaskListId, isTodoV2Enabled), hooks `executeTaskCreatedHooks` (notificações).
  - appState: persistência em `state.tasks` e polling leve para `TaskOutputTool` (com `waitForTaskCompletion`).
- TaskCreateTool
  - Cria tarefas locais/assíncronas (shell/agent/remote) com metadados; dispara hooks e retorna ID + path de output quando aplicável.
- TaskListTool
  - Lista tarefas por lista/estado; agrega para exibição e paginação; read‑only.
- TaskGetTool
  - Obtém detalhes de uma tarefa específica; read‑only; útil para follow‑ups.
- TaskUpdateTool
  - Atualiza título/descrição/status; respeita regras de permissão; mutável e serializada na orquestração.
- TaskStopTool
  - Encerra execução (mata subprocessos/agentes remotos se aplicável) com mensagens claras; abortável.
- TaskOutputTool
  - [Deprecated] Indica usar FileRead (Read) diretamente no caminho retornado/ notificação `<task-notification>`; mantém compat por legados.

Teams
- Tools: TeamCreateTool, TeamDeleteTool (UI + prompt + constants).
- TeamCreateTool
  - Cria times para agrupar agentes/tarefas; valida nomes/escopo; integra com store para roteamento.
- TeamDeleteTool
  - Remove time; confirma impacto e limpa metadados relacionados.

Padrões
- Read‑only vs mutáveis: classificar corretamente para paralelismo seguro.
- Notificações: ao completar tarefas em background, sempre emitir `<task-notification>` com path de output e status.
- Mensagens: preferir prompts e descrições orientadas à ação; expor IDs/paths de forma estável para automação.

