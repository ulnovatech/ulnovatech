import React, { useRef } from 'react';

const ACCEPT =
  '.csv,.xlsx,.xlsm,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Triggers multipart upload of CSV or XLSX to the given uploader.
 */
export default function ImportSpreadsheetButton({
  label = 'Import CSV / XLSX',
  className = '',
  disabled = false,
  onUpload,
}) {
  const inputRef = useRef(null);

  async function onChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUpload) return;
    const fd = new FormData();
    fd.append('file', file);
    await onUpload(fd);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        aria-hidden
        onChange={onChange}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={className || 'px-3 py-2 rounded-lg bg-gray-800 text-white text-sm hover:bg-gray-700 border border-gray-700'}
      >
        {label}
      </button>
    </>
  );
}
