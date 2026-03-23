const state = {
  currentView: "dashboard",
  selectedPatientId: "",
  selectedSessionId: "",
};

const els = {
  pageTitle: document.getElementById("page-title"),
  pageSubtitle: document.getElementById("page-subtitle"),
  apiBase: document.getElementById("apiBase"),
  dashboard: document.getElementById("view-dashboard"),
  patients: document.getElementById("view-patients"),
  sessions: document.getElementById("view-sessions"),
  checkin: document.getElementById("view-checkin"),
  navButtons: [...document.querySelectorAll(".nav-btn")],
  floatingAction: document.getElementById("floating-action"),
};

function api() {
  return els.apiBase.value.trim();
}

async function getJson(url, options = {}) {
  const res = await fetch(url, options);
  return await res.json();
}

function setActiveView(view) {
  state.currentView = view;

  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(`view-${view}`).classList.add("active");

  els.navButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  if (view === "dashboard") {
    els.pageTitle.textContent = "Good evening";
    els.pageSubtitle.textContent = "The path of adaptation.";
    renderDashboard();
  }

  if (view === "patients") {
    els.pageTitle.textContent = "Patients";
    els.pageSubtitle.textContent = "Curated clinical registry.";
    renderPatients();
  }

  if (view === "sessions") {
    els.pageTitle.textContent = "Sessions";
    els.pageSubtitle.textContent = "Precise operational flow.";
    renderSessions();
  }

  if (view === "checkin") {
    els.pageTitle.textContent = "Evaluation M1";
    els.pageSubtitle.textContent = "Autonomic state capture.";
    renderCheckin();
  }
}

els.navButtons.forEach(btn => {
  btn.addEventListener("click", () => setActiveView(btn.dataset.view));
});

els.floatingAction.addEventListener("click", () => {
  setActiveView("checkin");
});

function computeAdaptation(summary) {
  const latest = summary.latest_checkin;
  if (!latest || !latest.payload) {
    return { score: 64, state: "Awaiting Data" };
  }

  const rmssd = Number(latest.payload.rmssd_ms || 0);
  if (rmssd < 20) return { score: 42, state: "Simpaticotonia" };
  if (rmssd <= 50) return { score: 76, state: "Equilibrio" };
  return { score: 88, state: "Vagotonia" };
}

function ringSvg(score) {
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (score / 100) * circumference;

  return `
    <svg class="ring-svg" viewBox="0 0 240 240">
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff0bf"></stop>
          <stop offset="50%" stop-color="#d4af37"></stop>
          <stop offset="100%" stop-color="#b98209"></stop>
        </linearGradient>
      </defs>
      <circle class="ring-track" cx="120" cy="120" r="${radius}"></circle>
      <circle
        class="ring-progress"
        cx="120"
        cy="120"
        r="${radius}"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${progress}"
      ></circle>
    </svg>
  `;
}

function pulseSvg() {
  return `
    <svg class="signal-svg" viewBox="0 0 420 110" preserveAspectRatio="none">
      <defs>
        <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="rgba(212,175,55,0.15)"></stop>
          <stop offset="20%" stop-color="#f7dea1"></stop>
          <stop offset="55%" stop-color="#d4af37"></stop>
          <stop offset="100%" stop-color="rgba(212,175,55,0.08)"></stop>
        </linearGradient>
      </defs>
      <path
        class="signal-path"
        d="M0,58 L85,58 L110,58 L126,58 L145,58 L162,35 L174,70 L186,18 L200,86 L212,58 L238,58 L258,58 L276,34 L295,74 L313,58 L420,58"
      ></path>
    </svg>
  `;
}

async function renderDashboard() {
  const data = await getJson(`${api()}/dashboard/summary`);
  const adaptation = computeAdaptation(data);

  els.dashboard.innerHTML = `
    <div class="grid-hero">
      <div class="card adaptation-card">
        <div class="adaptation-wrap">
          <div class="ring-wrap">
            ${ringSvg(adaptation.score)}
            <div class="ring-center">
              <strong>${adaptation.score}%</strong>
              <span>Adaptation</span>
            </div>
          </div>

          <div class="adaptation-copy">
            <div class="eyebrow">Adaptation Path</div>
            <h3 class="big-state">${adaptation.state}</h3>
            <p>
              HANNA condenses autonomic, anatomical and evolutionary signals into a quiet decision layer.
              Every metric should feel rare, useful and precise.
            </p>
            <div class="signal-line">
              ${pulseSvg()}
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Current Signal</h3>
        ${
          data.latest_checkin
            ? `
              <div class="subtle-pill">${data.latest_checkin.payload.sna_state || "No state"}</div>
              <div style="margin-top:18px;">
                <div class="card-value">${data.latest_checkin.payload.hr_bpm || "--"} <span class="muted">bpm</span></div>
                <div class="card-label">Heart-rate</div>
              </div>
              <div style="margin-top:16px;">
                <div class="card-value">${data.latest_checkin.payload.rmssd_ms || "--"} <span class="muted">ms</span></div>
                <div class="card-label">Heart-rate variability</div>
              </div>
              <div class="timeline">
                <span></span>
                <span class="active"></span>
                <span class="active"></span>
                <span></span>
                <span></span>
              </div>
            `
            : `
              <p class="empty">No adaptation data yet.</p>
            `
        }
      </div>
    </div>

    <div class="grid-4">
      <div class="card">
        <h3>Anatomical</h3>
        <div class="card-value">${data.sessions_count}</div>
        <div class="card-label">Registered sessions</div>
        <div class="muted">Spatial and structural follow-up.</div>
      </div>

      <div class="card">
        <h3>Neuro-immune</h3>
        <div class="card-value">${data.checkins_count}</div>
        <div class="card-label">Captured check-ins</div>
        <div class="neuro-lines"></div>
      </div>

      <div class="card">
        <h3>Heart-rate</h3>
        <div class="signal-line" style="margin-bottom:14px;">${pulseSvg()}</div>
        <div class="muted">Pulse signature and variability tone.</div>
      </div>

      <div class="card">
        <h3>Evolution</h3>
        <div class="card-value">${data.patients_count}</div>
        <div class="card-label">Active patients</div>
        <div class="timeline">
          <span class="active"></span>
          <span class="active"></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  `;
}

