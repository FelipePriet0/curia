# WebSearchTool — Pesquisa com Bloqueios de Domínio e Streaming

Objetivo: entender como a ferramenta de busca web usa a capacidade nativa do provedor (Anthropic beta web_search) e agrega resultados/explicações em streaming, com allow/deny por domínio.

Componentes e Fluxo
- Implementação: `tools/WebSearchTool/WebSearchTool.ts`.
- Input: `{ query: string, allowed_domains?: string[], blocked_domains?: string[] }`.
- API: constrói `BetaWebSearchTool20250305` (name `web_search`) com `max_uses: 8` e filtros allow/deny.
- Execução: usa `queryModelWithStreaming` + `getWebSearchPrompt()` e `asSystemPrompt()` para instruir o modelo; o resultado chega como sequência de `BetaContentBlock`.
- Agregação de streaming: percorre blocos `server_tool_use`, `web_search_tool_result`, `text` e citações; intercala comentários de texto com arrays de hits `{ title, url }` por `tool_use_id`.
- Output: `{ query, results: (SearchResult|string)[], durationSeconds }`, onde `SearchResult = { tool_use_id, content: [{ title, url }] }`.

Permissões e Segurança
- Domínios permitidos/negados no input influenciam o próprio uso do web_search (não faz fetch direto, apenas retorna links/contexto).
- É read‑only e concurrency‑safe; não baixa conteúdos — isso é papel do WebFetch.

UX
- `UI.tsx` formata lista de hits e comentários; `renderToolUseProgressMessage` sinaliza progresso nas etapas de busca.
- `getToolUseSummary` produz mensagens compactas para transcript.

Pontos de Atenção
- `max_uses: 8` limita buscas por chamada; preferir refinar a query se estourar.
- `results` mescla texto e listas de hits — o consumidor deve tratar os dois tipos (útil para prompt‑engineering da etapa seguinte).

