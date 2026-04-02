 # Playbook de Permissões & Segurança

 Objetivo
 - Reproduzir o pipeline de permissão com modos, regras, classifier, hooks e host/SDK, com sandbox e swarm.

 Padrão de decisão (pseudocódigo)
 ```ts
 async function hasPermissionsToUseTool(tool, input, ctx, assistantMsg, toolUseID): Promise<Decision> {
   const mode = ctx.getAppState().toolPermissionContext.mode
   const rules = loadRules(mode)
   const env = detectEnv(ctx)

   // 1) Fast decisions por modo/regra
   const ruleDecision = applyRules(rules, tool, input, env)
   if (ruleDecision in ['allow','deny']) return ruleDecision

   // 2) Classifier (gated) com denial tracking
   const clf = feature('TRANSCRIPT_CLASSIFIER') ? await classify(tool, input, ctx) : null
   if (clf?.deny && !shouldFallbackToPrompting(denialState)) return denyWithGuidance()

   // 3) Hooks vs Host race
   const requestId = uuid()
   const hookP = executePermissionRequestHooks(...)
   const sdkP = sendCanUseToolViaSDK({ tool_name: tool.name, input, tool_use_id: toolUseID, request_id: requestId })
   const winner = await Promise.race([hookP, sdkP])
   const decision = winner?.decision ?? convertSdkResultToDecision(await sdkP)

   // 4) Persist updates (always allow/deny/ask)
   if (decision.updatedPermissions) persistAndApply(decision.updatedPermissions)
   return decision
 }
 ```

 Modos recomendados
 - default: respeita regras, pergunta quando necessário
 - plan: permissivo para planejamento, com guard rails para execuções
 - auto: habilita classifier + interações não bloqueantes
 - bypassPermissions: apenas em ambientes isolados (killswitch ativo por padrão em produção)

 Regras e Updates
 - Esquema: `PermissionRule` (name, pattern, behavior, source)
 - Updates persistentes: `PermissionUpdate` (destination/source) → `persistPermissionUpdates()` → `applyPermissionUpdates()` → atualiza AppState

 Sandbox e Rede
 - Encapsular pedido de rede como tool `SandboxNetworkAccess` via SDK
 - Integrar UI para líder/worker em swarms, com polling periódico e callbacks registrados

 Telemetria
 - Eventos mínimos: `tengu_permission_{start,allow,deny,ask}`, classifier timings, denial counts, source display name
 - Sanitizar nomes (sanitizeToolNameForAnalytics)

 Segurança operacional
 - Killswitch: checar/forçar desativação de bypass/auto conforme política
 - Denial tracking: limitar loops do classifier e cair para prompting
 - Sanitização de input: redireções de saída/paths validados (bash/powershell)

 Testes de sanidade
 - Regras conflitantes/sombreadas: detectar e avisar
 - Swarm: perda de resposta do líder → timeout e cancel
 - SDK duplicate responses: deduplicação por `tool_use_id`

