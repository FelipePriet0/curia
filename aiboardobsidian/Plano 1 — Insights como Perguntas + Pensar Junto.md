# Plano 1 — Insights como Perguntas + Pensar Junto

## O que percebi no problema

O output atual faz isso:

> *"Pare de vender 'conselho de big tech' e comece a vender 'sistema de decisão para PME'"*

Isso é **uma conclusão imposta**. O modelo não sabe por que você escolheu aquela linguagem. E você mesmo explicou: você fala "Big Tech Board" porque founders falam a língua do Vale do Silício — e isso é posicionamento intencional, não erro.

O modelo pulou a fase de **entender** e foi direto para **recomendar**. É exatamente o que um conselho ruim faz.

---

## Como vou resolver

Duas mudanças cirúrgicas no system prompt:

**1. Nova seção antes das Recomendações: `🔎 Pressupostos a Questionar`**

Antes de recomendar qualquer coisa, Curia deve expor os pressupostos embutidos nas escolhas do usuário — sempre como **perguntas**, nunca afirmações.

Exemplo do seu caso:
> *"Você escolheu o nome 'Board de Executivos' e fala a linguagem de Big Tech. Isso é posicionamento intencional para founders, ou é como o mercado está te enxergando?"*

Isso força o usuário a pensar junto — e às vezes a própria resposta já resolve o problema.

**2. Regra nova no WHAT YOU NEVER DO**

> Nunca transforme um insight em declaração. Se é um insight, é uma pergunta.

Em vez de: *"seu negócio vira revenda de terceiros sem moat"*
→ *"O que você faz que impede a Curia de ser percebida como revenda de tecnologia de terceiros?"*

---

## O que NÃO muda

A estrutura toda permanece. Só entra uma seção nova entre `Problema Central` e `Recomendações`, e uma regra de comportamento. Nada mais.
