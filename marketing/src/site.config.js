export const siteConfig = {
  name: 'UlnovaTech',
  tagline: 'Website, App & System development • IT services',
  email: 'ulnovatech@gmail.com',
  location: 'Kampala, Uganda',
  addressNote: 'Office under development',
  phones: ['+256 791779448', '+256 749594464', '+256 772169960'],
  primaryPhone: '+256791779448',
  whatsapp: 'https://wa.me/256749594464',
  social: {
    x: 'https://x.com/ulnova26716',
    instagram: 'https://www.instagram.com/ulnovatech/?hl=en',
    linkedin: 'https://www.linkedin.com/in/ulnova-tech-394547376/',
    youtube: 'https://www.youtube.com/@UlnovaTech',
  },
  links: {
    home: '/',
    portfolio: '/portfolio-app/',
    about: '/about',
    prices: '/prices',
    trackOrder: '/track-order',
    getStarted: '/portfolio-app/',
    logo: '/assets/img/uln-logo.png',
  },
}

const portfolioApi =
  import.meta.env.VITE_PORTFOLIO_API_URL ||
  (import.meta.env.DEV ? 'http://localhost/ulnovatech/portfolio/api' : '/portfolio/api')

export const apiEndpoints = {
  contact: '/php/contactus.php',
  newsletter: '/php/newsletter.php',
  webDesign: '/php/webdesigninq.php',
  appDev: '/php/appdevrequests.php',
  graphics: '/php/graphdesrequests.php',
  marketing: '/php/marketingrequests.php',
  orderStatus: `${portfolioApi}/order-status.php`,
}

/** Primary navigation — hash links prefixed for cross-page routing */
export const mainNavigation = [
  { id: 'home', label: 'Home', href: '/#hero' },
  {
    id: 'services',
    label: 'Services',
    children: [
      { label: 'Website development', href: '/#webdesign' },
      { label: 'Mobile app development', href: '/#appdev' },
      { label: 'Digital marketing & SEO', href: '/#marketing' },
      { label: 'IT consulting', href: '/#services' },
      { label: 'UI/UX design', href: '/#services' },
    ],
  },
  { id: 'portfolio', label: 'Portfolio', href: siteConfig.links.portfolio },
  { id: 'prices', label: 'Pricing', href: siteConfig.links.prices },
  {
    id: 'products',
    label: 'All Products',
    children: [
      { label: 'Websites', href: '/#webdesign' },
      {
        label: 'Apps',
        children: [
          { label: 'E-Commerce', href: '/#appdev' },
          { label: 'Delivery Apps', href: '/#appdev' },
          { label: 'Restaurant Apps', href: '/#appdev' },
          { label: 'Chat Apps', href: '/#appdev' },
        ],
      },
      {
        label: 'Management Systems',
        children: [
          { label: 'Business Mgt Systems', href: '/#services' },
          { label: 'Store Management', href: '/#services' },
          { label: 'Professional Dashboards', href: '/#services' },
          { label: 'Data Processing', href: '/#services' },
        ],
      },
      {
        label: 'Graphics Design',
        children: [
          { label: 'Animation Videos', href: '/#graphics' },
          { label: 'Logos', href: '/#graphics' },
          { label: 'Product Designs', href: '/#graphics' },
          { label: 'Branding', href: '/#graphics' },
          { label: 'Banners, Flyers, Posters', href: '/#graphics' },
        ],
      },
      {
        label: 'Advertisements',
        children: [
          { label: 'Video Ads', href: '/#marketing' },
          { label: 'Social Media Ads', href: '/#marketing' },
          { label: 'Product Ads', href: '/#marketing' },
        ],
      },
    ],
  },
  { id: 'contact', label: 'Contact', href: '/#contact' },
  { id: 'about', label: 'About', href: siteConfig.links.about },
]

export const footerUsefulLinks = [
  { label: 'Home', href: '/#hero' },
  { label: 'About us', href: siteConfig.links.about },
  { label: 'Pricing', href: siteConfig.links.prices },
  { label: 'Track order', href: siteConfig.links.trackOrder },
  { label: 'Services', href: '/#services' },
  { label: 'Portfolio', href: siteConfig.links.portfolio },
  { label: 'Contact', href: '/#contact' },
]

export const footerServiceLinks = [
  { label: 'Web Design', href: '/#webdesign' },
  { label: 'Web Development', href: '/#webdesign' },
  { label: 'Mobile Apps', href: '/#appdev' },
  { label: 'Digital Marketing', href: '/#marketing' },
  { label: 'Graphic Design', href: '/#graphics' },
]
