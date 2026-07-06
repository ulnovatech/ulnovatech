/** Minimum digit count for phone-based account matching. */
export const MIN_PHONE_DIGITS = 7;

/** Strip to digits only for stable cross-format comparison. */
export function normalizePhoneDigits(phone?: string | null): string | null {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < MIN_PHONE_DIGITS) return null;
  return digits;
}
