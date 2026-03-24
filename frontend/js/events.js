import { createEvent } from "./api.js";
import { getActivePatient, getActiveSession } from "./store.js";

const btn = document.getElementById("send-checkin");

btn.onclick = async () => {
  const patient = getActivePatient();
  const session = getActiveSession();

  if (!patient || !session) {
    return alert("Falta paciente o sesión");
  }

  await createEvent({
    session_id: session.session_id,
    patient_id: patient.patient_id,
    type: "M1_MEASURED",
    actor: "coach",
    payload: {
      rmssd_ms: 35
    }
  });

  alert("Check-in guardado");
};
