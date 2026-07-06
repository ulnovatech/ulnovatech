import { HiMail, HiPhone } from 'react-icons/hi'
import { FaWhatsapp } from 'react-icons/fa'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Capacitor } from '@capacitor/core'
import toast from 'react-hot-toast'
import { normalizePhone } from '../utils/requestHelpers'

async function hapticTap() {
  if (!Capacitor.isNativePlatform()) return
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch {
    // optional
  }
}

export default function EngageBar({ phone, email, whatsapp }) {
  const normalizedPhone = normalizePhone(phone)
  const normalizedWhatsApp = normalizePhone(whatsapp || phone)

  async function openTel() {
    if (!normalizedPhone) return
    await hapticTap()
    window.location.href = `tel:+${normalizedPhone}`
  }

  async function openWhatsApp() {
    if (!normalizedWhatsApp) return
    await hapticTap()
    window.open(`https://wa.me/${normalizedWhatsApp}`, '_blank', 'noreferrer')
  }

  async function openEmail() {
    if (!email) return
    await hapticTap()
    const to = encodeURIComponent(email.trim())
    window.location.href = `mailto:${to}`
  }

  const baseBtn =
    'flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-surface-card/95 px-4 pt-3 backdrop-blur-md"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.75rem)' }}
    >
      <div className="mx-auto flex max-w-lg gap-2">
        <button
          type="button"
          onClick={openTel}
          disabled={!normalizedPhone}
          className={`${baseBtn} bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30`}
        >
          <HiPhone className="h-5 w-5" />
          Call
        </button>
        <button
          type="button"
          onClick={openWhatsApp}
          disabled={!normalizedWhatsApp}
          className={`${baseBtn} bg-green-600/20 text-green-300 hover:bg-green-600/30`}
        >
          <FaWhatsapp className="h-5 w-5" />
          WhatsApp
        </button>
        <button
          type="button"
          onClick={openEmail}
          disabled={!email}
          className={`${baseBtn} bg-sky-600/20 text-sky-300 hover:bg-sky-600/30`}
        >
          <HiMail className="h-5 w-5" />
          Email
        </button>
      </div>
    </div>
  )
}

export function copyWithToast(value, label = 'Copied') {
  if (!value) return
  navigator.clipboard
    .writeText(value)
    .then(() => toast.success(label))
    .catch(() => toast.error('Could not copy'))
}
