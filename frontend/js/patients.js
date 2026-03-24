import { fetchPatients, createPatient } from "./api.js";
import { setActivePatient } from "./store.js";

const listEl = document.getElementById("patients-list");
const form = document.getElementById("patient-form");

async function loadPatients() {
  const patients = await fetchPatients();

  listEl.innerHTML = "";

  patients.forEach(p => {
    const el = document.createElement("div");
    el.className = "patient-item";
    el.innerText = p.name;

    el.onclick = () => {
      setActivePatient(p);
      alert("Paciente seleccionado");
    };

    listEl.appendChild(el);
  });
}

form.onsubmit = async (e) => {
  e.preventDefault();

  const name = document.getElementById("patient-name").value;

  if (!name) return;

  await createPatient(name);

  form.reset();
  loadPatients();
};

loadPatients();
