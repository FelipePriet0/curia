# ConfigTool — Leitura/Escrita de Config com Validação

Objetivo: permitir ao agente ler/ajustar configurações com coerção/validação, opções e pré‑checks (voz, remote control), mantendo UX segura.

Componentes
- Implementação: `tools/ConfigTool/ConfigTool.ts` + `supportedSettings.ts` e `prompt.ts`.

Fluxo
- GET: `operation: get` retorna valor formatado (`formatOnRead`) a partir de `source` e `path` da configuração.
- SET: valida opção (enum), coerção booleana, `validateOnWrite` assíncrono (ex.: checagem de modelo/voz), e aplica side‑effects (ex.: `remoteControlAtStartup` → atualiza AppState para refletir de imediato).
- Special: valor 'default' para remoteControlAtStartup remove override e re‑resolve default de plataforma/feature.

UX/Permissões
- Mensagens claras de erro (opções, validação externa) e sucesso; tool read‑only ou mutável conforme setting.
- Integra com gates de VOICE_MODE e autenticação quando habilitar voz.

Boas práticas
- Centralizar opções/paths em `supportedSettings`; evitar valores mágicos; usar formatters de leitura para UX.

