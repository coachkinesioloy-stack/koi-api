const API_URL = "http://localhost:8000";

// -------- PATIENTS --------

export async function fetchPatients() {
  const res = await fetch(`${API_URL}/patients`);
  return await res.json();
}

export async function createPatient(name) {
  const res = await fetch(`${API_URL}/patient?name=${encodeURIComponent(name)}`, {
    method: "POST",
  });
  return await res.json();
}

// -------- SESSIONS --------

export async function createSession(patient_id) {
  const res = await fetch(`${API_URL}/session`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ patient_id })
  });
  return await res.json();
}

export async function fetchSessions(patient_id) {
  const res = await fetch(`${API_URL}/patient/${patient_id}/sessions`);
  return await res.json();
}

// -------- EVENTS --------

export async function createEvent(data) {
  const res = await fetch(`${API_URL}/event`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  });
  return await res.json();
}

export async function fetchEvents(session_id) {
  const res = await fetch(`${API_URL}/session/${session_id}/events`);
  return await res.json();
}

// -------- PLANS --------

export async function createPlan(data) {
  const params = new URLSearchParams(data).toString();

  const res = await fetch(`${API_URL}/plan?${params}`, {
    method: "POST"
  });

  return await res.json();
}

export async function fetchPlans(patient_id) {
  const res = await fetch(`${API_URL}/patient/${patient_id}/plans`);
  return await res.json();
}
