import React, { useEffect, useState } from 'react';
import ProspectStatusBadge from './ProspectStatusBadge';

const empty = {
  name: '',
  industry: '',
  location: '',
  source: '',
  contact_phone: '',
  contact_email: '',
  contact_method: 'phone',
  priority: 'medium',
  notes: '',
  status: 'not_contacted',
};

export default function ProspectFormModal({ open, initial, onClose, onSubmit }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial?.id) {
      setForm({
        ...empty,
        name: initial.name || '',
        industry: initial.industry || '',
        location: initial.location || '',
        source: initial.source || '',
        contact_phone: initial.contact_phone || initial.phone || '',
        contact_email: initial.contact_email || initial.email || '',
        contact_method: initial.contact_method || 'phone',
        priority: initial.priority || 'medium',
        notes: initial.notes || '',
        status: initial.status || 'not_contacted',
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
    if (!form.name.trim()) {
      alert('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        industry: form.industry.trim() || null,
        location: form.location.trim() || null,
        source: form.source.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_method: form.contact_method || 'phone',
        priority: form.priority,
        notes: form.notes.trim() || null,
        status: form.status,
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const converted = initial?.status === 'converted_to_company';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-gray-900/95">
          <h3 className="text-lg font-semibold text-white">
            {initial?.id ? 'Edit prospect' : 'Add prospect'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {converted && (
            <p className="text-amber-400 text-xs">
              This prospect was converted to a company. Only viewing; use Companies to edit the record.
            </p>
          )}
          <label className="block space-y-1">
            <span className="text-muted">Name *</span>
            <input
              required
              disabled={converted}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white disabled:opacity-50"
              value={form.name}
              onChange={(e) => patch('name', e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-muted">Industry</span>
            <input
              disabled={converted}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white disabled:opacity-50"
              value={form.industry}
              onChange={(e) => patch('industry', e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-muted">Location</span>
            <input
              disabled={converted}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white disabled:opacity-50"
              value={form.location}
              onChange={(e) => patch('location', e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-muted">Source (e.g. LinkedIn, Google)</span>
            <input
              disabled={converted}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white disabled:opacity-50"
              value={form.source}
              onChange={(e) => patch('source', e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-muted">Contact phone</span>
              <input
                disabled={converted}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white disabled:opacity-50"
                value={form.contact_phone}
                onChange={(e) => patch('contact_phone', e.target.value)}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-muted">Contact email</span>
              <input
                disabled={converted}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white disabled:opacity-50"
                value={form.contact_email}
                onChange={(e) => patch('contact_email', e.target.value)}
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-muted">Contact method</span>
            <select
              disabled={converted}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white disabled:opacity-50"
              value={form.contact_method}
              onChange={(e) => patch('contact_method', e.target.value)}
            >
              <option value="phone">Phone</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="social">Social</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-muted">Priority</span>
              <select
                disabled={converted}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white"
                value={form.priority}
                onChange={(e) => patch('priority', e.target.value)}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <div className="block space-y-1">
              <span className="text-muted">Status</span>
              {converted ? (
                <div className="pt-1">
                  <ProspectStatusBadge status={initial.status} />
                </div>
              ) : (
                <select
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white"
                  value={form.status}
                  onChange={(e) => patch('status', e.target.value)}
                >
                  <option value="not_contacted">Not contacted</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                </select>
              )}
            </div>
          </div>
          <label className="block space-y-1">
            <span className="text-muted">Notes (research before calling)</span>
            <textarea
              rows={4}
              disabled={converted}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded text-white disabled:opacity-50"
              value={form.notes}
              onChange={(e) => patch('notes', e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-800 text-white">
              Cancel
            </button>
            {!converted && (
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
