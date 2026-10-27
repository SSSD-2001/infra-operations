1. Download the `fim-agent-installer.sh` file.

Take this below URL and update the `INSTALL_REF` value with the latest commit ID.

```
wget -O fim-agent-installer.sh https://raw.githubusercontent.com/wso2-open-operations/infra-operations/{INSTALL_REF}/apps/file-integrity-monitor/agent/fim-agent/fim-agent-installer.sh
```
Ex: Commit ID:

<img width="2048" height="579" alt="image" src="https://github.com/user-attachments/assets/c48271d1-5e6b-446e-a656-6184641ac088" />

2. Edit the `fim-agent-installer.sh` file and update the `INSTALL_REF` value with the latest commit ID.


<img width="1181" height="194" alt="image" src="https://github.com/user-attachments/assets/a6e01db8-2e65-42df-b95d-c93374dd8e9e" />

3. Run the installer script:

   ```bash
   bash fim-agent-installer.sh
   ```
4. After the fim-agent installation completes successfully, follow the on-screen instructions to finish the setup.

>Please note:

>**Added the credentials (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY) for the previously created IAM user for the Agent component, along with the S3 bucket details.**

```

IMPORTANT:
Before starting the services, update your credentials in:
  1. /home/fimuser/FIM/fim-agent.conf
  2. /home/fimuser/FIM/.env

After updating credentials, run:
  systemctl enable fim.service
  systemctl enable data-uploader.service
  systemctl start fim.service
  systemctl start data-uploader.service

Check status:
  systemctl status fim.service
  systemctl status data-uploader.service

View logs:
  journalctl -u fim.service -f
  journalctl -u data-uploader.service -f

Installer log:
  /var/log/fim_install.log
```
