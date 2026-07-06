const STATUS_STYLES = {
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  successful: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  failed: 'border-red-500/30 bg-red-500/10 text-red-200',
  cancelled: 'border-white/15 bg-white/5 text-white/60',
}

export default function PaymentSummaryCard({ payment }) {
  if (!payment) return null

  const style = STATUS_STYLES[payment.status] || STATUS_STYLES.pending

  return (
    <section className={`rounded-2xl border p-4 ${style}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
            Deposit status
          </p>
          <p className="mt-1 text-lg font-bold">{payment.status_label}</p>
        </div>
        {payment.template_reserved ? (
          <span className="rounded-lg bg-black/20 px-2 py-1 text-[10px] font-semibold uppercase">
            Reserved
          </span>
        ) : null}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs opacity-70">Deposit</dt>
          <dd className="mt-0.5 font-semibold">{payment.deposit_label}</dd>
        </div>
        {payment.package_total_label ? (
          <div>
            <dt className="text-xs opacity-70">Package total</dt>
            <dd className="mt-0.5 font-semibold">{payment.package_total_label}</dd>
          </div>
        ) : null}
        <div className="col-span-2">
          <dt className="text-xs opacity-70">Payment ref</dt>
          <dd className="mt-0.5 break-all font-mono text-xs">{payment.tx_ref}</dd>
        </div>
        {payment.paid_at ? (
          <div className="col-span-2">
            <dt className="text-xs opacity-70">Paid at</dt>
            <dd className="mt-0.5">{payment.paid_at}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  )
}
