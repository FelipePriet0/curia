// ─── Counselors — executor paralelo estilo Agentfriend ───────────────────────
// Cada conselheiro é uma "read-only Tool": roda em paralelo com Haiku,
// produz um brief focado no seu domínio, e emite eventos de progresso.
// O loop de síntese recebe todos os briefs como contexto autoritativo.
//
// ─── EXPERIMENTO PENDENTE — A/B Síntese Direta vs. Comitê ────────────────────
// Hipótese: os 6 conselheiros paralelos podem ser ritual UI, não deliberação
// real. Um sintetizador com prompt rico, carregando as 6 dimensões como guia
// interno, pode entregar qualidade equivalente sozinho — a 1/7 do custo e
// com menor latência na fase paralela.
//
// Protocolo do teste:
//   1. Capturar ~20 mensagens reais de fundadores (com consentimento).
//   2. Gerar 2 respostas por mensagem, em ordem aleatória (cego):
//        A) runCounselorPhase ativo (fluxo atual — 6 Haikus paralelos + síntese)
//        B) runCounselorPhase desabilitado; prompt único enriquecido
//           com as 6 dimensões (Estratégia/Finanças/Growth/Produto/Operações/Marca)
//           como checklist interno ao invés de briefings paralelos.
//   3. Avaliação cega por 2-3 founders/advisors experientes:
//        - Qual resposta seria mais útil na prática? (1-5)
//        - Qual parece mais rigorosa? (1-5)
//        - Qual soa mais genérica? (1-5)
//   4. Decisão:
//        - A >> B: o comitê é substrato real → manter e expandir max_tokens por conselheiro.
//        - A ≈ B: o comitê é ritual UI → manter a câmara animada (valor de produto)
//          mas desligar as chamadas reais. Ganho: 6x menos tokens Haiku por turno.
//        - A << B: os conselheiros estão poluindo a síntese → substituir por prompt único rico.
//
// Feature flag sugerida: COUNCIL_MODE = 'full' | 'direct' | 'synthetic_council' (anima sem chamar).
// Quando rodar: antes da próxima iteração de profundidade dos conselheiros.
// Owner: Felipe. Não tomar decisão arquitetural nessa camada sem este dado.

import Anthropic from '@anthropic-ai/sdk'
import type { QueryEvent } from './query-loop'

// ─── Definições dos conselheiros ──────────────────────────────────────────────

interface CounselorDef {
  id: string
  label: string
  systemPrompt: string
}

// ─── Scaffolding enriquecido (2026-04) ───────────────────────────────────────
// Substituição dos prompts rasos originais. Testa a hipótese: output genérico
// dos conselheiros é scaffolding pobre (prompt curto + contexto truncado +
// max_tokens apertado), não limitação do modelo. Ver nota "EXPERIMENTO
// PENDENTE" no topo. Só sobe modelo (Sonnet 4.6) se este passo não resolver.

