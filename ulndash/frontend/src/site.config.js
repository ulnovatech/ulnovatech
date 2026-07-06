/**
 * UlnoVaTech CRM dashboard — external app links and env-driven URLs.
 */

const isDev = import.meta.env.DEV

export const siteConfig = {
  name: 'Ulnova Tech',
  tagline: 'Reachout Dashboard',
}

/** Federated apps opened from the sidebar (not in-app routes). */
export const appLinks = {
  homeSite: import.meta.env.VITE_HOME_SITE_URL || (isDev ? 'http://localhost/ulnovatech/' : '/'),
  blog: import.meta.env.VITE_BLOG_URL || (isDev ? 'http://localhost:5173' : '/blog/'),
  portfolio:
    import.meta.env.VITE_PORTFOLIO_URL ||
    (isDev ? 'http://localhost/ulnovatech/portfolio/' : '/portfolio-app/'),
  discoveryIntelligence:
    import.meta.env.VITE_DISCOVERY_URL ||
    (isDev ? 'http://localhost:3000' : 'https://discovery.ulnovatech.store'),
}
