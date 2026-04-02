# CURIA — Como o Agente Funciona

> Este documento descreve com precisão o que é o agente CURIA, como ele delibera internamente e o que ele entrega. Use como referência completa para entender o produto.

---

## O que é o CURIA

O CURIA é um **conselho estratégico virtual para fundadores de PMEs**. O fundador apresenta seu problema mais crítico do momento — uma decisão difícil, um travamento de crescimento, uma crise de caixa, uma dúvida de posicionamento — e recebe de volta um **parecer estruturado de nível sênior**, como se tivesse acabado de sair de uma reunião de board.

O nome vem da Curia romana: o espaço onde as decisões mais importantes eram deliberadas coletivamente. A premissa é essa — todo fundador de sucesso tem um conselho; o CURIA democratiza esse acesso.

**O que o CURIA não é:** não é um chatbot genérico, não é um assistente que responde perguntas, não é um gerador de texto. É um sistema que **raciocina antes de responder** — diagnostica, aplica frameworks, integra perspectivas especializadas e só então formula o parecer.

---

## Quem usa e para quê

**Usuário:** fundador de pequena ou média empresa, geralmente sem acesso a conselheiros seniores, mentores ou consultoria estratégica.

**Contextos de uso típicos:**
- "Tenho uma decisão difícil que não consigo resolver sozinho"
- "Quero estruturar uma estratégia para os próximos 6 meses"
- "Preciso mapear os riscos do que estou prestes a fazer"
- "Quero revisar se meu plano de ação faz sentido"

---

## Como o CURIA delibera — Arquitetura interna

O CURIA não responde diretamente. Ele executa um **processo de deliberação em duas fases** antes de emitir qualquer parecer.

### Fase 1 — Conselho delibera em paralelo (6 conselheiros especializados)

Antes de formular a resposta, o CURIA dispara **6 conselheiros especializados em paralelo**, cada um via modelo Haiku (rápido, focado). Cada conselheiro analisa a questão exclusivamente pelo seu domínio e produz um **brief de 2-3 frases** com o diagnóstico mais crítico da sua perspectiva.

| Conselheiro | Domínio | O que ele avalia |
|---|---|---|
| **Estratégia** | Posicionamento e vantagem competitiva | Problema central, estágio da empresa (0-4), framework mais relevante (Rumelt, Collins, Porter, Thiel) |
| **Finanças** | Saúde financeira | Unit economics, LTV/CAC, margens, burn rate, concentração de receita, riscos de capital |
| **Growth** | Crescimento | PMF, canais de aquisição, retenção, loops de crescimento, North Star metric, coortes |
| **Produto** | Product-market fit | Jobs-to-be-done, Aha Moment, decisões de roadmap, diferenciação do produto |
| **Operações** | Execução | Gargalos, processos críticos, problemas de time, restrições sistêmicas (Teoria das Restrições) |
| **Marca** | Posicionamento de marca | Clareza da mensagem, percepção do cliente, diferenciação comunicada |

Os 6 briefs são integrados como **contexto autoritativo** para a fase seguinte — o modelo de síntese não cita os conselheiros diretamente, mas integra o raciocínio deles no parecer.

### Fase 2 — Síntese (modelo principal)

Com os 6 briefs dos conselheiros injetados no contexto, o modelo principal (GPT-4o ou Claude Sonnet como fallback) formula o **parecer final**. Ele tem acesso a:
- Toda a conversa até aqui
- Os 6 briefs especializados
- Ferramentas ativas (busca de casos reais, proposta de estratégia)

O loop de síntese pode rodar até 8 turnos. O modelo tem acesso a três ferramentas:

| Ferramenta | Quando é chamada | O que faz |
|---|---|---|
| `search_failure_case` | Quando um risco estratégico tem precedente real (obrigatório) | Mini model busca 5-7 casos de fracasso com o lens do Survivorship Bias (Abraham Wald) |
| `search_success_case` | Quando um precedente de sucesso reencadraria o problema | Mini model busca 5-7 casos de sucesso com o mesmo constraint |
| `propose_strategy` | Ao final de uma conversa com diagnóstico + plano completos | Registra a estratégia com nome, brief e estágio para o ciclo de revisão |

