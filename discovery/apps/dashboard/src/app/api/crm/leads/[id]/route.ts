import { AccountService, SuppressionService } from '@agency/accounts';
import { CrmService, getAllowedTransitions } from '@agency/crm';
import { DiscoveryService } from '@agency/discovery';
import { IntentService } from '@agency/intent';
import { IntelligenceService } from '@agency/intelligence';
import { OutreachService } from '@agency/outreach';
import { GmailReplyService, isGmailConnected } from '@agency/integrations';
import { QualificationService } from '@agency/qualification';
import { ProposalService } from '@agency/proposal';
import type { LeadStatus } from '@agency/types';
import { NextResponse } from 'next/server';

const crm = new CrmService();
const accounts = new AccountService();
const suppression = new SuppressionService();
const discovery = new DiscoveryService();
const intelligence = new IntelligenceService();
const intent = new IntentService();
const outreach = new OutreachService();
const proposals = new ProposalService();
const qualification = new QualificationService();
const gmailReplies = new GmailReplyService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { lead, notes, activities } = await crm.getLeadWithDetails(id);
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const business = await discovery.getBusiness(lead.businessId);
    const analysis = await intelligence.getAnalysis(lead.businessId);
    const signals = await intent.listByBusiness(lead.businessId);
    const messages = await outreach.listMessages(lead.id);
    const proposalList = await proposals.list(lead.id);
    const allowedTransitions = getAllowedTransitions(lead.status as LeadStatus);
    const account = await accounts.getById(lead.accountId);
    const suppressionStatus = account ? await suppression.getStatus(account) : null;
    const gmailConnected = await isGmailConnected();
    const replySuggestions = gmailConnected
      ? await gmailReplies.listPendingForLead(lead.id)
      : [];

    let opportunityBrief = null;
    try {
      opportunityBrief = await qualification.getOpportunityBrief(lead.businessId);
    } catch {
      opportunityBrief = null;
    }

    return NextResponse.json({
      lead,
      suppression: suppressionStatus,
      business,
      analysis,
      opportunityBrief,
      notes,
      activities,
      signals,
      outreach: messages,
      proposals: proposalList,
      allowedTransitions,
      gmailConnected,
      replySuggestions,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
