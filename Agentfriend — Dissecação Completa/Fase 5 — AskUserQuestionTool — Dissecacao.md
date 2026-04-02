# AskUserQuestionTool — Elicitação Estruturada (1–4 perguntas)

Objetivo: pedir decisões ao usuário de forma estruturada com opções, previews e anotações — integrado ao pipeline de permissões/modos.

Componentes
- Implementação: `tools/AskUserQuestionTool/AskUserQuestionTool.tsx`.
- Prompt/Constantes: largura do chip, textos de preview, habilitação de previews por feature.

Input/Output
- Input: `{ questions: [{ question, header, options[2–4]{label, description, preview?}, multiSelect? }], answers?, annotations?, metadata? }`.
- Output: `{ questions[], answers{question->string}, annotations }` (multi-select retorna join por vírgulas para compatibilidade textual).

Validações
- Unicidade: perguntas únicas e labels únicos por pergunta (refine UNIQUENESS_REFINE).
- Previews: opcionais, com formato guiado por `getQuestionPreviewFormat()` (mockups/códigos comparativos).

Comportamento
- Read‑only, concurrency‑safe; exibe UI rica no transcript (chips + previews); respeita canais permitidos.
- Integração com modos (cores por PermissionMode) e analytics (source em metadata).

Boas práticas
- Perguntas curtas e específicas; 2–4 opções bem distintas; usar preview quando a comparação visual ajuda.
- Evitar “Other” — o sistema fornece essa opção automaticamente.

