#  Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
# 
#  WSO2 LLC. licenses this file to you under the Apache License,
#  Version 2.0 (the "License"); you may not use this file except
#  in compliance with the License.
#  You may obtain a copy of the License at
# 
#  http://www.apache.org/licenses/LICENSE-2.0
# 
#  Unless required by applicable law or agreed to in writing,
#  software distributed under the License is distributed on an
#  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
#  specific language governing permissions and limitations
#  under the License. 

import json
import os
import re
import time
import shutil
from datetime import datetime
import difflib
import subprocess
import configparser
import sys
import pwd
import socket


# Paths 

# Paths 
_fim_dir        = os.environ.get('FIM_DIR',    '/home/fimuser/FIM')
_fim_home       = os.path.dirname(_fim_dir)         

backup_dir      = os.environ.get('BACKUP_DIR', os.path.join(_fim_home, 'BACKUP'))
input_file      = '/var/log/audit/audit.log'           # system path — unchanged
json_target_dir = os.environ.get('JSON_DIR',   os.path.join(_fim_dir, 'json_dir'))


# Config 

config = configparser.ConfigParser()
config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fim-agent.conf')
if not config.read(config_path):
    print(f"[Error] Config file not found: {config_path}", file=sys.stderr)
    sys.exit(1)


try:
    EXCLUDED_EXTENSIONS = set(
        ext.strip().lower()
        for ext in config['DEFAULT']['EXCLUDED_EXTENSIONS'].split(',')
    )
except KeyError as e:
    print(f"[Error] Missing config key: {e}", file=sys.stderr)
    sys.exit(1)

LOGS_MONITORING_ENABLE = config['DEFAULT'].get('LOGS_MONITORING_ENABLE', 'NO').upper() == 'YES'

confidential_extensions = EXCLUDED_EXTENSIONS.copy()
if not LOGS_MONITORING_ENABLE:
    confidential_extensions.add('.log')



# Exact-behavior helpers 

def get_username_from_id(user_id):
    try:
        user_id = str(user_id)
        if user_id == '4294967295':
            return 'System'
        uid_int = int(user_id)
        return pwd.getpwuid(uid_int).pw_name
    except (ValueError, KeyError):
        return None



def decode_proctitle(line: str) -> str:
    match = re.search(r'proctitle=([a-fA-F0-9]+)', line)
    if not match:
        return ""
    hex_string = match.group(1)

    try:
        decoded = bytes.fromhex(hex_string).decode('utf-8', errors='strict')
        parts = decoded.split('\x00')
        return ' '.join(parts).strip()
    except ValueError as ve:
        print(f"[Error] Invalid hex string: {hex_string} – {ve}")
        return ""
    except UnicodeDecodeError as ue:
        print(f"[Error] Cannot decode hex string to UTF-8: {hex_string} – {ue}")
        return ""


def generate_data(machine_identifier, conclusion, human_readable_timestamp, readable_text_cmd, diff):
    return {
        "machine_identifier": machine_identifier,
        "conclusion": conclusion,
        "human_readable_timestamp": human_readable_timestamp,
        "readable_text_cmd": readable_text_cmd,
        "diff": diff
    }


