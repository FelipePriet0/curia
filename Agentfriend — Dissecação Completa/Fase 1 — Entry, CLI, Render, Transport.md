# Fase 1 — Entry, CLI, Render, Transport

Objetivo: Entender como o binário inicia, como roteia caminhos rápidos, onde monta o CLI completo, como renderiza o TUI (Ink) e como envia/recebe mensagens (transports).

Sumário rápido
- Entry: `Agentfriend/entrypoints/cli.tsx`
- CLI bootstrap: `Agentfriend/main.tsx`
- Render (Ink + Theme): `Agentfriend/ink.ts`, `components/design-system/*`, `ink/*`
- Transports (STDIO remoto): `Agentfriend/cli/structuredIO.ts`, `cli/transports/*.ts`

Mapa de arquivos relevantes
- `entrypoints/cli.tsx`: roteador inicial com “fast‑paths”, gates de features e import dinâmico de `main.tsx`.
- `main.tsx`: registra perf, aplica pré‑fetches, configura Commander, inicializa config/telemetria/políticas, resolve modelo, monta TUI e inicia loop principal.
- `ink.ts`: thin wrapper de Ink que injeta `ThemeProvider` e exporta utilitários de UI.
- `cli/structuredIO.ts`: protocolo de IO estruturado (JSONL), controle de permissões de ferramentas, fila de saída.
- `cli/transports/WebSocketTransport.ts`: WebSocket full‑duplex com auto‑reconnect e buffers.
- `cli/transports/HybridTransport.ts`: WS para leitura + HTTP POST em lotes para escrita.
- `cli/transports/SSETransport.ts`: alternativa via Server‑Sent Events.

Fluxo — Entry e CLI (Mermaid)
```mermaid
flowchart TD
  A[Process start] --> B{Args}
  B -->|--version| V[print version and exit]
  B -->|--dump-system-prompt| DSP[render system prompt and exit]
  B -->|bridge/daemon/bg| FP[fast-path handler]
  B -->|--tmux --worktree| TMUX[execIntoTmuxWorktree]
  B -->|--bare| SIMPLE[set CLAUDE_CODE_SIMPLE]
  B --> C[startCapturingEarlyInput]
  C --> D[dynamic import main.tsx]
  D --> E[cliMain()]
```

Leitura detalhada — `entrypoints/cli.tsx`
- Core: detecta flags e desvia para caminhos rápidos sem carregar todo o CLI.
  - `--version`: imprime `MACRO.VERSION` e sai.
  - `--dump-system-prompt`: resolve modelo efetivo e imprime o system prompt.
  - `--claude-in-chrome-mcp`/`--chrome-native-host`/`--computer-use-mcp`: servidores MCP.
  - `--daemon-worker`, `daemon`: supervisor/worker de longa duração.
  - `remote-control|bridge|sync|rc`: Bridge Mode com checagens de auth, gate e policy.
  - BG sessions: `ps|logs|attach|kill` e flag `--bg` roteiam para `cli/bg.js`.
  - `environment-runner` e `self-hosted-runner`: modos headless.
  - `--tmux` com `--worktree`: tenta entrar em tmux antes de inicializar o CLI completo.
  - Flags de atualização erradas (`--update|--upgrade`) são redirecionadas para `update`.
- Caso geral: inicializa captura de input antecipado, perf checkpoints e importa `main.tsx`.
- Decisões importantes:
  - Uso pesado de import dinâmico para DCE e cold‑start rápido.
  - Feature gates via `feature('FLAG')` para builds diferentes.
  - Minimiza efeitos colaterais antes de decidir o caminho (perf + previsibilidade).

Leitura detalhada — `main.tsx` (bootstrap do CLI completo)
- Early side‑effects de performance: `profileCheckpoint`, `startMdmRawRead`, `startKeychainPrefetch`.
- Configurações/carregamentos paralelos: GrowthBook, políticas, remote managed settings, OAuth, modelos, plugins, LSP, etc.
- Commander: define comandos/subcomandos, opções e handlers (muitos em `Agentfriend/commands/*`).
- Renderização/TUI: usa `ink.ts` para criar root/render com tema; integra com estado global (`state/*`).
- Sessão: resolve `sessionId`, contexto do usuário, modelo inicial, permissões.
- Integrações: LSP, Mcp, plugins, analytics, “worktree” (tmux), teleporte remoto.
- Filosofia: reduzir latência percebida coordenando IO, perfis, e import dinâmico; isolamento de responsabilidades por serviço.

Render — `ink.ts`
- `withTheme(node)`: injeta `ThemeProvider` global.
- `render(node, options)`: delega para `ink/root.ts` garantindo tema.
- `createRoot(options)`: retorna root com `render` já decorado com tema.
- Exporta componentes de UI (Box/Text/Link/etc) e hooks (`useInput`, `useTerminalTitle`, etc.).
- Padrão: o app nunca precisa lembrar de montar `ThemeProvider` manualmente — menos boilerplate e tema consistente.