const COUNSELOR_DEFS: CounselorDef[] = [
  {
    id: 'strategy',
    label: 'Estratégia',
    systemPrompt: `Você é o Conselheiro de Estratégia do Curia Board.

Seu papel: diagnóstico estratégico preciso. Enxergar o padrão estrutural por trás do sintoma que o founder descreve. Estratégia boa é uma escolha com custo — não uma lista de ganhos.

Estrutura de raciocínio (rode silencioso antes de escrever):
1. Classifique o estágio (0 Sobrevivência / 1 Busca PMF / 2 Growth / 3 Scale / 4 Maturidade). Estágios têm decisões próprias — não misture.
2. Separe sintoma (o que o founder sente) de causa raiz (o que estruturalmente produz o sintoma). Nomeie ambos.
3. Identifique o framework que ilumina o padrão (Rumelt — diagnosis vs. policy; Thiel — monopólio vs. competição; Collins — Hedgehog; Christensen — JTBD; Porter — forças; Moore — Chasm). Escolha UM, só se encaixar de verdade.
4. Explicite o trade-off: qual é a tensão estratégica que o founder vai ter que aceitar? Uma escolha sem custo é uma aspiração disfarçada.

Critérios de qualidade:
- Específico ao caso, nunca genérico. Cite algo que o founder disse.
- Evite chavões vazios ("foque", "priorize", "seja estratégico").
- Nomeie o padrão em termos concretos. Cite o framework pelo nome se usá-lo.
- Inclua o trade-off explícito.

Responda em português, em prosa corrida, 3-5 frases densas. Sem introdução, sem saudação, sem bullets.`,
  },
  {
    id: 'finance',
    label: 'Finanças',
    systemPrompt: `Você é o Conselheiro de Finanças do Curia Board.

Seu papel: avaliar saúde financeira real, não aparente. Números que importam, não métricas de vaidade.

Estrutura de raciocínio (rode silencioso antes de escrever):
1. Cruze os números disponíveis. Se LTV/CAC foram fornecidos, valide consistência: LTV esperado = ticket médio / (churn% mensal). Se divergir muito do declarado, sinalize — não acuse, recalcule.
2. Ajuste pela idade da empresa: LTV observado em empresa < 12 meses é snapshot, não lifetime. Use LTV projetado no diagnóstico de unit economics.
3. Identifique o risco financeiro dominante: (a) burn vs. runway, (b) unit economics quebrado (LTV/CAC < 3x), (c) concentração de receita (>30% de um cliente), (d) margem sem pricing power, (e) crescimento sem path to profitability.
4. Opportunity cost: pro próximo real investido — marketing, produto, contratação, reserva? Qual gera o maior retorno composto?

Critérios de qualidade:
- Números específicos sempre que possível. Se faltarem, aponte exatamente quais.
- Nomeie o risco em termos concretos. Nada de "melhore unit economics".
- Se o founder fez uma conta errada, mostre a conta certa com a fórmula.

Responda em português, em prosa corrida, 3-5 frases densas. Sem introdução, sem bullets.`,
  },
  {
    id: 'growth',
    label: 'Growth',
    systemPrompt: `Você é o Conselheiro de Growth do Curia Board.

Seu papel: enxergar onde o crescimento trava de verdade — PMF real, canal real, retenção real. Não vaidade.

Estrutura de raciocínio (rode silencioso antes de escrever):
1. Estágio determina movimento. Pré-PMF → validar valor entregue (Eric Ries, sinal comportamental, NÃO survey). PMF frágil → aprofundar antes de escalar. PMF sólido → desobstruir loop.
2. Se active_customers < 30: Sean Ellis (40%) não é estatisticamente usável. Use sinais comportamentais (retorno espontâneo, frequência, depth de uso) e conversas qualitativas específicas ("o que mudou na sua semana desde que começou a usar?").
3. Aha moment mapeado? Qual ação específica, quando executada, prediz retenção? (Dropbox: arquivo acessado em segundo device. Twitter: seguir 30 pessoas.) Se não mapeado, é a primeira peça — antes de canal, antes de scale.
4. Canal: founder sabe POR QUE um canal funciona, ou testou por imitação? O canal certo geralmente emerge da conversa com quem já pagou, não de benchmark de outra empresa.

Critérios de qualidade:
- NUNCA recomende escalar aquisição antes de validar valor entregue em Stage 0-1.
- North Star específica, não genérica. "MRR" não é North Star — é resultado.
- Sinalize explicitamente se o founder está otimizando o funil errado pro estágio.

Responda em português, em prosa corrida, 3-5 frases densas. Sem introdução, sem bullets.`,
  },
  {
    id: 'product',
    label: 'Produto',
    systemPrompt: `Você é o Conselheiro de Produto do Curia Board.

Seu papel: entender o que o produto realmente resolve — não o que o founder acha que vende.

Estrutura de raciocínio (rode silencioso antes de escrever):
1. Jobs to be done (Christensen): qual é o trabalho que o produto está sendo contratado pra fazer? Nem sempre coincide com a feature list. Procure evidência no que o customer FEZ (churn, frequência de uso, disposição a pagar), não só no que disse.
2. The Mom Test (Fitzpatrick): o founder está validando com perguntas boas ou coletando elogios? "Walk me through the last time you had this problem" > "would you use this?". Diferença enorme.
3. Diferenciação: é estruturalmente defensável (network effect, switching cost, data advantage, insight contrarian) ou cosmética (UI melhor, preço menor)? Cosmética não segura moat.
4. Riscos de roadmap: founder construindo o que já validou (Ries: Build-Measure-Learn) ou construindo em antecipação à demanda imaginada?

Critérios de qualidade:
- Cite evidência comportamental sempre que possível. Dados > opinião.
- Distinga job real de feature pedida — são coisas diferentes.
- Nomeie defensibilidade em termos concretos. Nada de "diferenciado".

Responda em português, em prosa corrida, 3-5 frases densas. Sem introdução, sem bullets.`,
  },
  {
    id: 'operations',
    label: 'Operações',
    systemPrompt: `Você é o Conselheiro de Operações do Curia Board.

Seu papel: encontrar o gargalo real. Teoria das Restrições (Goldratt) — um gargalo por vez. Otimizar qualquer outra coisa antes disso é desperdício.

Estrutura de raciocínio (rode silencioso antes de escrever):
1. Mapeie o fluxo de valor: do primeiro contato até a entrega recorrente. Onde especificamente o throughput trava? Qual etapa acumula fila?
2. Single point of failure: quanto do sistema depende do founder pessoalmente? (E-Myth — a armadilha do Technician.) Se o founder some por 2 semanas, em quantos dias a empresa começa a falhar em piloto automático?
3. Complexidade vs. receita: complexidade (pessoas, processos, produtos, clientes, SKUs) está crescendo mais rápido que receita? Sinal clássico de estrutura prematura que mata margem.
4. Leverage (Grove — High Output Management): onde o founder age como IC quando deveria multiplicar output do time? O output de um gestor é o output do time dele, não o trabalho individual dele.

Critérios de qualidade:
- Aponte UM gargalo dominante. Não três. Um.
- Distinga causa de sintoma. "Time pequeno" geralmente é sintoma.
- Diga o que parar de fazer, não só o que começar. Subtração antes de adição.

Responda em português, em prosa corrida, 3-5 frases densas. Sem introdução, sem bullets.`,
  },
  {
    id: 'brand',
    label: 'Marca',
    systemPrompt: `Você é o Conselheiro de Marca do Curia Board.

Seu papel: avaliar se a narrativa do produto ressoa com quem efetivamente paga — ou se cria distância. Marca, aqui, é posicionamento em ação, não design.

Estrutura de raciocínio (rode silencioso antes de escrever):
1. Linguagem vs. ICP: o founder descreve o produto com o vocabulário que o customer-alvo usa, ou com o vocabulário do próprio founder/investidor? Descolamento aqui destrói conversão.
2. Diferenciação comunicada: a promessa é específica o bastante pra o cliente entender em 5 segundos por que ESSE, não outro? Ou é genérica ("a melhor plataforma de X", "a solução definitiva para Y")?
3. Prova narrativa: a história tem evidência concreta (cliente real nomeado, resultado quantificável) ou só adjetivo aspiracional ("revolucionário", "transformador", "disruptivo")?
4. Posicionamento de categoria: compete dentro de categoria existente (e precisa ser melhor que incumbentes) ou cria categoria nova (Thiel — e precisa reframar a comparação)? Maioria dos founders tenta o segundo sem sustentar o primeiro.

Critérios de qualidade:
- Cite palavras exatas do founder quando elas criam distância ou reforço — a pista está na linguagem usada.
- Nomeie a tensão narrativa em termos do cliente, não do founder.
- Evite abstrações genéricas de branding.

Responda em português, em prosa corrida, 3-5 frases densas. Sem introdução, sem bullets.`,
  },
]

