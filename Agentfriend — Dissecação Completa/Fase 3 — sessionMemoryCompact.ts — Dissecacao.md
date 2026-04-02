 # `sessionMemoryCompact.ts` — Compactação de Memória da Sessão

 Objetivo: reduzir o custo de memórias persistidas (CLAUDE.md, instruções, arquivos lembrados) mantendo utilidade e integridade sem “quebrar” pares e sem remover conteúdo indispensável do turno corrente.

 Componentes e config
 - Config dinâmica (GrowthBook): `getSessionMemoryCompactConfig()` lê `tengu_sm_compact_config` e mescla com defaults; chaves:
   - `minTokens`: mínimo para considerar compactar
   - `minTextBlockMessages`: apenas se houver pelo menos N mensagens com texto
   - `maxTokens`: teto para o alvo de pós‑compact
 - Controlos: `setSessionMemoryCompactConfig`, `resetSessionMemoryCompactConfig` para testes e hot‑reloads.

 Heurísticas centrais
 - `hasTextBlocks(message)`: true se a mensagem contém blocos de texto (assistant/user) — evita sumariar trechos sem valor textual (somente tool_result binário/imagens).
 - `getToolResultIds` + `hasToolUseWithIds`: se mensagens mantidas contêm `tool_result`, garantir que as `assistant` anteriores com tool_use correspondentes sejam incluídas (evita pares quebrados).
 - Ajuste de índices de corte: quando os kept‑ranges incluem thinking/tool_use divididos em múltiplas mensagens com o mesmo `message.id`, expandir o intervalo para manter os chunks coesos — `normalizeMessagesForAPI` depende disso para merge correto.

 Pipeline (alto nível)
 1) Inicializa config (GB) se necessário
 2) Se baixo volume de texto ou abaixo de `minTokens`, sai (no‑op)
 3) Seleciona janela a compactar (prefixo) respeitando pares tool_use/result e ids iguais
 4) Gera sumário (via compact prompts) para essa janela
 5) Insere boundaries e sumário; reaplica anexos de memória relevantes conforme budget

 Exemplo Antes/Depois
 - Antes: 30 mensagens, das quais:
   - 10 com tool_results pesados (arquivo longos, blobs)
   - 12 textos do usuário/assistant com decisões
   - 8 anotações de sistema
 - Config: minTokens=8k, maxTokens=20k, minTextBlockMessages=8
 - Ação: seleciona prefixo até ultrapassar `minTokens`, garante incluir os tool_use correspondentes e mensagens com mesmo `message.id`.
 - Sumário: emitido com seções (Primary Request, Files, Errors/Fixes…)
 - Depois:
   - [SystemCompactBoundary]
   - [Assistant Summary]
   - [Attachments] (memórias de sessão relevantes truncadas por bytes/linhas)

 Notas práticas
 - Se a janela “pós‑sumário” ainda estoura `maxTokens`, combine com `microcompact` para limpeza adicional antes da próxima chamada.
 - Quando o summarizer roda em partial “up_to”, não replique instruções que serão imediatamente seguidas pelo bloco retido; reduza redundância.

