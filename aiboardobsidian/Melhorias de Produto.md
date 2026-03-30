# Melhorias de Produto

Registro de decisões de design identificadas durante o desenvolvimento — com o problema, o raciocínio e o que precisa ser construído para resolver.

---

## 001 — Quem define contexto suficiente?

**Contexto:** A Curia precisa saber quando tem contexto suficiente para entregar as seções estruturadas — vs. quando deve fazer perguntas primeiro.

**Problema atual (MVP):** O LLM decide internamente. Opaco, inconsistente, impossível de auditar ou melhorar com dados.

**Os três atores possíveis:**

| Ator | Como decide | Problema |
|---|---|---|
| LLM | Julgamento interno | Opaco, inconsistente |
| Produto | Rubrica de campos/sinais | Rígido, perde nuance |
| Founder | Sinaliza quando quer avançar | Depende do founder saber o que precisa |

Nenhum dos três funciona sozinho.

**Design para produto maduro:** O LLM avalia, torna visível, e o founder confirma.

> *"Tenho o suficiente para um diagnóstico preliminar. Posso avançar com duas suposições que precisariam ser confirmadas — ou você me conta X e Y primeiro."*

O founder escolhe. O board executa com transparência sobre o que sabe e o que está assumindo.

**O que precisa ser instrumentado:**
1. Quando a Curia decidiu avançar — qual foi o gatilho?
2. O conselho foi específico ou genérico? (proxy: founder voltou? completou o plano?)
3. O que estava presente vs. ausente quando o conselho foi bom vs. ruim

Sem instrumentação, qualquer melhoria é intuição — não produto.

**Critério de suficiência hoje (heurística MVP):** Os *Pressupostos a Questionar* conseguem citar escolhas específicas do founder — não perguntas genéricas. Se sim, há substância. Se não, falta contexto.

---

## 002 — Conversa antes de estrutura (Design Apple)

**Contexto:** Hoje a Curia entrega as 11 seções em toda resposta — inclusive na primeira, antes de entender o problema.

**Problema:** Parece um consultor com PowerPoint pronto. A estrutura aparece antes do entendimento.

**Como um board real funciona:**
```
Founder fala →
  Board faz 2 perguntas difíceis →
    Founder responde →
      Board sintetiza nas seções estruturadas
```

**O que isso exige do produto:**
- O agente precisa distinguir dois modos: *modo pergunta* e *modo síntese*
- A transição entre modos é o problema do item 001
- As 11 seções são o destino, não a interface

**Status:** Princípio documentado na Constituição do Conselho. Não implementado no prompt.

---
