 # `entrypoints/cli.tsx` — Dissecação Minuciosa
 
 Intenção: um bootstrap finíssimo que toma decisões de roteamento em microsegundos, com zero ou quase zero imports, para reduzir cold‑start e custos. A filosofia é “não carregar nada até ter certeza de que precisa”.
 
 Seções por blocos
 
 1) Pré‑boot flags e env
 - `import { feature } from 'bun:bundle'`: gates de build — permitem Dead Code Elimination por bundle.
 - COREPACK: `process.env.COREPACK_ENABLE_AUTO_PIN = '0'` conserta auto‑pin do corepack inserindo yarnpkg no package.json; definido cedo por side‑effect controlado.
 - Heap child‑proc em remoto: se `CLAUDE_CODE_REMOTE === 'true'` injeta `--max-old-space-size=8192` em `NODE_OPTIONS`. Motivo: containers CCR têm 16GB; previne OOM no Node filho.
 - Ablation baseline: se `feature('ABLATION_BASELINE')` e `CLAUDE_CODE_ABLATION_BASELINE`, seta um conjunto de envs `??= '1'` (SIMPLE, DISABLE_THINKING, DISABLE_BACKGROUND_TASKS etc.). Nota: fica aqui e não em `init.ts` porque ferramentas capturam `DISABLE_*` no momento do import (init seria tarde).
 
 2) Fast‑path: `--version`
 - Checa `args` curtos e imprime `MACRO.VERSION` sem imports adicionais. Garante latência mínima para `-v`.
 
 3) Profiler e “dump system prompt”
 - Carrega dinamicamente `../utils/startupProfiler.js` e marca `cli_entry`.
 - `--dump-system-prompt` (gated): habilita configs, resolve o modelo (`--model` se passado; senão `getMainLoopModel()`), gera o system prompt (`getSystemPrompt`) e imprime. Usado para evals de sensibilidade a prompt.
 
 4) Caminhos MCP/Chrome
 - `--claude-in-chrome-mcp` → roda servidor MCP p/ extensão Chrome.
 - `--chrome-native-host` → host nativo p/ Chrome.
 - `--computer-use-mcp` (gated) → MCP de “computer use”.
 
 5) Daemon — worker e supervisor
 - `--daemon-worker <kind>`: executa `runDaemonWorker(kind)`. Observação: sem `enableConfigs()` aqui — workers são leves e só chamam config onde necessário.
 - `daemon ...`: inicializa configs+sinks e roda supervisor `daemonMain`.
 
 6) Bridge (remote-control)
 - Alias: `remote-control|rc|remote|sync|bridge`.
 - Checagens: autenticação via `getClaudeAIOAuthTokens`, gate de GrowthBook `getBridgeDisabledReason`, versão mínima `checkBridgeMinVersion` e política organizacional `isPolicyAllowed('allow_remote_control')` após `waitForPolicyLimitsToLoad()`.
 - Em caso de falha: `exitWithError` com mensagens claras.
 
 7) Sessões em background (BG)
 - Comandos `ps|logs|attach|kill` e flags `--bg/--background` roteiam para `cli/bg.js`. Design: manter código e dependências isolados do caminho padrão.
 
 8) Templates (gated)
 - `new|list|reply` → `cli/handlers/templateJobs.js`. Força `process.exit(0)` para encerrar TUI com handles pendentes.
 
 9) Runners headless (gated)
 - `environment-runner` → executa cenários headless BYOC.
 - `self-hosted-runner` → worker para SelfHostedRunnerWorkerService.
 
 10) Tmux + Worktree
 - Se `--tmux` com `--worktree` e `isWorktreeModeEnabled()`, tenta `execIntoTmuxWorktree(args)` antes de montar CLI — economiza custo ao errar cedo se não há tmux. Em erro: sai com mensagem clara.
 
 11) Correção de flags de update
 - Redireciona `--update|--upgrade` para subcomando `update` (UX defensiva).
 
 12) Flag `--bare`
 - Seta `CLAUDE_CODE_SIMPLE = '1'` cedo para que gates acionem durante avaliação de módulos e construção de opções do Commander, não só dentro do handler.
 
 13) Entrada padrão e import do CLI completo
 - `startCapturingEarlyInput()`: evita perder dados de stdin durante import do CLI pesado.
 - Marca perf `cli_before_main_import` → `await import('../main.js')` → `cli_after_main_import` → `await cliMain()` → `cli_after_main_complete`.
 
 Decisões de design e porquês
 - Import dinâmico agressivo: reduz TTI (time-to-interactive) e permite que “caminhos raros” fiquem fora do cold path.
 - Gates por `feature()`: variam o binário por build/ambiente, permitindo ablações e eliminar código via DCE.
 - Foco em UX: oferecer saídas instantâneas para tarefas simples; mensagens de erro claras para políticas/gates.
 - Observabilidade: `profileCheckpoint` em pontos críticos para perf budget e regressão.
 
 Q&A interno
 - Q: Por que algumas checagens de auth acontecem antes de consultarem GrowthBook?
   A: GrowthBook precisa de contexto do usuário autenticado; sem auth, retornaria gate stale/false do cache.
 - Q: Por que `process.exit(0)` em templates?
   A: Ink TUI pode deixar handles de eventos que impedem saída natural; força encerramento sem vazamentos.
 - Q: Por que `--bare` setado antes do Commander?
   A: Opções e handlers dependem dessa flag para construir a UI/opções corretas — precisa influenciar o parse e não só a execução.
 
