# Sumário das Fases e Arquivos (Estilo Livro)

Propósito: guia de navegação do estudo — o que cada fase cobre e o papel de cada arquivo. Use como índice rápido para achar o tópico certo ao replicar o Agentfriend.

## Fase 1 — Entry, CLI, Render, Transport
- Fase 1 — Entry, CLI, Render, Transport.md: panorama do boot: CLI, renderizador (Ink), e transports (WebSocket/Hybrid).
- Fase 1 — Entry (pasta): notas detalhadas do entrypoint/CLI e flags.
- Fase 1 — IO (pasta): IO estruturado e mensagens base.
- Fase 1 — Render (pasta): arquitetura do renderizador e componentes de UI.
- Fase 1 — Transports (pasta): implementação de WebSocket/Hybrid e handshake.
- Fase 1 — Addendum (pasta): addenda específicos (main.tsx, ajustes finos).
- Fase 1.5 — Bridge, Remote & CCR — Dissecacao.md: auth, gates, compat, reconexão, batching e métricas.
- Fase 1 — Telemetria & Perf Budgets.md: eventos mínimos, PII, amostragem e metas de TTI/latência.
- Fase 1 — Ambiente & Segredos (Keychain, MDM, Managed Settings).md: integrações seguras e fallback por SO.

## Fase 2 — Loop Principal, Estado e Ferramentas
- Fase 2 — Resumo + Playbook.md: visão geral do loop e estado.
- Fase 2 — Main Loop, Estado e Orquestração.md: laço principal, fluxo de mensagens, integração de estado.
- Fase 2 — AppStateStore & onChangeAppState — Dissecacao.md: store, mutações e side‑effects controlados.
- Fase 2 — Tool.ts — Dissecacao.md: contrato Tool<Input,Output,Progress> e funções padrão.
- Fase 2 — query.ts — Dissecacao.md: orquestração por query (streaming, fallback, ordering).
- Fase 2 — REPL.tsx — Arquitetura.md: modo REPL e ponte com o render.

## Fase 3 — Memória, Compactação e Contexto
- Fase 3 — Memória, Compactação e Contexto.md: conceitos e objetivos.
- Fase 3 — Playbook de Compactação & Memória.md: estratégias (auto/micro), budgets, anexos.
- Fase 3 — autoCompact + microCompact — Dissecacao.md: quando e como acionar compactações.
- Fase 3 — microCompact + autoCompact — Mapeamento função a função.md: referência função‑a‑função.
- Fase 3 — compact.ts — Dissecacao.md: núcleo de compactação.
- Fase 3 — sessionMemoryCompact.ts — Dissecacao.md: compactação por sessão e estados.
- Fase 3 — Prompts de Compactação + postCompactMessages — Dissecacao.md: prompts e reidratação pós‑compact.
- Fase 3 — Memórias e Anexos — Dissecacao.md: anexos persistidos e reinclusão.
- Fase 3 — Exemplo Compacto (Histórico Atual).md: exemplo aplicado do estado de histórico.

## Fase 4 — Permissões, Modos e Sandbox
- Fase 4 — Permissões & Segurança.md: princípios e ameaças.
- Fase 4 — Playbook de Permissões & Segurança.md: regras, matching, UX ask/deny/allow.
- Fase 4 — permissions.ts — Dissecacao.md: entry de permissões no runtime.
- Fase 4 — Modes, Results e Killswitch — Dissecacao.md: modos de execução e salvaguardas.
- Fase 4 — Sandbox & Swarm — Dissecacao.md: isolamento e coordenação distribuída.
- Fase 4 — Padrões & Lições + Checklist.md: lições aprendidas e lista de verificação.

## Fase 5 — Tools & Skills (Execução e Orquestração)
- Fase 5 — Tools & Skills.md: mapa das ferramentas e objetivos.
- Fase 5 — Orquestração de Ferramentas — Dissecacao.md: executor em streaming, batches e ordering.
- Fase 5 — Playbook de Ferramentas & Skills.md: guia de implementação segura e rápida.

