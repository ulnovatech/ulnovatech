export type ComplaintSignal = {
  complaint: string;
  frequency: number;
  isTechnical: boolean;
  fixDifficulty: 'LOW' | 'MEDIUM' | 'HIGH';
};

export type ComplaintAnalysis = {
  topComplaints: ComplaintSignal[];
  buildableFixes: string[];
  estimatedFixTimeDays: number;
  confidenceScore: number;
};

export const EMPTY_COMPLAINT_ANALYSIS: ComplaintAnalysis = {
  topComplaints: [],
  buildableFixes: [],
  estimatedFixTimeDays: 0,
  confidenceScore: 0,
};

export type GapType = 'TYPE_2' | 'TYPE_3' | 'NONE';

export type GapScore = {
  type: GapType;
  score: number;
  staleness: number;
  salesProof: number;
  complaintDensity: number;
  recentVelocity: boolean;
  verdict: string;
};

export type GhostVerdict = {
  isGhost: boolean;
  reasons: string[];
};

export type VisibilityRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export type VisibilityVerdict = {
  willSurface: boolean;
  risk: VisibilityRisk;
  recommendation: string;
  exploitableWindow: string | null;
};

export type CategoryMetrics = {
  listingCount: number;
  avgSales: number;
  ghostCount: number;
  ghostTown: boolean;
};
