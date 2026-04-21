import type { IncomingTicket, ClassificationResult } from './types.js'
import { config } from './config.js'

// ─── PROMPT ───────────────────────────────────────────────────────────────────

function buildPrompt(ticket: IncomingTicket): string {
  return `
You are a support ticket classifier for an AI chatbot platform.
Analyze the user message and return ONLY a JSON object, no explanation.j8j

User message: "${ticket.message}"
Channel: ${ticket.channel}

Return exactly this structure:
{
  "category": "billing" | "technical" | "integration" | "feature_request" | "general",
  "priority": "low" | "medium" | "high" | "critical",
  "confidence": <number between 0 and 1>,
  "suggestedAction": "<one sentence action for the support team>",
  "requiresHuman": <true if complex or emotional, false if FAQ>,<<
  "detectedLanguage": "<ISO 639-1 code>"
}

Priority rules:
- critical: system down, data loss, security issue
- high: broken feature, blocking workflow
- medium: degraded performance, workaround exists
- low: general questions, feature requests
  `.trim()
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set([
  'billing',
  'technical',
  'integration',
  'feature_request',
  'general',
])

const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'critical'])

function validateClassification(raw: unknown): ClassificationResult {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('LLM returned an invalid structure')
  }

  const obj = raw as Record<string, unknown>

  const category = obj['category']
  const priority = obj['priority']
  const confidence = obj['confidence']
  const suggestedAction = obj['suggestedAction']
  const requiresHuman = obj['requiresHuman']
  const detectedLanguage = obj['detectedLanguage']

  if (typeof category !== 'string' || !VALID_CATEGORIES.has(category)) {
    throw new Error(`Invalid category received: ${String(category)}`)
  }

  if (typeof priority !== 'string' || !VALID_PRIORITIES.has(priority)) {
    throw new Error(`Invalid priority received: ${String(priority)}`)
  }

  return {
    category: category as ClassificationResult['category'],
    priority: priority as ClassificationResult['priority'],
    confidence: typeof confidence === 'number' ? confidence : 0.5,
    suggestedAction:
      typeof suggestedAction === 'string'
        ? suggestedAction
        : 'Route to general queue',
    requiresHuman: typeof requiresHuman === 'boolean' ? requiresHuman : true,
    detectedLanguage:
      typeof detectedLanguage === 'string' ? detectedLanguage : 'en',
  }
}

// ─── AUTO-REPLY ───────────────────────────────────────────────────────────────

const AUTO_REPLIES: Record<ClassificationResult['category'], string> = {
  billing:
    'For billing questions, you can manage your subscription at app.botpress.com/billing.',
  technical:
    "I've logged your technical issue. Check our docs at botpress.com/docs while we investigate.",
  integration:
    'Integration questions are covered in our Cloud Hub docs. Flagging this for our team.',
  feature_request:
    "Thanks for the suggestion! I've added it to our product feedback board.",
  general: 'Thanks for your message! Our team will follow up within 24 hours.',
}

function generateAutoReply(result: ClassificationResult): string {
  if (result.requiresHuman) {
    return 'Thanks for reaching out! A member of our support team will get back to you shortly.'
  }
  return AUTO_REPLIES[result.category] ?? 'Our team will be in touch soon.'
}

// ─── OPENAI-COMPATIBLE RESPONSE TYPE ─────────────────────────────────────────

interface AIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

// ─── MAIN CLASSIFIER ─────────────────────────────────────────────────────────

export async function classifyTicket(ticket: IncomingTicket): Promise<{
  classification: ClassificationResult
  autoReply: string
}> {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: config.deepseekModel,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a ticket classifier. Respond with valid JSON only.',
        },
        {
          role: 'user',
          content: buildPrompt(ticket),
        },
      ],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error('[classifier] DeepSeek API error:', body)
    throw new Error(`DeepSeek request failed with status ${response.status}`)
  }

  const data = (await response.json()) as AIResponse

  const firstChoice = data.choices[0]
  if (!firstChoice) {
    throw new Error('No choices returned from DeepSeek API')
  }

  const rawContent = firstChoice.message.content
  const parsedContent = JSON.parse(rawContent)
  const classification = validateClassification(parsedContent)
  const autoReply = generateAutoReply(classification)

  return {
    classification,
    autoReply
  }
}