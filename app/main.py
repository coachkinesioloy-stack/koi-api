import os
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from .models import (
    CreateSessionRequest,
    CreateSessionResponse,
    CreateEventRequest,
    EventRecord,
)
from .r2 import put_json, list_keys, get_json


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
    patient_id = str(uuid.uuid4())

    record = {
        "patient_id": patient_id,
        "name": name,
        "created_at": now_iso()
    }

    key = f"patients/{patient_id}.json"
    put_json(key, record)

    return record


@app.get("/patients")
def get_patients():
    keys = list_keys(prefix="patients/")
    patients = []

    for k in keys:
        data = get_json(k)
        if data:
            patients.append(data)

    patients.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return patients


@app.get("/patient/{patient_id}")
def get_patient(patient_id: str):
    data = get_json(f"patients/{patient_id}.json")
    if not data:
        raise HTTPException(status_code=404, detail="Patient not found")
    return data


@app.post("/session", response_model=CreateSessionResponse)
def create_session(req: CreateSessionRequest):
    session_id = str(uuid.uuid4())

    event_id = str(uuid.uuid4())
    ts = now_iso()

    record = {
        "event_id": event_id,
        "ts": ts,
        "session_id": session_id,
        "patient_id": req.patient_id,
        "type": "SESSION_CREATED",
        "actor": "system",
        "protocol_version": protocol_version(),
        "schema_name": "session",
        "schema_version": "1",
        "payload": {},
    }

    key = f"events/{ts[:7]}/{session_id}/{event_id}.json"
    put_json(key, record)

    return CreateSessionResponse(
        session_id=session_id,
        protocol_version=protocol_version(),
    )


@app.get("/patient/{patient_id}/sessions")
def get_patient_sessions(patient_id: str):
    keys = list_keys(prefix="events/")
    sessions = []

    for k in keys:
        data = get_json(k)
        if not data:
            continue

        if data.get("type") == "SESSION_CREATED" and data.get("patient_id") == patient_id:
            sessions.append({
                "session_id": data.get("session_id"),
                "patient_id": data.get("patient_id"),
                "ts": data.get("ts")
            })

    sessions.sort(key=lambda x: x.get("ts", ""), reverse=True)
    return sessions


@app.post("/event", response_model=EventRecord)
def create_event(req: CreateEventRequest):
    if not req.session_id or not req.patient_id or not req.type:
        raise HTTPException(status_code=400, detail="Missing required fields")

    event_id = str(uuid.uuid4())
    ts = (req.ts or datetime.now(timezone.utc)).isoformat()

    payload = dict(req.payload)

    if req.type == "M1_MEASURED":
        rmssd = payload.get("rmssd_ms")
        if rmssd is not None:
            payload["sna_state"] = classify_sna(float(rmssd))

    record = EventRecord(
        event_id=event_id,
        ts=ts,
        session_id=req.session_id,
        patient_id=req.patient_id,
        type=req.type,
        actor=req.actor,
        protocol_version=protocol_version(),
        schema_name=req.schema_name,
        schema_version=req.schema_version,
        payload=payload,
    ).model_dump()

    key = f"events/{ts[:7]}/{req.session_id}/{event_id}.json"
    put_json(key, record)

    return record


@app.get("/session/{session_id}/events", response_model=List[EventRecord])
def get_session_events(session_id: str):
    keys = list_keys(prefix="events/")
    session_keys = [k for k in keys if f"/{session_id}/" in k]

    records = []
    for k in session_keys:
        data = get_json(k)
        if data:
            records.append(EventRecord(**data))

    records.sort(key=lambda r: r.ts)
    return records


@app.get("/dashboard/summary")
def dashboard_summary():
    patients = get_patients()

    keys = list_keys(prefix="events/")
    all_events = []
    for k in keys:
        data = get_json(k)
        if data:
            all_events.append(data)

    sessions = [e for e in all_events if e.get("type") == "SESSION_CREATED"]
    checkins = [e for e in all_events if e.get("type") == "M1_MEASURED"]

    latest_checkin = checkins[-1] if checkins else None

    return {
        "patients_count": len(patients),
        "sessions_count": len(sessions),
        "checkins_count": len(checkins),
        "latest_checkin": latest_checkin,
    }


@app.get("/debug/keys")
def debug_keys():
    return {"keys": list_keys(prefix="")}
