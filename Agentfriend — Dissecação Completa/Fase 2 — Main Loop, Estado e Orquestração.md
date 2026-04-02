 # Fase 2 — Main Loop, Estado e Orquestração

 Objetivo: mapear o laço principal de diálogo/execução (query loop), como o estado dirige decisões (AppStateStore), e como a orquestração integra streaming do modelo, ferramentas, permissões, compactação, colapso de contexto, orçamentos e UI.

 Sumário
 - Loop principal: `Agentfriend/query.ts`
 - Contexto de ferramentas: `Agentfriend/Tool.ts`
 - Estado global: `Agentfriend/state/AppStateStore.ts`, `state/onChangeAppState.ts`
 - REPL wiring: `Agentfriend/replLauncher.tsx`, `screens/REPL.tsx`

 Diagrama de alto nível
 ```mermaid
 sequenceDiagram
   participant UI as REPL/UI
   participant Q as query.ts
   participant API as Claude API
   participant Tools as Tools/MCP
   UI->>Q: query({messages, toolUseContext, ...})
   loop Until terminal state
     Q->>API: stream request (messages/systemContext)
     API-->>Q: stream events (assistant, tool_use, deltas)
     alt tool_use arrived
       Q->>Tools: runTools(...) or StreamingToolExecutor
       Tools-->>Q: tool_result messages (+context updates)
       Q-->>UI: yield messages (assistant, tool_result, attachments)
       Q->>Q: next turn (recurse)
     else no tool_use
       Q-->>UI: yield assistant + hooks/attachments
       Q->>Q: decide stop/continue (budget, hooks, max tokens)
     end
   end
   Q-->>UI: Terminal(reason)
 ```

 Arquivos detalhados
 - Veja: Fase 2 — query.ts — Dissecacao.md
 - Veja: Fase 2 — Tool.ts — Dissecacao.md
 - Veja: Fase 2 — AppStateStore & onChangeAppState — Dissecacao.md
 - Veja: Fase 2 — REPL.tsx — Arquitetura.md

