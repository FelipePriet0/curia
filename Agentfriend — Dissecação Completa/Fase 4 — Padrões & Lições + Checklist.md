 # Fase 4 — Padrões & Lições + Checklist

 Padrões (o que copiar para seu agente)
 - Camadas de decisão: modo → regras → classifier (gated) → corrida hooks vs host (SDK). Retorne cedo em allow/deny; só "ask" entra na corrida.
 - Corrida não bloqueante: dispare hooks e SDK em paralelo; aborte o perdedor ao decidir; deduplique por `tool_use_id`.
 - Persistência segura: PermissionUpdates validadas por schema; aplicar + persistir e refletir no AppState (onChange externaliza modo).
 - Telemetria orientada a diagnóstico: eventos mínimos `tengu_permission_*` com contagens/tempos/classifier; sanitize de nome de tool.
 - Killswitch & política: sempre verifique killswitch ao entrar em bypass/auto; reverta com UX clara quando bloqueado.
 - Sandbox & rede: trate rede como tool sintética via SDK (`SandboxNetworkAccess`) — reaproveita pipeline e UI de permissão.
 - Swarm: líder decide; workers só solicitam; callbacks + polling com validação de schema evitam estados zumbis.
 - Segurança de paths/execução: validações específicas (bash/powershell, path rules) antes do classifier; classifier nunca é o único guardião.

 Lições
 - Evite loops: denial tracking limita negativas consecutivas/total e força prompting.
 - Sincronize para fora: externalize nomes internos de modos ao publicar metadata (CCR/SDK).
 - UX consistente: resumos de tool `getActivityDescription` e motivos tornam prompts mais confiáveis.

 Checklist de integração
 - Modos/resultados
   - [ ] Implementar `PermissionMode` e `toExternalPermissionMode`
   - [ ] Implementar `PermissionDecision`/Result com razões e `updatedInput`
 - Regras/updates
   - [ ] Parser de regras (nome/padrão/comportamento/source)
   - [ ] `PermissionUpdate` + persist/apply + loaders
 - Pipeline `hasPermissionsToUseTool`
   - [ ] Fast path por modo/regra/sandbox
   - [ ] Classifier (opcional) + denial tracking com limites
   - [ ] Corrida hooks vs SDK (AbortController) + deduplicação por `tool_use_id`
   - [ ] Persistência de updates + retorno final
 - StructuredIO/SDK
   - [ ] Rota `control_request: can_use_tool` + `onControlRequest{Sent,Resolved}`
   - [ ] NDJSON streams ordenados e buffer único outbound
 - Hooks
   - [ ] Execução concorrente e coleta de `permissionUpdates`
   - [ ] Aplicação otimista e rollback se necessário
 - Killswitch
   - [ ] Checks em bypass/auto + mensagens de reversão
 - Sandbox
   - [ ] Tool sintética `SandboxNetworkAccess` com o mesmo fluxo
 - Swarm
   - [ ] Mailbox/request/response + polling a cada 500ms
   - [ ] Registro/limpeza de callbacks; validação de schema das respostas
 - Telemetria
   - [ ] Eventos mínimos; campos úteis (durations, counts, reasons)
 - Testes
   - [ ] Regras conflitantes/sombreadas
   - [ ] Duplicatas de SDK; perda de resposta do líder
   - [ ] Denial spiral → fallback para prompting