A divisão de trabalho nas ferramentas de busca é intencional: o mini model (rápido, com acesso à web) varre e retorna os casos brutos. O modelo principal filtra, seleciona o mais afiado e sintetiza em insight contextualizado para aquele founder específico.

---

## O que o CURIA entrega — Output estruturado

Quando o fundador apresenta um problema com contexto suficiente, o CURIA entrega um **parecer estruturado** com as seguintes seções:

### 1. Diagnóstico
O que está acontecendo de verdade. Não o sintoma — a leitura sistêmica da situação.

### 2. Problema Central
A causa raiz isolada. A frase que, quando o fundador lê, ele pensa "é exatamente isso".

### 3. Riscos Estratégicos
O que pode dar errado se o problema não for endereçado. Riscos específicos, não genéricos.

### 4. Leitura de Performance
O que os números dizem (quando disponíveis). Interpretação das métricas no contexto do estágio da empresa.

### 5. Framework Aplicado
Qual modelo mental melhor explica a situação: Rumelt (problema-diagnóstico-política-ação), Collins (flywheel, Hedgehog), Porter (5 forças, cadeia de valor), Thiel (0 to 1), Teoria das Restrições, ou outro conforme o caso.

### 6. Cases Validados — Survivorship Bias (Abraham Wald)

Esta é a seção onde a maioria dos advisors falha: eles mostram só os aviões que voltaram.

O princípio do Wald: exércitos analisavam os aviões que retornavam da batalha cheios de tiros e reforçavam onde as marcas de bala estavam. Wald viu o que ninguém percebeu — essas áreas *não eram fatais*. Os aviões atingidos nas outras partes simplesmente não voltaram. Reforce onde *não há marcas de bala*.

Aplicado ao CURIA: todos copiam os casos de sucesso. Os fracassos são invisíveis porque essas empresas nunca escreveram um livro. O CURIA mostra os invisíveis.

**⚠️ Case de Fracasso — obrigatório quando o padrão existe**
Empresa ou fundador que fez exatamente o que parece certo na situação do founder — e falhou por razões que o viés de sobrevivência esconde.
Formato: empresa → situação (similar à do founder) → o que fizeram (que parecia correto) → o que não conseguiram ver (a marca de bala invisível) → como terminou → uma linha conectando ao momento atual do founder.
Sempre aberto com: *"Você está olhando os aviões que voltaram. Este aqui não voltou — e por isso ninguém fala dele."*

**✅ Case de Sucesso — opcional, só quando genuinamente reencadra**
Empresa ou fundador que enfrentou o mesmo constraint e encontrou o caminho. Não precisa ser o mesmo setor — precisa ser a mesma dor, o mesmo tipo de decisão.
Só incluído se muda como o founder vê a própria situação. Não para inspirar. Não porque existe um precedente qualquer.

**Ordem sempre:** fracasso antes de sucesso. O contraste é pedagógico.

**Filtro de qualidade — o que desqualifica um case:**
- Empresa anônima ou não verificável
- Apple, Amazon, Google, Netflix, Airbnb, Nubank — a menos que o padrão específico de fracasso/sucesso seja estruturalmente idêntico (não "eles também disruptaram um setor")
- Outcome vago ("acabou dando certo eventualmente")
- Estágio incompatível (case de Series C não ilustra problema de Stage 0)
- Conexão que precisa de mais de uma frase para ser explicada

Se nenhum case passar o filtro: o CURIA escreve "Não encontrei um precedente suficientemente preciso para este padrão específico" e segue. Um campo em branco bate um case fraco.

### 7. Recomendações Estratégicas
3 a 5 ações concretas. Nível advisor sênior: inclui audiência, canal, métrica, prazo. Sem "melhore seu marketing". Cada recomendação é específica o suficiente para ser executada sem precisar perguntar "mas como?".

### 8. Próximos Passos (7–14 dias)
O que fazer essa semana e na próxima. Concreto, sequenciado, com métrica de sucesso.

### 9. Perguntas Difíceis
As 3 perguntas que um bom conselheiro faria. Desafiam os pressupostos do fundador. São entregues como perguntas — não como conclusões — porque o insight pertence ao fundador.

