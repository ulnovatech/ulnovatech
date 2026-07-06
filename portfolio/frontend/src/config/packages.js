export const pricingPlans = [
  {
    id: 'basic',
    title: 'Basic Launch Package',
    priceUgx: 250000,
    depositUgx: 50000,
    badge: null,
    features: [
      'Domain & Hosting (1 year)',
      'Up to 5 Pages',
      'Google Business Setup',
      'Basic SEO',
      '2 Weeks Support',
    ],
  },
  {
    id: 'smart',
    title: 'Start Smart Package',
    priceUgx: 400000,
    depositUgx: 80000,
    badge: 'popular',
    features: [
      'Domain & Hosting (1 year)',
      'Up to 20 Pages',
      'Google Business Setup',
      'Business Email',
      '1 Month Support',
    ],
  },
  {
    id: 'premium',
    title: 'Premium Growth Package',
    priceUgx: 700000,
    depositUgx: 140000,
    badge: 'best-value',
    features: [
      'Premium Hosting (1 year)',
      'Up to 30 Pages',
      'Enhanced Google Setup',
      'E-commerce Functionality',
      '2 Months Support',
    ],
  },
];

export function formatUgx(amount) {
  return `UGX ${Number(amount).toLocaleString('en-UG')}`;
}

export function getPlanById(id) {
  return pricingPlans.find((plan) => plan.id === id) ?? pricingPlans[0];
}
