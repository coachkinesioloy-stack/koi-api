import { createSession, fetchSessions } from "./api.js";
import { getActivePatient, setActiveSession } from "./store.js";

const btn = document.getElementById("create-session");
const list = document.getElementById("sessions-list");

async function loadSessions() {
  const patient = getActivePatient();
  if (!patient) return;

  const sessions = await fetchSessions(patient.patient_id);

  list.innerHTML = "";

  sessions.forEach(s => {
    const el = document.createElement("div");
    el.innerText = s.session_id;

    el.onclick = () => {
      setActiveSession(s);
      alert("Sesión seleccionada");
    };

    list.appendChild(el);
  });
}

btn.onclick = async () => {
  const patient = getActivePatient();
  if (!patient) return alert("Seleccionar paciente");

  const session = await createSession(patient.patient_id);

  setActiveSession(session);

  loadSessions();
};

loadSessions();
