import json
import os

FILE = "events.json"

def put_json(key, data):
    if not os.path.exists(FILE):
        with open(FILE, "w") as f:
            json.dump([], f)

    with open(FILE, "r") as f:
        events = json.load(f)

    events.append(data)

    with open(FILE, "w") as f:
        json.dump(events, f)

def list_keys(prefix):
    return []

def get_json(key):
    return {}
