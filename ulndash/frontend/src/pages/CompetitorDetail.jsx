import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CompetitorsAPI } from '../services/api';
import ThreatBadge from '../components/ThreatBadge';
import CompetitorFormModal from '../components/CompetitorFormModal';

function Section({ title, children }) {
  return (
    <section className="card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wide"> {title}</h3>
      <div className="text-gray-200 text-sm space-y-2">{children}</div>
    </section>
  );
}

function ListBlock({ label, items }) {
  if (!items || !items.length) return null;
  return (
    <div>
      <div className="text-gray-200 font-medium mb-1">{label}</div>
      <ul className="list-disc list-inside text-gray-300 space-y-1">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

export default function CompetitorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await CompetitorsAPI.get(id);
      setRow(r);
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to load competitor');
      setRow(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleSubmit(payload) {
    await CompetitorsAPI.update(id, payload);
    await load();
  }

  async function handleDelete() {
    if (!confirm('Delete this competitor permanently?')) return;
    try {
      await CompetitorsAPI.remove(id);
      navigate('/competitors');
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  }

  if (loading) {
    return <div className="p-6 text-muted">Loading…</div>;
  }
  if (!row || row.error) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-rose-400">Competitor not found.</p>
        <Link to="/competitors" className="text-indigo-400 underline">
          Back to list
        </Link>
      </div>
    );
  }

  const websiteHref = row.website
    ? row.website.startsWith('http')
      ? row.website
      : `https://${row.website}`
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <Link to="/competitors" className="text-sm text-indigo-400 hover:underline">
            ← Competitors
          </Link>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <h1 className="text-2xl font-bold text-white">{row.name}</h1>
            <ThreatBadge level={row.threat_level} />
            {row.is_active ? (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Active
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">Inactive</span>
            )}
          </div>
          <p className="text-muted text-sm mt-1">
            {row.industry || 'Industry unknown'}
            {row.location ? ` · ${row.location}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {websiteHref && (
            <a
              href={websiteHref}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-700"
            >
              Website
            </a>
          )}
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-rose-700 text-white text-sm hover:bg-rose-800"
          >
            Remove
          </button>
        </div>
      </div>

      <Section title="Company overview">
        <p>
          <span className="text-muted">Mission</span>
          <br />
          {row.mission || '—'}
        </p>
        <p>
          <span className="text-muted">Size</span>
          <br />
          {row.company_size || '—'}
        </p>
        <p>
          <span className="text-muted">Location</span>
          <br />
          {row.location || '—'}
        </p>
        <p>
          <span className="text-muted">Summary</span>
          <br />
          {row.description || '—'}
        </p>
      </Section>

      <Section title="Products & services">
        <p className="whitespace-pre-wrap">{row.products_services || '—'}</p>
      </Section>

      <Section title="Tech stack">
        <p className="whitespace-pre-wrap">{row.tech_stack || '—'}</p>
      </Section>

      <Section title="Target market">
        <p className="whitespace-pre-wrap">{row.target_market || '—'}</p>
      </Section>

      <Section title="Pricing models">
        <p className="whitespace-pre-wrap">{row.pricing_models || '—'}</p>
      </Section>

      <Section title="Strengths & weaknesses">
        <ListBlock label="Strengths" items={row.strengths} />
        <ListBlock label="Weaknesses" items={row.weaknesses} />
        {!row.strengths?.length && !row.weaknesses?.length && <p className="text-gray-500">—</p>}
      </Section>

      <Section title="Tags">
        {row.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {row.tags.map((t, i) => (
              <span key={i} className="px-2 py-1 rounded bg-gray-800 text-xs text-gray-300">
                {t}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-500">—</span>
        )}
      </Section>

      {row.notes && (
        <Section title="Internal notes">
          <p className="whitespace-pre-wrap text-gray-400">{row.notes}</p>
        </Section>
      )}

      <p className="text-xs text-muted">
        Created {row.created_at || '—'}
        {row.updated_at ? ` · Updated ${row.updated_at}` : ''}
      </p>

      <CompetitorFormModal
        open={editOpen}
        initial={row}
        onClose={() => setEditOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
