# GrepTool e GlobTool — Busca Segura no FS

Objetivo: documentar as ferramentas de busca de conteúdo e de nomes de arquivos, ambas read‑only e concorrentes, com validações de caminho e limites de resultado para evitar inchaço de contexto.

GrepTool (ripgrep)
- Input: `pattern`, `path?`, `glob?`, `type?`, `output_mode?` (`content|files_with_matches|count`), contexto `-A/-B/-C|context`, `-n`, `-i`, `head_limit`, `offset`, `multiline`.
- Segurança/Validações:
  - `validateInput`: valida `path` quando fornecido; ignora UNC (`\\`/`//`) para evitar vazamento NTLM (sem syscalls).
  - `checkPermissions`: `checkReadPermissionForTool` com contextos e ignore patterns (integração política FS).
  - Exclusões: ignora diretórios de VCS (`.git`, `.hg`, etc.) e plugins órfãos; aplica ignore patterns do AppState (via `getFileReadIgnorePatterns`).
- Execução:
  - Construção de args de `ripgrep` com caps de colunas, multiline opcional, filtros `--type`, `--glob` (brace/virgula split), `--hidden` e exclusões.
  - `head_limit` padrão 250 (paginável via `offset`); aplica limite antes de relativizar caminhos para economizar tokens.
  - Modos:
    - `content`: linhas com contexto e números; relativiza prefixos absolutos.
    - `files_with_matches`: lista de arquivos + contagem; usa `filenames.join` em UI.
    - `count`: agrega por arquivo e soma total de ocorrências.
- Concurrency/Read‑only: `isConcurrencySafe: true` e `isReadOnly: true` — roda em paralelo no executor de streaming.
- UX: `getToolUseSummary` para descrição amigável, `extractSearchText` para transcript, mapeamento de `appliedLimit/Offset` para notas de paginação.

GlobTool (listagem por padrão)
- Input: `pattern`, `path?` (omitido para usar CWD; valida diretório quando fornecido, ignora UNC).
- Segurança/Validações:
  - `validateInput`: checa existência e diretório; sugere caminho similar sob CWD (mensagem amigável).
  - `checkPermissions`: `checkReadPermissionForTool` com contexto FS.
- Execução:
  - `glob()` com `limit` de resultados (default 100, configurável por `globLimits`), suporte a cancelamento; relativiza caminhos sob CWD.
  - Output: `filenames[]`, `numFiles`, `durationMs`, `truncated` (nota em UI quando truncado).
- Concurrency/Read‑only: `isConcurrencySafe: true` e `isReadOnly: true`.
- UX: reaproveita o UI do Grep para exibir somente `filenames.join` e chrome simples ("No files found", aviso de truncation).

Padrões
- Evitar caminhos UNC em validações para mitigar NTLM; operações reais de leitura são feitas por ripgrep/glob conforme sandbox/políticas.
- Sempre relativizar paths na saída para reduzir custo de tokens e manter estabilidade entre compacts.
- Fornecer paginação explícita em buscas largas com `head_limit` e `offset` para sessões interativas.