Ferramentas de Shell e FS
- Fase 5 — BashTool — Dissecacao.md: sandbox, segurança e execução Bash.
- Fase 5 — PowerShellTool — Dissecacao.md: segurança/AST, paths/providers, política Windows.
- Fase 5 — FileReadTool — Dissecacao.md: limites, anexos, segurança de leitura.
- Fase 5 — FileEditTool — Dissecacao.md: diffs seguros, preview e autorização.
- Fase 5 — FileWriteTool — Dissecacao.md: read‑before‑write, diffs, LSP e diagnósticos.
- Fase 5 — Grep e Glob — Dissecacao.md: buscas read‑only com caps e paginação.
- Fase 5 — LSPTool — Dissecacao.md: navegação por símbolos/refs/hover.

Web
- Fase 5 — WebSearchTool — Dissecacao.md: busca com allowed/blocked domains em streaming.
- Fase 5 — WebFetchTool — Dissecacao.md: fetch seguro, preapproved e resumo com prompt.
- Fase 5 — Web — Playbook de Pesquisa e Fetch.md: padrões de Search→Fetch.

Notebooks
- Fase 5 — NotebookEditTool — Dissecacao.md: edição segura de .ipynb com read‑before‑edit.

Agentes e Skills
- Fase 5 — AgentTool & SkillTool — Dissecacao.md: agentes e execução de skills, telemetria.
- Fase 5 — Playbook de Ferramentas & Skills.md: melhores práticas para tools/skills.

MCP
- Fase 5 — MCP — Dissecacao.md: conexões, transports, escopos e gating.
- Fase 5 — MCP Tools — Dissecacao.md: MCPTool/Read/List/Auth e uso prático.

Gestão/Agendamento
- Fase 5 — Tasks & Teams — Dissecacao.md: criação/listagem/atualização/stop/output.
- Fase 5 — RemoteTrigger & ScheduleCron — Dissecacao.md: gatilho remoto e cron CRUD.

Comunicação/Descoberta/Modo
- Fase 5 — SendMessageTool — Dissecacao.md: mensagens no fluxo.
- Fase 5 — ToolSearch & TodoWrite — Dissecacao.md: descoberta de tools e registro de TODOs.
- Fase 5 — Plan & Worktree — Dissecacao.md: entrar/sair de PlanMode e Worktree.
- Fase 5 — Sleep & SyntheticOutput — Dissecacao.md: pausas e saída JSON estruturada.

Consolidação
- Fase 5 — Índice & Checklist Final.md: checklist para replicação por projeto.

## Fase 7 — Extensibilidade, Skills e Permissões (Infra)
- Fase 7 — Plugins — Loader & Policy — Dissecacao.md: descoberta/validação e política (nomes/origens/homograph).
- Fase 7 — Plugins — Marketplace & Instalação — Dissecacao.md: marketplaces, instalação/atualização e reconciliação.
- Fase 7 — Skills — Loading & Bundled — Dissecacao.md: carregamento por fontes, bundladas e MCP.
- Fase 7 — Permissões — Infra Interna — Dissecacao.md: loaders, parsing/matching, modos e classificadores.
- Fase 7 — Swarm — Permission Bridge — Dissecacao.md: sync de permissões em líder/worker.

## Camada Executiva (McKinsey)
- 0 — Executive Summary.md
- Operating Model & Governance.md
- KPIs, SLIs & SLOs.md
- Security & Risk Register.md
- Implementation Roadmap & Workstreams.md
- RACI — Roles & Responsibilities.md
- Change Management & Communications.md
- Decision Log.md
- Compliance Mapping — Privacy, Security, Audit.md
- Maturity Model & Capability Roadmap.md
- Feature Flags Strategy & Release Governance.md
- Glossário.md
- One-Pager — Exec Summary, Roadmap & SLOs.md
- Template — Release Readiness Checklist.md

## Apêndices
- Apêndice — Tabelas de Recuperação (Erros & Ações).md: decisões por classe de erro, limites e mensagens.
- Fase 2.5 — Modos Especiais — KAIROS, Brief, Dream, Ultraplan.md: modos e orquestrações avançadas.

Observação
- Não há Fase 6 separada — tópicos de orquestração assíncrona (Tasks/Teams/Cron/SendMessage) foram consolidados na Fase 5.
