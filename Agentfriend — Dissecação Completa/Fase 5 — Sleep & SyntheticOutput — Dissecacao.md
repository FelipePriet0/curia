# SleepTool e SyntheticOutputTool — Pausas e Saída Estruturada

SleepTool
- Objetivo: orientar o uso de pausas deliberadas (evitar busy wait) com prompts claros sobre quando usar e limites aceitáveis.
- Prompt: recomendações de duração, casos de uso (aguardar serviços, backoffs) e alternativas (backgrounding, tasks).
- Padrões: evitar sleeps longos em foreground; preferir background/task ou delegar.

SyntheticOutputTool
- Objetivo: devolver resposta final como JSON estruturado validado por schema (Ajv), com variante customizável via `createSyntheticOutputTool(schema)`.
- Input/Output: valida contra schema e retorna confirmação + `structured_output`.
- Permissões: sempre allow (não executa side‑effects), read‑only.
- UX: mensagens minimalistas; uso típico em SDK/CLI e workflows.

