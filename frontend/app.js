const API = "https://hanna-api-9rub.onrender.com";

const state = {
  currentView: "dashboard",
  selectedPatientId: "",
  selectedSessionId: "",
  patients: [],
  sessionsByPatient: {},
  summary: null,
};

const views = {
  dashboard: document.getElementById("view-dashboard"),
  patients: document.getElementById("view-patients"),
  sessions: document.getElementById("view-sessions"),
  checkin: document.getElementById("view-checkin"),
  planning: document.getElementById("view-planning"),
  library: document.getElementById("view-library"),
  community: document.getElementById("view-community"),
  tips: document.getElementById("view-tips"),
  live: document.getElementById("view-live"),
  settings: document.getElementById("view-settings"),
};

const navButtons = [...document.querySelectorAll(".side-link")];
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const activePatientName = document.getElementById("activePatientName");
const activePatientMeta = document.getElementById("activePatientMeta");

function api() {
  return API;
}

async function getJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return await res.json();
}

function activateReveal(root = document) {
  const items = [...root.querySelectorAll(".reveal, .card")];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("in-view");
    });
  }, { threshold: 0.16 });

  items.forEach((el) => observer.observe(el));
}

function setupParallax() {
  const bg = document.getElementById("bgParallax");
  if (!bg) return;

  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY * 0.08;
      bg.style.transform = `translateY(${y}px)`;
    },
    { passive: true }
  );
}

async function loadPatients() {
  state.patients = await getJson(`${api()}/patients`);
  return state.patients;
}

async function loadSummary() {
  state.summary = await getJson(`${api()}/dashboard/summary`);
  return state.summary;
}

async function loadSessionsForPatient(patientId) {
  if (!patientId) return [];
  if (!state.sessionsByPatient[patientId]) {
    state.sessionsByPatient[patientId] = await getJson(`${api()}/patient/${patientId}/sessions`);
  }
  return state.sessionsByPatient[patientId];
}

function patientNameById(patientId) {
  const p = state.patients.find((x) => x.patient_id === patientId);
  return p ? p.name : patientId;
}

function getActivePatient() {
  return state.patients.find((p) => p.patient_id === state.selectedPatientId) || null;
}

function refreshActivePatientHeader() {
  const patient = getActivePatient();

  if (!patient) {
    activePatientName.textContent = "Sin seleccionar";
    activePatientMeta.textContent = "Seleccioná un paciente para trabajar.";
    return;
  }

  activePatientName.textContent = patient.name;
  activePatientMeta.textContent = patient.patient_id;
}

function setActivePatient(patientId) {
  state.selectedPatientId = patientId;
  state.selectedSessionId = "";
  refreshActivePatientHeader();

  if (state.currentView === "dashboard") renderDashboard();
  if (state.currentView === "patients") renderPatients();
  if (state.currentView === "sessions") renderSessions();
  if (state.currentView === "checkin") renderCheckin();
}

function setView(view) {
  state.currentView = view;

  Object.entries(views).forEach(([key, el]) => {
    el.classList.toggle("active", key === view);
  });

  navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  if (view === "dashboard") {
    pageTitle.textContent = "Dashboard clínico";
    pageSubtitle.textContent = "Control integral del sistema.";
    renderDashboard();
  }

  if (view === "patients") {
    pageTitle.textContent = "Pacientes";
    pageSubtitle.textContent = "Alta, selección y gestión clínica.";
    renderPatients();
  }

  if (view === "sessions") {
    pageTitle.textContent = "Sesiones";
    pageSubtitle.textContent = "Creación y seguimiento de sesiones.";
    renderSessions();
  }

  if (view === "checkin") {
    pageTitle.textContent = "Evaluaciones";
    pageSubtitle.textContent = "Check-in biométrico y eventos.";
    renderCheckin();
  }

  if (view === "planning") {
    pageTitle.textContent = "Planificación";
    pageSubtitle.textContent = "Rutinas, ejercicios y progresiones.";
    renderPlanning();
  }

  if (view === "library") {
    pageTitle.textContent = "Biblioteca";
    pageSubtitle.textContent = "Videos y recursos clínicos.";
    renderLibrary();
  }

  if (view === "community") {
    pageTitle.textContent = "Comunidad";
    pageSubtitle.textContent = "Espacios de relación y soporte.";
    renderCommunity();
  }

  if (view === "tips") {
    pageTitle.textContent = "Tips / Publicaciones";
    pageSubtitle.textContent = "Contenido educativo y mensajes.";
    renderTips();
  }

  if (view === "live") {
    pageTitle.textContent = "Sesión en vivo";
    pageSubtitle.textContent = "Coaching y análisis en tiempo real.";
    renderLive();
  }

  if (view === "settings") {
    pageTitle.textContent = "Configuración";
    pageSubtitle.textContent = "Parámetros clínicos y del sistema.";
    renderSettings();
  }
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});

