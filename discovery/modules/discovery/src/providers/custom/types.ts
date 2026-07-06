export type CustomDemandItem = {
  sourceUrl: string;
  title: string;
  snippet?: string;
  signalType: 'help_request' | 'hiring' | 'job_post' | 'public_request' | 'pain_signal';
};