### 10. Proposta de Retorno
O CURIA sempre sugere marcar uma revisão do plano (7, 14 ou 30 dias). O sistema cria um lembrete e, na data escolhida, reabre a conversa com o contexto completo do plano.

---

## Princípios que governam o comportamento

O CURIA segue princípios rígidos que definem **como** ele pensa, independente da tecnologia:

**1. Primeiro entender, depois aconselhar.**
Quando o contexto é insuficiente, o CURIA faz 2-3 perguntas cirúrgicas antes de recomendar. Nunca entrega um plano sobre diagnóstico incompleto.

**2. Diagnóstico antes de plano.**
O plano de ação só é entregue quando o Diagnóstico e o Problema Central estão claros. Diagnóstico incompleto com lacunas explícitas é melhor do que plano prematuro.

**3. Insight é pergunta, não declaração.**
O CURIA nunca diz "seu negócio está virando commodity." Ele pergunta: *"O que impede seu negócio de ser percebido como uma commodity no mercado?"* A conclusão pertence ao fundador.

**4. Especificidade é respeito.**
Conselhos genéricos são insultos disfarçados de ajuda. Cada recomendação deve ter audiência, canal, valor, prazo e métrica.

**5. Cases validados, não cases decorativos.**
O CURIA nunca inclui um case para "enriquecer" a resposta. Cada case passa por um filtro de três critérios: precisão do padrão (o mesmo constraint, não o mesmo setor), proximidade de estágio (uma empresa em Series C não ilustra um problema de Stage 0) e o "senior advisor test" (um partner de McKinsey usaria esse case numa reunião de board?). Se nenhum passar, o campo fica em branco.

**6. A conversa é o produto. As seções são a síntese.**
As seções estruturadas não são template a ser preenchido. São o resultado de uma conversa que construiu contexto suficiente.

---

## Gerenciamento de contexto e memória

O CURIA mantém o histórico completo de cada conversa (salvo no banco de dados por conversa). Para conversas longas, o sistema aplica compactação automática:

- **Micro-compact:** trunca o histórico para as últimas 16 mensagens antes de cada chamada à API, preservando sempre que a primeira mensagem seja do usuário.
- **Auto-compact:** quando o contexto ultrapassa ~72k tokens, o Haiku gera um resumo estratégico da conversa (problema central, diagnóstico, frameworks, decisões, próximos passos) e substitui o histórico pelo resumo + mensagens recentes. O contexto estratégico não se perde — é comprimido.

---

## Conversa contínua — ciclo de revisão

O CURIA não é uma interação única. É um **ciclo**:

1. Fundador apresenta o problema
2. CURIA delibera e entrega o parecer + plano de 7-14 dias
3. Fundador escolhe data de revisão
4. Na data marcada, o sistema notifica e reabre a conversa com o contexto completo
5. CURIA avalia o progresso, atualiza o diagnóstico, ajusta o plano

Cada conversa tem título gerado por IA (baseado na primeira mensagem), pode ser renomeada, arquivada ou deletada. O histórico de estratégias ativas fica acessível na sidebar.

---

## Interface — Câmara de Deliberação

A UI do CURIA é uma **câmara isométrica** com 6 personagens low-poly sentados ao redor de uma mesa redonda de madeira. Cada personagem representa um conselheiro.

Durante a deliberação, o usuário vê em tempo real:
- Quais conselheiros estão ativos (animação de pensamento)
- Keyword do domínio de cada conselheiro ativo aparecendo acima da sua cabeça
- Quando um conselheiro conclui, um snippet do brief aparece acima dele
- Label de fase: "Conselheiros deliberam…" → "Sintetizando parecer…"
- Badge de contexto (% do budget de tokens usado, com cor adaptativa: verde/dourado/vermelho)

A câmara é compacta durante o chat e expandida na tela inicial.

---

## Resumo em uma frase

> O CURIA é um conselho estratégico virtual que, para cada problema apresentado por um fundador, executa uma deliberação paralela de 6 especialistas, busca cases reais via Survivorship Bias (mostrando os aviões que não voltaram antes dos que voltaram), sintetiza tudo em um parecer estruturado de nível sênior e entrega diagnóstico + plano de ação concreto com revisão agendada — tudo em menos de 30 segundos.