async function renderDashboard() {
  await loadPatients();
  const summary = await loadSummary();
  refreshActivePatientHeader();

  const latest = summary.latest_checkin?.payload || {};
  const hrv = latest.rmssd_ms ?? "--";
  const hr = latest.hr_bpm ?? "--";
  const stateText = latest.sna_state ?? "Sin datos";

  views.dashboard.innerHTML = `
    <div class="dashboard">
      <section class="card metric-card reveal">
        <h3>Pacientes totales</h3>
        <div class="metric-value">${summary.patients_count}</div>
        <div class="metric-sub">Pacientes registrados en HANNA</div>
      </section>

      <section class="card metric-card reveal">
        <h3>Sesiones totales</h3>
        <div class="metric-value">${summary.sessions_count}</div>
        <div class="metric-sub">Sesiones creadas en el sistema</div>
      </section>

      <section class="card metric-card reveal">
        <h3>Check-ins M1</h3>
        <div class="metric-value">${summary.checkins_count}</div>
        <div class="metric-sub">Evaluaciones biométricas realizadas</div>
      </section>

      <section class="card wide-card reveal">
        <h3>Paciente activo</h3>
        ${
          state.selectedPatientId
            ? `
              <div class="grid-2">
                <div>
                  <div class="metric-value" style="font-size:34px;">${patientNameById(state.selectedPatientId)}</div>
                  <div class="metric-sub">${state.selectedPatientId}</div>
                </div>
                <div>
                  <div class="metric-sub">Último estado autonómico</div>
                  <div class="metric-value" style="font-size:28px;">${stateText}</div>
                </div>
              </div>
            `
            : `
              <div class="empty">Todavía no seleccionaste un paciente.</div>
            `
        }
      </section>

      <section class="card metric-card reveal">
        <h3>HRV actual</h3>
        <div class="metric-value">${hrv}</div>
        <div class="metric-sub">RMSSD ms</div>
      </section>

      <section class="card metric-card reveal">
        <h3>Heart-rate</h3>
        <div class="metric-value">${hr}</div>
        <div class="metric-sub">BPM</div>
      </section>

      <section class="card metric-card reveal">
        <h3>Estado clínico</h3>
        <div class="metric-value" style="font-size:28px;">${stateText}</div>
        <div class="metric-sub">Resultado automático M1</div>
      </section>
    </div>
  `;

  activateReveal(views.dashboard);
}

function patientCard(p) {
  const selected = state.selectedPatientId === p.patient_id ? "selected-card" : "";
  return `
    <div class="simple-item patient-card ${selected}" data-patient-id="${p.patient_id}">
      <strong>${p.name}</strong><br>
      <span class="muted">${p.patient_id}</span>
    </div>
  `;
}

