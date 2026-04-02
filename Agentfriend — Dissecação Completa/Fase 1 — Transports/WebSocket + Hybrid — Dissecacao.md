 # Transports — WebSocketTransport + HybridTransport (Dissecado)
 
 Objetivo: garantir comunicação robusta com o “ingress” remoto (ou host) sob redes instáveis, proxies com timeouts e necessidade de reexecução ordenada.
 
 `WebSocketTransport`
 - Estado: `'idle'|'connected'|'reconnecting'|'closing'|'closed'`. Controla fluxo e previne chamadas fora de fase.
 - Headers dinâmicos: injeta `X-Last-Request-Id` para replays/diagnóstico após reconexão.
 - Suporte a runtimes: Bun (DOM‑like WS com opções `headers/proxy/tls`) e Node (lib `ws`). Mantém `isBunWs` para remover listeners corretamente (API difere: `removeEventListener` vs `off`).
 - Health e reconexão:
   - Ping/pong (Bun e ws suportam `ping()`); `pongReceived` previne loops de reconnect falsos.
   - Keep‑alive: envia frames periódicos para resetar idle timers de proxies (e.g. Cloudflare 5min).
   - `lastActivityTime`: mede ocioso real (exclui ping/pong) para classificar fechamentos por idle‑timeout.
   - Backoff: mantém `reconnectAttempts`, `reconnectStartTime`, `lastReconnectAttemptTime` e timers para escalonar tentativas.
 - Buffer de mensagens: `CircularBuffer<StdoutMessage>` retém histórico para replay após reconectar.
 - Callbacks: `onData`, `onCloseCallback`, `onConnectCallback` e `refreshHeaders` para tokens em rotação.
 
 Padrões de implementação
 - `connect()`: constrói headers, cria WS (Bun ou Node), ata handlers de open/message/error/close/pong.
 - `handleOpenEvent`: mede `connectStartTime` → telemetria. Zera contadores, troca estado para `connected` e inicia ping/keep‑alive.
 - `handleMessageEvent`: atualiza `lastActivityTime`, invoca `onData` e faz buffering quando necessário.
 - `doDisconnect(code?)`: remove listeners coerentes ao runtime, para ping/keep‑alive, troca estado e agenda reconnect se `autoReconnect`.
 - `reconnect()`: estratégia com jitter e limites; reaplica headers via `refreshHeaders()`.
 
 `HybridTransport` (WS leitura + HTTP POST escrita)
 - Motivação: Fire‑and‑forget pelo lado do chamador em “bridge mode” causava colisões no backend com múltiplos writes simultâneos; a estratégia é serializar e batelar writes para reduzir conflitos e tempestades de retry.
 - Componentes:
   - `postUrl`: derivado do `ws://...` → `https://.../post` (helpers ocultos no arquivo).
   - `SerialBatchEventUploader<StdoutMessage>`: fila com `maxBatchSize`, `maxQueueSize` alto (evita deadlock quando callers não “await”), backoff exponencial com jitter e callback `onBatchDropped` após `maxConsecutiveFailures` (telemetria defensiva).
   - Buffer de `stream_event`: acumula por ~100ms (`BATCH_FLUSH_INTERVAL_MS`); qualquer write não‑stream força flush para preservar ordem.
   - `CLOSE_GRACE_MS`: período final para drenar fila em `close()` sem bloquear encerramento do processo.
 - Fluxo de escrita:
   - `write(stream_event)`: acumula no buffer; timer dispara `enqueue` de lote.
   - `write(non-stream)`: flush imediato do buffer + enqueue do evento atômico.
   - `postOnce(batch)`: POST único; erros retryable sobem para o uploader.
 - Telemetria: `logForDiagnosticsNoPII('cli_hybrid_*')` para inicialização e batches descartados.
 
 Diagrama de estados (Mermaid)
 ```mermaid
 stateDiagram-v2
   [*] --> idle
   idle --> reconnecting: connect()
   reconnecting --> connected: onOpen
   connected --> reconnecting: onError/onClose
   connected --> closing: close()
   closing --> closed: teardown complete
   closed --> reconnecting: autoReconnect
 ```
 
 Q&A interno
 - Q: Por que um `maxQueueSize` tão alto na Hybrid?
   A: Callers fazem `void write()` — sem await, backpressure não propaga. Um limite baixo causaria deadlock; o bound vira só memória, com telemetria para quedas.
 - Q: Por que buffer de 100ms para `stream_event`?
   A: Deltas de conteúdo altamente frequentes (stream de tokens) reduzirão drasticamente número de POSTs sem impactar UX perceptível.
 - Q: Por que ping/pong E keep‑alive por dados?
   A: Proxies ignoram pings de controle; o keep‑alive com pequenos dados resetam contadores de idle de proxies externos.
 
