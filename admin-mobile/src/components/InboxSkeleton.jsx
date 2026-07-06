export default function InboxSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-white/5 bg-surface-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded bg-white/10" />
              <div className="h-2 w-2/3 rounded bg-white/5" />
            </div>
          </div>
          <div className="mt-3 h-2 w-full rounded bg-white/5" />
        </div>
      ))}
    </div>
  )
}
