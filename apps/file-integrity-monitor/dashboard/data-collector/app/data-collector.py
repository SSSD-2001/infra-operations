#   Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).

#  WSO2 LLC. licenses this file to you under the Apache License,
#  Version 2.0 (the "License"); you may not use this file except
#  in compliance with the License.
#  You may obtain a copy of the License at

#  http://www.apache.org/licenses/LICENSE-2.0

#  Unless required by applicable law or agreed to in writing,
#  software distributed under the License is distributed on an
#  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
#  specific language governing permissions and limitations
#  under the License. 


import boto3
import json
import time
import os
import mysql.connector
from mysql.connector import Error


# Load environment variables
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

DB_HOST = os.getenv("DB_HOST", "mysql-server")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD") or os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = int(os.getenv("DB_PORT", "3306"))

# TLS / SSL cert paths
DB_SSL_CA = os.getenv("DB_SSL_CA", "/app/certs/ca.pem")
DB_SSL_CERT = os.getenv("DB_SSL_CERT", "/app/certs/client-cert.pem")
DB_SSL_KEY = os.getenv("DB_SSL_KEY", "/app/certs/client-key.pem")

# Verification flags
DB_SSL_VERIFY_CERT = os.getenv("DB_SSL_VERIFY_CERT", "true").lower() == "true"
DB_SSL_VERIFY_IDENTITY = os.getenv("DB_SSL_VERIFY_IDENTITY", "false").lower() == "true"



# Validate required configs
required_envs = [
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    S3_BUCKET_NAME,
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
]

if not all(required_envs):
    raise RuntimeError("Missing one or more required environment variables")

required_cert_files = [DB_SSL_CA, DB_SSL_CERT, DB_SSL_KEY]
for cert_file in required_cert_files:
    if not os.path.isfile(cert_file):
        raise RuntimeError(f"Missing TLS certificate file: {cert_file}")



# Initialize S3 client
def initialize_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
    )



# Create DB connection (TLS enabled)
def create_connection():
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT,
            autocommit=True,
            charset="utf8mb4",
            connection_timeout=5,
            ssl_ca=DB_SSL_CA,
            ssl_cert=DB_SSL_CERT,
            ssl_key=DB_SSL_KEY,
            ssl_verify_cert=DB_SSL_VERIFY_CERT,
            ssl_verify_identity=DB_SSL_VERIFY_IDENTITY,
            tls_versions=["TLSv1.2", "TLSv1.3"],
        )
        print(" Connected to MySQL DB over TLS")
        return connection
    except Error as e:
        print(f" Database TLS connection error: {e}")
        return None


# Process a single JSON file
def process_json_file(file_path, cursor):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        insert_query = """
            INSERT INTO centralised_fim_db
            (machine_identifier, conclusion, timestamp, readable_text_cmd, data_changed)
            VALUES (%s, %s, %s, %s, %s)
        """

        cursor.execute(
            insert_query,
            (
                data["machine_identifier"],
                data["conclusion"],
                data["human_readable_timestamp"],
                data["readable_text_cmd"],
                data["diff"],
            ),
        )

        print(f" Inserted: {data['machine_identifier']}")
        return True

    except KeyError:
        print(f" Invalid JSON structure: {file_path}")
        return False
    except json.JSONDecodeError as e:
        print(f" JSON decode error {file_path}: {e}")
        return False
    except Error as e:
        print(f" DB error {file_path}: {e}")
        return False
    except Exception as e:
        print(f" Unexpected error {file_path}: {e}")
        return False


# Fetch files from S3
def fetch_and_process_files(s3_client, bucket_name, local_directory):
    connection = create_connection()
    if not connection:
        return

    cursor = connection.cursor()
    paginator = s3_client.get_paginator("list_objects_v2")

    try:
        for page in paginator.paginate(Bucket=bucket_name):
            for obj in page.get("Contents", []):
                file_name = obj["Key"]
                local_file_path = os.path.join(local_directory, file_name)

                os.makedirs(os.path.dirname(local_file_path), exist_ok=True)

                print(f" Downloading {file_name}")
                s3_client.download_file(bucket_name, file_name, local_file_path)

                success = process_json_file(local_file_path, cursor)

                if success:
                    s3_client.delete_object(Bucket=bucket_name, Key=file_name)
                    os.remove(local_file_path)
                    print(f" Removed {file_name}")
                else:
                    print(f" Retained {file_name}")

    except Exception as e:
        print(f" Error processing S3 files: {e}")

    finally:
        cursor.close()
        connection.close()



# Main loop
def main():
    s3_client = initialize_s3_client()
    local_directory = "/app/centralised_bak"
    os.makedirs(local_directory, exist_ok=True)

    print(" S3 → DB TLS service started")

    while True:
        fetch_and_process_files(s3_client, S3_BUCKET_NAME, local_directory)
        time.sleep(300)



# Entry point
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(" Service stopped")
