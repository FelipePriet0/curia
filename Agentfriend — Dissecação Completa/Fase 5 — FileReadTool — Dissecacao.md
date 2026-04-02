 # FileReadTool — Limites, Anexos e Segurança

 Objetivo: ler arquivos com orçamento de tokens controlado e produzir anexos úteis ao transcript e ao modelo.

 Destaques
 - Limites: `getDefaultFileReadingLimits`, `MAX_LINES_TO_READ`, checks de tamanho (`isFileWithinReadSizeLimit`) e orçamento de tokens (FileReadTokenExceededError).
 - Leitura parcial: `readFileInRange` com truncation por bytes/linhas para garantir que as primeiras partes (frontmatter/início) sejam incluídas.
 - Anexos: `generateFileAttachment` e caminhos relativos estáveis (displayPath) para UX consistente.
 - Integração com memória/compactação: anexos de arquivo reaparecem pós‑compact dentro de budgets.
 - Permissões: passa por pipeline de `hasPermissionsToUseTool`, com `getActivityDescription` amigável (e.g., “Reading src/foo.ts”).

 Boas práticas
 - Cap por bytes + linhas; priorizar cabeçalhos e contexto inicial.
 - Emitir `truncated` quando ocorrer, para UX/confiança.
 - Respeitar caches de estado de arquivo (fileStateCache) para reduzir custo.

