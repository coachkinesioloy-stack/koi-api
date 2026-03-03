from pydantic import BaseModel, Field
from typing import Any, Dict, Literal, Optional
from datetime import datetime

Actor = Literal["patient", "system", "licensed"]

class CreateSessionRequest(BaseModel):
    patient_id: str = Field(..., description="Seudónimo tipo P-00023")

class CreateSessionResponse(BaseModel):
    session_id: str
    protocol_version: str

class CreateEventRequest(BaseModel):
    session_id: str
    patient_id: str
    type: str
    actor: Actor
    schema_name: str
    schema_version: str
    payload: Dict[str, Any]
    ts: Optional[datetime] = None

class EventRecord(BaseModel):
    event_id: str
    ts: str
    session_id: str
    patient_id: str
    type: str
    actor: Actor
    protocol_version: str
    schema_name: str
    schema_version: str
    payload: Dict[str, Any]
