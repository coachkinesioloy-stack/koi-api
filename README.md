# KOI Pilot API

## Run locally
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export R2_ACCESS_KEY_ID="..."
export R2_SECRET_ACCESS_KEY="..."
export R2_ACCOUNT_ID="..."
export R2_BUCKET_NAME="koi-pilot"
export KOI_PROTOCOL_VERSION="KOI-0.1.0"

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
