import React from 'react';

function normalizePhone(phone) {
  if (!phone) return '';
  const digits = phone.toString().trim().replace(/[^0-9+]/g, '');
  // Remove leading + for wa.me (wa.me accepts without plus too), but keep international
  return digits.startsWith('+') ? digits.substring(1) : digits;
}

export default function EngageActions({ phone, whatsapp, email }) {
  const normalizedPhone = normalizePhone(phone || '');
  const normalizedWhatsApp = normalizePhone(whatsapp || phone || '');

  function handleWhatsApp(e) {
    e.stopPropagation();
    if (!normalizedWhatsApp) return;
    const url = `https://wa.me/${normalizedWhatsApp}`;
    window.open(url, '_blank', 'noreferrer');
  }

  function handleEmail(e) {
    e.stopPropagation();
    if (!email) return;
    const to = encodeURIComponent(email.trim());
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}`;
    window.open(url, '_blank', 'noreferrer');
  }

  function handlePhone(e) {
    e.stopPropagation();
    if (!normalizedPhone) return;
    window.location.href = `tel:${normalizedPhone}`;
  }

  const buttonClass =
    'px-2 py-1 text-xs rounded border border-gray-600 bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50';

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        className={buttonClass}
        onClick={handleWhatsApp}
        disabled={!normalizedWhatsApp}
        title={normalizedWhatsApp ? 'WhatsApp' : 'No WhatsApp number'}
      >
        📱WA
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={handlePhone}
        disabled={!normalizedPhone}
        title={normalizedPhone ? 'Phone dial' : 'No phone number'}
      >
        📞
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={handleEmail}
        disabled={!email}
        title={email ? 'Email' : 'No email'}
      >
        ✉️
      </button>
    </div>
  );
}
