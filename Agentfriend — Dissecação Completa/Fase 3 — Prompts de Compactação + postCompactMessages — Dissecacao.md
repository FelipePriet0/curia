 # Prompts de Compactação e postCompactMessages — Dissecado

 Objetivo: entender as variantes de prompt de compactação (completo, parcial, up_to) e como o sistema constrói as mensagens pós-compact (`buildPostCompactMessages`) para manter o histórico consistente, cache‑friendly e útil ao modelo.

 Arquivo‑chave: `services/compact/prompt.ts`

 Componentes principais
 - Constantes de instrução: blocos de instruções extensos que definem o formato e os critérios de sumário (Primary Request, Key Concepts, Files and Code Sections, Errors and fixes, etc.). Variantes para full e partial (RECENT vs UP_TO).
 - `COMPACT_PROMPT` (completo): orienta a resumir toda a conversa, com seções enumeradas e exemplos, enfatizando precisão e inclusão de snippets quando relevante.
 - `PARTIAL_COMPACT_PROMPT` (parcial – RECENT): pede sumário apenas da parte recente após o contexto retido; útil quando uma janela inicial é mantida intacta e apenas o “sufixo” precisa ser compactado.
 - `PARTIAL_COMPACT_UP_TO_PROMPT` (parcial – UP_TO): sumário da porção “até aqui”, sabendo que mensagens novas virão depois; estrutura inclui “Context for Continuing Work”. Otimiza cache “up_to”.
 - `getCompactPrompt(...) / getPartialCompactPrompt(...)`: funções que montam o conteúdo final (system + user) preenchendo variáveis (ex.: instruções compactas adicionais, diretrizes específicas do produto) e retornam os blocos usados por `queryModelWithStreaming` no branch de compactação.
 - `getCompactUserSummaryMessage(...)`: gera a mensagem tipo “assistant/system boundary + resumo” a ser inserida no histórico pós‑compact.

 Racional de design
 - Estrutura explícita das seções do sumário assegura alta recuperabilidade: o modelo “aprende” como emitir conteúdo que servirá de contexto estável e navegável (arquivos, erros, decisões).
 - Variantes partial vs up_to evitam desperdiçar cache ou duplicar trabalho: reduz tokens e melhora reuso de prefixos no prompt cache do provedor.

 Exemplos práticos de uso
 1) Compact completo (histórico muito longo sem janela retida)
 - Entrada: [User: “Explique X”] … [Assistant: respostas + tool_use/result] … centenas de mensagens.
 - Ação: `getCompactPrompt` gera instruções completas; `queryModelWithStreaming` pede o sumário consolidando tópicos, arquivos citados e correções.
 - Saída pós‑compact: `createCompactBoundaryMessage(…); getCompactUserSummaryMessage(…); anexos (refs de arquivo, deltas MCP/skills)` e segue o turno com o histórico reduzido.

 2) Parcial RECENT (somente o trecho “mais novo” é resumido)
 - Cenário: uma janela inicial (com onboarding/decisões) deve ser mantida intacta; apenas os últimos N blocos cresceram demais.
 - Ação: `getPartialCompactPrompt` instrui a focar “recent messages only”; o resultado é inserido antes do trecho recente mantido.
 - Benefício: evita re‑sumarizar a janela estável — menor custo e melhor fidelidade.

 3) Parcial UP_TO (cache‑friendly)
 - Cenário: vamos colocar um sumário no topo e manter o restante inteiro depois (que o modelo não vê). Esse padrão maximiza o reaproveitamento em cache (“prefixo fixo”).
 - Ação: `PARTIAL_COMPACT_UP_TO_PROMPT` guia a escrever um sumário auto‑suficiente com seção “Context for Continuing Work”.

 postCompactMessages — pipeline
 - Origem: `compact.ts` e `query.ts` (via `buildPostCompactMessages(compactionResult)`)
 - Passos:
   1) Emite `SystemCompactBoundaryMessage` com metadados de tokens (pre/post/truePost, ids de tool sumariados)
   2) Emite o sumário “assistant/system” resultante da compactação
   3) Reidrata anexos essenciais em ordem: arquivos de referência recentes (cap por arquivo e por total), deltas MCP, deltas de ferramentas diferidas, listagem de agentes/skills (com truncamento por budget)
   4) Sinaliza post‑compact a estados internos: `markPostCompaction()`, `runPostCompactCleanup(querySource)`

 Exemplo simplificado de pós‑compact (antes → depois)
 - Antes: [50 mensagens com várias tool_use/tool_result intercaladas; PDFs, grandes diffs]
 - Depois:
   - [SystemCompactBoundary: {pre=120k, post=18k, truePost=17k, deleted_tool_ids=[…]}]
   - [Assistant/System Summary: seções 1..9 com arquivos citados e erros corrigidos]
   - [Attachments]:
     - compact_file_reference: src/foo.ts (displayPath rel)
     - mcp_instructions_delta: “added server X”, “removed server Y”
     - deferred_tools_delta: “Tool Z discovered; enabled later”
   - [segue REPL com contexto limpo]

 Notas
 - O uso de `uniqBy` e heurísticas de reordenação garantem que anexos não dupliquem conteúdo ou invertam dependências (arquivos antes de deltas que os referenciam).
 - Erros de prompt‑too‑long no próprio summarizer são tratados com `getPromptTooLongTokenGap()` para degradar/reparticionar (ex.: dividir em partial up_to).

