 # MCP — Conexões, Transports e Escopos

 Objetivo: mapear como o sistema gerencia conexões MCP (Model Context Protocol) para expor ferramentas/recursos externos de forma segura e configurável.

 Componentes
 - `MCPConnectionManager.tsx`: gerencia ciclo de vida, reconexões, UI e permissões de canal.
 - `client.ts`: cliente MCP com normalização, erros e utilitários.
 - `types.ts`: schemas zod (config, transports, scopes), tipos `ConnectedMCPServer` e `FailedMCPServer`.
 - `config.ts`: construção de configs a partir de múltiplos escopos (local/user/project/dynamic/enterprise/managed/claudeai) + expansão de env e OAuth/XAA.
 - Transports suportados: stdio, http, ws, sse, sse-ide, ws-ide, sdk, claudeai-proxy.

 Fluxo
 - Carregar configs (scoped) → filtrar/gatear (channel permissions) → conectar cada servidor → registrar tools/recursos/capabilities.
 - Em execuções de ferramenta, MCP Tool consulta `MCPConnectionManager` pelos clients conectados/recursos e despacha.
 - UI: notifica conectividade, erros e solicitações de eliciação (`elicitationHandler.ts`).

 Padrões
 - Validar config com zod antes de conectar; props opcionais (headers, headersHelper, oauth/xaa) e invariantes fortes (https:// exigido em auth metadata URLs).
 - Segregar escopos (ConfigScope) e registrar pluginSource para políticas.
 - Expor permissões por canal (ex.: Telegram/Slack) via `channelPermissions.ts` e respeitar sandbox/políticas.

