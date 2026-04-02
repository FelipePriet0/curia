# WebFetchTool — Fetch Seguro com Preapproved, Regras e Resumos

Objetivo: mapear como a ferramenta busca conteúdo de páginas, aplica um prompt ao markdown extraído, respeita domínios preaprovados e integra com o pipeline de permissões.

Componentes
- Implementação: `tools/WebFetchTool/WebFetchTool.ts`.
- Utils: `utils.ts` (getURLMarkdownContent, applyPromptToMarkdown, MAX_MARKDOWN_LENGTH, isPreapprovedUrl), `preapproved.ts` (isPreapprovedHost).
- UI: `UI.tsx`, `prompt.ts` (DESCRIPTION, WEB_FETCH_TOOL_NAME).

Input/Output
- Input: `{ url: string, prompt: string }` com validação zod (`url()`), `shouldDefer: true` (pode rodar depois de outras ações).
- Output: `{ bytes, code, codeText, result, durationMs, url }`.
- Redirect handling: se 30x para outro host, retorna mensagem instruindo novo uso com a URL redirecionada (não segue automaticamente).

Permissões
- Preapproved: `isPreapprovedHost(host, pathname)` → allow imediato (reason: Preapproved host).
- Regras por conteúdo: `webFetchToolInputToPermissionRuleContent` → `domain:<hostname>`; consulta `getRuleByContentsForTool` para deny/ask/allow.
- Mensagens “ask”: claras e com `suggestions` (PermissionUpdate) para adicionar allow à localSettings.

Execução
- `getURLMarkdownContent(url)`: extrai markdown e metadados (bytes, code, contentType, persistedPath quando binário).
- Se URL preaprovada e `contentType` markdown curto (< MAX_MARKDOWN_LENGTH): retorna conteúdo puro; senão aplica `applyPromptToMarkdown(prompt, content, signal, isNonInteractiveSession, isPreapproved)` para gerar resumo.
- Se houve persistência de binário: anexa linha “Binary content … saved to …”.

Propriedades
- Read‑only e concurrency‑safe.
- `toAutoClassifierInput`: `${url}: ${prompt}` para classificação.

Boas Práticas
- Use WebSearchTool para localizar URLs e WebFetchTool para obter conteúdo/sumário.
- Prefira adicionar allows por domínio (`domain:<host>`) em vez de URLs específicas para reduzir fricção.
- Não seguir redirects para outros hosts automaticamente — exigir confirmação protege contra pivôs maliciosos.

