import json
import os

FILE = "events.json"


def _load_events():
    if not os.path.exists(FILE):
        return []

    with open(FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def _save_events(events):
    with open(FILE, "w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False, indent=2)


def put_json(key, data):
    events = _load_events()
    item = {
        "key": key,
        "data": data
    }
    events.append(item)
    _save_events(events)


def list_keys(prefix):
    events = _load_events()
    return [item["key"] for item in events if item["key"].startswith(prefix)]


def get_json(key):
    events = _load_events()
    for item in events:
        if item["key"] == key:
            return item["data"]
    return {}