def create_json(data, file_name):
    os.makedirs(json_target_dir, exist_ok=True)
    full_file_path = os.path.join(json_target_dir, file_name)
        
    tmp_file_path = f"{full_file_path}.tmp"
    with open(tmp_file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    os.replace(tmp_file_path, full_file_path)


def is_readable_text_file(file_path):

    try:
        result = subprocess.run(
            ['/usr/bin/file', '--', file_path],
            capture_output=True,
            text=True,
            timeout=3,
            check=False
        )
        
        output = result.stdout

        if 'text' in output:
            return 'yes'
        elif '(No such file or directory)' in output:
            return 'temp'
        elif 'directory' in output:
            return 'directory'
        else:
            return 'no'

    except subprocess.TimeoutExpired:
        return 'no'
    except (FileNotFoundError, OSError) as e:
        
        print(f"An error occurred checking file readability: {e}")
        return 'no'


def cleanup_old_backups(backup_file_path):
    backup_dir_local = os.path.dirname(backup_file_path)
    base_filename = os.path.basename(backup_file_path)

    backup_files = [
        f for f in os.listdir(backup_dir_local)
        if f.startswith(base_filename) and f != base_filename
    ]
    backup_files.sort(key=lambda f: os.path.getmtime(os.path.join(backup_dir_local, f)))

    while len(backup_files) > 2:
        old_backup = backup_files.pop(0)
        os.remove(os.path.join(backup_dir_local, old_backup))


def remove_swp_files(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.swp') or '.swp_' in file:
                file_path = os.path.join(root, file)
                try:
                    os.remove(file_path)
                except Exception as e:
                    print(f"Error removing {file_path}: {e}")


def get_hostname():

    try:
        with open('/etc/hostname', 'r') as f:
            return f.read().strip()
    except FileNotFoundError:
        return socket.gethostname()


def get_time_zone():

    try:
        with open('/etc/timezone', 'r') as f:
            return f.read().strip()
    except FileNotFoundError:
        return 'UTC'


def get_inode_dir_for_backup(full_path):

    inode_path = os.path.dirname(full_path) + '/'
    try:
        return str(os.stat(inode_path).st_ino)
    except Exception:
        print('no such a path')
        return None


def process_paths(test_case, delete_flag):
    """
    Exact same algorithm, including org_file_name behavior.
    Returns (final_path, org_file_name) or (None, None)
    """
    def extract_unique_components(paths):
        words = []
        for path in paths:
            components = [word for word in path.split('/') if word]
            words.append(components)
        return words

    def remove_duplicates(words_list):
        unique_ordered = []
        for words in words_list:
            ordered = []
            seen = set()
            for word in words:
                if word not in seen:
                    ordered.append(word)
                    seen.add(word)
            unique_ordered.append(ordered)
        return unique_ordered

    def add_slashes(unique_words):
        org_file_name = unique_words[-1]
        return '/' + '/'.join(unique_words), org_file_name

    def paths_order(flattened_words):
        while flattened_words:
            abs_path, org = add_slashes(flattened_words)

            if os.path.exists(abs_path):
                return abs_path, org
            elif delete_flag == 1:
                return abs_path, org

            flattened_words = flattened_words[1:]

        return None, None

    words = extract_unique_components(test_case)
    flattened_words = [item for sublist in words for item in sublist]
    unique_ordered = remove_duplicates([flattened_words])[0]
    return paths_order(unique_ordered)


def compare_files(file1, file2, confidential_extensions):
    def is_confidential(file_path):
        base_name = os.path.basename(file_path)
        match = re.match(r"([^\_]+)", base_name)
        if match:
            extracted_filename = match.group(1)
        else:
            extracted_filename = base_name
        return any(extracted_filename.endswith(ext) for ext in confidential_extensions)

    try:
        with open(file1, 'r', encoding='utf-8') as f1, open(file2, 'r', encoding='utf-8') as f2:
            if is_confidential(file1) or is_confidential(file2):
                diff = "This is a confidential file"
            else:
                diff = difflib.unified_diff(
                    f1.readlines(), f2.readlines(),
                    fromfile=os.path.basename(file1),
                    tofile=os.path.basename(file2)
                )
            return ''.join(diff)
    except (UnicodeDecodeError, FileNotFoundError, IsADirectoryError):
        return "Non Readable file maybe due to update"


def get_latest_files(edit_directory, file_name):
    files = [f for f in os.listdir(edit_directory) if os.path.isfile(os.path.join(edit_directory, f))]
    files.sort(key=lambda f: os.path.getmtime(os.path.join(edit_directory, f)))

    base_name_dict = {}
    for f in files:
        base_name = '_'.join(f.split('_')[:-1])
        if base_name == file_name:
            base_name_dict.setdefault(base_name, []).append(f)

    latest_files = []
    for _, file_list in base_name_dict.items():
        if len(file_list) >= 2:
            latest_files.append(file_list[-2:])

    return latest_files



# Stateful stream processor ( capture/global behavior)

class StreamState:
    def __init__(self):
        self.syscall_info = {}
        self.buffer = []
        self.capture = False
        self.chmod = 0
        self.delete = 0
        self.create = 0

state = StreamState()


def process_log_line_equivalent(line: str):
    # Start capture on syscall lines (exact triggers)
    if (re.search(r'syscall=257 success=yes', line) or
        re.search(r'syscall=82 success=yes', line) or
        re.search(r'syscall=268 success=yes', line) or
        re.search(r'syscall=263 success=yes', line)):

        state.delete = 0
        state.chmod = 0
        state.create = 0
        state.syscall_info.clear()
        state.buffer.clear()
        state.capture = True
        state.buffer.append(line)

        if re.search(r'syscall=268 success=yes', line):
            state.chmod = 1
        if re.search(r'syscall=263 success=yes', line):
            state.delete = 1

        # timestamp

        timestamp_match = re.search(r'audit\((\d+\.\d+)', line)
        if not timestamp_match:
            return
        timestamp = timestamp_match.group(1)

        match = re.search(r'auid=(\d+)\s+uid=(\d+)', line)
        if match:
            auid = match.group(1)
            uid = match.group(2)
        else:
            auid, uid = None, None

        auid_username = get_username_from_id(auid) if auid is not None else None
        uid_username = get_username_from_id(uid) if uid is not None else None

        state.syscall_info.update({
            'timestamp': timestamp,
            'auid': auid_username,
            'uid': uid_username
        })
        return

    # CWD
    if state.capture and re.match(r'^type=CWD', line):
        cwd_path_match = re.search(r'cwd="([^"]+)"', line)
        if cwd_path_match:
            state.syscall_info['cwd_path'] = cwd_path_match.group(1)
        return

    # PATH
    if state.capture and re.match(r'^type=PATH', line):
        if re.search(r'.swp"', line) or re.search(r'.swpx"', line) or re.search(r'4913', line) or re.search(r'.swx"', line):
            state.capture = False

        state.buffer.append(line)

        path_match = re.search(r'name="([^"]+)"', line)
        if not path_match:
            return

        path = path_match.group(1)

        if re.search(r'nametype=PARENT', line):
            if path == "./":
                state.capture = False
            state.syscall_info['parent_path'] = path

        if re.search(r'nametype=NORMAL', line):
            state.syscall_info['file_path'] = path

        if re.search(r'nametype=CREATE', line):
            state.syscall_info['file_path'] = path
            state.create = 1

        if re.search(r'nametype=DELETE', line):
            state.syscall_info['file_path'] = path

        return

    # PROCTITLE => finalize
    if state.capture and re.match(r'^type=PROCTITLE', line):
        state.buffer.append(line)
        readable_text_cmd = decode_proctitle(line)

        if (('parent_path' in state.syscall_info or state.chmod) and
            ('file_path' in state.syscall_info)):

            # Build 
            if state.chmod == 1:
                test_case = [state.syscall_info.get('cwd_path', ''), state.syscall_info.get('file_path', '')]
            else:
                test_case = [state.syscall_info.get('cwd_path', ''), state.syscall_info.get('parent_path', ''), state.syscall_info.get('file_path', '')]

            full_path, org_file_name = process_paths(test_case, state.delete)
            if full_path is None:
                return _reset_capture()

            inode_tag = get_inode_dir_for_backup(full_path)
            if inode_tag is None:
                return _reset_capture()

            # EXT skip EXACT
            _, ext = os.path.splitext(full_path)
            if ext.lower() in confidential_extensions:
                return _reset_capture()

            machine_identifier = str(get_hostname())

            # conclusion EXACT
            if state.syscall_info['auid'] != state.syscall_info['uid']:
                conclusion = f"{state.syscall_info['auid']} has edited {full_path} file as {state.syscall_info['uid']}"
            else:
                conclusion = f"{state.syscall_info['auid']} has edited {full_path} file"

            time_zone = str(get_time_zone())
            human_readable_timestamp = str(datetime.fromtimestamp(float(state.syscall_info['timestamp'])).strftime('%Y-%m-%d %H:%M:%S')) + f"({time_zone})"

            # Branching EXACT
            kind = is_readable_text_file(full_path)

            # --- yes + not chmod + not delete => backup+diff
            if (kind == 'yes') and (not state.chmod) and (not state.delete):

                directory, _file_name = os.path.split(full_path)
                
                remove_swp_files(directory)

                relative_path = os.path.relpath(full_path, directory)  #  becomes file_name
                final_backup_file_path = os.path.join(backup_dir, f"{relative_path}_{inode_tag}")
                versioned_backup_path = f"{final_backup_file_path}_{state.syscall_info['timestamp']}"

                os.makedirs(os.path.dirname(final_backup_file_path), exist_ok=True)
                try:
                    shutil.copy2(full_path, versioned_backup_path)
                except FileNotFoundError:
                    return _reset_capture()

                cleanup_old_backups(final_backup_file_path)

                if not os.path.exists(backup_dir):
                    os.makedirs(backup_dir)

                edit_directory, file_name_base = os.path.split(final_backup_file_path)
                remove_swp_files(edit_directory)

                latest_files = get_latest_files(edit_directory, file_name_base)

                if latest_files:
                    for file_pair in latest_files:
                        file1, file2 = [os.path.join(edit_directory, f) for f in file_pair]
                        diff = compare_files(file1, file2, confidential_extensions)

                        if diff == '':
                            diff = "Content unchanged"
                        if state.create == 1 and diff == "This is the initial backup of the file":
                            diff = "This is newly created files"

                        data = generate_data(machine_identifier, conclusion, human_readable_timestamp, readable_text_cmd, diff)
                        json_file_name = f"{state.syscall_info['timestamp']}_{org_file_name}.json"
                        create_json(data, json_file_name)
                else:
                    diff = "This is the initial backup of the file"
                    if state.create == 1:
                        diff = "This is newly created files"
                    data = generate_data(machine_identifier, conclusion, human_readable_timestamp, readable_text_cmd, diff)
                    json_file_name = f"{state.syscall_info['timestamp']}_{org_file_name}.json"
                    create_json(data, json_file_name)

                return _reset_capture()

            # --- temp
            if kind == 'temp':
                diff = 'This is temporary file created from system'
                if state.delete == 1:
                    diff = 'This file or directory deleted'

                data = generate_data(machine_identifier, conclusion, human_readable_timestamp, readable_text_cmd, diff)
                create_json(data, f"{state.syscall_info['timestamp']}.json")
                return _reset_capture()

            # --- no
            if kind == 'no':
                data = generate_data(machine_identifier, conclusion, human_readable_timestamp, readable_text_cmd,
                                     'This is non readable files due to the patch updates')
                create_json(data, f"{state.syscall_info['timestamp']}.json")
                return _reset_capture()

            # --- directory + chmod
            if kind == 'directory' and state.chmod == 1:
                data = generate_data(machine_identifier, conclusion, human_readable_timestamp, readable_text_cmd,
                                     'Permission has changed in this path')
                create_json(data, f"{state.syscall_info['timestamp']}.json")
                return _reset_capture()

            # --- chmod
            if state.chmod == 1:
                data = generate_data(machine_identifier, conclusion, human_readable_timestamp, readable_text_cmd,
                                     'Permission has changed in this path')
                create_json(data, f"{state.syscall_info['timestamp']}.json")
                return _reset_capture()

        return _reset_capture()

    return


def _reset_capture():
    state.syscall_info.clear()
    state.buffer.clear()
    state.capture = False
    state.chmod = 0
    state.delete = 0
    state.create = 0
    return



# Tail + rotation

def get_inode(path):
    return os.stat(path).st_ino


def follow_log(input_file):

    while True:
        try:
            current_inode = get_inode(input_file)

            with open(input_file, 'r') as infile:
                infile.seek(0, os.SEEK_END)

                while True:
                    line = infile.readline()
                    if line:
                        process_log_line_equivalent(line)
                    else:
                        time.sleep(0.5)
                        try:
                            new_inode = get_inode(input_file)
                        except FileNotFoundError:
                            time.sleep(1)
                            break
                        if new_inode != current_inode:
                            break

        except FileNotFoundError:
            print(f"[Warning] Log file not found: {input_file}, retrying...")
            time.sleep(1)
            continue

        except Exception as e:
            print(f"[Error] Unexpected error in follow_log: {e}")
            time.sleep(1)
            continue


if __name__ == "__main__":
    follow_log(input_file)