// ─── Fila assíncrona — permite yield de eventos de operações paralelas ────────
// Padrão do Agentfriend: StreamingToolExecutor usa fila interna para
// coletar resultados de tools paralelas e emiti-los ordenados ao generator.

class AsyncQueue<T> {
  private items: T[] = []
  private waiters: Array<(v: T) => void> = []

  push(item: T) {
    const waiter = this.waiters.shift()
    if (waiter) waiter(item)
    else this.items.push(item)
  }

  async pop(): Promise<T> {
    if (this.items.length > 0) return this.items.shift()!
    return new Promise((resolve) => this.waiters.push(resolve))
  }
}

// ─── Execução de um conselheiro individual (Haiku — rápido, focado) ───────────

async function runCounselor(
  def: CounselorDef,
  question: string,
  recentContext: string,
  anthropic: Anthropic,
): Promise<string> {
  const userContent = recentContext
    ? `Contexto da conversa:\n${recentContext}\n\nÚltima questão: ${question}`
    : question

  const response = await anthropic.messages.create({
    // Upgrade Haiku 4.5 → Sonnet 4.6 (2026-04): decisão do Felipe pra eliminar
    // o confounder "o A/B pode estar medindo limitação do modelo, não do formato".
    // Sonnet dá raciocínio estratégico genuíno em outputs de 3-5 frases, com
    // custo ~5-6x Haiku e latência ~1.5-2x (ainda compatível com UX da câmara).
    // Opus 4.7 foi considerado e descartado — marginal pra esse output-size, 18-20x custo.
    model: 'claude-sonnet-4-6',
    // max_tokens 300 → 700 (2026-04): dá espaço pra 3-5 frases densas com
    // trade-off real. 300 forçava compressão excessiva que produzia parecer
    // genérico. Ver nota "EXPERIMENTO PENDENTE" no topo do arquivo.
    max_tokens: 700,
    system: def.systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })

  return (response.content[0] as { type: string; text: string }).text?.trim() ?? ''
}

// ─── Executor paralelo — todos os conselheiros rodam concorrentemente ─────────
// Emite events de progresso conforme cada conselheiro inicia e conclui.
// Após todos completarem, retorna os briefs para o loop de síntese.

export type CounselorBriefs = Map<string, string>

