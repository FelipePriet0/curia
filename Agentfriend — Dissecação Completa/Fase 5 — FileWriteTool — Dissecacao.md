# FileWriteTool — Escrever Arquivos com Read-Before-Write e Diff

Objetivo: documentar criação/overwrite de arquivos com validação rigorosa, política de escrita e integração com diagnóstico/LSP.

Componentes
- Implementação: `tools/FileWriteTool/FileWriteTool.ts`, UI/prompt/helpers.
- Integrações: LSP (didChange/didSave), VSCode (diff), skills (descoberta/ativação condicional), analytics/diff, fileHistory.

Input/Output
- Input: `{ file_path: abs, content }`.
- Output: `{ type: 'create'|'update', filePath, content, structuredPatch[], originalFile|null, gitDiff? }`.

Permissões/FS
- `checkWritePermissionForTool` (FS policy) e deny por diretórios; bloqueia team-mem secrets.
- UNC: validação ignora syscalls em UNC para evitar NTLM leaks; segue política para decisão.

Validações
- Read-before-write: exige leitura prévia e verifica mtime; se alterado, recusa (FILE_UNEXPECTEDLY_MODIFIED_ERROR path) para evitar perda de dados.
- Quando arquivo existe: faz leitura sincrônica segura e compara conteúdo (fallback em Windows para falsos positivos de timestamp).

Execução
- Prepara diretório (mkdir) fora da seção crítica; fileHistory backup se habilitado; leitura + checagem atômica; write com preservação de encoding e LF consistente.
- Notifica LSP (change/save) e VSCode (diff); atualiza readFileState com novo mtime.
- Analytics: logs de operação e contagem de linhas alteradas; opcional gitDiff (feature‑flag).

UX
- Mensagens “File created/updated”; patch estruturado para revisão; integração com highlights.

Boas práticas
- Sempre exigir leitura prévia; evitar syscalls em UNC; manter políticas de deny/ask claras.
- Para novos arquivos, contar todas as linhas como adições e registrar diffs coerentes.

