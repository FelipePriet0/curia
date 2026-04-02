 # Memórias e Anexos — Seleção, Orçamento e Injeção

 Fontes
 - `utils/attachments.ts`: seleção e construção de anexos (arquivos, memórias, tasks, deltas), limites de tamanho/linhas, fila de comandos.
 - `services/compact/sessionMemoryCompact.ts`: regras de compactação específicas de memórias de sessão.
 - `utils/messages.ts`: normalização, boundaries, mensagens sintetizadas (interrupção/cancel/reject), utilidades para API.

 Estratégias
 - Orçamento de memórias: caps por arquivo (`MAX_MEMORY_LINES`, `MAX_MEMORY_BYTES` ≈ 4KB) e por sessão (`MAX_SESSION_BYTES` ≈ 60KB) para evitar que surfacing de memórias cresça sem bound ao longo da sessão.
 - Relevância: seleção prioriza abertura/frontmatter e instruções iniciais (maior utilidade para modelos), truncando o resto.
 - Sessão: `sessionMemoryCompact` opera sobre memórias e mensagens textuais para reduzir custo mantendo “essência” — configurável via GrowthBook (`tengu_sm_compact_config`).
 - Fila de comandos → attachments: prompts de usuário e “task-notification” viram anexos no fim do turno, mantendo origem e garantindo consumo-remover somente de itens realmente injetados.
 - Rehidratação segura: após compactar, reintroduz referências/trechos importantes (arquivos recentes, deltas de instruções/skills) respeitando budgets.

 Q&A
 - Q: Por que cortar por bytes além de linhas?
   A: Modelos contam tokens; linhas longas podem explodir o custo. Byte-cap sólido garante estabilidade do budget por injeção.
 - Q: Quando parar de “prefetchar” memórias?
   A: Ao atingir `MAX_SESSION_BYTES` — pressupõe-se que as memórias mais relevantes já estão em contexto; retomar após um compact que removeu anexos antigos.

