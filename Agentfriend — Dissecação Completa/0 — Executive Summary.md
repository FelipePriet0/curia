# Executive Summary — Agentfriend (Replicação de Padrão)

Objetivo
- Estabelecer um padrão de agente com segurança, UX e performance de classe enterprise, inspirado no Agentfriend, sem reutilização de código.

Tese
- Núcleo: loop assíncrono em generator (baixa latência), executor de ferramentas em streaming (RO paralelo / RW serial), pipeline de permissões fail‑closed e transporte resiliente (WS + batch HTTP).
- Suporte: telemetria mínima com budgets, governança de feature flags, e controles de risco (shell/FS, MCP/Plugins, bridge remoto, privacidade).

Resultados Esperados (OKRs)
- O1: MVP seguro em 4 semanas com Tools RO (Glob/Grep/FileRead/LSP) e permissões FS.
- O2: TTI < 300ms (p95) e latência de prompt de permissão < 2s (p95).
- O3: 0 incidentes de execução shell não autorizada; 0 vazamentos PII por design.

Princípios
- Segurança por padrão; permissões determinísticas; PII‑minimization; performance com lazy imports e prefetch pós‑render; extensibilidade com gates e sandbox.

Roadmap de Alto Nível
- Semana 1–2: Tool API + executor + RO tools + permissões FS + REPL/Transports.
- Semana 3: Shell minimal (RO), micro/auto‑compact, fallback/recovery.
- Semana 4: FileEdit, MCP básico, telemetria mínima, checklists de segurança.
- Extensões: Bridge/CCR, KAIROS/Brief, Dream, Plugins/Marketplace com políticas.

Riscos Críticos & Mitigações (sumário)
- Shell/Windows nativo: negar por política sem sandbox; preferir WSL.
- Supply chain (MCP/Plugins): whitelist, validação forte, isolamento de diretório.
- Telemetria/privacidade: opt‑out corporativo, eventos mínimos, pseudonimização.
- Bridge remoto: tokens curtos, min‑version, batching com flush e replays com backoff.