async function renderPatients() {
  const patients = await getJson(`${api()}/patients`);

  els.patients.innerHTML = `
    <div class="grid-hero">
      <div class="card">
        <h3>New Patient</h3>
        <div class="form-grid-2">
          <div style="grid-column: 1 / -1;">
            <label class="muted">Full name</label>
            <input id="patient-name" placeholder="Ej: Juan Pérez" />
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-primary" id="save-patient-btn">Save patient</button>
        </div>

        <div class="result-box">
          <pre id="patient-result">Waiting input...</pre>
        </div>
      </div>

      <div class="card">
        <h3>Registry</h3>
        <div class="list">
          ${
            patients.length
              ? patients.map(p => `
                <div class="list-item">
                  <strong>${p.name}</strong>
                  <div class="muted">${p.patient_id}</div>
                </div>
              `).join("")
              : `<p class="empty">No patients yet.</p>`
          }
        </div>
      </div>
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
}

async function renderSessions() {
  const patients = await getJson(`${api()}/patients`);

  els.sessions.innerHTML = `
    <div class="grid-hero">
      <div class="card">
        <h3>Create Session</h3>

        <label class="muted">Patient</label>
        <select id="session-patient-select">
          <option value="">Select patient</option>
          ${patients.map(p => `<option value="${p.patient_id}">${p.name} — ${p.patient_id}</option>`).join("")}
        </select>

        <div class="form-actions">
          <button class="btn btn-primary" id="create-session-btn">Create session</button>
        </div>

        <div class="result-box">
          <pre id="session-result">Waiting action...</pre>
        </div>
      </div>

      <div class="card">
        <h3>Session Log</h3>
        <div id="sessions-list" class="list">
          <p class="empty">Select a patient to load sessions.</p>
        </div>
      </div>
    </div>
  `;

  const patientSelect = document.getElementById("session-patient-select");
  const sessionsList = document.getElementById("sessions-list");

  patientSelect.onchange = async () => {
    const patientId = patientSelect.value;
    state.selectedPatientId = patientId;

    if (!patientId) {
      sessionsList.innerHTML = `<p class="empty">Select a patient to load sessions.</p>`;
      return;
    }

    const sessions = await getJson(`${api()}/patient/${patientId}/sessions`);

    sessionsList.innerHTML = sessions.length
      ? sessions.map(s => `
        <div class="list-item">
          <strong>${s.session_id}</strong>
          <div class="muted">${s.ts}</div>
        </div>
      `).join("")
      : `<p class="empty">No sessions for this patient.</p>`;
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
}

async function renderCheckin() {
  const patients = await getJson(`${api()}/patients`);

  els.checkin.innerHTML = `
    <div class="grid-hero">
      <div class="card">
        <h3>M1 — Biometric Check-in</h3>

        <label class="muted">Patient</label>
        <select id="checkin-patient-select">
          <option value="">Select patient</option>
          ${patients.map(p => `<option value="${p.patient_id}">${p.name} — ${p.patient_id}</option>`).join("")}
        </select>

        <label class="muted" style="display:block; margin-top:12px;">Session</label>
        <select id="checkin-session-select">
          <option value="">Select session</option>
        </select>

        <div class="form-grid-3" style="margin-top:16px;">
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
          <button class="btn btn-primary" id="save-checkin-btn">Save check-in</button>
        </div>

        <div class="result-box">
          <pre id="checkin-result">Waiting action...</pre>
        </div>
      </div>

      <div class="card">
        <h3>Session Events</h3>
        <div id="checkin-events-list" class="list">
          <p class="empty">Select session to view events.</p>
        </div>
      </div>
    </div>
  `;

  const patientSelect = document.getElementById("checkin-patient-select");
  const sessionSelect = document.getElementById("checkin-session-select");
  const eventsList = document.getElementById("checkin-events-list");

  patientSelect.onchange = async () => {
    const patientId = patientSelect.value;
    state.selectedPatientId = patientId;
    sessionSelect.innerHTML = `<option value="">Select session</option>`;

    if (!patientId) return;

    const sessions = await getJson(`${api()}/patient/${patientId}/sessions`);
    sessionSelect.innerHTML = `
      <option value="">Select session</option>
      ${sessions.map(s => `<option value="${s.session_id}">${s.session_id}</option>`).join("")}
    `;
  };

  sessionSelect.onchange = async () => {
    const sessionId = sessionSelect.value;
    state.selectedSessionId = sessionId;

    if (!sessionId) {
      eventsList.innerHTML = `<p class="empty">Select session to view events.</p>`;
      return;
    }

    const events = await getJson(`${api()}/session/${sessionId}/events`);

    eventsList.innerHTML = events.length
      ? events.map(e => `
        <div class="list-item">
          <strong>${e.type}</strong>
          <div class="muted">${e.ts}</div>
          <pre>${JSON.stringify(e.payload, null, 2)}</pre>
        </div>
      `).join("")
      : `<p class="empty">No events in this session.</p>`;
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
  };
}

setActiveView("dashboard");
