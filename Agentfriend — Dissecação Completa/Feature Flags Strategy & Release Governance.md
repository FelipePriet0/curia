# Feature Flags Strategy & Release Governance

Estratégia
- Flags por domínio (permissões, transportes, shells, MCP, modos especiais). Default off em prod.
- Canários graduais; killswitch para bypass/shell/mcp.

Governança
- Tabela de ownership por flag; critérios de ativação; métricas de sucesso/falha.

Política de Versões
- MVP seguro = conjunto mínimo de flags; documentar combinações suportadas e riscos.

