# PlanMode e Worktree — Entrar/Sair com Segurança

Objetivo: documentar ferramentas que alternam modos de execução (planejamento) e contexto de trabalho (worktree), controlando permissões e UX.

PlanMode
- Tools: EnterPlanModeTool, ExitPlanModeTool (V2).
- Comportamento: ativa um modo “plano” onde execução destrutiva é suspensa/limitada e saídas são focadas em plano/TO‑DOs; saída restaura permissões padrão.
- UX: mensagens claras de entrada/saída; integração com cores por modo.

Worktree
- Tools: EnterWorktreeTool, ExitWorktreeTool.
- Comportamento: isola contexto de trabalho (ex.: subdiretório/projeto) e controla saída para restaurar o estado anterior; protege contra mudanças perigosas de cwd quando em agentes filhos.
- UX: confirma path alvo, mostra cwd atual e nota de restauração ao sair.

Padrões
- Respeitar prioridades de modo (plan-mode precedence sobre bypasses) — herdado em spawns.
- Evitar side‑effects em agentes filhos; alterações de cwd preferencialmente só na thread principal.

