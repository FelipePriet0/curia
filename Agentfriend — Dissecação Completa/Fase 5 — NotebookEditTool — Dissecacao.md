# NotebookEditTool — Edição Segura de .ipynb com Read-Before-Write

Objetivo: mapear como a ferramenta edita células de notebooks Jupyter (.ipynb) com validação rígida, política de permissões de escrita e prevenção de perda de dados.

Componentes
- Implementação: `tools/NotebookEditTool/NotebookEditTool.ts`.
- UI/Prompt: `UI.tsx` (mensagens de uso/erro/resultado), `prompt.ts` (descrição/guia), `constants.ts`.

Input/Output
- Input: `{ notebook_path: abs, cell_id?, new_source, cell_type?, edit_mode?=replace }`.
- Output: `{ new_source, cell_id?, cell_type, language, edit_mode, error?, notebook_path, original_file, updated_file }`.

Permissões
- `checkPermissions`: usa `checkWritePermissionForTool` com `toolPermissionContext` — respeita regras, zonas protegidas e políticas de escrita.

Validações Críticas
- Caminho: deve ser absoluto e com extensão `.ipynb`; ignora UNC (`\\`/`//`) na validação para evitar NTLM leaks.
- Modo: `replace|insert|delete`; se `insert`, `cell_type` obrigatório.
- Read-before-edit: exige que o arquivo tenha sido lido antes (estado `readFileState`) e que o mtime atual não seja posterior ao timestamp lido — evita editar em cima de conteúdo desatualizado.
- Notebook válido: valida JSON; verifica `cell_id` por ID ou índice (`cell-N`), com mensagens claras.

Execução
- Lê conteúdo com `readFileSyncWithMetadata` (encoding/line endings) e faz `jsonParse` não-memoizado (evita mutação compartilhada de cache).
- Resolve índice/alvo da célula; converte `replace→insert` quando índice for igual a `cells.length` (append amigável); gera `id` para versões >= 4.5 quando necessário.
- `delete`: remove célula; `insert`: cria célula code/markdown; `replace`: substitui `source` e, se code, zera `execution_count` e `outputs`.
- Escreve com `writeTextContent` preservando encoding/line endings; atualiza `readFileState` com novo mtime para dedupe correto no `FileReadTool` subsequente.
- Integra com `fileHistoryTrackEdit` para atribuição/histórico.

UX
- Mensagens compactas (path@cell), erros amigáveis e highlight de código no resultado.
- `shouldDefer: true`: permite postergar execução em orquestração.

Boas práticas
- Sempre exigir leitura prévia e checar mtime antes de editar.
- Manter mensagens de erro específicas (ID inexistente, JSON inválido, path incorreto).
- Resetar artefatos de execução ao alterar células de código.

