import os
import json
import boto3
from botocore.config import Config
from typing import Dict, Any, List

def _client():
    account_id = os.environ["R2_ACCOUNT_ID"]
    endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"

    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )

def put_json(key: str, data: Dict[str, Any]) -> None:
    bucket = os.environ["R2_BUCKET_NAME"]
    client = _client()
    body = json.dumps(data, ensure_ascii=False).encode("utf-8")
    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=body,
        ContentType="application/json; charset=utf-8",
    )

def list_keys(prefix: str) -> List[str]:
    bucket = os.environ["R2_BUCKET_NAME"]
    client = _client()
    keys: List[str] = []
    token = None

    while True:
        kwargs = {"Bucket": bucket, "Prefix": prefix, "MaxKeys": 1000}
        if token:
            kwargs["ContinuationToken"] = token

        resp = client.list_objects_v2(**kwargs)
        for item in resp.get("Contents", []):
            keys.append(item["Key"])

        if resp.get("IsTruncated"):
            token = resp.get("NextContinuationToken")
        else:
            break

    return keys

def get_json(key: str) -> Dict[str, Any]:
    bucket = os.environ["R2_BUCKET_NAME"]
    client = _client()
    resp = client.get_object(Bucket=bucket, Key=key)
    raw = resp["Body"].read().decode("utf-8")
    return json.loads(raw)
