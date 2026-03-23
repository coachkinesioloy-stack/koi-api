const API = "https://hanna-api-9rub.onrender.com";

const state = {
  currentView: "dashboard",
  selectedPatientId: "",
  selectedSessionId: "",
};

const views = {
  dashboard: document.getElementById("view-dashboard"),
  patients: document.getElementById("view-patients"),
  sessions: document.getElementById("view-sessions"),
  checkin: document.getElementById("view-checkin"),
  settings: document.getElementById("view-settings"),
};

const navButtons = [...document.querySelectorAll(".side-link")];

function api() {
  return API;
}

async function getJson(url, options = {}) {
  const res = await fetch(url, options);
  return await res.json();
}

function activateReveal(root = document) {
  const items = [...root.querySelectorAll(".reveal, .card, .pulse-center")];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("in-view");
    });
  }, { threshold: 0.18 });

  items.forEach((el) => observer.observe(el));
}

function setupParallax() {
  const bg = document.getElementById("bgParallax");
  if (!bg) return;

  window.addEventListener("scroll", () => {
    const y = window.scrollY * 0.08;
    bg.style.transform = `translateY(${y}px)`;
  }, { passive: true });
}

function setView(view) {
  state.currentView = view;

  Object.entries(views).forEach(([key, el]) => {
    el.classList.toggle("active", key === view);
  });

  navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  if (view === "dashboard") renderDashboardData();
  if (view === "patients") renderPatients();
  if (view === "sessions") renderSessions();
  if (view === "checkin") renderCheckin();
  if (view === "settings") renderSettings();
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});

document.getElementById("startSessionBtn")?.addEventListener("click", () => {
  setView("checkin");
});

async function renderDashboardData() {
  try {
    const data = await getJson(`${api()}/dashboard/summary`);
    const latest = data.latest_checkin?.payload || {};

    const hrv = latest.rmssd_ms ?? 144;
    const score = hrv < 20 ? 42 : hrv <= 50 ? 76 : 90;

    document.getElementById("hrvHeadValue").textContent = hrv;
    document.getElementById("updHrv").textContent = latest.rmssd_ms ? `+${Math.round((latest.rmssd_ms / 18) * 5)}%` : "+5%";
    document.getElementById("adaptProgress").style.width = `${score}%`;

    if (data.latest_checkin?.patient_id) {
      document.getElementById("sessionNameBox").textContent = data.latest_checkin.patient_id;
    }
  } catch {
    document.getElementById("adaptProgress").style.width = "76%";
  }

  activateReveal(document);
}

async function renderPatients() {
  const patients = await getJson(`${api()}/patients`);

  views.patients.innerHTML = `
    <div class="simple-grid">
      <section class="view-panel reveal">
        <h3>Nuevo paciente</h3>
        <label>Nombre</label>
        <input id="patient-name" placeholder="Ej: Juan Pérez" />
        <div class="form-actions">
          <button class="small-btn" id="save-patient-btn">Guardar paciente</button>
        </div>
        <div class="result-box">
          <pre id="patient-result">Esperando datos...</pre>
        </div>
      </section>

      <section class="view-panel reveal">
        <h3>Pacientes registrados</h3>
        <div class="simple-list">
          ${
            patients.length
              ? patients.map(p => `
                <div class="simple-item">
                  <strong>${p.name}</strong><br>
                  <span class="muted">${p.patient_id}</span>
                </div>
              `).join("")
              : `<div class="empty">No hay pacientes.</div>`
          }
        </div>
      </section>
    </div>
  `;

  document.getElementById("save-patient-btn").onclick = async () => {
    const name = document.getElementById("patient-name").value.trim();
    if (!name) return;

    const data = await getJson(`${api()}/patient?name=${encodeURIComponent(name)}`, {
      method: "POST"
    });

    document.getElementById("patient-result").textContent = JSON.stringify(data, null, 2);
    state.selectedPatientId = data.patient_id;
    renderPatients();
  };

  activateReveal(views.patients);
}

