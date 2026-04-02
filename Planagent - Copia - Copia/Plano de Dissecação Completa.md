O Plano: Obsidian "Agentfriend — Dissecação Completa"                                                                                                                                                                                              
                                                                                                                                                                                                                                                       Escopo Real                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               ┌─────────────────────────┬─────────┐                                                                                                                                                                                                                │         Métrica         │ Número  │                                                                                                                                                                                                                ├─────────────────────────┼─────────┤                                                                                                                                                                                                                │ Total de arquivos       │ 1.905   │                                                                                                                                                                                                                ├─────────────────────────┼─────────┤                                                                                                                                                                                                                │ Linhas de código        │ ~50.110 │                                                                                                                                                                                                                ├─────────────────────────┼─────────┤                                                                                                                                                                                                                │ Arquivos TypeScript/TSX │ 1.884   │                                                                                                                                                                                                                ├─────────────────────────┼─────────┤                                                                                                                                                                                                                │ Módulos principais      │ 35      │                                                                                                                                                                                                                └─────────────────────────┴─────────┘                                                                                                                                                                                                                                                                                                                                                                                                                                                                     Isso é grande. Mas totalmente viável se trabalharmos em camadas.                                                                                                                                                                                                                                                                                                                                                                                                                                          ---                                                                                                                                                                                                                                                  Estrutura da Vault no Obsidian                                                                                                                                                                                                                                                                                                                                                                                                                                                                            📁 Agentfriend/                                                                                                                                                                                                                                      ├── 📁 00_Visao_Geral/                                                                                                                                                                                                                               │   ├── Arquitetura_Geral.md                                                                                                                                                                                                                         │   ├── Como_o_Agente_Pensa.md                                                                                                                                                                                                                       │   ├── Stack_Tecnologico.md                                                                                                                                                                                                                       
  │   └── Mapa_de_Dependencias.md
  │
  ├── 📁 01_Bootstrap_e_Estado/
  │   └── state.ts.md           ← 1.758 linhas dissecadas
  │
  ├── 📁 02_QueryEngine/
  │   ├── QueryEngine.ts.md     ← cérebro do agente
  │   ├── query.ts.md
  │   └── As_6_Fases_da_Query.md
  │
  ├── 📁 03_Ferramentas/
  │   ├── Tool.ts.md            ← arquitetura base
  │   ├── tools.ts.md           ← registro de todas as tools
  │   ├── BashTool.md
  │   ├── AgentTool.md
  │   ├── FileEditTool.md
  │   └── ... (40+ tools)
  │
  ├── 📁 04_Sistema_de_Tarefas/
  │   ├── Task.ts.md
  │   ├── tasks.ts.md
  │   └── ... (subtipos de tasks)
  │
  ├── 📁 05_Memoria/
  │   ├── Como_a_Memoria_Funciona.md
  │   ├── memdir.md
  │   ├── autoDream.md          ← consolidação em background
  │   └── extractMemories.md
  │
  ├── 📁 06_Contexto/
  │   ├── context.ts.md
  │   └── getSystemContext.md
  │
  ├── 📁 07_Permissoes/
  │   ├── Sistema_de_Permissoes.md
  │   └── toolOrchestration.md
  │
  ├── 📁 08_Bridge/
  │   ├── bridgeMain.ts.md      ← 2.999 linhas
  │   ├── replBridge.ts.md      ← 2.406 linhas
  │   └── ... (33 arquivos)
  │
  ├── 📁 09_Coordinator/
  │   ├── coordinatorMode.md
  │   └── Multi_Agentes.md
  │
  ├── 📁 10_CLI/
  │   ├── print.ts.md           ← 5.594 linhas (maior arquivo)
  │   ├── structuredIO.md
  │   └── transports/
  │
  ├── 📁 11_Componentes_React/
  │   └── ... (100+ componentes)
  │
  ├── 📁 12_Hooks/
  │   └── ... (hooks de permissão, notificação, etc.)
  │
  ├── 📁 13_Plugins/
  │   └── ...
  │
  ├── 📁 14_Skills/
  │   └── ...
  │
  ├── 📁 15_Commands/
  │   └── ... (150+ comandos)
  │
  ├── 📁 16_Services/
  │   └── ... (analytics, MCP, OAuth, LSP...)
  │
  ├── 📁 17_Utils/
  │   └── ... (git, github, swarm, ultraplan...)
  │
  └── 📁 18_Padroes_e_Licoes/
      ├── Padroes_Arquiteturais.md
      ├── Licoes_para_Aplicar.md
      └── Como_Construir_Seu_Proprio_Agente.md

  ---
  Template de Cada Nota de Arquivo

  Cada .ts dissecado terá essa estrutura:

  # nome_do_arquivo.ts

  ## Propósito
  O que este arquivo faz em 1 parágrafo.

  ## Posição na Arquitetura
  Onde se encaixa no sistema geral (diagrama).

  ## Dependências
  O que importa e por quê.

  ## Funções / Classes

  ### `nomeDaFuncao(params)`
  - **O que faz:** ...
  - **Parâmetros:** ...
  - **Retorno:** ...
  - **Linha a linha:** ...
  - **Por que foi feito assim:** ...

  ## Padrões Observados
  Decisões de design interessantes.

  ## Lições para o Seu Agente
  O que você pode reutilizar.

  ---
  Ordem de Execução (do Núcleo para as Bordas)

  ┌──────┬───────────────────────────────────────┬──────────────────────────────────┐
  │ Fase │                Módulos                │              Motivo              │
  ├──────┼───────────────────────────────────────┼──────────────────────────────────┤
  │ 1    │ Bootstrap, QueryEngine, query.ts      │ Entender o loop central primeiro │
  ├──────┼───────────────────────────────────────┼──────────────────────────────────┤
  │ 2    │ Tool.ts, tools.ts, 5 tools principais │ Como o agente age                │
  ├──────┼───────────────────────────────────────┼──────────────────────────────────┤
  │ 3    │ Memória, Context, autoDream           │ Como o agente lembra             │
  ├──────┼───────────────────────────────────────┼──────────────────────────────────┤
  │ 4    │ Permissões, Coordinator               │ Como o agente delega             │
  ├──────┼───────────────────────────────────────┼──────────────────────────────────┤
  │ 5    │ Bridge, CLI, Commands                 │ Camada de comunicação            │
  ├──────┼───────────────────────────────────────┼──────────────────────────────────┤
  │ 6    │ Components, Hooks, Services           │ UI e serviços de suporte         │
  ├──────┼───────────────────────────────────────┼──────────────────────────────────┤
  │ 7    │ Utils, Plugins, Skills                │ Utilitários e extensibilidade    │
  ├──────┼───────────────────────────────────────┼──────────────────────────────────┤
  │ 8    │ Padrões & Lições                      │ Síntese final                    │
  └──────┴───────────────────────────────────────┴──────────────────────────────────┘

  ---
  Como Vamos Executar

  A cada sessão eu:
  1. Leio os arquivos da fase atual
  2. Gero as notas .md prontas para colar no Obsidian
  3. Incluo diagramas em texto (Mermaid, que o Obsidian renderiza)
  4. Marco o que está pronto