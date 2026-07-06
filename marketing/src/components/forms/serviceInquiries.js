import { apiEndpoints } from '../../site.config'

export const serviceInquiries = [
  {
    id: 'web',
    title: 'Website Development Inquiry',
    description: 'Tell us about the website you need.',
    endpoint: apiEndpoints.webDesign,
    cta: 'Request Website Quote',
  },
  {
    id: 'app',
    title: 'Mobile App Development Inquiry',
    description: 'Share your app idea and goals.',
    endpoint: apiEndpoints.appDev,
    cta: 'Request App Quote',
  },
  {
    id: 'graphics',
    title: 'Graphics Design Inquiry',
    description: 'Describe the design work you need.',
    endpoint: apiEndpoints.graphics,
    cta: 'Request Design Quote',
  },
  {
    id: 'marketing',
    title: 'Digital Marketing & SEO Inquiry',
    description: 'How can we help grow your brand online?',
    endpoint: apiEndpoints.marketing,
    cta: 'Request Marketing Quote',
  },
]
