// src/services/requests.js
// Reuse shared API request helper so all pages use one base URL strategy.
import { request } from "./api";

export async function fetchRequests(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/requests${qs ? `?${qs}` : ""}`);
}

export async function fetchRequestById(id) {
  return request(`/requests/${id}`);
}

export async function convertRequestToCompany(id) {
  return request(`/requests/${id}/convert`, { method: "POST" });
}
