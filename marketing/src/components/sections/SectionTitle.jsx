export default function SectionTitle({ eyebrow, title, description, align = 'center' }) {
  const alignClass = align === 'left' ? 'text-left items-start' : 'text-center items-center'

  return (
    <div className={`mx-auto mb-10 flex max-w-3xl flex-col gap-3 ${alignClass}`}>
      {title ? <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{title}</h2> : null}
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-widest text-brand">{eyebrow}</p> : null}
      {description ? <p className="text-base leading-relaxed text-gray-600 sm:text-lg">{description}</p> : null}
    </div>
  )
}

