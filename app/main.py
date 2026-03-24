import os
import uuid
import json
from datetime import datetime, timezone
from typing import List, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    CreateSessionRequest,
    CreateSessionResponse,
    CreateEventRequest,
    EventRecord,
)
from .storage import (
    ensure_files,
    read_patients,
    create_patient_row,
    read_sessions,
    create_session_row,
    read_events,
    create_event_row,
    read_plans,
    create_plan_row,
)

ensure_files()

app = FastAPI(title="HANNA API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def protocol_version() -> str:
    return os.environ.get("KOI_PROTOCOL_VERSION", "KOI-0.1.0")


def classify_sna(rmssd_ms: float) -> str:
    if rmssd_ms < 20:
        return "Simpaticotonia"
    if rmssd_ms <= 50:
        return "Equilibrio"
    return "Vagotonia"


@app.get("/health")
def health():
    return {
        "ok": True,
        "ts": now_iso(),
        "protocol_version": protocol_version(),
    }


@app.post("/patient")
def create_patient(name: str):
    name = (name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")

    patient_id = str(uuid.uuid4())
    row = {
        "patient_id": patient_id,
        "name": name,
        "created_at": now_iso(),
    }
    create_patient_row(row)
    return row


@app.get("/patients")
def get_patients():
    patients = read_patients()
    patients.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return patients


@app.get("/patient/{patient_id}")
def get_patient(patient_id: str):
    patients = read_patients()
    for patient in patients:
        if patient["patient_id"] == patient_id:
            return patient
    raise HTTPException(status_code=404, detail="Patient not found")


@app.post("/session", response_model=CreateSessionResponse)
def create_session(req: CreateSessionRequest):
    patient_id = (req.patient_id or "").strip()
    if not patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required")

    patients = read_patients()
    exists = any(p["patient_id"] == patient_id for p in patients)
    if not exists:
        raise HTTPException(status_code=404, detail="Patient not found")

    session_id = str(uuid.uuid4())
    ts = now_iso()

    session_row = {
        "session_id": session_id,
        "patient_id": patient_id,
        "ts": ts,
    }
    create_session_row(session_row)

    return CreateSessionResponse(
        session_id=session_id,
        protocol_version=protocol_version(),
    )


@app.get("/patient/{patient_id}/sessions")
def get_patient_sessions(patient_id: str):
    sessions = read_sessions()
    filtered = [s for s in sessions if s["patient_id"] == patient_id]
    filtered.sort(key=lambda x: x.get("ts", ""), reverse=True)
    return filtered


@app.post("/event", response_model=EventRecord)
def create_event(req: CreateEventRequest):
    if not req.session_id or not req.patient_id or not req.type:
        raise HTTPException(status_code=400, detail="Missing required fields")

    sessions = read_sessions()
    session_exists = any(s["session_id"] == req.session_id for s in sessions)
    if not session_exists:
        raise HTTPException(status_code=404, detail="Session not found")

    event_id = str(uuid.uuid4())
    ts = (req.ts or datetime.now(timezone.utc)).isoformat()

    payload: Dict[str, Any] = dict(req.payload or {})

    if req.type == "M1_MEASURED":
        rmssd = payload.get("rmssd_ms")
        if rmssd is not None:
            payload["sna_state"] = classify_sna(float(rmssd))

    event_row = {
        "event_id": event_id,
        "ts": ts,
        "session_id": req.session_id,
        "patient_id": req.patient_id,
        "type": req.type,
        "actor": req.actor,
        "protocol_version": protocol_version(),
        "schema_name": req.schema_name,
        "schema_version": req.schema_version,
        "payload_json": json.dumps(payload, ensure_ascii=False),
    }
    create_event_row(event_row)

    record = EventRecord(
        event_id=event_id,
        ts=ts,
        session_id=req.session_id,
        patient_id=req.patient_id,
        type=req.type,
        actor=req.actor,
        protocol_version=protocol_version(),
        schema_name=req.schema_name,
        schema_version=req.schema_version(),
        payload=payload,
    )

    return record


@app.get("/session/{session_id}/events", response_model=List[EventRecord])
def get_session_events(session_id: str):
    rows = read_events()
    filtered = [r for r in rows if r["session_id"] == session_id]
    filtered.sort(key=lambda x: x.get("ts", ""))

    records: List[EventRecord] = []
    for row in filtered:
        payload = {}
        try:
            payload = json.loads(row.get("payload_json", "") or "{}")
        except json.JSONDecodeError:
            payload = {}

        records.append(
            EventRecord(
                event_id=row["event_id"],
                ts=row["ts"],
                session_id=row["session_id"],
                patient_id=row["patient_id"],
                type=row["type"],
                actor=row["actor"],
                protocol_version=row["protocol_version"],
                schema_name=row["schema_name"],
                schema_version=row["schema_version"],
                payload=payload,
            )
        )

    return records


@app.post("/plan")
def create_plan(
    patient_id: str,
    title: str,
    category: str,
    description: str = "",
    frequency: str = "",
):
    patient_id = (patient_id or "").strip()
    title = (title or "").strip()
    category = (category or "").strip()
    description = (description or "").strip()
    frequency = (frequency or "").strip()

    if not patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required")
    if not title:
        raise HTTPException(status_code=400, detail="title is required")
    if not category:
        raise HTTPException(status_code=400, detail="category is required")

    patients = read_patients()
    exists = any(p["patient_id"] == patient_id for p in patients)
    if not exists:
        raise HTTPException(status_code=404, detail="Patient not found")

    row = {
        "plan_id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "title": title,
        "category": category,
        "description": description,
        "frequency": frequency,
        "created_at": now_iso(),
    }
    create_plan_row(row)
    return row


@app.get("/patient/{patient_id}/plans")
def get_patient_plans(patient_id: str):
    plans = read_plans()
    filtered = [p for p in plans if p["patient_id"] == patient_id]
    filtered.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return filtered


@app.get("/dashboard/summary")
def dashboard_summary():
    patients = read_patients()
    sessions = read_sessions()
    events = read_events()
    plans = read_plans()

    checkins = [e for e in events if e["type"] == "M1_MEASURED"]
    latest_checkin = None

    if checkins:
      latest_raw = sorted(checkins, key=lambda x: x.get("ts", ""))[-1]
      try:
          payload = json.loads(latest_raw.get("payload_json", "") or "{}")
      except json.JSONDecodeError:
          payload = {}

      latest_checkin = {
          "event_id": latest_raw["event_id"],
          "ts": latest_raw["ts"],
          "session_id": latest_raw["session_id"],
          "patient_id": latest_raw["patient_id"],
          "type": latest_raw["type"],
          "actor": latest_raw["actor"],
          "protocol_version": latest_raw["protocol_version"],
          "schema_name": latest_raw["schema_name"],
          "schema_version": latest_raw["schema_version"],
          "payload": payload,
      }

    return {
        "patients_count": len(patients),
        "sessions_count": len(sessions),
        "checkins_count": len(checkins),
        "plans_count": len(plans),
        "latest_checkin": latest_checkin,
    }


@app.get("/debug/storage")
def debug_storage():
    return {
        "patients": len(read_patients()),
        "sessions": len(read_sessions()),
        "events": len(read_events()),
        "plans": len(read_plans()),
    }
