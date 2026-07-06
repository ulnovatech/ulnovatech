import { BiProfileService, buildOutreachOpener } from '@agency/intelligence';
import { CrmService } from '@agency/crm';
import { DiscoveryRepository } from '@agency/discovery';
import { OutreachService } from '@agency/outreach';
import { QualificationService } from '@agency/qualification';
import { NextResponse } from 'next/server';

const crm = new CrmService();
const qualification = new QualificationService();
const outreach = new OutreachService();
const biProfiles = new BiProfileService();
const discovery = new DiscoveryRepository();

export async function GET(request: Request) {
  try {
    const leadId = new URL(request.url).searchParams.get('leadId');
    if (!leadId) {
      return NextResponse.json({ error: 'leadId required' }, { status: 400 });
    }

    const lead = await crm.getLead(leadId);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const brief = await qualification.getOpportunityBrief(lead.businessId);
    const template = await outreach.resolveTemplateForOpportunityType(brief.opportunityType);

    let suggestedOpener: string | null = null;
    let openerPainId: string | null = null;
    let openerPainLabel: string | null = null;
    let openerEvidence: Array<{ id: string; label: string; excerpt?: string | null }> = [];

    try {
      const business = await discovery.getBusiness(lead.businessId);
      const boi = await biProfiles.getOpportunityBrief(lead.businessId);
      const opener = buildOutreachOpener({
        businessName: business?.name ?? 'your business',
        city: business?.city,
        industry: business?.industry,
        pains: boi.pains,
        evidence: boi.evidence,
        pitchAngle: boi.salesBrief?.pitchAngle,
        topService: boi.salesBrief?.recommendedServices?.[0],
      });
      suggestedOpener = opener.opener;
      openerPainId = opener.painId;
      openerPainLabel = opener.painLabel;
      openerEvidence = opener.evidenceIds
        .map((id) => boi.evidence.find((e) => e.id === id))
        .filter((e): e is NonNullable<typeof e> => !!e)
        .map((e) => ({ id: e.id, label: e.label, excerpt: e.excerpt }));
    } catch {
      // BOI not available — recommended template still works without opener
    }

    return NextResponse.json({
      leadId,
      opportunityType: brief.opportunityType,
      opportunityTypeLabel: brief.opportunityTypeLabel,
      pitchAngle: brief.pitchAngle,
      template: template
        ? {
            id: template.id,
            name: template.name,
            opportunityType: template.opportunityType,
          }
        : null,
      suggestedOpener,
      openerPainId,
      openerPainLabel,
      openerEvidence,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
