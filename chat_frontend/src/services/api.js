//
// Simple API client for backend REST endpoints
//

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "/api";

// PUBLIC_INTERFACE
export async function fetchPatients() {
  /** Fetch a list of patients with recent chat summaries. */
  const res = await fetch(`${BASE_URL}/patients`, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error(`Failed to fetch patients: ${res.status}`);
  return res.json();
}

// PUBLIC_INTERFACE
export async function fetchPatientHistory(patientId) {
  /** Fetch chat history for a patient by ID. */
  const res = await fetch(`${BASE_URL}/patients/${encodeURIComponent(patientId)}/history`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to fetch history for ${patientId}: ${res.status}`);
  return res.json();
}

// PUBLIC_INTERFACE
export async function createOrUpdatePatient(patient) {
  /**
   * Create or update a patient record.
   * patient: { id?, name, age?, notes? }
   */
  const res = await fetch(`${BASE_URL}/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patient),
  });
  if (!res.ok) throw new Error(`Failed to save patient: ${res.status}`);
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
  if (!res.ok) throw new Error(`Failed to send message: ${res.status}`);
  return res.json();
}
