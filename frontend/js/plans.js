import { createPlan, fetchPlans } from "./api.js";
import { getActivePatient } from "./store.js";

const form = document.getElementById("plan-form");
const list = document.getElementById("plans-list");

async function loadPlans() {
  const patient = getActivePatient();
  if (!patient) return;

  const plans = await fetchPlans(patient.patient_id);

  list.innerHTML = "";

  plans.forEach(p => {
    const el = document.createElement("div");
    el.innerText = `${p.title} - ${p.category}`;
    list.appendChild(el);
  });
}

form.onsubmit = async (e) => {
  e.preventDefault();

  const patient = getActivePatient();
  if (!patient) return alert("Seleccionar paciente");

  const data = {
    patient_id: patient.patient_id,
    title: document.getElementById("plan-title").value,
    category: document.getElementById("plan-category").value,
    description: document.getElementById("plan-description").value,
    frequency: document.getElementById("plan-frequency").value,
  };

  await createPlan(data);

  form.reset();
  loadPlans();
};

loadPlans();
