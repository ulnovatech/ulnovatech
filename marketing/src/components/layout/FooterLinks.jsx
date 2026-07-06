export default function FooterLinks({ title, links }) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">{title}</h4>
      <ul className="space-y-2 text-sm text-slate-300">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href} className="inline-flex items-center gap-2 transition hover:text-brand">
              <span className="text-brand" aria-hidden="true">
                ›
              </span>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
