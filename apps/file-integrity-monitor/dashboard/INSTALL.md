# File Integrity Monitor Dashboard Setup Guide

## 1. Set Up the Database for the Centralized Server

Run the following script after replacing `your-root-password` and `your-fim-user-password` with the correct passwords.

```bash
#!/bin/bash

set -euo pipefail

# ===== Root MySQL connection =====
DB_HOST="127.0.0.1"
DB_PORT="3306"
ROOT_USER="root"
ROOT_PASSWORD='your-root-password'

# ===== Target database =====
DB_NAME="FIMDB"

# ===== Application user =====
FIM_DB_USER="fim_user"
FIM_DB_PASSWORD='your-fim-user-password'

: "${ROOT_USER:?ROOT_USER is required}"
: "${ROOT_PASSWORD:?ROOT_PASSWORD is required}"
: "${FIM_DB_USER:?FIM_DB_USER is required}"
: "${FIM_DB_PASSWORD:?FIM_DB_PASSWORD is required}"

mysql -h "$DB_HOST" \
      -P "$DB_PORT" \
      -u "$ROOT_USER" \
      -p"$ROOT_PASSWORD" <<EOF_SQL
CREATE DATABASE IF NOT EXISTS ${DB_NAME}
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ${DB_NAME};

CREATE TABLE IF NOT EXISTS centralised_fim_db (
    id INT NOT NULL AUTO_INCREMENT,
    machine_identifier VARCHAR(255) NOT NULL,
    conclusion TEXT NOT NULL,
    timestamp VARCHAR(64) NOT NULL,
    readable_text_cmd TEXT DEFAULT NULL,
    data_changed LONGTEXT NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_machine_identifier (machine_identifier),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB;

CREATE USER IF NOT EXISTS '${FIM_DB_USER}'@'127.0.0.1' IDENTIFIED BY '${FIM_DB_PASSWORD}';
GRANT SELECT, INSERT, UPDATE, DELETE ON ${DB_NAME}.* TO '${FIM_DB_USER}'@'127.0.0.1';
FLUSH PRIVILEGES;
EOF_SQL

echo "[INFO] Database, table, and user permissions were created successfully."
```

## 2. Download the File Integrity Monitor Dashboard Components

Download the FIM dashboard components from the following GitHub repository:

```text
https://github.com/wso2-open-operations/infra-operations/tree/main/apps/file-integrity-monitor/dashboard
```

Alternatively, use the following commands to download the dashboard components:

```bash
curl -L https://github.com/wso2-open-operations/infra-operations/archive/refs/heads/main.zip -o infra-operations.zip

sudo apt install unzip -y

unzip infra-operations.zip 'infra-operations-main/apps/file-integrity-monitor/dashboard/*' -d .

mv infra-operations-main/apps/file-integrity-monitor/dashboard ./dashboard

rm -rf infra-operations-main infra-operations.zip
```

## 3. Install Docker on the Dashboard Host Machine

Use the following commands to install Docker:

```bash
# Install prerequisites
sudo apt update
sudo apt install -y ca-certificates curl

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add Docker's apt repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine, CLI, containerd, Buildx, and the Compose plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Test Docker
sudo docker run hello-world
```

## 4. Verify Docker Installation and Grant Docker Access

Run the following commands to verify the Docker installation and grant Docker access to the current user:

```bash
docker --version
docker compose version
sudo usermod -aG docker $USER
```

After running the `usermod` command, log out and log back in for the group changes to take effect.

## 5. Generate Certificates for Database SSL

Edit the MySQL configuration file:

```bash
sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf
```

Add the following SSL settings under the `[mysqld]` section:

```ini
[mysqld]

# Basic Settings
user = mysql

ssl-ca=/etc/mysql/ssl/ca.pem
ssl-cert=/etc/mysql/ssl/server-cert.pem
ssl-key=/etc/mysql/ssl/server-key.pem

require_secure_transport=ON
```

Create the SSL directory and move into it:

```bash
sudo mkdir -p /etc/mysql/ssl
cd /etc/mysql/ssl
```

Generate the required certificates:

```bash
sudo openssl genrsa 2048 > ca-key.pem
sudo openssl req -new -x509 -nodes -days 3650 -key ca-key.pem -subj "/CN=MySQL-CA" -out ca.pem

sudo openssl req -newkey rsa:2048 -days 3650 -nodes -keyout server-key.pem -subj "/CN=mysql-server" -out server-req.pem
sudo openssl x509 -req -in server-req.pem -days 3650 -CA ca.pem -CAkey ca-key.pem -set_serial 01 -out server-cert.pem

sudo openssl req -newkey rsa:2048 -days 3650 -nodes -keyout client-key.pem -subj "/CN=php-client" -out client-req.pem
sudo openssl x509 -req -in client-req.pem -days 3650 -CA ca.pem -CAkey ca-key.pem -set_serial 02 -out client-cert.pem

sudo chmod 600 *-key.pem
sudo chmod 644 *.pem
```

