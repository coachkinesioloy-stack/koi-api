const KEY = "HANNA_STATE";

export function getState() {
  return JSON.parse(localStorage.getItem(KEY) || "{}");
}

export function setState(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function setActivePatient(patient) {
  const state = getState();
  state.activePatient = patient;
  setState(state);
}

export function getActivePatient() {
  return getState().activePatient || null;
}

export function setActiveSession(session) {
  const state = getState();
  state.activeSession = session;
  setState(state);
}

export function getActiveSession() {
  return getState().activeSession || null;
}
