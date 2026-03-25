// ─── Database Types ───────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  created_at: string
}

export interface Company {
  id: string
  user_id: string
  company_name: string
  industry: string | null
  stage: string | null
  main_problem: string | null
  created_at: string
}

export interface Conversation {
  id: string
  company_id: string | null
  user_id: string
  plan_id: string | null
  conversation_type: 'regular' | 'plan_origin' | 'plan_review'
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Plan {
  id: string
  user_id: string
  origin_conversation_id: string | null
  title: string
  summary: string
  next_steps: string
  metrics: Record<string, string> | null
  framework_used: string | null
  review_date: string | null
  review_interval_days: number
  status: 'active' | 'reviewed' | 'archived'
  notification_sent: boolean
  notification_sent_at: string | null
  created_at: string
  updated_at: string
}

export interface PlanReviewContext {
  id: string
  title: string
  summary: string
  next_steps: string
  metrics: Record<string, string> | null
  framework_used: string | null
  created_at: string
  review_date: string | null
}

// ─── Board Types ──────────────────────────────────────────────────────────────

export interface BoardResponse {
  diagnosis: string
  main_problem: string
  strategic_risks: string
  framework_applied: string
  recommendations: string
  next_steps: string
  critical_questions: string
}

// ─── API Types ────────────────────────────────────────────────────────────────

export interface SendMessageRequest {
  conversation_id?: string
  message: string
  company_context?: CompanyContext
}

export interface SendMessageResponse {
  conversation_id: string
  message: Message
}

export interface CompanyContext {
  company_name?: string
  industry?: string
  business_model?: string
  stage?: string
  employees?: string
  monthly_revenue?: string
  main_problem?: string
  target_customer?: string
}

// ─── UI Types ─────────────────────────────────────────────────────────────────

export interface ConversationWithLastMessage extends Conversation {
  last_message?: string
}
