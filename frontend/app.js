const state = {
  currentView: "dashboard",
  selectedPatientId: "",
  selectedSessionId: "",
};

const els = {
  title: document.getElementById("view-title"),
  subtitle: document.getElementById("view-subtitle"),
  apiBase: document.getElementById("apiBase"),
  dashboard: document.getElementById("view-dashboard"),
  patients: document.getElementById("view-patients"),
  sessions: document.getElementById("view-sessions"),
  checkin: document.getElementById("view-checkin"),
  navLinks: [...document.querySelectorAll(".nav-link")],
};

function api() {
  return els.apiBase.value.trim();
}

async function getJson(url, options = {}) {
  const res = await fetch(url, options);
  return await res.json();
}

function setView(view) {
  state.currentView = view;

  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(`view-${view}`).classList.add("active");

  els.navLinks.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  if (view === "dashboard") {
    els.title.textContent = "Dashboard";
    els.subtitle.textContent = "Resumen operativo de HANNA";
    renderDashboard();
  }

  if (view === "patients") {
    els.title.textContent = "Pacientes";
    els.subtitle.textContent = "Alta y listado de pacientes";
    renderPatients();
  }

  if (view === "sessions") {
    els.title.textContent = "Sesiones";
    els.subtitle.textContent = "Creación y consulta de sesiones";
    renderSessions();
  }

  if (view === "checkin") {
    els.title.textContent = "Evaluación M1";
    els.subtitle.textContent = "Check-in biométrico inicial";
    renderCheckin();
  }
}

els.navLinks.forEach(btn => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});

async function renderDashboard() {
  const data = await getJson(`${api()}/dashboard/summary`);

  els.dashboard.innerHTML = `
    <div class="grid-3">
      <div class="card">
        <div class="section-title">Pacientes</div>
        <div class="metric">${data.patients_count}</div>
        <div class="metric-sub">Pacientes cargados</div>
      </div>

      <div class="card">
        <div class="section-title">Sesiones</div>
        <div class="metric">${data.sessions_count}</div>
        <div class="metric-sub">Sesiones registradas</div>
      </div>

      <div class="card">
        <div class="section-title">Check-ins M1</div>
        <div class="metric">${data.checkins_count}</div>
        <div class="metric-sub">Evaluaciones biométricas</div>
      </div>
    </div>

    <div class="grid-2" style="margin-top:18px;">
      <div class="card">
        <h3>Último check-in</h3>
        ${
          data.latest_checkin
            ? `
            <div class="badge">${data.latest_checkin.payload.sna_state || "Sin estado"}</div>
            <pre>${JSON.stringify(data.latest_checkin, null, 2)}</pre>
          `
            : `<p class="muted">Todavía no hay check-ins cargados.</p>`
        }
      </div>

      <div class="card">
        <h3>Estado de trabajo</h3>
        <div class="list">
          <div class="list-item">
            <strong>Backend conectado</strong>
            <span class="muted">Pacientes, sesiones y eventos operativos.</span>
          </div>
          <div class="list-item">
            <strong>Evaluación M1 activa</strong>
            <span class="muted">RMSSD, HR, RR, SQI, dolor y energía.</span>
          </div>
          <div class="list-item">
            <strong>Siguiente paso</strong>
            <span class="muted">Profundizar M1 y luego pasar a M2.</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function renderPatients() {
  const patients = await getJson(`${api()}/patients`);

  els.patients.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <h3>Nuevo paciente</h3>
        <div class="form-grid">
          <div style="grid-column:1 / -1;">
            <label class="muted">Nombre</label>
            <input id="patient-name" placeholder="Ej: Juan Pérez" />
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-primary" id="create-patient-btn">Guardar paciente</button>
        </div>

        <pre id="patient-create-result"></pre>
      </div>

      <div class="card">
        <h3>Listado</h3>
        <div class="list">
          ${
            patients.length
              ? patients.map(p => `
                <div class="list-item">
                  <strong>${p.name}</strong>
                  <span class="muted">${p.patient_id}</span>
                </div>
              `).join("")
              : `<p class="muted">No hay pacientes cargados.</p>`
          }
        </div>
      </div>
    </div>
  `;

  document.getElementById("create-patient-btn").onclick = async () => {
    const name = document.getElementById("patient-name").value.trim();
    if (!name) return;

    const data = await getJson(`${api()}/patient?name=${encodeURIComponent(name)}`, {
      method: "POST"
    });

    document.getElementById("patient-create-result").textContent = JSON.stringify(data, null, 2);
    state.selectedPatientId = data.patient_id;
    renderPatients();
  };
}

