//
//
// Simple API client for backend REST endpoints
//
// Notes:
// - Extracts backend error messages when available to aid debugging.
// - Avoids sending undefined fields in payloads.
//

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "/api";

// INTERNAL: Attempt to parse JSON safely
async function tryParseJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// PUBLIC_INTERFACE
export async function fetchPatients() {
  /** Fetch a list of patients with recent chat summaries. */
  const res = await fetch(`${BASE_URL}/patients`, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) {
    const data = await tryParseJson(res);
    const detail = data?.detail || data?.message;
    throw new Error(detail ? `Failed to fetch patients: ${detail}` : `Failed to fetch patients: ${res.status}`);
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
    const data = await tryParseJson(res);
    const detail = data?.detail || data?.message;
    throw new Error(detail ? `Failed to fetch history for ${patientId}: ${detail}` : `Failed to fetch history for ${patientId}: ${res.status}`);
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
    const data = await tryParseJson(res);
    const detail = data?.detail || data?.message;
    throw new Error(detail ? `Failed to save patient: ${detail}` : `Failed to save patient: ${res.status}`);
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
    const data = await tryParseJson(res);
    const detail = data?.detail || data?.message;
    throw new Error(detail ? `Failed to send message: ${detail}` : `Failed to send message: ${res.status}`);
  }
  return res.json();
}
