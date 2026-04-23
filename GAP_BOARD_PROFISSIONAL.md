# GAP_BOARD_PROFISSIONAL

**O que é este documento:** mapeamento honesto do que falta na Curia pra ela operar como um board profissional de verdade. Separa gap estrutural (não fecha — é diferença de posição institucional) de gap de produto (fecha — é só trabalho).

Base: ~70% de alinhamento dentro da conversa (como pensar, enquadrar, perguntar, recomendar, calibrar voz). ~30% de gap fora da conversa (rastrear compromisso, auditar dado, abrir porta, forçar escolha, operar em ritual, posição adversarial). Este doc é o 30%.

---

## As 7 divergências

### 1. Auditoria de dado bruto

**Como board real opera:** lê o deck, o P&L, o cohort, o pipeline. Quando o CEO diz "o churn tá ok", o board conta. Não aceita narrativa — confere número.

**Como a Curia opera hoje:** só tem o que o founder conta. Ela pergunta os números, mas não audita. Teto de rigor: consegue apontar quando o founder não sabe o número, não consegue apontar quando ele está errado sobre ele.

**Classificação:** Gap estrutural (parcial). Fecharia parcialmente se tivesse ingestão de planilha, dashboard, export de CRM. Hoje não tem e provavelmente não terá a curto prazo.

---

### 2. Surfacing de discordância

**Como board real opera:** explicita divergência. "Dois de nós acham pivô, três acham dobrar aposta, aqui está o porquê de cada lado."

**Como a Curia opera hoje:** no modo `full` tem 6 vozes, mas a saída é sintetizada — a divergência é apagada no synthesizer. Founder recebe uma voz consensual.

**Classificação:** Gap de produto. Fecha.

**Movimento possível:** quando `full` detecta disagreement real entre conselheiros (ex: 4 recomendam caminho A, 2 recomendam caminho B), o synthesizer deveria preservar essa divisão e apresentar as duas teses com nome — "4 dos conselheiros disseram X pelos seguintes motivos, 2 disseram Y pelos seguintes motivos". Decidir se founder escolhe ou se o synthesizer toma o tiebreaker com justificativa.

---

### 3. Accountability longitudinal

**Como board real opera:** lembra que você disse há 3 trimestres que ia chegar em $2M ARR. Hoje você tá em $1.1M. O board cobra: "o que aconteceu?"

**Como a Curia opera hoje:** tem memória institucional (`strategies`) e `plan_review` com trigger de 7/14/30 dias. Mas cada conversa começa "limpa" — a Curia não abre a sessão puxando o que o founder prometeu antes e não entregou.

**Classificação:** Gap de produto. Fecha.

**Movimento possível:** no início de toda conversa, carregar compromissos em aberto (plans com `review_date` passado, `status != completed`) e deixar a Curia decidir se puxa isso na abertura. Se o founder abre uma conversa nova sobre um problema parecido com um compromisso em aberto, a Curia precisa dizer: "antes da gente entrar nisso — você disse há 2 semanas que ia fazer X. Cadê?"

---

### 4. Forçar capital allocation

**Como board real opera:** não deixa o CEO sair com "vou fazer essas 5 coisas". Obriga escolher 2, porque dinheiro e tempo são finitos.

**Como a Curia opera hoje:** Recomendações saem em 3-5 sem forçar a escolha. O founder pode sair com todas e não executar nenhuma.

**Classificação:** Gap de produto. Fecha.

**Movimento possível:** depois das 3-5 recomendações, uma pergunta explícita: "das 5, quais 2 você vai fundar esta semana?" Ou um widget de priorização forçada. Ou uma regra no scaffold: se o founder tá num estágio de scarcity (caixa curto, time pequeno), o Board entrega só 2 recomendações, não 5.

---

### 5. Network / Rolodex

**Como board real opera:** abre porta. Intros pra cliente, pra contratação, pra comprador, pra investidor. Metade do valor de um board bom é o Rolodex.

