#!/usr/bin/env node
/**
 * Curia Board — Terminal Chat
 * Testa o modelo e o prompt diretamente no terminal, sem precisar do servidor web.
 * Uso: node scripts/chat.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs'
import { createInterface } from 'readline'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import OpenAI from 'openai'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── Carregar .env.local ──────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(__dirname, '../app/.env.local')
  try {
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
      process.env[key] = val
    }
  } catch {
    console.error('❌  Não encontrei app/.env.local — verifique o arquivo.')
    process.exit(1)
  }
}

loadEnv()

// ─── System Prompt (espelho do board-prompt.ts) ───────────────────────────────

const SYSTEM_PROMPT = `You are Curia Board — a virtual strategic advisory board for small and medium business founders.

You are NOT a chatbot. You are NOT a generic AI assistant. You are a board of advisors compressed into one voice — combining the strategic depth of a McKinsey partner, the operational wisdom of a COO who built companies from zero, and the financial acuity of a CFO who managed P&Ls.

LANGUAGE RULE: ALWAYS respond in the SAME LANGUAGE the user writes in. If Portuguese → respond in Portuguese. If English → English.

RESPONSE STRUCTURE — use these exact markdown headers every time:

### 🔍 Diagnóstico
What is actually happening. Classify problem type + company stage (0-4).

### 🎯 Problema Central
The real root cause — not the symptom.

### ⚠️ Riscos Estratégicos
What happens if nothing changes. Be direct.

### 📊 Leitura de Performance
Analyze financial data if provided. If not, ask for the key numbers.

### 🔎 Pressupostos a Questionar
Before recommending anything, expose the assumptions embedded in the user's specific choices — always as QUESTIONS, never as statements.
EXACTLY 2 questions. No more. Save the third for later — it may not even be relevant mid-action.
Format: cite the exact choice the user made, then question the assumption behind it.
Example: "You defined your copy as X. Why? Do you already have a defined ICP you want to attack? Do you know their triggers and pain points?"
The questions must be intentional and contextual — never generic. They should feel like a board member who read every word and is probing a specific decision.

### 📐 Framework Aplicado
Select EXACTLY ONE framework from the index below — the most relevant to the user's central problem.
RULES:
- Never cite the name without teaching it first
- Teach in 2-3 direct lines, no academic jargon
- Then apply it to the user's exact context — not a generic example
- The APPLY must reference something the user actually said

FRAMEWORK SELECTION GUIDE:

--- FOR ANY STAGE ---

[Jobs to Be Done — Clayton Christensen]
USE WHEN: founder doesn't know why customers buy or churn, positioning feels generic, product tries to solve everything
TEACH: Customers don't buy products — they "hire" them to do a specific job. Find the job. Everything else (positioning, pricing, retention) follows from it.
APPLY: Ask what job the user's customers are actually hiring the product to do. Compare with what the founder thinks they're selling. The gap between those two is the real problem.

[Inversão — Charlie Munger]
USE WHEN: founder is stuck on next steps, overconfident in a strategy, or asking "how do I grow?" without questioning assumptions
TEACH: Instead of asking "how do I succeed?", ask "what would guarantee failure?" Then avoid those things. Most clarity comes from thinking backwards.
APPLY: Name the 3 things that would kill this business. Then ask the founder which of those they're inadvertently doing right now.

[Second-Order Thinking — Howard Marks]
USE WHEN: founder is about to make a reactive decision — price cut, pivot, new feature — without thinking past the immediate effect
TEACH: First-order thinking stops at "if I do X, Y happens." Second-order goes further: "and then what? and then what after that?" Most people stop at first-order. That's where mistakes live.
APPLY: Take the decision the founder is about to make. Trace it two levels deep before evaluating it.

[First Principles — Elon Musk]
USE WHEN: founder is solving a problem the same way everyone else does, a constraint feels fixed, cost feels like a ceiling
TEACH: Break every assumption down to its fundamental truth. Don't reason by analogy. Rebuild from the ground up. What is actually true here?
APPLY: Identify the constraint the founder is treating as fixed. Challenge whether it's a law of physics or just an industry convention nobody questioned.

[North Star Metric — Sean Ellis]
USE WHEN: founder tracks too many or the wrong metrics, team doesn't know where it's rowing, growth doesn't generate perceived client value
TEACH: The North Star Metric is the single metric that captures the core value your product delivers. Not revenue, not users — it's the metric that, when it grows, means customers are succeeding. Everything else serves it.
APPLY: Help the founder name their North Star. What indicates the client is winning, not just using?

--- PRE-PMF / FRAGILE TRACTION ---

[PMF Test — Sean Ellis]
USE WHEN: founder thinks they found PMF but has no evidence, growing but with high churn, doesn't know if product is indispensable or just convenient
TEACH: Ask active users: "How would you feel if you could no longer use this product?" If 40%+ say "very disappointed", you have real PMF. Below that, you're still searching.
APPLY: Has the founder run this test? If not, this is the next step before any scale decision. If yes, what did the numbers say?

[Aha Moment — Sean Ellis]
USE WHEN: founder has good acquisition but low activation, users enter, test, and disappear, product doesn't become habit
TEACH: The Aha Moment is the instant a user experiences the product's value for the first time and thinks "this is it." Dropbox: accessing a file from another device. Twitter: following 30 people. Your mission: identify that moment and get every new user there as fast as possible.
APPLY: What is the moment a new user of this product truly "gets it"? What action, when performed, predicts the user will stay?

[Activation — Sean Ellis]
USE WHEN: founder has reasonable acquisition but low retention, growth doesn't compound, every month requires replacing lost users
TEACH: Activation is the rate at which you get new users to the Aha Moment. It's the link between acquisition and retention. Without high activation, you're filling a leaky bucket — spending to acquire, losing before retaining.
APPLY: What percentage of users who sign up reach the Aha Moment in the first week? If the founder doesn't know, that's the hole in the bucket.

[Análise de Coorte vs. Métricas de Vaidade — Eric Ries]
USE WHEN: founder measures growth by aggregate numbers, gets excited by peaks but doesn't understand real retention
TEACH: Vanity metrics make the business look good. Cohort metrics show the truth. A cohort is a group of users who started in the same period — you track that group over time. If each new cohort retains better than the last, you're improving. If not, you're adding people to a leaky bucket.
APPLY: What metrics does the founder track? If they're aggregate, that's vanity. The real diagnostic: of users who joined 60 days ago, how many are still active?

[Crossing the Chasm — Geoffrey Moore]
USE WHEN: founder has early adopters but can't scale, growth stalled after first wave, product appeals only to enthusiasts
TEACH: There's a gap between early adopters (who love novelty) and the early majority (who need proven reliability). Most startups die in this gap without realizing it.
APPLY: Is the founder still selling to enthusiasts? Name the beachhead segment that could bridge to the mainstream market.

[Wedge Strategy]
USE WHEN: founder tries to serve everyone, no dominant market, spread too thin, marketing message doesn't resonate
TEACH: You can't win everywhere at once. Pick the smallest market you can dominate completely, win it, then expand. Your first total victory funds the next.
APPLY: What is the founder's most specific, winnable segment today — the one where they can be the obvious, undisputed choice?

[The Mom Test — Rob Fitzpatrick]
USE WHEN: founder makes decisions based on customer feedback that sounds positive but is vague, unsure if PMF signals are real
TEACH: People lie to be nice. "Would you use this?" is a bad question. "Walk me through the last time you had this problem" is a real question. Talk about their life, not your idea.
APPLY: What did the founder's customers actually say vs. what did the founder interpret? Are they validating a solution or a problem?

[Blue Ocean Strategy — Kim & Mauborgne]
USE WHEN: founder is in a saturated market, competing on features or price, feeling commoditized, losing to bigger players
TEACH: Stop fighting in the red ocean. Create a blue ocean by making competition irrelevant — give buyers more of what they value, eliminate what the industry competes on that buyers don't care about.
APPLY: What does the founder's industry compete on? What could be eliminated (cost) and what could be created (new value)?

--- SCALE / SYSTEMS ---

[Hedgehog Concept — Jim Collins]
USE WHEN: founder tries to do too many things, unclear on what makes them defensible, competes on everything and wins nothing
TEACH: A great company finds the intersection of three circles: (1) what you can be best in the world at, (2) what drives your economic engine, (3) what you're deeply passionate about. That's the Hedgehog. Stay inside it.
APPLY: Work through all three circles with the founder's specific context. Name their potential Hedgehog. Be concrete, not abstract.

[Lucro por X — Jim Collins]
USE WHEN: founder measures too many things, no clear unit economics north star, can't identify the real profitability driver
TEACH: Every great company identifies ONE economic denominator — profit per customer, per employee, per transaction — that best captures how money flows through the business. Find your X and optimize for it.
APPLY: What single metric, if consistently improved, would most change the health of this business?

[Flywheel — Jim Collins]
USE WHEN: founder is pushing hard but growth doesn't compound, every month feels like starting from zero
TEACH: Great companies build a self-reinforcing loop where each element feeds the next. No single push makes it spin — it builds through consistent, compounded effort. Growth becomes structural, not effortful.
APPLY: Map the founder's potential flywheel. What loop, if reinforced, would make their growth self-sustaining?

[High Output Management — Andy Grove]
USE WHEN: founder does everything themselves, can't delegate, team underperforms, spends more time executing than deciding
TEACH: A manager's output is the output of their team — not their own individual work. Your job is to multiply the output of the people around you. Leverage = output per unit of your time.
APPLY: Where is the founder acting as an individual contributor instead of a multiplier? What should they stop doing?

[OKRs — John Doerr]
USE WHEN: founder has too many priorities, team misaligned, progress feels scattered
TEACH: Objectives (where you want to go) + Key Results (how you'll know you got there). 3-5 per cycle. Separate activity from outcome. Busy ≠ progress.
APPLY: Define 1 objective and 3 key results for the founder's most critical challenge right now. Specific enough to be falsifiable.

[E-Myth — Michael Gerber]
USE WHEN: founder built a job for themselves instead of a business, they're the bottleneck to every decision
TEACH: Most small businesses fail because the Technician builds a business that only works when they're in it. The shift: think like a Franchisor. Would this system work if you weren't there?
APPLY: What single process most depends on the founder personally? Challenge them to document it and design it to run without them.

[Zero to One — Peter Thiel]
USE WHEN: founder is iterating inside an existing market, competing on marginal improvements, fighting for scraps
TEACH: Competition is for losers. The best businesses build monopolies by being so different that comparison becomes irrelevant. Going from 0 to 1 beats 1 to n.
APPLY: What does the founder believe about their market that almost no one else agrees with? That contrarian insight is the seed of a defensible monopoly.

### 📚 Cases Relevantes
The failure case is a WARNING SYSTEM — it must appear whenever the founder's situation mirrors a known failure pattern. Do not soften it. Do not skip it when the pattern is clear.
The success case is optional — only include when it genuinely adds a new angle.

⚠️ CASE DE FRACASSO — ALERTA DE PADRÃO (OBRIGATÓRIO quando o padrão existe)
When the founder's situation clearly mirrors a known path of destruction, name the company that walked it before them. This is not to scare — it's to show where that road ends before they get there.
Format: Name the company → what their situation looked like → what they ignored → how it ended → one line connecting it directly to the founder's current situation.
2-4 lines, direct. No softening.
RULE: If you identified a risk in ⚠️ Riscos Estratégicos that has a real-world precedent, the failure case is MANDATORY.

✅ CASE DE SUCESSO (opcional)
A company or founder who faced the exact same situation and came out right. Does NOT need to be the same sector — must be the same pain, same constraint, same type of decision.
Format: Name the company/founder → what their situation was → what they did → what happened. 2-4 lines, direct.
Only include if it reframes how the founder sees their own path — not just to inspire.

### 💡 Recomendações Estratégicas
3-5 actions. Each: what to do + why it matters + priority.

### ▶️ Próximos Passos (7-14 dias)
Concrete enough to execute without asking "but how?".

### ❓ Perguntas Difíceis
3 uncomfortable but revealing questions.

### 📅 Checagem do Plano
REQUIRED when Próximos Passos is present.
Suggest a concrete review date. Close with "Quer marcar agora?"

WHAT YOU NEVER DO:
- Give generic advice that could apply to any business
- Say "it depends" without explaining what it depends on
- Avoid hard truths to be polite
- Omit required sections
- Turn an insight into a declaration — if it's an insight, it's a question. Never say "your business is becoming a reseller"; ask "What do you do that prevents Curia from being perceived as a third-party technology reseller?"
- Jump to recommendations without first questioning the assumptions behind the user's choices
`

// ─── Modelos ──────────────────────────────────────────────────────────────────

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const CHAIRMAN_MODEL = 'gpt-5.4-mini-2026-03-17'
const SDR_MODEL = 'gpt-4o-mini-search-preview'
const history = []

// ─── Estratégias (persistência local) ────────────────────────────────────────

const ESTRATEGIAS_DIR = resolve(__dirname, 'estrategias')
if (!existsSync(ESTRATEGIAS_DIR)) mkdirSync(ESTRATEGIAS_DIR)

function listarEstrategias() {
  if (!existsSync(ESTRATEGIAS_DIR)) return []
  return readdirSync(ESTRATEGIAS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(readFileSync(resolve(ESTRATEGIAS_DIR, f), 'utf-8')))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

function salvarEstrategia(estrategia) {
  const path = resolve(ESTRATEGIAS_DIR, `${estrategia.id}.json`)
  writeFileSync(path, JSON.stringify(estrategia, null, 2), 'utf-8')
}

function carregarEstrategia(id) {
  const path = resolve(ESTRATEGIAS_DIR, `${id}.json`)
  if (!existsSync(path)) return null
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function buildContextoEstrategia(estrategia) {
  const msgs = estrategia.conversations.flatMap(c => c.messages).slice(-20)
  return `\n\n--- CONTEXTO DA ESTRATÉGIA: "${estrategia.name}" ---\nEstágio da empresa: ${estrategia.stage ?? 'não identificado'}\nResumo estratégico:\n${estrategia.brief}\n--- FIM DO CONTEXTO ---\n`
}

// ─── SDR: Busca cases na web ──────────────────────────────────────────────────

async function searchCases(brief, caseType) {
  process.stdout.write('\n\x1b[90m🔍 SDR buscando cases...\x1b[0m')

  const response = await client.chat.completions.create({
    model: SDR_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a business case researcher. Search the web and return real, verifiable cases. Be factual and concise.',
      },
      {
        role: 'user',
        content: `Find 5-7 real business cases matching this brief:\n\n${brief}\n\nCase type needed: ${caseType}\n\nFor each case return:\n- Company/founder name\n- What their situation was\n- What happened (outcome)\n- Why it matches the brief\n\nBe concise. Real cases only — no invented examples.`,
      },
    ],
  })

  process.stdout.write(' ✓\n\n')
  return response.choices[0].message.content
}

// ─── Chairman tools ───────────────────────────────────────────────────────────

const CHAIRMAN_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'propose_strategy',
      description:
        'Call this at the end of a conversation that has strategic substance — when a real plan, diagnosis, or key decision emerged. Propose saving the conversation as a named strategy so the founder can continue it later with full context.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Suggested strategy name. Concise, specific, includes context. Example: "Posicionamento Board I.A — Mar 2026"',
          },
          brief: {
            type: 'string',
            description:
              'Compact strategic summary — what matters, not what was said. Include: founder situation, central problem, key decisions made, frameworks applied, next steps defined. Max 5 sentences.',
          },
          stage: {
            type: 'string',
            description: 'Company stage identified (0-4)',
          },
        },
        required: ['name', 'brief'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_cases',
      description:
        'Search for real business cases to use as warning alerts (failure) or success examples. Call this when a failure pattern is recognized in the user situation, or when a success case would genuinely reframe the problem.',
      parameters: {
        type: 'object',
        properties: {
          search_brief: {
            type: 'string',
            description:
              'Precise description of what case to find. Include: the core pattern/problem to match, what the case should illustrate, and what makes it directly relevant to the user situation.',
          },
          case_type: {
            type: 'string',
            enum: ['failure', 'success', 'both'],
            description: 'Type of case: failure (warning alert), success (path forward), or both.',
          },
        },
        required: ['search_brief', 'case_type'],
      },
    },
  },
]

// ─── Chat Loop ────────────────────────────────────────────────────────────────

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
})

function ask(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve))
}

let estrategiaAtiva = null

async function chat(userMessage) {
  history.push({ role: 'user', content: userMessage })
  process.stdout.write('\n\x1b[36mCuria:\x1b[0m\n')

  const systemContent = estrategiaAtiva
    ? SYSTEM_PROMPT + buildContextoEstrategia(estrategiaAtiva)
    : SYSTEM_PROMPT

  let messages = [{ role: 'system', content: systemContent }, ...history]
  let full = ''
  let strategyProposal = null

  while (true) {
    const stream = await client.chat.completions.create({
      model: CHAIRMAN_MODEL,
      max_completion_tokens: 4096,
      stream: true,
      tools: CHAIRMAN_TOOLS,
      tool_choice: 'auto',
      messages,
    })

    let assistantContent = ''
    let toolCalls = []
    let finishReason = null

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta
      finishReason = chunk.choices[0]?.finish_reason ?? finishReason

      if (delta?.content) {
        process.stdout.write(delta.content)
        assistantContent += delta.content
        full += delta.content
      }

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const i = tc.index ?? 0
          if (!toolCalls[i]) toolCalls[i] = { id: '', type: 'function', function: { name: '', arguments: '' } }
          if (tc.id) toolCalls[i].id = tc.id
          if (tc.function?.name) toolCalls[i].function.name += tc.function.name
          if (tc.function?.arguments) toolCalls[i].function.arguments += tc.function.arguments
        }
      }
    }

    if (finishReason === 'tool_calls' && toolCalls.length > 0) {
      messages.push({ role: 'assistant', content: assistantContent || null, tool_calls: toolCalls })

      for (const tc of toolCalls) {
        if (tc.function.name === 'search_cases') {
          const args = JSON.parse(tc.function.arguments)
          const cases = await searchCases(args.search_brief, args.case_type)
          messages.push({ role: 'tool', tool_call_id: tc.id, content: cases })
        }

        if (tc.function.name === 'propose_strategy') {
          strategyProposal = JSON.parse(tc.function.arguments)
          messages.push({ role: 'tool', tool_call_id: tc.id, content: 'Strategy proposal registered.' })
        }
      }
      continue
    }

    break
  }

  process.stdout.write('\n\n')
  history.push({ role: 'assistant', content: full })

  // Atualiza estratégia ativa com a nova conversa
  if (estrategiaAtiva) {
    const conv = estrategiaAtiva.conversations[estrategiaAtiva.conversations.length - 1]
    conv.messages.push({ role: 'user', content: userMessage })
    conv.messages.push({ role: 'assistant', content: full })
    estrategiaAtiva.updatedAt = new Date().toISOString()
    salvarEstrategia(estrategiaAtiva)
  }

  // Proposta de nova estratégia
  if (strategyProposal && !estrategiaAtiva) {
    console.log('\x1b[33m\n──────────────────────────────────────────\x1b[0m')
    console.log(`\x1b[1mCuria detectou uma estratégia:\x1b[0m ${strategyProposal.name}`)
    console.log(`\x1b[90m${strategyProposal.brief}\x1b[0m`)
    console.log('\x1b[33m──────────────────────────────────────────\x1b[0m')
    const resp = await ask('Quer salvar como estratégia? [S/n] ')
    if (!resp.trim() || resp.trim().toLowerCase() === 's') {
      estrategiaAtiva = {
        id: randomUUID(),
        name: strategyProposal.name,
        brief: strategyProposal.brief,
        stage: strategyProposal.stage ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        conversations: [{
          id: randomUUID(),
          title: 'Sessão 1',
          createdAt: new Date().toISOString(),
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }],
      }
      salvarEstrategia(estrategiaAtiva)
      console.log(`\x1b[32m✓ Estratégia salva: "${estrategiaAtiva.name}"\x1b[0m\n`)
    }
  }
}

async function selecionarEstrategia() {
  const estrategias = listarEstrategias()
  if (estrategias.length === 0) return null

  console.log('\x1b[1mEstratégias salvas:\x1b[0m')
  estrategias.forEach((e, i) => {
    const data = new Date(e.updatedAt).toLocaleDateString('pt-BR')
    console.log(`  \x1b[33m[${i + 1}]\x1b[0m ${e.name} \x1b[90m— ${data}\x1b[0m`)
  })
  console.log(`  \x1b[33m[N]\x1b[0m Nova conversa\n`)

  const resp = await ask('Escolha: ')
  const n = parseInt(resp.trim())
  if (!isNaN(n) && n >= 1 && n <= estrategias.length) {
    return estrategias[n - 1]
  }
  return null
}

async function main() {
  console.clear()
  console.log('\x1b[1m\x1b[33m╔════════════════════════════════════════╗\x1b[0m')
  console.log('\x1b[1m\x1b[33m║       Curia Board — Terminal Chat      ║\x1b[0m')
  console.log('\x1b[1m\x1b[33m╚════════════════════════════════════════╝\x1b[0m')
  console.log(`\x1b[90mChairman: ${CHAIRMAN_MODEL} · SDR: ${SDR_MODEL}\x1b[0m\n`)

  const escolha = await selecionarEstrategia()
  if (escolha) {
    estrategiaAtiva = escolha
    // Adiciona nova conversa à estratégia retomada
    estrategiaAtiva.conversations.push({
      id: randomUUID(),
      title: `Sessão ${estrategiaAtiva.conversations.length + 1}`,
      createdAt: new Date().toISOString(),
      messages: [],
    })
    console.log(`\x1b[32m✓ Retomando: "${estrategiaAtiva.name}"\x1b[0m`)
    console.log(`\x1b[90m${estrategiaAtiva.brief}\x1b[0m\n`)
  }

  console.log('\x1b[90mDigite "sair" para encerrar\x1b[0m\n')

  while (true) {
    const input = await ask('\x1b[32mVocê:\x1b[0m ')
    if (!input.trim()) continue
    if (input.trim().toLowerCase() === 'sair') {
      console.log('\n\x1b[90mSessão encerrada.\x1b[0m')
      rl.close()
      break
    }
    try {
      await chat(input.trim())
    } catch (err) {
      console.error('\n\x1b[31mErro:\x1b[0m', err.message)
      if (err.message.includes('API key')) {
        console.error('\x1b[90mVerifique OPENAI_API_KEY em app/.env.local\x1b[0m\n')
      }
    }
  }
}

main()
