# Playbook Web — Pesquisa (Search) e Coleta (Fetch)

Objetivo: consolidar padrões para usar WebSearchTool e WebFetchTool com segurança, eficiência e boa UX.

Padrões de Uso
- Primeiro Search, depois Fetch: use WebSearchTool para gerar candidatos (links + commentary) e só então WebFetchTool para extrair/resumir conteúdo.
- Domínios: filtre no Search com `allowed_domains/blocked_domains` e, no Fetch, use regras por domínio (`domain:<host>`) e preapproved.
- Redirects: não siga 30x automáticos para outros hosts; peça confirmação com mensagem clara e a URL resolvida.

Permissões
- Preapproved: lista de hosts `isPreapprovedHost` (ou `isPreapprovedUrl`) concede allow imediato no Fetch.
- Regras: `getRuleByContentsForTool` com `ruleContent = domain:<hostname>` para allow/ask/deny no Fetch; mensagens "ask" devem sugerir o allow correspondente.

Execução/Streaming
- Search em streaming: agregue blocos `server_tool_use` → `web_search_tool_result` → `text/citations`, preservando a ordem e intercalando comentários do modelo.
- Fetch com prompt: `applyPromptToMarkdown(prompt, content, signal, isNonInteractive, isPreapproved)`; para markdown curto + preapproved, pode retornar conteúdo bruto.
- Binários: salvar em disco com extensão por MIME e anexar nota “saved to …” no resultado.

UX e Limites
- Limitar buscas por chamada (`max_uses: 8`) e orientar refinamento de query quando excedido.
- Paginar ou resumir resultados extensos; manter links limpos e legíveis.
- Mensagens de progresso explícitas (search steps; fetch/processing times) e erros detalhados (invalid_url, network, redirect).

Checklist Rápido
- Query definida? Domínios filtrados? Preapproved em uso quando fizer sentido?
- Regras de domínio configuradas (allow/ask/deny)? Mensagens "ask" com sugestões?
- Redirects tratados? Binários persistidos e anotados?
- Saída: resultados intercalados (Search) e resumo coerente (Fetch)?

