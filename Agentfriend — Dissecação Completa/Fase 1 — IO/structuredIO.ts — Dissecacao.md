 # `cli/structuredIO.ts` — IO Estruturado do SDK (Dissecado)
 
 Objetivo: transformar stdio (linhas NDJSON) em um canal ordenado, previsível e seguro para o ciclo do agente, com permissões de ferramentas, cancelamento e deduplicação resolvidos na camada de transporte lógico.
 
 Componentes principais
 - `structuredInput`: generator assíncrono que emite `StdinMessage | SDKMessage` já parseados e validados.
 - `outbound: Stream<StdoutMessage>`: fila única para escrita, garantindo que `control_request` não ultrapasse `stream_event` enfileirado.
 - `pendingRequests`: mapa `request_id → {resolve,reject,schema,request}` para correlacionar responses.
 - `resolvedToolUseIds`: Set com janela deslizante para ignorar respostas duplicadas de `can_use_tool` e evitar 400s “tool_use ids must be unique”. Limite: 1000.
 - Callbacks: `onControlRequestSent`, `onControlRequestResolved`, `unexpectedResponseCallback` para bridges/hosts externos.
 
 Leitura — `read()` (núcleo do parser)
 - Mantém `content` buffer e `prependedLines` (mensagens de usuário injetadas como seed/replay).
 - Loop produz linhas de três fontes: prepended, frações de `content` acumulado, ou aguardando novas do `input` (um AsyncIterable de strings).
 - Para cada linha JSON:
   - Normaliza chaves (`normalizeControlMessageKeys`) — compat de versões.
   - Se `type === 'control_response'`: 
     - Ignora se `request_id` desconhecido (chama `unexpectedResponseCallback` se definido).
     - Marca `trackResolvedToolUseId` quando subtype é `can_use_tool` e notifica `onControlRequestResolved`.
     - Aplica validação de schema se fornecido; em erro, rejeita a promise.
     - Quando `replayUserMessages` é true, repassa a mensagem para upstream; caso contrário, filtra (não vaza para o loop do agente).
   - Para `type` em `{user, control_request, assistant, system}`: retorna a mensagem validada; demais tipos logam “unknown type” e são ignorados.
   - Erros de parse: logam e encerram processo com código 1 (defensivo, evita estado inconsistente).
 
 Escrita — `write(message)`
 - Serializa `message` como NDJSON e escreve em stdout (`writeToStdout`). Sem await — IO síncrona rápida.
 
 Solicitações — `sendRequest(request, schema, signal?, requestId?)`
 - Enfileira `control_request` em `outbound` e cria uma promise ligada a `pendingRequests`.
 - Suporta cancelamento cooperativo: se `signal` aborta, envia `control_cancel_request` e rejeita imediatamente (com `AbortError`).
 - Ao resolver, valida o payload com `schema.parse(result)` quando fornecido; caso contrário, resolve `{}`.
 - Segurança contra duplicatas: `trackResolvedToolUseId()` é chamado no caminho de resolução/cancelamento de `can_use_tool`.
 
 Permissões — `createCanUseTool(onPermissionPrompt?)`
 - Fluxo híbrido entre hooks locais e prompt do host SDK (VS Code, etc.).
 - Calcula `mainPermissionResult` com `hasPermissionsToUseTool()`; se for allow/deny, retorna imediatamente.
 - Caso exija confirmação, dispara em paralelo:
   - `hookPromise`: execução de PermissionRequest hooks via `executePermissionRequestHooksForSDK` (pode decidir allow/deny, atualizar input e persistir “always allow”).
   - `sdkPromise`: `sendRequest` subtype `can_use_tool` para o host mostrar diálogo. Antes, emite `onPermissionPrompt(details)` com um `requestId` estável para correlacionar no host.
 - Corrida: `Promise.race`. 
   - Se hook vencer com decisão → aborta `sdkPromise` (suprime `AbortError`) e retorna decisão.
   - Se hook não decidir → aguarda `sdkPromise` e converte com `permissionPromptToolResultToPermissionDecision()`.
   - Se o SDK vencer primeiro → aplica sua decisão; hook continua mas será ignorado.
 - Persistência: quando hook aplica “always allow”, `persistPermissionUpdates()` e `applyPermissionUpdates()` atualizam contexto de permissões via `setAppState` no `toolUseContext`.
 
 Sandbox network — `createSandboxNetworkPermissionChecker`
 - Encapsula uma solicitação de permissão de rede como uma ferramenta sintética `SandboxNetworkAccess` via o mesmo protocolo `can_use_tool` — assim hosts apresentam um diálogo coerente.
 
 MCP — `sendMcpMessage(serverName, message)`
 - Usa `sendRequest` com schema `{ mcp_response: any }` e retorna `mcp_response` — encapsula JSON-RPC sobre o mesmo canal controlado.
 
 Diagramas
 
 Sequência — `can_use_tool` (hook vs host)
 ```mermaid
 sequenceDiagram
   participant Agent as Agent (App)
   participant SIO as StructuredIO
   participant Hooks as Permission Hooks
   participant Host as SDK Host (VS Code)
   Agent->>SIO: createCanUseTool(...)
   SIO->>Hooks: executePermissionRequestHooksForSDK(...)
   SIO->>Host: control_request(can_use_tool, request_id)
   alt Hook decide antes
     Hooks-->>SIO: Decision(allow/deny)
     SIO-->>Host: control_cancel_request
     SIO-->>Agent: Decision
   else Host decide antes
     Host-->>SIO: control_response(request_id)
     SIO-->>Agent: Decision
   end
 ```
 
 Invariantes e porquês
 - Ordem de saída: `outbound` evita que `control_request` ultrapasse diffs de stream pendentes.
 - Deduplicação: um `tool_use_id` só pode ser resolvido uma vez — Set com limitação evita crescimento infinito.
 - Tolerância a respostas órfãs: `unexpectedResponseCallback` é o dreno controlado para integrações que reentregam tarde.
 - Cancelamento efetivo: ao abortar, envia cancel e rejeita imediatamente o consumidor, não aguardando ack do host (UX responsiva).
 
 Q&A interno
 - Q: Por que não repassar `control_response` ao loop por padrão?
   A: É semântica de transporte; o app consome a resolução como promise. Para replay, há o modo `replayUserMessages`.
 - Q: Por que uma Stream única para outbound?
   A: Garante ordenação e elimina condições de corrida entre diferentes tipos de mensagens.
 - Q: Onde está o backpressure real?
   A: No transporte (e.g., HybridTransport com SerialBatchEventUploader). Aqui prioriza semântica e correlação.
 