async function renderPatients() {
  const patients = await loadPatients();
  refreshActivePatientHeader();

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
          <div id="patient-feedback" class="empty">Creá o seleccioná un paciente.</div>
        </div>
      </section>

      <section class="view-panel reveal">
        <h3>Pacientes registrados</h3>
        <div class="simple-list" id="patients-list-box">
          ${patients.length ? patients.map(patientCard).join("") : `<div class="empty">No hay pacientes.</div>`}
        </div>
      </section>
    </div>
  `;

  document.getElementById("save-patient-btn").onclick = async () => {
    const name = document.getElementById("patient-name").value.trim();
    if (!name) return;

    const data = await getJson(`${api()}/patient?name=${encodeURIComponent(name)}`, {
      method: "POST",
    });

    state.sessionsByPatient = {};
    await loadPatients();
    setActivePatient(data.patient_id);

    document.getElementById("patient-feedback").innerHTML = `
      <div class="simple-item selected-card">
        <strong>Paciente creado</strong><br>
        <span class="muted">${data.name}</span><br>
        <span class="muted">${data.patient_id}</span>
      </div>
    `;
  };

  document.querySelectorAll(".patient-card").forEach((card) => {
    card.onclick = () => {
      setActivePatient(card.dataset.patientId);
    };
  });

  activateReveal(views.patients);
}

function renderSessionList(sessions) {
  if (!sessions.length) return `<div class="empty">No hay sesiones.</div>`;

  return sessions
    .map(
      (s) => `
      <div class="simple-item">
        <strong>${s.session_id}</strong><br>
        <span class="muted">${s.ts}</span>
      </div>
    `
    )
    .join("");
}

async function renderSessions() {
  await loadPatients();
  refreshActivePatientHeader();

  const activePatient = getActivePatient();

  views.sessions.innerHTML = `
    <div class="simple-grid">
      <section class="view-panel reveal">
        <h3>Crear sesión</h3>
        <label>Paciente activo</label>
        <input value="${activePatient ? activePatient.name : "Sin paciente activo"}" disabled />
        <div class="form-actions">
          <button class="small-btn" id="create-session-btn" ${activePatient ? "" : "disabled"}>Crear sesión</button>
        </div>
        <div class="result-box">
          <div id="session-feedback" class="empty">${activePatient ? "Listo para crear sesión." : "Primero seleccioná un paciente."}</div>
        </div>
      </section>

      <section class="view-panel reveal">
        <h3>Sesiones del paciente</h3>
        <div id="sessions-list" class="simple-list">
          <div class="empty">${activePatient ? "Cargando sesiones..." : "Seleccioná un paciente."}</div>
        </div>
      </section>
    </div>
  `;

  const sessionsList = document.getElementById("sessions-list");

  async function refreshSessionsList() {
    if (!state.selectedPatientId) {
      sessionsList.innerHTML = `<div class="empty">Seleccioná un paciente.</div>`;
      return;
    }

    const sessions = await loadSessionsForPatient(state.selectedPatientId);
    sessionsList.innerHTML = renderSessionList(sessions);
  }

  if (state.selectedPatientId) {
    refreshSessionsList();
  }

  const createBtn = document.getElementById("create-session-btn");
  if (createBtn) {
    createBtn.onclick = async () => {
      if (!state.selectedPatientId) return;

      const data = await getJson(`${api()}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: state.selectedPatientId }),
      });

      state.selectedSessionId = data.session_id;
      state.sessionsByPatient[state.selectedPatientId] = undefined;

      document.getElementById("session-feedback").innerHTML = `
        <div class="simple-item selected-card">
          <strong>Sesión creada</strong><br>
          <span class="muted">${data.session_id}</span>
        </div>
      `;

      await refreshSessionsList();
      await renderDashboard();
    };
  }

  activateReveal(views.sessions);
}

function renderEventsList(events) {
  if (!events.length) return `<div class="empty">No hay eventos.</div>`;

  return events
    .map(
      (e) => `
      <div class="simple-item">
        <strong>${e.type}</strong><br>
        <span class="muted">${e.ts}</span>
        <div class="muted" style="margin-top:8px;">${e.payload.sna_state ? `Estado: ${e.payload.sna_state}` : "Evento registrado"}</div>
      </div>
    `
    )
    .join("");
}