async function renderSessions() {
  const patients = await getJson(`${api()}/patients`);

  els.sessions.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <h3>Nueva sesión</h3>

        <label class="muted">Paciente</label>
        <select id="session-patient">
          <option value="">Seleccionar paciente</option>
          ${patients.map(p => `<option value="${p.patient_id}">${p.name} — ${p.patient_id}</option>`).join("")}
        </select>

        <div class="form-actions">
          <button class="btn btn-primary" id="create-session-btn">Crear sesión</button>
        </div>

        <pre id="session-create-result"></pre>
      </div>

      <div class="card">
        <h3>Sesiones del paciente</h3>
        <div id="patient-sessions-box" class="list">
          <p class="muted">Seleccioná un paciente para ver sus sesiones.</p>
        </div>
      </div>
    </div>
  `;

  const select = document.getElementById("session-patient");
  const sessionsBox = document.getElementById("patient-sessions-box");

  select.onchange = async () => {
    const patientId = select.value;
    state.selectedPatientId = patientId;
    if (!patientId) return;

    const sessions = await getJson(`${api()}/patient/${patientId}/sessions`);

    sessionsBox.innerHTML = sessions.length
      ? sessions.map(s => `
          <div class="list-item">
            <strong>${s.session_id}</strong>
            <span class="muted">${s.ts}</span>
          </div>
        `).join("")
      : `<p class="muted">Este paciente no tiene sesiones.</p>`;
  };

  document.getElementById("create-session-btn").onclick = async () => {
    const patientId = select.value;
    if (!patientId) return;

    const data = await getJson(`${api()}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: patientId })
    });

    document.getElementById("session-create-result").textContent = JSON.stringify(data, null, 2);
    state.selectedPatientId = patientId;
    state.selectedSessionId = data.session_id;
    select.dispatchEvent(new Event("change"));
  };
}

async function renderCheckin() {
  const patients = await getJson(`${api()}/patients`);

  els.checkin.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <h3>Nuevo check-in M1</h3>

        <label class="muted">Paciente</label>
        <select id="checkin-patient">
          <option value="">Seleccionar paciente</option>
          ${patients.map(p => `<option value="${p.patient_id}">${p.name} — ${p.patient_id}</option>`).join("")}
        </select>

        <label class="muted" style="margin-top:12px; display:block;">Sesión</label>
        <select id="checkin-session">
          <option value="">Seleccionar sesión</option>
        </select>

        <div class="form-grid" style="margin-top:16px;">
          <div>
            <label class="muted">RMSSD</label>
            <input id="rmssd_ms" value="18.4" />
          </div>
          <div>
            <label class="muted">HR BPM</label>
            <input id="hr_bpm" value="82" />
          </div>
          <div>
            <label class="muted">RR RPM</label>
            <input id="rr_rpm" value="14" />
          </div>
          <div>
            <label class="muted">SQI</label>
            <input id="sqi" value="0.91" />
          </div>
          <div>
            <label class="muted">EVA</label>
            <input id="eva" value="5" />
          </div>
          <div>
            <label class="muted">Energy</label>
            <input id="energy" value="6" />
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-primary" id="send-checkin-btn">Guardar check-in</button>
        </div>

        <pre id="checkin-result"></pre>
      </div>

      <div class="card">
        <h3>Eventos de la sesión</h3>
        <div id="session-events-box" class="list">
          <p class="muted">Seleccioná una sesión para ver eventos.</p>
        </div>
      </div>
    </div>
  `;

  const patientSelect = document.getElementById("checkin-patient");
  const sessionSelect = document.getElementById("checkin-session");
  const eventsBox = document.getElementById("session-events-box");

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
    if (!sessionId) return;

    const events = await getJson(`${api()}/session/${sessionId}/events`);
    eventsBox.innerHTML = events.length
      ? events.map(e => `
          <div class="list-item">
            <strong>${e.type}</strong>
            <span class="muted">${e.ts}</span>
            <pre>${JSON.stringify(e.payload, null, 2)}</pre>
          </div>
        `).join("")
      : `<p class="muted">No hay eventos en esta sesión.</p>`;
  };

  document.getElementById("send-checkin-btn").onclick = async () => {
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
  };
}

setView("dashboard");
