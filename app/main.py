import os
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from typing import List

from .models import (
    CreateSessionRequest,
    CreateSessionResponse,
    CreateEventRequest,
    EventRecord,
)
from .r2 import put_json, list_keys, get_json

app = FastAPI(title="KOI Pilot API", version="0.1.0")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def protocol_version() -> str:
    return os.environ.get("KOI_PROTOCOL_VERSION", "KOI-0.1.0")


@app.get("/health")
def health():
    return {
        "ok": True,
        "ts": now_iso(),
        "protocol_version": protocol_version()
    }


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
        protocol_version=protocol_version()
    )


@app.post("/event", response_model=EventRecord)
def create_event(req: CreateEventRequest):
    if not req.session_id or not req.patient_id or not req.type:
        raise HTTPException(status_code=400, detail="Missing required fields")

    event_id = str(uuid.uuid4())
    ts = (req.ts or datetime.now(timezone.utc)).isoformat()

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
        payload=req.payload,
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


# endpoint de debug para ver qué archivos existen
@app.get("/debug/keys")
def debug_keys():
    return {
        "keys": list_keys(prefix="events/")
    }