async function renderSessions() {
  const patients = await getJson(`${api()}/patients`);

  views.sessions.innerHTML = `
    <div class="simple-grid">
      <section class="view-panel reveal">
        <h3>Crear sesión</h3>
        <label>Paciente</label>
        <select id="session-patient-select">
          <option value="">Seleccionar paciente</option>
          ${patients.map(p => `<option value="${p.patient_id}">${p.name} — ${p.patient_id}</option>`).join("")}
        </select>

        <div class="form-actions">
          <button class="small-btn" id="create-session-btn">Crear sesión</button>
        </div>

        <div class="result-box">
          <pre id="session-result">Esperando acción...</pre>
        </div>
      </section>

      <section class="view-panel reveal">
        <h3>Sesiones del paciente</h3>
        <div id="sessions-list" class="simple-list">
          <div class="empty">Seleccioná un paciente.</div>
        </div>
      </section>
    </div>
  `;

  const patientSelect = document.getElementById("session-patient-select");
  const sessionsList = document.getElementById("sessions-list");

  patientSelect.onchange = async () => {
    const patientId = patientSelect.value;
    state.selectedPatientId = patientId;

    if (!patientId) {
      sessionsList.innerHTML = `<div class="empty">Seleccioná un paciente.</div>`;
      return;
    }

    const sessions = await getJson(`${api()}/patient/${patientId}/sessions`);
    sessionsList.innerHTML = sessions.length
      ? sessions.map(s => `
        <div class="simple-item">
          <strong>${s.session_id}</strong><br>
          <span class="muted">${s.ts}</span>
        </div>
      `).join("")
      : `<div class="empty">No hay sesiones.</div>`;
  };

  document.getElementById("create-session-btn").onclick = async () => {
    const patientId = patientSelect.value;
    if (!patientId) return;

    const data = await getJson(`${api()}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: patientId })
    });

    document.getElementById("session-result").textContent = JSON.stringify(data, null, 2);
    state.selectedPatientId = patientId;
    state.selectedSessionId = data.session_id;
    patientSelect.dispatchEvent(new Event("change"));
  };

  activateReveal(views.sessions);
}

async function renderCheckin() {
  const patients = await getJson(`${api()}/patients`);

  views.checkin.innerHTML = `
    <div class="simple-grid">
      <section class="view-panel reveal">
        <h3>M1 · Check-in biométrico</h3>

        <label>Paciente</label>
        <select id="checkin-patient-select">
          <option value="">Seleccionar paciente</option>
          ${patients.map(p => `<option value="${p.patient_id}">${p.name} — ${p.patient_id}</option>`).join("")}
        </select>

        <label style="margin-top:12px;">Sesión</label>
        <select id="checkin-session-select">
          <option value="">Seleccionar sesión</option>
        </select>

        <label style="margin-top:12px;">RMSSD</label>
        <input id="rmssd_ms" value="18.4" />

        <label style="margin-top:12px;">HR BPM</label>
        <input id="hr_bpm" value="82" />

        <label style="margin-top:12px;">RR RPM</label>
        <input id="rr_rpm" value="14" />

        <label style="margin-top:12px;">SQI</label>
        <input id="sqi" value="0.91" />

        <label style="margin-top:12px;">EVA</label>
        <input id="eva" value="5" />

        <label style="margin-top:12px;">Energy</label>
        <input id="energy" value="6" />

        <div class="form-actions">
          <button class="small-btn" id="save-checkin-btn">Guardar check-in</button>
        </div>

        <div class="result-box">
          <pre id="checkin-result">Esperando acción...</pre>
        </div>
      </section>

      <section class="view-panel reveal">
        <h3>Eventos de la sesión</h3>
        <div id="checkin-events-list" class="simple-list">
          <div class="empty">Seleccioná una sesión.</div>
        </div>
      </section>
    </div>
  `;

  const patientSelect = document.getElementById("checkin-patient-select");
  const sessionSelect = document.getElementById("checkin-session-select");
  const eventsList = document.getElementById("checkin-events-list");

  patientSelect.onchange = async () => {
    const patientId = patientSelect.value;
    state.selectedPatientId = patientId;
    sessionSelect.innerHTML = `<option value="">Seleccionar sesión</option>`;

    if (!patientId) return;

    const sessions = await getJson(`${api()}/patient/${patientId}/sessions`);
    sessionSelect.innerHTML = `
      <option value="">Seleccionar sesión</option>
      ${sessions.map(s => `<option value="${s.session_id}">${s.session_id}</option>`).join("")}
    `;
  };

  sessionSelect.onchange = async () => {
    const sessionId = sessionSelect.value;
    state.selectedSessionId = sessionId;

    if (!sessionId) {
      eventsList.innerHTML = `<div class="empty">Seleccioná una sesión.</div>`;
      return;
    }

    const events = await getJson(`${api()}/session/${sessionId}/events`);
    eventsList.innerHTML = events.length
      ? events.map(e => `
        <div class="simple-item">
          <strong>${e.type}</strong><br>
          <span class="muted">${e.ts}</span>
          <pre>${JSON.stringify(e.payload, null, 2)}</pre>
        </div>
      `).join("")
      : `<div class="empty">No hay eventos.</div>`;
  };

  document.getElementById("save-checkin-btn").onclick = async () => {
    const patientId = patientSelect.value;
    const sessionId = sessionSelect.value;
    if (!patientId || !sessionId) return;

    const payload = {
      session_id: sessionId,
      patient_id: patientId,
      type: "M1_MEASURED",
      actor: "system",
      schema_name: "biometric_checkin",
      schema_version: "1",
      payload: {
        rmssd_ms: parseFloat(document.getElementById("rmssd_ms").value),
        hr_bpm: parseFloat(document.getElementById("hr_bpm").value),
        rr_rpm: parseFloat(document.getElementById("rr_rpm").value),
        sqi: parseFloat(document.getElementById("sqi").value),
        eva: parseFloat(document.getElementById("eva").value),
        energy: parseFloat(document.getElementById("energy").value)
      }
    };

    const data = await getJson(`${api()}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    document.getElementById("checkin-result").textContent = JSON.stringify(data, null, 2);
    sessionSelect.dispatchEvent(new Event("change"));
    renderDashboardData();
  };

  activateReveal(views.checkin);
}

function renderSettings() {
  views.settings.innerHTML = `
    <section class="view-panel reveal">
      <h3>Configuración</h3>
      <div class="empty">Sección reservada para parámetros clínicos, IA y visualización.</div>
    </section>
  `;
  activateReveal(views.settings);
}

setupParallax();
activateReveal(document);
renderDashboardData();