Restart MySQL:

```bash
sudo systemctl restart mysql
```

## 6. Copy Certificates to the Dashboard Folders

Copy the certificates to the `data-analyzer` and `data-collector` certificate directories, then grant the required permissions.

Replace `<Download Location>` with the actual location where the dashboard folder was downloaded.

### Data Analyzer

```bash
sudo cp /etc/mysql/ssl/ca.pem <Download Location>/dashboard/data-analyzer/certs/
sudo cp /etc/mysql/ssl/client-cert.pem <Download Location>/dashboard/data-analyzer/certs/
sudo cp /etc/mysql/ssl/client-key.pem <Download Location>/dashboard/data-analyzer/certs/

cd <Download Location>/dashboard/data-analyzer/certs/

sudo chmod 600 *-key.pem
sudo chmod 644 *.pem
```

### Data Collector

```bash
sudo cp /etc/mysql/ssl/ca.pem <Download Location>/dashboard/data-collector/certs/
sudo cp /etc/mysql/ssl/client-cert.pem <Download Location>/dashboard/data-collector/certs/
sudo cp /etc/mysql/ssl/client-key.pem <Download Location>/dashboard/data-collector/certs/

cd <Download Location>/dashboard/data-collector/certs/

sudo chmod 600 *-key.pem
sudo chmod 644 *.pem
```

## 7. Generate a Self-Signed SSL/TLS Certificate for the UI

Move to the `data-analyzer` SSL directory:

```bash
cd <Download Location>/dashboard/data-analyzer/ssl
```

Generate a self-signed SSL/TLS certificate and private key using OpenSSL.

Replace `<YOUR-CENTRALISED-VM-IP>` with your centralized VM IP address.

```bash
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout server.key \
  -out server.crt \
  -subj "/C=LK/ST=Western/L=Colombo/O=DigiOps/OU=FIM/CN=<YOUR-CENTRALISED-VM-IP>" \
  -addext "subjectAltName=IP:<YOUR-CENTRALISED-VM-IP>"
```

## 8. Build the Docker Images

Run the following commands from the dashboard directory:

```bash
cd <Download Location>/dashboard/

docker build -t fim-data-analyzer ./data-analyzer
docker build -t fim-data-collector ./data-collector
```

## 9. Run the Data Collector Container

>Please note:

>**Added the credentials (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY) for the previously created IAM user for the Dashboard component, along with the S3 bucket details.**

Fill in the required environment variable values before running the command.

```bash
docker run -d \
  --restart unless-stopped \
  --network host \
  --name fim-data-collector \
  -e AWS_ACCESS_KEY_ID= \
  -e AWS_SECRET_ACCESS_KEY= \
  -e AWS_REGION= \
  -e S3_BUCKET_NAME= \
  -e DB_HOST=127.0.0.1 \
  -e DB_USER=fim_user \
  -e DB_PASSWORD= \
  -e DB_NAME=FIMDB \
  -e DB_SSL_CA=/app/certs/ca.pem \
  -e DB_SSL_CERT=/app/certs/client-cert.pem \
  -e DB_SSL_KEY=/app/certs/client-key.pem \
  fim-data-collector
```

## 10. Run the Data Analyzer Container

Fill in the required environment variable values before running the command.

```bash
docker run -d \
  --restart unless-stopped \
  --network host \
  --name fim-data-analyzer \
  --add-host mysql-server:127.0.0.1 \
  -e DB_HOST=mysql-server \
  -e DB_USER=fim_user \
  -e DB_PASS= \
  -e DB_NAME=FIMDB \
  -e DB_PORT=3306 \
  -e DASH_USER='your-dashboard-user' \
  -e DASH_PASS='your-dashboard-password' \
  fim-data-analyzer
```

## 11. Verify the Dashboard

Open the following URL in your browser and verify that the dashboard loads successfully:

```text
https://<YOUR-CENTRALISED-VM-IP>/login.php
```

Dashboard should be visible like this.

<img width="1511" height="945" alt="image" src="https://github.com/user-attachments/assets/c53733a6-8225-4404-ab8a-17d0b65fbcb2" />

Please Add 'your-dashboard-user' and 'your-dashboard-password' to authenticate the login.

<img width="2048" height="1286" alt="fim-dashboard-table-blurred" src="https://github.com/user-attachments/assets/3cae17aa-1523-4928-9bb8-f25eb6de3001" />
