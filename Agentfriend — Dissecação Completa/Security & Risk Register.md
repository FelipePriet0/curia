# Security & Risk Register

Top Risks
- Shell Execution (Windows nativo): sem sandbox POSIX → negar por política; preferir WSL.
- Filesystem Exfiltration: proteção de `.git/**`, secrets/**, symlinks perigosos e UNC/NTLM.
- Bridge/Remote: tokens long‑lived, version drift, drops sem replays.
- Supply Chain (MCP/Plugins): manifests maliciosos, homographs, path traversal.
- Privacy/Telemetry: coleta excessiva, PII em logs/eventos.

Mitigações
- Shell: classificador RO conservador; bloqueios de IEX/encoded/download cradles/COM; abort tree; timeouts.
- FS: validação de path segura, deny list estrita e normalização canônica; read‑before‑write.
- Bridge: tokens curtos, min‑version, batching com flush, buffer de replay, backoff com jitter.
- Supply chain: whitelist, schemas fortes, homograph block, base path enforcement.
- Telemetria: eventos mínimos, pseudonimização, opt‑out corporativo.

Controles de Detecção
- Alerta em retries/drops anormais; prompts de permissão acima do baseline; timeouts de shell; 413 recorrente.

Plano de Resposta
- Kill‑switch para bypass/shell; rollback de flags; reduzir paralelismo/limites; comunicação e fix forward.

