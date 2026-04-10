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
  strategy_id: string | null
  conversation_type: 'regular' | 'plan_origin' | 'plan_review' | 'strategy'
  title: string
  pinned: boolean
  archived: boolean
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

export interface Strategy {
  id: string
  user_id: string
  name: string
  brief: string
  stage: string | null
  created_at: string
  updated_at: string
}

// ─── Context Types ────────────────────────────────────────────────────────────

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

export interface StrategyContext {
  name: string
  brief: string
  stage: string | null
}

export interface StrategyProposal {
  name: string
  brief: string
  stage?: string
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
  // Basic info
  company_name?: string
  industry?: string
  business_model?: string
  business_type?: string
  monetization?: string
  stage?: string
  employees?: string
  capital_stage?: string
  founded_period?: string
  product_description?: string
  target_customer?: string
  // Traction
  active_customers?: number
  icp_defined?: boolean
  icp_description?: string
  acquisition_channel?: string
  // Bottleneck
  main_problem?: string
  main_bottleneck?: string
  main_bottleneck_detail?: string
  // Metrics — subscription
  mrr?: number
  churn_rate?: number
  cac?: number
  ltv?: number
  // Metrics — transactional / service
  monthly_revenue?: number
  gross_margin?: number
  average_ticket?: number
  max_capacity?: number
  // Metrics — marketplace
  gmv?: number
  take_rate?: number
  marketplace_weak_side?: string
  // Onboarding diagnosis
  diagnosed_stage?: string
  diagnostic_summary?: string
  priority_ladder?: Array<{
    rank: number
    problem: string
    detail: string
    framework: string
    urgency: string
  }>
}

// ─── UI Types ─────────────────────────────────────────────────────────────────

export interface ConversationWithLastMessage extends Conversation {
  last_message?: string
}
