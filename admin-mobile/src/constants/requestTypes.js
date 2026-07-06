export const REQUEST_TYPES = [
  { key: '', label: 'All' },
  { key: 'website_order', label: 'Orders' },
  { key: 'contactus', label: 'Contact' },
  { key: 'appdev', label: 'App Dev' },
  { key: 'graphdes', label: 'Graphic' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'webdesign', label: 'Web Design' },
  { key: 'newsletter', label: 'Newsletter' },
]

export const TYPE_META = {
  appdev: { label: 'App Dev', className: 'bg-purple-600/90 text-white' },
  graphdes: { label: 'Graphic', className: 'bg-pink-600/90 text-white' },
  marketing: { label: 'Marketing', className: 'bg-teal-600/90 text-white' },
  webdesign: { label: 'Web Design', className: 'bg-blue-600/90 text-white' },
  website_order: { label: 'Order', className: 'bg-emerald-600/90 text-white' },
  contactus: { label: 'Contact', className: 'bg-amber-500/90 text-black' },
  newsletter: { label: 'Newsletter', className: 'bg-gray-500/90 text-white' },
}