**Como a Curia opera hoje:** não tem rede. Não pode fazer intro.

**Classificação:** Gap estrutural. Não fecha — é limite de LLM. Único movimento possível é mid-term: a Curia poderia sugerir canais (onde procurar, o que perguntar) e criar o "perfil do perfil ideal" que o founder leva pra sua própria rede. Mas não é substituto real.

---

### 6. Posição adversarial

**Como board real opera:** pode demitir o CEO. Tem autoridade fiduciária. Quando precisa, é adversarial — defende shareholder, não founder.

**Como a Curia opera hoje:** trabalha PARA o founder. Pode chamar de BS um pressuposto, mas não pode dizer "o board está avaliando se você é o CEO certo pra essa fase".

**Classificação:** Gap estrutural. Não fecha — é diferença de posição institucional. A Curia não é fiduciária.

**Movimento paliativo possível:** um modo "exec session" — "se eu tivesse que escrever um report sobre você pros investidores sem você na sala, aqui está o que eu escreveria". Simula a visão de fora sem precisar ter a autoridade.

---

### 7. Ritual calendárico

**Como board real opera:** tem quarterly review, annual strategy, executive session sem o CEO. É calendário fixo — o founder é obrigado a parar e revisar.

**Como a Curia opera hoje:** 100% ad-hoc. Founder puxa cadeira quando quer. Pode ser vantagem (disponibilidade), mas também é perda — nunca é obrigado a revisar num ciclo.

**Classificação:** Gap de produto. Fecha.

**Movimento possível:** modo "revisão trimestral" estruturado. A cada 90 dias, a Curia dispara proativamente (via scheduled task): "tá na hora de fazer o board meeting trimestral. Vamos revisar estratégia, performance, plano, pipeline de hiring, e o que mudou desde última revisão." Com agenda fixa, não ad-hoc.

---

## Os 6 movimentos que fechariam o gap de produto

Consolidando os gaps que fecham, em ordem de esforço estimado × impacto:

1. **Accountability longitudinal** — carregar compromissos em aberto na abertura da conversa e forçar a Curia a cobrar antes de entrar em tópico novo.

2. **Forçar escolha em capital allocation** — depois das recomendações, pergunta explícita de priorização (ou cap de 2 em contextos de scarcity).

3. **Surfacing de discordância no `full` mode** — quando conselheiros divergem significativamente, o synthesizer preserva e apresenta as duas teses.

4. **Modo revisão trimestral** — ritual calendárico disparado via scheduled task, com agenda fixa.

5. **Modo exec session** — "o que eu escreveria sobre você sem você na sala" — simula posição adversarial.

6. **Canais sugeridos (paliativo pro network)** — onde procurar e como abordar, já que não tem Rolodex próprio.

---

## O que não fecha (gap estrutural)

- **Auditoria de dado bruto** — sem ingestão real, teto de rigor permanece.
- **Network / Rolodex** — não tem jeito, LLM não abre porta.
- **Autoridade fiduciária** — Curia é consultora, não fiduciária. Diferença institucional real.

Isso não é fraqueza da Curia. É diferença honesta entre board de verdade e Board estratégico operado por LLM. O valor da Curia não é ser idêntica — é ser muito boa naquilo que ela é: o sócio experiente que tá ali na hora, com a pergunta certa na mão, sem política interna.

---

## Notas de prioridade (pra conversa futura)

Priorizar por:
- (a) qual gap o founder sente mais na carne hoje
- (b) qual movimento reforça o ciclo de plano/review que já existe (compounding sobre infra atual)
- (c) qual movimento diferencia a Curia de chat genérico (discordância e accountability são mais defensivos do que ritual trimestral, por exemplo)

Candidatos a primeira rodada de implementação: **accountability longitudinal** + **forçar capital allocation** + **surfacing de discordância**. Os três reforçam o mesmo eixo — Curia deixa de ser conselheira episódica e vira presença contínua que cobra.
