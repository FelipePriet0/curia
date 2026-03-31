import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import type { StrategyProposal } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LLMMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface LLMOptions {
  system: string
  messages: LLMMessage[]
}

// ─── Clients ──────────────────────────────────────────────────────────────────

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
  return new Anthropic({ apiKey })
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
  return new OpenAI({ apiKey })
}

// ─── Tool Definitions (Plano 4 + 5) ──────────────────────────────────────────

const SEARCH_CASES_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'search_cases',
    description:
      'Search the web for real business cases (success or failure) relevant to the user situation. Call this when a failure pattern is recognized or when a success case would genuinely reframe the problem.',
    parameters: {
      type: 'object',
      properties: {
        search_brief: {
          type: 'string',
          description:
            'Precise description of the case to find. Include: core pattern/problem to match, what the case should illustrate, and what makes it directly relevant to the user situation.',
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
}

const PROPOSE_STRATEGY_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'propose_strategy',
    description:
      'Call this at the end of a conversation that has real strategic substance — when a concrete plan, diagnosis, and next steps emerged. Proposes saving the conversation as a named strategy so the founder can continue it later with full context.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description:
            'Suggested strategy name. Concise, specific, includes context. Example: "Posicionamento Board I.A — Mar 2026"',
        },
        brief: {
          type: 'string',
          description:
            'Compact strategic summary — what matters, not what was said. Include: founder situation, central problem, key decisions made, framework applied, next steps defined. Max 5 sentences.',
        },
        stage: {
          type: 'string',
          description: 'Company stage identified (0-4)',
        },
      },
      required: ['name', 'brief'],
    },
  },
}

// ─── SDR: Web search for cases (Plano 4) ─────────────────────────────────────

async function searchCasesSDR(brief: string, caseType: string): Promise<string> {
  const client = getOpenAIClient()
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini-search-preview',
    messages: [
      {
        role: 'system',
        content:
          'You are a business case researcher. Search the web and return real, verifiable cases. Be factual and concise.',
      },
      {
        role: 'user',
        content: `Find 5-7 real business cases matching this brief:\n\n${brief}\n\nCase type needed: ${caseType}\n\nFor each case return:\n- Company/founder name\n- What their situation was\n- What happened (outcome)\n- Why it matches the brief\n\nBe concise. Real cases only — no invented examples.`,
      },
    ],
  } as any)
  return (response.choices[0]?.message?.content as string) ?? ''
}

// ─── Streaming with OpenAI + Tool Loop ───────────────────────────────────────

const STRATEGY_PROPOSAL_MARKER = '\n[STRATEGY_PROPOSAL]:'

async function streamWithOpenAI(options: LLMOptions): Promise<ReadableStream<string>> {
  const client = getOpenAIClient()

  return new ReadableStream<string>({
    async start(controller) {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: options.system },
        ...options.messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ]

      let strategyProposal: StrategyProposal | null = null

      while (true) {
        const stream = await client.chat.completions.create({
          model: 'gpt-5.4-mini-2026-03-17',
          max_tokens: 4096,
          stream: true,
          tools: [SEARCH_CASES_TOOL, PROPOSE_STRATEGY_TOOL],
          tool_choice: 'auto',
          messages,
        })

        let assistantContent = ''
        const toolCalls: Array<{ id: string; type: string; function: { name: string; arguments: string } }> = []
        let finishReason: string | null = null

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta
          finishReason = chunk.choices[0]?.finish_reason ?? finishReason

          if (delta?.content) {
            controller.enqueue(delta.content)
            assistantContent += delta.content
          }

          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const i = tc.index ?? 0
              if (!toolCalls[i]) {
                toolCalls[i] = { id: '', type: 'function', function: { name: '', arguments: '' } }
              }
              if (tc.id) toolCalls[i].id = tc.id
              if (tc.function?.name) toolCalls[i].function.name += tc.function.name
              if (tc.function?.arguments) toolCalls[i].function.arguments += tc.function.arguments
            }
          }
        }

        if (finishReason === 'tool_calls' && toolCalls.length > 0) {
          messages.push({
            role: 'assistant',
            content: assistantContent || null,
            tool_calls: toolCalls.map((tc) => ({
              id: tc.id,
              type: 'function' as const,
              function: { name: tc.function.name, arguments: tc.function.arguments },
            })),
          })

          for (const tc of toolCalls) {
            if (tc.function.name === 'search_cases') {
              const args = JSON.parse(tc.function.arguments)
              const cases = await searchCasesSDR(args.search_brief, args.case_type)
              messages.push({ role: 'tool', tool_call_id: tc.id, content: cases })
            }

            if (tc.function.name === 'propose_strategy') {
              strategyProposal = JSON.parse(tc.function.arguments)
              messages.push({
                role: 'tool',
                tool_call_id: tc.id,
                content: 'Strategy proposal registered. Continue your response naturally.',
              })
            }
          }
          continue
        }

        break
      }

      // Inject strategy proposal marker at end of stream (stripped before DB save, read by front-end)
      if (strategyProposal) {
        controller.enqueue(
          `${STRATEGY_PROPOSAL_MARKER}${JSON.stringify(strategyProposal)}`
        )
      }

      controller.close()
    },
  })
}

// ─── Streaming with Claude (fallback — no tool calls) ────────────────────────

async function streamWithClaude(options: LLMOptions): Promise<ReadableStream<string>> {
  const client = getAnthropicClient()

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: options.system,
    messages: options.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  })

  return new ReadableStream<string>({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(chunk.delta.text)
        }
      }
      controller.close()
    },
  })
}

// ─── Title generation (Haiku — fast, no streaming) ───────────────────────────

export async function generateConversationTitle(firstMessage: string): Promise<string> {
  const client = getAnthropicClient()
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 24,
      system:
        'Gere um título conciso (3 a 6 palavras) em português para uma conversa estratégica que começa com a mensagem do usuário. Retorne APENAS o título — sem aspas, sem ponto final, sem explicação.',
      messages: [{ role: 'user', content: firstMessage.slice(0, 400) }],
    })
    const text = (response.content[0] as { type: string; text: string }).text?.trim()
    return text || firstMessage.slice(0, 50)
  } catch {
    return firstMessage.slice(0, 50)
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function streamBoardResponse(
  options: LLMOptions
): Promise<ReadableStream<string>> {
  try {
    return await streamWithOpenAI(options)
  } catch (err) {
    console.warn('[LLM] OpenAI failed, falling back to Claude:', err)
    return await streamWithClaude(options)
  }
}

export { STRATEGY_PROPOSAL_MARKER }
