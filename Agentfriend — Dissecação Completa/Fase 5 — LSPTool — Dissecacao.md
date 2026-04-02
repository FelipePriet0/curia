# LSPTool — Navegação de Código via LSP

Objetivo: expor operações do Protocolo de Servidor de Linguagem (LSP) para navegação e compreensão de código com validação de entrada, conexão gerenciada e formatação amigável para transcript.

Componentes
- `LSPTool.ts`: implementação da tool (schema, validate, call, mapping, UX), integração com `services/lsp/manager`.
- `schemas.ts`: discriminated union para operações (`goToDefinition`, `findReferences`, `hover`, `documentSymbol`, `workspaceSymbol`, `goToImplementation`, `prepareCallHierarchy`, `incomingCalls`, `outgoingCalls`).
- `formatters.ts`: formatações específicas por operação (links, trechos, contagens, cabeçalhos).
- `UI.tsx`: mensagens de uso/erro/resultado; `userFacingName`, summaries e extract de texto.
- `prompt.ts`: descrição concisa para orientação do modelo.

Input/Output
- Input (tool‑compat): objeto estrito com `operation`, `filePath`, `line`, `character` (1‑based, como editores). Validação detalhada acontece contra a union em `validateInput` para erros melhores.
- Output: `operation`, `result` (string formatada), `filePath`, `resultCount?`, `fileCount?`, metadados por operação.
- Limite de arquivo: `MAX_LSP_FILE_SIZE_BYTES = 10MB` para operações que precisem ler o arquivo.

Fluxo e Conexão
- Verifica status inicial de LSP (`getInitializationStatus`, `isLspConnected`) e aguarda `waitForInitialization` se necessário.
- Usa `getLspServerManager` para despachar operações conforme linguagem e raiz (`getCwd`/`expandPath`).
- Garante caminhos absolutos/relativos corretos (`pathToFileURL`, `expandPath`).

Permissões e Validação
- `validateInput`: checa existência do arquivo, tamanho e coerção de número de linha/coluna; mensagens amigáveis em ENOENT com sugestão.
- `checkPermissions`: `checkReadPermissionForTool` aplicado ao arquivo alvo (read‑only; segura para concorrência).

Execução e Formatação
- Por operação, chama servidor LSP e formata com helpers:
  - Definição/Implementação: links/locations agregados; dedup (`uniq`).
  - Referências: lista por arquivo com contagem; cabeçalho com totals.
  - Hover: trechos de tipo/doc resumidos.
  - Symbols: `documentSymbol` e `workspaceSymbol` com agrupamento e limites.
  - Call Hierarchy: `prepare` → `incoming`/`outgoing` com arvorezinha formatada.
- Saída mapeada via `mapToolResultToToolResultBlockParam` para transcript claro e compacto.

UX e Concurrency
- `isConcurrencySafe: true` e `isReadOnly: true` — executa em paralelo no executor de streaming.
- `getToolUseSummary`/`getActivityDescription`: mensagens breves do alvo (arquivo:linha/coluna) para boa leitura no fluxo.

Padrões
- Normalizar caminhos e respeitar `CWD`; preferir relativos na renderização quando possível para reduzir tokens.
- Surfacer contagens e arquivos distintos para orientar follow‑ups (ex.: abrir `FileRead` nas localizações relevantes).
- Em timeouts/erros do servidor LSP, apresentar fallback claro e não confundir com “sem resultados”.

