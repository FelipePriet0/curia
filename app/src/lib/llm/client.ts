import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LLMMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface LLMOptions {
  system: string
  messages: LLMMessage[]
  stream?: boolean
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

// ─── Streaming ────────────────────────────────────────────────────────────────

export async function streamBoardResponse(
  options: LLMOptions
): Promise<ReadableStream<string>> {
  // Try GPT-5.4 mini first, fallback to Claude
  try {
    return await streamWithOpenAI(options)
  } catch (err) {
    console.warn('[LLM] OpenAI failed, falling back to Claude:', err)
    return await streamWithClaude(options)
  }
}

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

async function streamWithOpenAI(options: LLMOptions): Promise<ReadableStream<string>> {
  const client = getOpenAIClient()

  const stream = await client.chat.completions.create({
    model: 'gpt-5.4-mini',
    max_tokens: 4096,
    stream: true,
    messages: [
      { role: 'system', content: options.system },
      ...options.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ],
  })

  return new ReadableStream<string>({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) controller.enqueue(text)
      }
      controller.close()
    },
  })
}
