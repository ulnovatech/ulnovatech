import React, { useEffect, useState } from 'react';

const empty = {
  name: '',
  industry: '',
  description: '',
  website: '',
  threat_level: 'medium',
  tags: '',
  strengths: '',
  weaknesses: '',
  mission: '',
  company_size: '',
  location: '',
  products_services: '',
  tech_stack: '',
  target_market: '',
  pricing_models: '',
  is_active: true,
  notes: '',
};

function linesToArray(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .split(/[\r\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function arrayToLines(arr) {
  if (!Array.isArray(arr)) return '';
  return arr.join('\n');
}

export default function CompetitorFormModal({ open, initial, onClose, onSubmit }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial && initial.id) {
      setForm({
        ...empty,
        ...initial,
        tags: arrayToLines(initial.tags),
        strengths: arrayToLines(initial.strengths),
        weaknesses: arrayToLines(initial.weaknesses),
        is_active: !!initial.is_active,
      });
    } else {
      setForm(empty);
    }
  }, [open, initial]);

  if (!open) return null;

  function patch(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        industry: form.industry.trim() || null,
        description: form.description.trim() || null,
        website: form.website.trim() || null,
        threat_level: form.threat_level,
        tags: linesToArray(form.tags),
        strengths: linesToArray(form.strengths),
        weaknesses: linesToArray(form.weaknesses),
        mission: form.mission.trim() || null,
        company_size: form.company_size.trim() || null,
        location: form.location.trim() || null,
        products_services: form.products_services.trim() || null,
        tech_stack: form.tech_stack.trim() || null,
        target_market: form.target_market.trim() || null,
        pricing_models: form.pricing_models.trim() || null,
        is_active: !!form.is_active,
        notes: form.notes.trim() || null,
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-gray-900/95">
          <h3 className="text-lg font-semibold text-white">
            {initial?.id ? 'Edit competitor' : 'Add competitor'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-muted">Name *</span>
              <input
                required
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white"
                value={form.name}
                onChange={(e) => patch('name', e.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-muted">Industry</span>
              <input
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white"
                value={form.industry}
                onChange={(e) => patch('industry', e.target.value)}
              />
            </label>
            <label className="block space-y-1 md:col-span-2">
              <span className="text-muted">Website</span>
              <input
                type="url"
                placeholder="https://"
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white"
                value={form.website}
                onChange={(e) => patch('website', e.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-muted">Threat level</span>
              <select
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white"
                value={form.threat_level}
                onChange={(e) => patch('threat_level', e.target.value)}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={(e) => patch('is_active', e.target.checked)}
              />
              <span className="text-muted">Active tracking</span>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-muted">Short description</span>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white"
              value={form.description}
              onChange={(e) => patch('description', e.target.value)}
            />
          </label>

          <div className="border border-gray-800 rounded-lg p-4 space-y-3">
            <div className="text-xs font-semibold text-muted uppercase tracking-wide">Company overview</div>
            <label className="block space-y-1">
              <span className="text-muted">Mission</span>
              <textarea
                rows={2}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white"
                value={form.mission}
                onChange={(e) => patch('mission', e.target.value)}
              />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-muted">Size (employees / stage)</span>
                <input
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white"
                  value={form.company_size}
                  onChange={(e) => patch('company_size', e.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-muted">Location</span>
                <input
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white"
                  value={form.location}
                  onChange={(e) => patch('location', e.target.value)}
                />
              </label>
            </div>
          </div>

          <label className="block space-y-1">
            <span className="text-muted">Products / services</span>
            <textarea
              rows={3}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white"
              value={form.products_services}
              onChange={(e) => patch('products_services', e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-muted">Tech stack</span>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white"
              value={form.tech_stack}
              onChange={(e) => patch('tech_stack', e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-muted">Target market</span>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white"
              value={form.target_market}
              onChange={(e) => patch('target_market', e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-muted">Pricing models</span>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white"
              value={form.pricing_models}
              onChange={(e) => patch('pricing_models', e.target.value)}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-muted">Tags (one per line or comma-separated)</span>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white font-mono text-xs"
              value={form.tags}
              onChange={(e) => patch('tags', e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-muted">Strengths (one per line)</span>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white font-mono text-xs"
              value={form.strengths}
              onChange={(e) => patch('strengths', e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-muted">Weaknesses (one per line)</span>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white font-mono text-xs"
              value={form.weaknesses}
              onChange={(e) => patch('weaknesses', e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-muted">Internal notes</span>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white"
              value={form.notes}
              onChange={(e) => patch('notes', e.target.value)}
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-800 text-white">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
