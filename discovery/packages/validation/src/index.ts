import { z } from 'zod';

const BLOCKED_DISCOVERY_COUNTRIES = new Set([
  '__integration_test__',
  'Testland',
  'Failland',
  'Acceptance',
]);

export const createDiscoveryRunSchema = z
  .object({
    country: z.string().min(1).max(100),
    city: z.string().min(1).max(100),
    industry: z.string().min(1).max(200),
    profile: z.enum(['micro', 'standard', 'boost']).optional(),
    prospectFocus: z.boolean().optional(),
    boiNarrative: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (BLOCKED_DISCOVERY_COUNTRIES.has(data.country)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Test fixture countries cannot be used for discovery runs.',
        path: ['country'],
      });
    }
  });

export const createIntentSignalSchema = z.object({
  businessId: z.string().uuid(),
  source: z.string().min(1).max(100),
  signalType: z.enum([
    'job_post',
    'hiring',
    'help_request',
    'pain_signal',
    'public_request',
    'other',
  ]),
  signalClass: z.enum(['enrichment', 'demand']).optional(),
  signalStrength: z.number().min(0).max(100),
});

export const pasteDemandIntentSchema = z.object({
  sourceUrl: z.string().url().max(1000),
  title: z.string().min(1).max(500),
  snippet: z.string().max(5000).optional(),
  signalType: z.enum([
    'job_post',
    'hiring',
    'help_request',
    'pain_signal',
    'public_request',
    'other',
  ]),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  businessId: z.string().uuid().optional(),
  signalStrength: z.number().min(0).max(100).optional(),
});

export const createLeadSchema = z.object({
  businessId: z.string().uuid(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  owner: z.string().min(1).max(100).default('operator'),
  promoteOnly: z.boolean().optional(),
  status: z.enum(['NEW', 'REVIEWED']).optional(),
});

export const transitionLeadSchema = z.object({
  leadId: z.string().uuid(),
  toStatus: z.enum([
    'NEW',
    'REVIEWED',
    'CONTACTED',
    'REPLIED',
    'QUALIFIED',
    'PROPOSAL_SENT',
    'CLOSED_WON',
    'CLOSED_LOST',
    'NO_RESPONSE',
    'NOT_INTERESTED',
    'ARCHIVED',
  ]),
  note: z.string().optional(),
});

export const createNoteSchema = z.object({
  leadId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export const markRepliedSchema = z.object({
  note: z.string().max(5000).optional(),
  channel: z.enum(['email', 'linkedin', 'phone', 'other']).optional(),
});

export const createOutreachTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().max(500).optional(),
  body: z.string().min(1).max(10000),
  channel: z.enum(['email', 'linkedin', 'phone', 'other']).default('email'),
  opportunityType: z
    .enum(['demand_response', 'greenfield', 'redesign', 'modernize', 'general'])
    .optional()
    .nullable(),
});

export const createOutreachMessageSchema = z.object({
  leadId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  subject: z.string().max(500).optional(),
  body: z.string().min(1).max(10000),
  channel: z.enum(['email', 'linkedin', 'phone', 'other']).default('email'),
  markContacted: z.boolean().optional().default(true),
});

export const createProposalSchema = z.object({
  leadId: z.string().uuid(),
  title: z.string().min(1).max(500),
  amount: z.number().min(0),
  body: z.string().optional(),
  autoQualify: z.boolean().optional().default(false),
});

export const createRevenueRecordSchema = z.object({
  leadId: z.string().uuid(),
  clientName: z.string().min(1).max(300),
  amount: z.number().min(0),
  type: z.enum(['one_time', 'retainer']),
  proposalId: z.string().uuid().optional(),
});
