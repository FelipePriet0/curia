# MCP Tools — Execução, Recursos e Autenticação

Objetivo: documentar as ferramentas de uso do MCP no nível de tool (não infraestrutura): `MCPTool`, `ReadMcpResourceTool`, `ListMcpResourcesTool` e `McpAuthTool`.

MCPTool
- Papel: wrapper genérico para executar uma tool exposta por um servidor MCP conectado.
- Estrutura: `isMcp: true`, `name` e `description` são sobrescritos em `mcpClient.ts` conforme a tool concreta; input `passthrough` (schemas definidos no servidor), output `string` (padrão), `isResultTruncated` usa heurística de linhas.
- Permissões: `behavior: 'passthrough'` — decisão acontece via channel/server policies no ConnectionManager e no client.
- UX: `renderToolUseMessage/Progress/Result` padronizados; mapeamento direto para `tool_result`.

ReadMcpResourceTool
- Papel: ler um recurso publicado por um servidor MCP (ex.: base de conhecimento, config remota, doc indexed).
- Execução: `ensureConnectedClient` e chamada a `client.readResource`; persistência opcional de binários (`persistBinaryContent`) com mensagem de “saved” amigável.
- Schema: valida com tipos do SDK (`ReadResourceResultSchema`), output formatado e truncation awareness (`isOutputLineTruncated`).
- UX: `userFacingName`, render amigável e separação de progresso.

ListMcpResourcesTool
- Papel: listar recursos disponíveis em um servidor MCP (por nome, tipo, URI).
- Execução: consulta clients conectados via ConnectionManager e formata a lista; filtros/agrupamentos simples.
- UX: UI com colunas e paginação quando necessário; integra com discovery do lado do modelo.

McpAuthTool
- Papel: pseudo‑tool gerada quando um servidor está instalado porém requer autenticação.
- Execução: `createMcpAuthTool(server, config)` constrói uma tool `mcp__<server>__authenticate`; ao chamar, dispara `performMCPOAuthFlow` (sem abrir navegador), retorna a URL de autorização para o usuário completar.
- Pós‑auth: ao concluir, reconecta (`reconnectMcpServerImpl`), substitui tools/commands prefixados `mcp__<server>__*` pelas reais no `appState` e remove a pseudo‑tool.
- Limites: apenas `http`/`sse` suportam OAuth pelo tool; `claudeai-proxy` e outros exibem mensagem para autenticação manual (`/mcp`).

Padrões
- Respeitar `channelPermissions` e escopos do servidor (enterprise/user/project) definidos no ConnectionManager.
- Sanitizar e paginar listagens; persistir binários fora do transcript e indicar caminho salvo.
- Sempre propagar erros de conexão/autorização com mensagens claras para o modelo orientar o usuário.