async function renderCheckin() {
  await loadPatients();
  refreshActivePatientHeader();

  const activePatient = getActivePatient();
  const sessions = state.selectedPatientId ? await loadSessionsForPatient(state.selectedPatientId) : [];

  views.checkin.innerHTML = `
    <div class="simple-grid">
      <section class="view-panel reveal">
        <h3>M1 · Check-in biométrico</h3>

        <label>Paciente activo</label>
        <input value="${activePatient ? activePatient.name : "Sin paciente activo"}" disabled />

        <label style="margin-top:12px;">Sesión</label>
        <select id="checkin-session-select">
          <option value="">Seleccionar sesión</option>
          ${sessions.map((s) => `<option value="${s.session_id}" ${state.selectedSessionId === s.session_id ? "selected" : ""}>${s.session_id}</option>`).join("")}
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
          <button class="small-btn" id="save-checkin-btn" ${activePatient ? "" : "disabled"}>Guardar check-in</button>
        </div>

        <div class="result-box">
          <div id="checkin-feedback" class="empty">${activePatient ? "Listo para guardar evaluación." : "Primero seleccioná un paciente."}</div>
        </div>
      </section>

      <section class="view-panel reveal">
        <h3>Eventos de la sesión</h3>
        <div id="checkin-events-list" class="simple-list">
          <div class="empty">${state.selectedSessionId ? "Cargando eventos..." : "Seleccioná una sesión."}</div>
        </div>
      </section>
    </div>
  `;

  const sessionSelect = document.getElementById("checkin-session-select");
  const eventsList = document.getElementById("checkin-events-list");

  async function refreshEventsList() {
    const sessionId = sessionSelect.value;
    state.selectedSessionId = sessionId;

    if (!sessionId) {
      eventsList.innerHTML = `<div class="empty">Seleccioná una sesión.</div>`;
      return;
    }

    const events = await getJson(`${api()}/session/${sessionId}/events`);
    eventsList.innerHTML = renderEventsList(events);
  }

  sessionSelect.onchange = refreshEventsList;

  if (state.selectedSessionId) {
    sessionSelect.value = state.selectedSessionId;
    refreshEventsList();
  }

  const saveBtn = document.getElementById("save-checkin-btn");
  if (saveBtn) {
    saveBtn.onclick = async () => {
      const sessionId = sessionSelect.value;
      if (!state.selectedPatientId || !sessionId) return;

      const payload = {
        session_id: sessionId,
        patient_id: state.selectedPatientId,
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
          energy: parseFloat(document.getElementById("energy").value),
        },
      };

      const data = await getJson(`${api()}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      document.getElementById("checkin-feedback").innerHTML = `
        <div class="simple-item selected-card">
          <strong>Check-in guardado</strong><br>
          <span class="muted">${data.payload.sna_state || "Sin estado"}</span>
        </div>
      `;

      await refreshEventsList();
      await renderDashboard();
    };
  }

  activateReveal(views.checkin);
}

function renderPlanning() {
  views.planning.innerHTML = `
    <section class="view-panel reveal">
      <h3>Planificación</h3>
      <div class="empty">Acá van rutinas, ejercicios, progresiones y asignaciones por paciente.</div>
    </section>
  `;
  activateReveal(views.planning);
}

function renderLibrary() {
  views.library.innerHTML = `
    <section class="view-panel reveal">
      <h3>Biblioteca</h3>
      <div class="empty">Acá va la carga y gestión de videos y recursos.</div>
    </section>
  `;
  activateReveal(views.library);
}

function renderCommunity() {
  views.community.innerHTML = `
    <section class="view-panel reveal">
      <h3>Comunidad</h3>
      <div class="empty">Acá va chat, grupos por patología y espacio de interacción.</div>
    </section>
  `;
  activateReveal(views.community);
}

function renderTips() {
  views.tips.innerHTML = `
    <section class="view-panel reveal">
      <h3>Tips / Publicaciones</h3>
      <div class="empty">Acá van publicaciones, recomendaciones y contenido educativo.</div>
    </section>
  `;
  activateReveal(views.tips);
}

function renderLive() {
  views.live.innerHTML = `
    <section class="view-panel reveal">
      <h3>Sesión en vivo</h3>
      <div class="empty">Acá va la experiencia de videollamada, análisis y coaching en tiempo real.</div>
    </section>
  `;
  activateReveal(views.live);
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
setView("dashboard");
