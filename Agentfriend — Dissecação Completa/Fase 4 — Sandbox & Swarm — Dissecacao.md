 # Sandbox & Swarm — Permissões de Rede e Sincronização Líder/Trabalhador

 Objetivo: mapear como pedidos de permissão de rede são levantados em ambientes com sandbox e como, em equipes (swarm), trabalhadores solicitam decisões ao líder.

 Sandbox de rede
 - StructuredIO `createSandboxNetworkPermissionChecker`: encapsula pedido como `can_use_tool` para a tool sintética `SandboxNetworkAccess` (nome estável para UI/hosts), usando o mesmo fluxo de permissão.
 - Em REPL, componentes exibem `SandboxPermissionRequest` quando necessário; líder decide e a decisão é propagada.

 Swarm sync
 - Worker path: ao precisar de permissão, registra callback (`registerPermissionCallback`) e envia pedido via mailbox/IPC (utils/swarm/permissionSync.ts).
 - Hook `useSwarmPermissionPoller`: 
   - Poll a cada 500ms por respostas do líder (via `pollForResponse`/`removeWorkerResponse`).
   - Valida updates com `permissionUpdateSchema()` antes de acionar `onAllow`.
   - Gerencia registro/remoção de callbacks para evitar vazamentos.
 - Leader bridge: `leaderPermissionBridge.ts` registra filas (confirm/setContext), orquestra UI do líder e publica a decisão de volta.
 - Component UI: `components/permissions/PermissionRequest.tsx` renderiza diálogo com contexto (descrição da tool, input, identidade do worker/teammate) e botões de aprovar/negar, além de opções “always allow/deny”.

 Diagrama
 ```mermaid
 sequenceDiagram
   participant W as Worker
   participant L as Leader
   participant UI as PermissionRequest UI
   W->>W: registerPermissionCallback(requestId)
   W->>L: mailbox: permission_request(requestId, toolUseId, input)
   L->>UI: render dialog (tool desc, input)
   UI-->>L: approve/reject (+updates)
   L->>W: mailbox: permission_response(requestId, decision)
   W->>W: pollForResponse -> invoke pendingCallbacks
   W-->>Tool: continue/abort
 ```

 Notas
 - Callbacks limpos em `/clear` via `clearAllPendingCallbacks()`.
 - Atualizações de permissão (always allow/deny) fluem do líder para o worker com validação de schema.

