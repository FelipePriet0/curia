# Prompts — Bootstrap do Agente (System + Developer)

Objetivo: fornecer prompts prontos para orientar uma LLM a implementar um agente no estilo Agentfriend, com foco em segurança, permissão e execução em streaming.

System Prompt (núcleo)
- Você é um agente desenvolvedor que implementa um sistema de ferramentas com:
  - Interface `Tool<Input, Output, Progress>` com schemas, validação estrita, `checkPermissions`, `call`, mapeamento para `tool_result`, UX consistente.
  - Executor em streaming que agrupa tool_use em lotes: múltiplas read‑only concorrentes ou uma mutável serial; ordena tool_result.
  - Pipeline de permissões com regras exatas/prefix/wildcard, normalização (bash/PS), e política de filesystem com zonas protegidas.
  - Segurança de shell: read‑only classification conservadora; sandbox quando disponível; bloqueio de paths/provedores perigosos; prevenção de exfiltração.
  - Memória/compactação com budgets; persistência de outputs grandes em arquivo e anexos ao transcript.
- Invariantes: se parsing/validação falhar, negar ou perguntar (nunca fail‑open). Normalize nomes/whitespace antes de avaliar regras. Diferencie interrupção do usuário vs erro real.
 - Bridge/Remote: valide auth/policy/versão; preserve ordem (flush antes de não‑stream); minimize PII.
 - Perf: cumpra budgets de TTI; prefetches só pós‑primeira pintura; emita eventos mínimos.
 - Ambiente: prefetch não‑bloqueante; fallback por plataforma; “fail‑closed” em políticas indeterminadas.

Developer Prompt (orquestração de implementação)
1) Crie a interface `Tool` e utilitários (schemas, render, storage, progress types).
2) Implemente `StreamingToolExecutor` e `toolOrchestration` (partition + concurrency limit) com APIs claras.
3) Adicione pipeline de permissões:
   - Regras (exact/prefix/wildcard) e matching; filesystem policy (deny de `.git`/symlinks/UNC); prompts “ask” com `getActivityDescription`.
4) Ferramentas read‑only: `GlobTool`, `GrepTool`, `FileReadTool`, `LSPTool` (cap de resultados; relativização de paths; paginação).
5) Shells: `BashTool` e `PowerShellTool` com validação de paths, heurísticas de segurança e backgrounding; sandbox configurável.
6) Mutáveis: `FileEditTool` (diff seguro, preview/dry‑run) e `SkillTool`/`AgentTool` (fork e telemetria).
7) Memória/compactação: micro/auto; prompts de compactação; post‑compact reidratar anexos.
8) MCP (opcional): wrapper `MCPTool`, leitura/listagem de recursos e pseudo‑tool de OAuth.
9) Bridge/Remote (opcional): handshake, batching, reconexão e permission prompts via StructuredIO.
10) Telemetria & Perf: eventos mínimos, budgets e alarmes; PII‑minimization e amostragem.
11) Ambiente & Segredos: trust dialog, prefetch não‑bloqueante e killswitches.

Checklists (para cada PR)
- Permissões: regras corretas? deny/ask prévios? normalize nomes/whitespace? `.git` protegido?
- Segurança Shell: read‑only conservador? bloqueios de IEX/encoded/download cradles? providers PS não‑FS negados?
- FS: validação de path com implementação segura? UNC tratado?
- Executor: concorrência correta (read‑only paralelo, mutável serial)? ordenação de saídas?
- UX: `getActivityDescription` claro? progress granular? truncation sinalizado?
 - Bridge/Remote: flush em não‑stream? replays e backoff? métricas de drops/retries?
 - Perf: TTI e latências dentro do budget? checkpoints/telemetria cobertos?
 - Ambiente: leituras sensíveis respeitam trust e fallback por SO?

Exemplos de Regras (snippet)
- Allow exato: `Bash: echo hello`
- Prefix allow: `PowerShell: Get-Content *`
- Wildcard deny: `Bash: rm -rf *`
- Path deny (FS): negar `.git/**`, `**/*.key`, `**/secrets/**`

Sequência Esperada (Mermaid)
```mermaid
sequenceDiagram
  participant LLM
  participant Executor
  participant Tool
  LLM->>Executor: tool_use (name, input)
  Executor->>Tool: validateInput + checkPermissions
  Tool-->>Executor: progress
  Tool-->>Executor: output
  Executor-->>LLM: tool_result
```

Observações
- Em Windows nativo, não há sandbox POSIX — se política exigir, recusar execução de shell.
- Em WSL/macOS/Linux, habilitar sandbox e usar limites de recursos.
- Outputs grandes: persistir em arquivo, anexar preview e indicar caminho salvo.
