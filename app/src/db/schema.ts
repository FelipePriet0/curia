import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const conversationTypeEnum = pgEnum('conversation_type', [
  'regular',
  'plan_origin',
  'plan_review',
  'strategy',
])

export const eventTypeEnum = pgEnum('event_type', [
  'activation_started',
  'conversation_started',
  'flow_progressed',
  'plan_requested',
  'plan_created',
  'review_scheduled',
  'review_completed',
])

export const planStatusEnum = pgEnum('plan_status', [
  'active',
  'reviewed',
  'archived',
])

export const messageRoleEnum = pgEnum('message_role', [
  'user',
  'assistant',
])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id'),
  email: text('email').notNull(),
  passwordHash: text('password_hash'),
  fullName: text('full_name'),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  emailVerified: boolean('email_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('users_clerk_user_id_unique').on(table.clerkUserId),
  uniqueIndex('users_email_unique').on(table.email),
  index('users_created_at_idx').on(table.createdAt),
])

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('sessions_user_id_idx').on(table.userId),
  index('sessions_expires_at_idx').on(table.expiresAt),
])

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('password_reset_tokens_hash_unique').on(table.tokenHash),
  index('password_reset_tokens_user_id_idx').on(table.userId),
  index('password_reset_tokens_expires_at_idx').on(table.expiresAt),
])

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyName: text('company_name').notNull(),
  industry: text('industry'),
  stage: text('stage'),
  mainProblem: text('main_problem'),
  businessType: text('business_type'),
  businessModel: text('business_model'),
  monetization: text('monetization'),
  averageTicket: numeric('average_ticket'),
  productDescription: text('product_description'),
  teamSize: text('team_size'),
  foundedPeriod: text('founded_period'),
  capitalStage: text('capital_stage'),
  mrr: numeric('mrr'),
  churnRate: numeric('churn_rate'),
  cac: numeric('cac'),
  ltv: numeric('ltv'),
  monthlyRevenue: numeric('monthly_revenue'),
  grossMargin: numeric('gross_margin'),
  maxCapacity: integer('max_capacity'),
  gmv: numeric('gmv'),
  takeRate: numeric('take_rate'),
  marketplaceWeakSide: text('marketplace_weak_side'),
  activeCustomers: integer('active_customers'),
  icpDefined: boolean('icp_defined').notNull().default(false),
  icpDescription: text('icp_description'),
  acquisitionChannel: text('acquisition_channel'),
  mainBottleneck: text('main_bottleneck'),
  mainBottleneckDetail: text('main_bottleneck_detail'),
  diagnosedStage: text('diagnosed_stage'),
  stageConfirmed: boolean('stage_confirmed').notNull().default(false),
  diagnosticSummary: text('diagnostic_summary'),
  priorityLadder: jsonb('priority_ladder'),
  onboardingCompletedAt: timestamp('onboarding_completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('companies_user_id_unique').on(table.userId),
  index('companies_user_id_idx').on(table.userId),
])

export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  originConversationId: uuid('origin_conversation_id'),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  nextSteps: text('next_steps').notNull(),
  metrics: jsonb('metrics'),
  frameworkUsed: text('framework_used'),
  reviewDate: date('review_date'),
  reviewIntervalDays: integer('review_interval_days').notNull().default(14),
  status: planStatusEnum('status').notNull().default('active'),
  notificationSent: boolean('notification_sent').notNull().default(false),
  notificationSentAt: timestamp('notification_sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('plans_user_id_idx').on(table.userId),
  index('plans_review_date_idx').on(table.reviewDate),
])

export const strategies = pgTable('strategies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  brief: text('brief').notNull(),
  stage: text('stage'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('strategies_user_id_idx').on(table.userId),
])

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  planId: uuid('plan_id').references(() => plans.id, { onDelete: 'set null' }),
  strategyId: uuid('strategy_id').references(() => strategies.id, { onDelete: 'set null' }),
  conversationType: conversationTypeEnum('conversation_type').notNull().default('regular'),
  title: text('title').notNull().default('New conversation'),
  pinned: boolean('pinned').notNull().default(false),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('conversations_user_id_idx').on(table.userId),
  index('conversations_updated_at_idx').on(table.updatedAt),
  index('conversations_plan_id_idx').on(table.planId),
  index('conversations_strategy_id_idx').on(table.strategyId),
])

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('messages_conversation_id_idx').on(table.conversationId, table.createdAt),
])

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'set null' }),
  type: eventTypeEnum('type').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('events_user_created_idx').on(table.userId, table.createdAt),
  index('events_type_created_idx').on(table.type, table.createdAt),
])

export const sharedConversations = pgTable('shared_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('shared_conversations_token_unique').on(table.token),
  index('shared_conversations_user_idx').on(table.userId, table.createdAt),
  index('shared_conversations_conv_idx').on(table.conversationId),
])

export const userTermsAcceptances = pgTable('user_terms_acceptances', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  termsVersion: text('terms_version').notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull().defaultNow(),
  ip: text('ip'),
  userAgent: text('user_agent'),
}, (table) => [
  index('terms_accept_user_idx').on(table.userId, table.acceptedAt),
])

export const usersRelations = relations(users, ({ many, one }) => ({
  company: one(companies, {
    fields: [users.id],
    references: [companies.userId],
  }),
  sessions: many(sessions),
  passwordResetTokens: many(passwordResetTokens),
  conversations: many(conversations),
  plans: many(plans),
  strategies: many(strategies),
  events: many(events),
  sharedConversations: many(sharedConversations),
  termsAcceptances: many(userTermsAcceptances),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}))

export const companiesRelations = relations(companies, ({ one }) => ({
  user: one(users, {
    fields: [companies.userId],
    references: [users.id],
  }),
}))

export const plansRelations = relations(plans, ({ one, many }) => ({
  user: one(users, {
    fields: [plans.userId],
    references: [users.id],
  }),
  conversations: many(conversations),
}))

export const strategiesRelations = relations(strategies, ({ one, many }) => ({
  user: one(users, {
    fields: [strategies.userId],
    references: [users.id],
  }),
  conversations: many(conversations),
}))

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [conversations.companyId],
    references: [companies.id],
  }),
  plan: one(plans, {
    fields: [conversations.planId],
    references: [plans.id],
  }),
  strategy: one(strategies, {
    fields: [conversations.strategyId],
    references: [strategies.id],
  }),
  messages: many(messages),
  shared: many(sharedConversations),
  events: many(events),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}))

export const eventsRelations = relations(events, ({ one }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
  conversation: one(conversations, {
    fields: [events.conversationId],
    references: [conversations.id],
  }),
}))

export const sharedConversationsRelations = relations(sharedConversations, ({ one }) => ({
  user: one(users, {
    fields: [sharedConversations.userId],
    references: [users.id],
  }),
  conversation: one(conversations, {
    fields: [sharedConversations.conversationId],
    references: [conversations.id],
  }),
}))

export const userTermsAcceptancesRelations = relations(userTermsAcceptances, ({ one }) => ({
  user: one(users, {
    fields: [userTermsAcceptances.userId],
    references: [users.id],
  }),
}))
