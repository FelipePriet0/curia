# ToolSearchTool & TodoWriteTool — Descoberta e Registros

Objetivo: documentar a ferramenta de descoberta de ferramentas e a de escrita de TODOs para organização rápida.

ToolSearchTool
- Uso: localizar ferramentas disponíveis por nome/descrição/categoria; read‑only; ajuda a guiar o modelo para o tool correto.
- Input: termo de busca; Output: lista de ferramentas com nomes e descrições; UI com colapsos/realce.
- Padrões: incentivar uso antes de criar comandos ad‑hoc; integra com auto‑classifier.

TodoWriteTool
- Uso: criar entradas de TODO/nota estruturada; grava em local padrão ou definido, seguindo políticas de escrita.
- Permissões: `checkWritePermissionForTool` (FS) e regras; mensagens “ask” claras.
- Padrões: preferir formato leve (markdown) e caminhos visíveis; anexar contexto mínimo (referência a arquivos/commits quando relevante).

