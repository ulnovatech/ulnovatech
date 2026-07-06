// src/components/RequestDetails.jsx
import React, { useState } from "react";
import { convertRequestToCompany } from "../services/requests";

export default function RequestDetails({ item, onClose }) {
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState(false);
  const [error, setError] = useState(null);

  async function handleConvert() {
    if (!item?.id) return;
    setConverting(true);
    setError(null);
    try {
      await convertRequestToCompany(item.id);
      setConverted(true);
    } catch (e) {
      console.error("Convert failed", e);
      setError(e.message || "Failed to convert request.");
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-xl w-full max-w-lg space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Request Details</h3>
          <button
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          <div><strong>ID:</strong> {item.id}</div>
          <div><strong>Name:</strong> {item.name}</div>
          <div><strong>Email:</strong> {item.email}</div>
          <div><strong>Message:</strong> {item.message}</div>
          <div><strong>Status:</strong> {item.status}</div>
        </div>

        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}

        {converted ? (
          <div className="text-green-400 font-semibold">
            ✅ Converted to company successfully!
          </div>
        ) : (
          <div className="flex justify-end gap-3">
            <button
              onClick={handleConvert}
              disabled={converting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white disabled:opacity-50"
            >
              {converting ? "Converting..." : "Convert to Company"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
