import { countryCodes, defaultDialCode } from '../../lib/countryCodes'

export default function CountrySelect({ value, onChange, id, className = '' }) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm ${className}`}
      aria-label="Country code"
    >
      {countryCodes.map((c) => (
        <option key={`${c.code}-${c.dial}`} value={c.dial}>
          {c.dial} {c.name}
        </option>
      ))}
    </select>
  )
}

export { defaultDialCode }