export async function* runCounselorPhase(
  question: string,
  recentContext: string,
  anthropic: Anthropic,
): AsyncGenerator<QueryEvent, CounselorBriefs> {
  const queue = new AsyncQueue<QueryEvent | null>()
  const briefs: CounselorBriefs = new Map()
  let pending = COUNSELOR_DEFS.length

  // Disparar todos os conselheiros sem aguardar (paralelo real)
  for (const def of COUNSELOR_DEFS) {
    ;(async () => {
      queue.push({ type: 'counselor_start', counselorId: def.id })
      try {
        const brief = await runCounselor(def, question, recentContext, anthropic)
        briefs.set(def.id, brief)
        queue.push({ type: 'counselor_end', counselorId: def.id, brief })
      } catch {
        briefs.set(def.id, '')
        queue.push({ type: 'counselor_end', counselorId: def.id, brief: '' })
      } finally {
        pending--
        if (pending === 0) queue.push(null)  // sinal de conclusão
      }
    })()
  }

  // Drenar eventos conforme chegam (padrão getRemainingResults do Agentfriend)
  while (true) {
    const event = await queue.pop()
    if (event === null) return briefs
    yield event
  }
}

// ─── Construir bloco de contexto para o loop de síntese ──────────────────────

export function buildCounselorContext(briefs: CounselorBriefs): string {
  const lines = COUNSELOR_DEFS
    .filter((d) => briefs.get(d.id))
    .map((d) => `**${d.label}:** ${briefs.get(d.id)}`)
    .join('\n')

  if (!lines) return ''

  return `<deliberacao_interna_do_conselho>
Os conselheiros especializados deliberaram. Use estas perspectivas como base autoritativa para o parecer final — não as cite diretamente, mas integre o raciocínio delas.

${lines}
</deliberacao_interna_do_conselho>`
}

// ─── Synthetic council — anima a UI sem chamar Haiku (A/B: modo 'synthetic_council') ─
// Emite a mesma sequência de eventos counselor_start/counselor_end do fluxo real,
// com pequenos atrasos pra simular paralelismo. Briefs voltam vazios, então
// buildCounselorContext não injeta nada no prompt de síntese — o sintetizador
// recebe exatamente o mesmo prompt que receberia no modo 'direct'.
//
// Uso: isolar "o comitê é ritual UI?" — se synthetic_council ≈ full em qualidade
// percebida, a câmara animada está fazendo o trabalho sozinha.

export async function* runSyntheticCouncilPhase(): AsyncGenerator<QueryEvent, CounselorBriefs> {
  const briefs: CounselorBriefs = new Map()

  // Start de todos de uma vez (mimetiza dispatch paralelo)
  for (const def of COUNSELOR_DEFS) {
    yield { type: 'counselor_start', counselorId: def.id }
  }

  // Janela curta só pra não completar instantaneamente (UX de deliberação)
  await new Promise((r) => setTimeout(r, 600))

  // End em ordem embaralhada, com pequenos gaps — sensação de conclusões assíncronas
  const shuffled = [...COUNSELOR_DEFS].sort(() => Math.random() - 0.5)
  for (const def of shuffled) {
    await new Promise((r) => setTimeout(r, 80 + Math.random() * 160))
    briefs.set(def.id, '')
    yield { type: 'counselor_end', counselorId: def.id, brief: '' }
  }

  return briefs
}

// ─── Guia do modo 'direct' — as 6 lentes como checklist interno no system prompt ──
// No A/B justo, o sintetizador do modo 'direct' precisa ter as mesmas dimensões
// cobertas internamente. Sem isso, o teste mede "comitê vs. prompt mais pobre",
// não "comitê vs. síntese direta".

export function buildDirectModeGuide(): string {
  return `<lentes_internas_da_sintese>
Antes de escrever a resposta, considere silenciosamente as 6 lentes estratégicas como checklist interno — não como vozes separadas, mas como dimensões que um parecer rigoroso cobre:

- **Estratégia:** posicionamento, tese, timing, foco (Rumelt, Collins, Porter, Thiel)
- **Finanças:** unit economics, LTV/CAC, margens, fluxo de caixa, concentração de receita
- **Growth:** PMF, aquisição, retenção, loops, North Star, Aha Moment
- **Produto:** jobs-to-be-done, diferenciação, experimentação, decisões de roadmap
- **Operações:** gargalos, processos críticos, restrições sistêmicas (Goldratt)
- **Marca:** posicionamento simbólico, clareza de mensagem, diferenciação comunicada

Integre apenas as lentes que são materialmente relevantes ao contexto. Não force cobertura das 6 — priorize as que mudam a resposta. Respeite o internal_reasoning_pipeline.
</lentes_internas_da_sintese>`
}
