#  Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

import os
import time
import boto3
import configparser
import logging
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger('fim-s3-uploader')

# --- Paths (systemd-safe: use absolute paths) ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.environ.get("FIM_CONFIG_FILE", os.path.join(BASE_DIR, "fim-agent.conf"))
DOTENV_FILE = os.environ.get("FIM_DOTENV_FILE", os.path.join(BASE_DIR, ".env"))

# Load environment variables from .env if present
# NOTE: .env must be in KEY=value format (no spaces), e.g. AWS_ACCESS_KEY_ID=xxxx
load_dotenv(DOTENV_FILE)

# --- Read config ---
config = configparser.ConfigParser()

read_files = config.read(CONFIG_FILE)
if not read_files:
    raise FileNotFoundError(f"Config file not found/readable: {CONFIG_FILE}")

if "S3" not in config:
    raise ValueError(f"Missing [S3] section in config file: {CONFIG_FILE}")

# General limits
FILE_SIZE_LIMIT = int(config["DEFAULT"].get("FILE_SIZE_MB", "10")) * 1024 * 1024  # MB -> bytes


def _require_non_empty(section: str, key: str) -> str:
    value = config.get(section, key, fallback="").strip()
    if not value:
        raise ValueError(f"Missing required config: [{section}] {key}")
    return value


# --- Non-secret settings from config ---
BUCKET_NAME = _require_non_empty("S3", "BUCKET_NAME")
JSON_DIR = _require_non_empty("S3", "JSON_DIR")
UPLOAD_INTERVAL = int(config["S3"].get("UPLOAD_INTERVAL", "300"))

# --- Secrets from environment (.env) ---
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "").strip()
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "").strip()

# Region can come from env OR config (config is fine; not a secret)
AWS_REGION = (os.getenv("AWS_REGION", "").strip()
              or config["S3"].get("AWS_REGION", "us-west-2")).strip()


def initialize_s3_client():
    """
    If AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY are provided, use them.
    Otherwise, boto3 will use its default credential chain (IAM role, ~/.aws, etc.).
    """
    client_kwargs = {"region_name": AWS_REGION}

    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        client_kwargs["aws_access_key_id"] = AWS_ACCESS_KEY_ID
        client_kwargs["aws_secret_access_key"] = AWS_SECRET_ACCESS_KEY

    return boto3.client("s3", **client_kwargs)


def upload_to_s3(s3_client, bucket_name, file_path):
    try:
        s3_client.upload_file(
            file_path,
            bucket_name,
            os.path.basename(file_path)
        )

        if os.path.exists(file_path):
            os.remove(file_path)

    except Exception as e:
        logger.error("Failed to upload %s: %s", file_path, e)


def upload_files_periodically(s3_client, bucket_name, json_dir, interval):
    logger.info(
        "FIM S3 uploader started | bucket=%s | json_dir=%s | interval=%ds | max_file=%d bytes | region=%s",
        bucket_name,
        json_dir,
        interval,
        FILE_SIZE_LIMIT,
        AWS_REGION
    )

    # Create directory if missing (optional; comment out if you prefer strict failure)
    os.makedirs(json_dir, exist_ok=True)

    while True:
        try:
            files = [
                os.path.join(json_dir, f)
                for f in os.listdir(json_dir)
                if f.endswith(".json") and os.path.isfile(os.path.join(json_dir, f))
            ]

            for file_path in files:
                try:
                    file_size = os.path.getsize(file_path)

                    if file_size > FILE_SIZE_LIMIT:
                        logger.warning(
                            "Skipped oversized file: %s (%d bytes)",
                            file_path,
                            file_size
                        )
                        continue

                    upload_to_s3(s3_client, bucket_name, file_path)

                except FileNotFoundError:
                    # File was removed between listdir and stat/upload
                    continue

            time.sleep(interval)

        except Exception:
            logger.exception("Upload loop error")
            time.sleep(5)


if __name__ == "__main__":
    s3_client = initialize_s3_client()
    upload_files_periodically(
        s3_client,
        BUCKET_NAME,
        JSON_DIR,
        UPLOAD_INTERVAL
    )
