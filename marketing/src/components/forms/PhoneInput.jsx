import CountrySelect, { defaultDialCode } from './CountrySelect'

export default function PhoneInput({
  dialCode,
  onDialCodeChange,
  phone,
  onPhoneChange,
  required = true,
}) {
  return (
    <div className="flex gap-2">
      <CountrySelect
        value={dialCode || defaultDialCode}
        onChange={onDialCodeChange}
        className="w-36 shrink-0"
      />
      <input
        type="tel"
        inputMode="tel"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        required={required}
        placeholder="772169960"
        className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
    </div>
  )
}
