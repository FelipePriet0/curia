# BriefTool — Mensagens Proativas com Anexos

Objetivo: enviar mensagens para o usuário (com anexos) em fluxos proativos, com gating por entitlement/opt‑in e integração de analytics.

Componentes
- Implementação: `tools/BriefTool/BriefTool.ts`, UI/Prompt.
- Gating: `isBriefEntitled()` (feature flags + GB + env) e `isBriefEnabled()` (entitlement + opt‑in: --brief, defaultView chat, /brief, config, tools SDK, env).

Input/Output
- Input: `{ message: markdown, attachments?: string[], status: 'normal'|'proactive' }`.
- Output: `{ message, attachments?: [{ path,size,isImage,file_uuid? }], sentAt? }`.

Validações/Fluxo
- Valida paths de anexos (absolute/relative ao cwd), resolve metadados; attachments são opcionais para compatibilidade com resume.
- Emite evento analytics e aplica growthbook gates conforme KAIROS/KAIROS_BRIEF.

UX
- Render com path linkado e contagem pluralizada; status 'proactive' diferencia UX.

Boas práticas
- Usar para status inesperados, blockers e resultados de tarefas em background; manter mensagens curtas; anexar evidências (diffs, logs, imagens).

