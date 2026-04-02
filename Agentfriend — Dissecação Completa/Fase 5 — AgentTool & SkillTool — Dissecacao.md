 # AgentTool & SkillTool — Agentes e Skills

 AgentTool (loadAgentsDir)
 - Carrega definições de agentes (nome, tipo, cor, capacidades) a partir de diretórios `agents/` e settings.
 - Preenche `agentNameRegistry` (AppState) para roteamento por nome e UX (logo/nome em UI).
 - Suporte a aliases e resolução dinâmica, com validação de schemas.

 SkillTool
 - Executa um “comando” (skill) que pode vir de plugins/MCP/bundled — resolve comando, argumentos e contexto de execução.
 - Fork de subagente: `executeForkedSkill` cria `agentId` novo, prepara contexto (mensagens, effort), e executa em cadeia separada com budget.
 - Telemetria rica: `tengu_skill_tool_invocation` com nome da skill, origem (bundled/oficial/terceiro), marketplace, profundidade de query e se foi descoberta.
 - Integração com descoberta: quando `EXPERIMENTAL_SKILL_SEARCH` habilitado, coleta `was_discovered` e integra com prefetch.
 - Permissões: passa por pipeline normal; skills podem encadear outras ferramentas de forma isolada.

 Padrões
 - Sanitizar nome exposto (ex.: `custom` quando não for oficial/bundled) para preservar privacidade nos eventos.
 - Preparar `renderedSystemPrompt` no contexto do fork para compartilhar cache de prompt com o pai.
 - Tratar `onProgress` para exibir passos internos das skills complexas.

