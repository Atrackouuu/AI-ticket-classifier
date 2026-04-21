export interface IncomingTicket {
  userId: string
  message: string
  channel: 'web' | 'whatsapp' | 'slack' | 'api'
  timestamp: string
}

export type TicketCategory =
  | 'billing'
  | 'technical'
  | 'integration'
  | 'feature_request'
  | 'general'

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export interface ClassificationResult {
  category: TicketCategory
  priority: TicketPriority
  confidence: number
  suggestedAction: string
  requiresHuman: boolean
  detectedLanguage: string
}

export interface WebhookResponse {
  success: true
  ticketId: string
  classification: ClassificationResult
  autoReply: string
  processedAt: string
}

export interface ErrorResponse {
  success: false
  error: string
  code: string
}