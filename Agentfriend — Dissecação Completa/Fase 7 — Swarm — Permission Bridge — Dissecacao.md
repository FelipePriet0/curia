# Swarm — Permission Sync & Leader Bridge

Objetivo: descrever como permissões são sincronizadas em cenários de swarm/distribuído.

Componentes
- `utils/swarm/permissionSync.ts`: sincroniza permissões entre nós/threads.
- `utils/swarm/leaderPermissionBridge.ts`: ponte entre líder/coordenador e workers para decisões de permissão.

Padrões
- Delegar decisão ao líder quando requerido; manter cache consistente; evitar latência excessiva com regras estáveis.
- Logs suficientes para auditoria sem expor dados sensíveis.

