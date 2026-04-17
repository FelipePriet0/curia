import type {
  companies,
  conversations,
  messages,
  plans,
  sharedConversations,
  strategies,
} from '@/db/schema'

export function serializeConversation(row: typeof conversations.$inferSelect) {
  return {
    id: row.id,
    company_id: row.companyId,
    user_id: row.userId,
    plan_id: row.planId,
    strategy_id: row.strategyId,
    conversation_type: row.conversationType,
    title: row.title,
    pinned: row.pinned,
    archived: row.archived,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

export function serializeMessage(row: typeof messages.$inferSelect) {
  return {
    id: row.id,
    conversation_id: row.conversationId,
    role: row.role,
    content: row.content,
    created_at: row.createdAt.toISOString(),
  }
}

export function serializePlan(row: typeof plans.$inferSelect) {
  return {
    id: row.id,
    user_id: row.userId,
    origin_conversation_id: row.originConversationId,
    title: row.title,
    summary: row.summary,
    next_steps: row.nextSteps,
    metrics: row.metrics,
    framework_used: row.frameworkUsed,
    review_date: row.reviewDate,
    review_interval_days: row.reviewIntervalDays,
    status: row.status,
    notification_sent: row.notificationSent,
    notification_sent_at: row.notificationSentAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

export function serializeStrategy(row: typeof strategies.$inferSelect) {
  return {
    id: row.id,
    user_id: row.userId,
    name: row.name,
    brief: row.brief,
    stage: row.stage,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

export function serializeCompany(row: typeof companies.$inferSelect) {
  return {
    id: row.id,
    user_id: row.userId,
    company_name: row.companyName,
    industry: row.industry,
    stage: row.stage,
    main_problem: row.mainProblem,
    business_type: row.businessType,
    business_model: row.businessModel,
    monetization: row.monetization,
    average_ticket: row.averageTicket != null ? Number(row.averageTicket) : null,
    product_description: row.productDescription,
    team_size: row.teamSize,
    founded_period: row.foundedPeriod,
    capital_stage: row.capitalStage,
    mrr: row.mrr != null ? Number(row.mrr) : null,
    churn_rate: row.churnRate != null ? Number(row.churnRate) : null,
    cac: row.cac != null ? Number(row.cac) : null,
    ltv: row.ltv != null ? Number(row.ltv) : null,
    monthly_revenue: row.monthlyRevenue != null ? Number(row.monthlyRevenue) : null,
    gross_margin: row.grossMargin != null ? Number(row.grossMargin) : null,
    max_capacity: row.maxCapacity,
    gmv: row.gmv != null ? Number(row.gmv) : null,
    take_rate: row.takeRate != null ? Number(row.takeRate) : null,
    marketplace_weak_side: row.marketplaceWeakSide,
    active_customers: row.activeCustomers,
    icp_defined: row.icpDefined,
    icp_description: row.icpDescription,
    acquisition_channel: row.acquisitionChannel,
    main_bottleneck: row.mainBottleneck,
    main_bottleneck_detail: row.mainBottleneckDetail,
    diagnosed_stage: row.diagnosedStage,
    stage_confirmed: row.stageConfirmed,
    diagnostic_summary: row.diagnosticSummary,
    priority_ladder: row.priorityLadder,
    onboarding_completed_at: row.onboardingCompletedAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

export function serializeSharedConversation(row: typeof sharedConversations.$inferSelect) {
  return {
    id: row.id,
    user_id: row.userId,
    conversation_id: row.conversationId,
    token: row.token,
    created_at: row.createdAt.toISOString(),
    revoked_at: row.revokedAt?.toISOString() ?? null,
  }
}
