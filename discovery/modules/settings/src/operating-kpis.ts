/** V1 KPI targets — mirrors docs/OPERATING_MODEL.md (read-only in UI until R7 ops metrics). */

export type OperatingKpi = {
  id: string;
  label: string;
  target: string;
  measurement: string;
};

export const OPERATING_KPI_TARGETS: OperatingKpi[] = [
  {
    id: 'reachable_leads_week',
    label: 'Reachable leads promoted / week',
    target: '≥ 15',
    measurement: 'Leads from review with medium+ reachability or verified contact',
  },
  {
    id: 'review_to_contacted',
    label: 'Review → contacted conversion',
    target: '≥ 40%',
    measurement: 'CONTACTED / leads promoted that week',
  },
  {
    id: 'duplicate_outreach',
    label: 'Duplicate outreach rate',
    target: '< 2%',
    measurement: 'Same account contacted twice in 30 days',
  },
  {
    id: 'places_spend_month',
    label: 'Google Places spend / month',
    target: '≤ cap (default 150)',
    measurement: 'GET /api/acquisition/budget → google_places',
  },
  {
    id: 'discovery_success_rate',
    label: 'Discovery run success rate',
    target: '≥ 90%',
    measurement: 'Completed / started runs (7-day window)',
  },
  {
    id: 'demand_actioned_week',
    label: 'Demand signals actioned / week',
    target: '≥ 5',
    measurement: 'Inbox matched, prospect created, or dismissed',
  },
];
