//
//
// Simple API client for backend REST endpoints
//
// Notes:
// - Extracts backend error messages when available to aid debugging.
// - Avoids sending undefined fields in payloads.
// - Normalizes base URL and prevents accidental double "/api" segments.
// - Provides better diagnostics for non-JSON error responses.
//

/**
 * Normalize backend base URL from REACT_APP_BACKEND_URL.
 * - If undefined, fallback to "/api" (CRA dev proxy path).
 * - Strip trailing slashes.
 * - If the env var mistakenly ends with "/api", strip it to avoid "/api/api".
 */
function normalizeBaseUrl(url) {
  if (!url) return "/api";
  let u = String(url).trim().replace(/\/+$/, "");
  if (u.toLowerCase().endsWith("/api")) {
    u = u.slice(0, -4);
  }
  return u || "/api";
}

const BASE_URL = normalizeBaseUrl(process.env.REACT_APP_BACKEND_URL);

/* eslint-disable no-console */
if (typeof window !== "undefined") {
  console.info(
    "[api] Using backend BASE_URL:",
    BASE_URL === "/api" ? "/api (via dev proxy if configured)" : BASE_URL
  );
}
/* eslint-enable no-console */

// INTERNAL: Attempt to parse JSON safely
async function tryParseJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// INTERNAL: Extract best-effort error message from a Response that may not be JSON.
async function buildHttpError(res, defaultMsg) {
  const data = await tryParseJson(res);
  if (data) {
    const detail = data?.detail || data?.message || data?.error;
    if (detail) return new Error(`${defaultMsg}: ${detail}`);
  }
  // Fallback: attempt to read text (e.g., an HTML error page) and include a short snippet
  try {
    const text = await res.text();
    const snippet = (text || "").replace(/\s+/g, " ").slice(0, 160);
    return new Error(`${defaultMsg}: HTTP ${res.status} ${res.statusText} — ${snippet}`);
  } catch {
    return new Error(`${defaultMsg}: HTTP ${res.status} ${res.statusText}`);
  }
}

// PUBLIC_INTERFACE
export async function fetchPatients() {
  /** Fetch a list of patients with recent chat summaries. */
  const res = await fetch(`${BASE_URL}/patients`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw await buildHttpError(res, "Failed to fetch patients");
  }
  return res.json();
}

// PUBLIC_INTERFACE
export async function fetchPatientHistory(patientId) {
  /** Fetch chat history for a patient by ID. */
  const res = await fetch(`${BASE_URL}/patients/${encodeURIComponent(patientId)}/history`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw await buildHttpError(res, `Failed to fetch history for ${patientId}`);
  }
  return res.json();
}

// PUBLIC_INTERFACE
export async function createOrUpdatePatient(patient) {
  /**
   * Create or update a patient record.
   * patient: { id?, name, age?, notes? }
   * Only send defined fields to avoid backend validation errors.
   */
  const clean = Object.fromEntries(
    Object.entries(patient || {}).filter(([, v]) => v !== undefined && v !== null)
  );

  const res = await fetch(`${BASE_URL}/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clean),
  });

  if (!res.ok) {
    throw await buildHttpError(res, "Failed to save patient");
  }
  return res.json();
}

// PUBLIC_INTERFACE
export async function sendChatMessage({ patientId, message }) {
  /**
   * Send the user's message and receive responses from both agents.
   * Returns: { user: {...}, agent1: {...}, agent2: {...}, threadId }
   */
  const res = await fetch(`${BASE_URL}/chat/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientId, message }),
  });
  if (!res.ok) {
    throw await buildHttpError(res, "Failed to send message");
  }
  return res.json();
}
