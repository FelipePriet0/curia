# SendMessageTool — Enviar Mensagens no Fluxo

Objetivo: mapear a ferramenta que publica mensagens (texto) no transcript/ambiente, útil para prompts dirigidos e comunicação entre ferramentas.

Componentes
- Implementação: `tools/SendMessageTool/SendMessageTool.ts`, UI em `UI.tsx`, constantes e prompt.

Comportamento
- Input: campos de texto e opções de formatação; validação simples via zod.
- Execução: injeta mensagem no transcript, preservando ordenação do executor em streaming; sinaliza erros de validação/limites.
- Permissões: normalmente allow, controlada por políticas de canal.

Padrões
- Usar para anotações e instruções intermediárias; evitar abuso para logs extensos (prefira tool results ou anexos persistidos).
- Mensagens devem ser claras e concisas, com contexto mínimo necessário.

