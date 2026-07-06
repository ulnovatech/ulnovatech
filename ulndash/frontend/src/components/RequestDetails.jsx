import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RequestsAPI, CompaniesAPI } from "../services/api";

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await RequestsAPI.get(id);
      setRequest(r);
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  }

  async function handleConvert() {
    if (!confirm("Convert this request into a company?")) return;
    try {
      const res = await RequestsAPI.convertToCompany(id);
      alert("Converted successfully!");
      navigate(`/companies/${res.company_id}`); // Go to new company detail page
    } catch (e) {
      alert("Conversion failed: " + e.message);
    }
  }

  useEffect(() => { load(); }, [id]);

  if (loading || !request) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{request.name}</h1>
      <div className="bg-white p-4 rounded-xl shadow">
        <p><strong>Phone:</strong> {request.phone}</p>
        <p><strong>Description:</strong> {request.description}</p>
        <p><strong>Submitted:</strong> {request.submitted_at}</p>
      </div>

      {/* ✅ Convert button */}
      <button
        onClick={handleConvert}
        className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
      >
        Convert to Company
      </button>
    </div>
  );
}
