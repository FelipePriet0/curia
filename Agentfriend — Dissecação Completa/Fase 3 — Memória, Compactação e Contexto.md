 # Fase 3 — Memória, Compactação e Contexto

 Objetivo: entender como o sistema controla o tamanho/qualidade do contexto e injeta memórias úteis, mantendo estabilidade (sem pares tool_use/result quebrados), performando cache-friendly e com recuperação de erros.

 Mapa
 - Compactação: `services/compact/{compact,autoCompact,microCompact,apiMicrocompact,postCompactCleanup,grouping}.ts`
 - Sessão/Memória: `services/compact/sessionMemoryCompact.ts`, `utils/attachments.ts` (memórias), `utils/claudemd.ts` (detecção), `utils/messages.ts`
 - Config tempo: `services/compact/timeBasedMCConfig.ts`

 Fluxo resumido (Mermaid)
 ```mermaid
 flowchart TD
   A[Messages] --> B(microcompact)
   B --> C(contextCollapse?)
   C --> D(autoCompact)
   D -->|summary + boundaries| E[post-compact messages]
   E --> F(stream API)
   F -->|tool_use| G(run tools)
   G --> H[next turn]
   E --> H
 ```

 Pilares de design
 - Preservar pares tool_use/tool_result e thinking: heurísticas de início/fim garantem que compacts não desalinhem IDs ou “partam” transcrições streamadas.
 - Boundaries explícitos: mensagens-sentinela `SystemCompactBoundaryMessage` mostram onde compactou; pós-compacta adiciona sumários e anexos reintroduzindo partes essenciais.
 - Amigável a cache: prompts compactados e “up_to” mantêm compatibilidade com prompt caching (evitam bust desnecessário), incluindo microcompact baseado em tempo para renovar prefixos após expiração.
 - Segurança do estado: `postCompactCleanup` reseta caches e stores relevantes no main thread, sem corromper subagentes.

 Q&A inicial
 - Q: Por que microcompact ANTES da chamada?
   A: Reduz tokens reescritos e melhora chance de cache; rodar após a primeira falta só ajudaria turnos seguintes.
 - Q: Como driblam contextos malformados (tu sem result)?
   A: Agrupamento por rodada de API (`groupMessagesByApiRound`) e reparos no caminho do summarizer; evite depender de “human turn only”.

