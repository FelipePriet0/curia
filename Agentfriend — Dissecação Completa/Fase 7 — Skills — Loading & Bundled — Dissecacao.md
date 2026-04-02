# Skills — Loading e Bundled

Objetivo: documentar como o sistema carrega skills a partir de diretórios, plugins, gestão/managed, MCP e bundladas.

Componentes
- Loader: `skills/loadSkillsDir.ts` — resolve paths por fonte (policy/user/project/plugin), ignora gitignored, dedup por realpath, parse de frontmatter e comandos (argumentos, whenToUse, model/effort, hooks e execução em fork), allowedTools e paths.
- Bundled: `skills/bundled/index.ts` e registradores (verify, updateConfig, remember, simplify, skillify, stuck, keybindings, batch, loremIpsum, loop, scheduleRemoteAgents, claudeApi, dream/hunter sob flags).
- MCP Skills: `skills/mcpSkillBuilders.ts` — registra skills baseadas em MCP.

Fluxo
- Estima tokens de frontmatter (não carrega conteúdo completo até invocar); lê markdown e extrai descrição/whenToUse; substitui argumentos e resolve hooks.
- Dedup: resolve identidade por realpath para evitar duplicatas via symlink/overlaps.
- Paths e filtros: `getSkillsPath()` por fonte; permite patterns (paths) e trata `**` como match‑all.

Padrões
- Só carregar conteúdo completo na execução (economia de tokens); armazenar metadata suficiente para discovery e auto‑classifier.
- Integrar com effort/model/hook e execução em fork quando necessário.

