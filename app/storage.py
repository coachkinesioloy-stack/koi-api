import csv
import os
from typing import List, Dict

BASE_DIR = "data"

PATIENTS_FILE = os.path.join(BASE_DIR, "patients.csv")
SESSIONS_FILE = os.path.join(BASE_DIR, "sessions.csv")
EVENTS_FILE = os.path.join(BASE_DIR, "events.csv")


def ensure_files() -> None:
    os.makedirs(BASE_DIR, exist_ok=True)

    if not os.path.exists(PATIENTS_FILE):
        with open(PATIENTS_FILE, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=["patient_id", "name", "created_at"],
            )
            writer.writeheader()

    if not os.path.exists(SESSIONS_FILE):
        with open(SESSIONS_FILE, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=["session_id", "patient_id", "ts"],
            )
            writer.writeheader()

    if not os.path.exists(EVENTS_FILE):
        with open(EVENTS_FILE, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(
                f,
                fieldnames=[
                    "event_id",
                    "ts",
                    "session_id",
                    "patient_id",
                    "type",
                    "actor",
                    "protocol_version",
                    "schema_name",
                    "schema_version",
                    "payload_json",
                ],
            )
            writer.writeheader()


def _read_csv(path: str) -> List[Dict[str, str]]:
    if not os.path.exists(path):
        return []

    with open(path, "r", newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _append_csv(path: str, row: Dict[str, str], fieldnames: List[str]) -> None:
    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writerow(row)


def read_patients() -> List[Dict[str, str]]:
    return _read_csv(PATIENTS_FILE)


def create_patient_row(row: Dict[str, str]) -> None:
    _append_csv(
        PATIENTS_FILE,
        row,
        ["patient_id", "name", "created_at"],
    )


def read_sessions() -> List[Dict[str, str]]:
    return _read_csv(SESSIONS_FILE)


def create_session_row(row: Dict[str, str]) -> None:
    _append_csv(
        SESSIONS_FILE,
        row,
        ["session_id", "patient_id", "ts"],
    )


def read_events() -> List[Dict[str, str]]:
    return _read_csv(EVENTS_FILE)


def create_event_row(row: Dict[str, str]) -> None:
    _append_csv(
        EVENTS_FILE,
        row,
        [
            "event_id",
            "ts",
            "session_id",
            "patient_id",
            "type",
            "actor",
            "protocol_version",
            "schema_name",
            "schema_version",
            "payload_json",
        ],
    )
