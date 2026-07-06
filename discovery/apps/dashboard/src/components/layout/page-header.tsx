export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      {description && <p className="text-sm text-slate-600 mt-1">{description}</p>}
    </div>
  );
}