Structured IO e Protocolo — `cli/structuredIO.ts`
- Propósito: interface de alto nível para ler/escrever mensagens JSONL no STDIO com semântica do SDK (mensagens de usuário, eventos de stream, control_request/control_response, permissões de tools, hooks).
- Principais peças:
  - `StructuredIO.structuredInput`: async generator que emite `StdinMessage | SDKMessage` parseando linhas JSON e mensagens “prependidas”.
  - `outbound: Stream<StdoutMessage>`: fila ordenada onde control_requests não ultrapassam stream_events.
  - Deduplicação: rastreia tool_use_ids resolvidos para ignorar `control_response` duplicado e evitar mensagens duplicadas/400s.
  - Permissões: integra regras/hook/permission‑prompt‑tool e serializa “reason” quando aplicável.
  - `prependUserMessage`: injeta uma mensagem de usuário antes do próximo item lido (útil para replay/seed de conversas).
  - `flushInternalEvents`/`internalEventsPending`: sobrecarregado em `RemoteIO` para telemetria/flush.
- Resultado: um canal confiável e ordenado para a orquestração do agente, resistente a mensagens tardias e com política de permissões acoplada.

Transports — `WebSocketTransport`, `HybridTransport`, `SSETransport`
- `WebSocketTransport`:
  - Estados: `idle|connected|reconnecting|closing|closed` com auto‑reconnect exponencial e jitter.
  - Headers dinâmicos: inclui `X-Last-Request-Id` para replays/diagnóstico.
  - Health: ping/pong, keep‑alive periódico, cálculo de idle para diferenciar timeouts.
  - Buffer circular de mensagens para replay pós‑reconexão.
  - Suporta Bun e Node (ws) com API compatível.
- `HybridTransport`:
  - Leitura via WS; escrita via HTTP POST em lotes.
  - Bufferização de `stream_event` por ~100ms para reduzir POSTs; quaisquer writes não‑stream forçam flush para preservar a ordem.
  - Fila serial com `SerialBatchEventUploader`: backoff exponencial + jitter, `maxBatchSize`, `maxQueueSize`, telemetria para batches descartados.
  - Justificativa: reduzir colisões/“retry storms” no backend ao serializar writes; controlar pressão com backpressure (quando callers aguardam).
- `SSETransport` (quando usado): canal de leitura unidirecional com fallback quando WS não é viável.

Diagrama — Transportes (Mermaid)
```mermaid
flowchart LR
  subgraph Client
    IO[StructuredIO]\n(outbound Stream)
    WS[WebSocketTransport]
    HY[(HybridTransport)]
    UPL[SerialBatchEventUploader]
  end

  IO -->|onData| WS
  IO -->|write(stream_event)| HY
  HY -->|buffer 100ms| HY
  HY --> UPL -->|POST batch| API[(Ingress API)]
  WS <-->|frames| SVC[(Ingress WS)]
```

Q&A interno — como eles pensam?
- Por que tantos “fast‑paths” no entry?
  - Minimizar cold‑start: evitar importar centenas de módulos quando um comando simples resolve; melhora UX e custos.
- Por que import dinâmico e feature gates?
  - Permite DCE por build, reduz superfície e riscos; recursos só existem quando habilitados.
- Por que `startCapturingEarlyInput` antes do `main`?
  - Evitar perder input do usuário em startups lentas; captura stdin e injeta depois.
- Por que `HybridTransport` em vez de WS puro?
  - Escrita serializada via HTTP evita colisões em backends com consistência fraca e limita saturação com retry/backoff previsíveis.
- Como garantem ordem entre stream e control_request?
  - Fila de saída única (`outbound`) e flush de buffers antes de writes não‑stream.
- Como evitam mensagens duplicadas de tools?
  - Set de `tool_use_id` resolvidos com janela deslizante (`MAX_RESOLVED_TOOL_USE_IDS`).
- Onde UI encontra estado e lógica?
  - `state/*` gerencia AppState; render via Ink com ThemeProvider; comandos em `commands/*` acionam actions e atualizam estado.

Padrões e lições (destaques desta fase)
- Separação de responsabilidades por camada (entry vs main vs services).
- Start rápido: prefetch paralelo, import dinâmico, checkpoints de perf.
- Robustez de IO: StructuredIO com ordenação, deduplicação e permissões integradas.
- Transporte resiliente: reconexão, keep‑alive, buffers e caminhos híbridos.
- UX do terminal: TUI componível com tema centralizado e sem boilerplate.

Próximos passos sugeridos (Fase 1 → Fase 2)
- Mapear o “Main Loop” e o ciclo de mensagens: onde mensagens do usuário entram, onde o modelo é consultado e como ferramentas são invocadas.
- Entrar em `state/*`, `services/*` e `commands/*` críticos para o fluxo.

