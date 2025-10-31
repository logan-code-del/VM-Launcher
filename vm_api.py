#!/usr/bin/env python3
import os
import subprocess
import shlex
from pathlib import Path
from flask import Flask, jsonify, request

ISOS_DIR = Path('/isos')
IMAGES_DIR = Path('/images')
NOVNC_DIR = Path('/opt/noVNC')
QEMU_PID = Path('/tmp/qemu.pid')
WS_PID = Path('/tmp/websockify.pid')

app = Flask(__name__)


def ensure_dirs():
    ISOS_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)


def run_bg(cmd, pidfile=None):
    # start subprocess in background; write pid to pidfile if given
    p = subprocess.Popen(shlex.split(cmd), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if pidfile:
        Path(pidfile).write_text(str(p.pid))
    return p.pid


def read_pid(pidfile):
    try:
        return int(Path(pidfile).read_text())
    except Exception:
        return None


def kill_pid(pid):
    try:
        os.kill(pid, 15)
    except Exception:
        pass


@app.route('/api/isos', methods=['GET'])
def list_isos():
    ensure_dirs()
    items = []
    for p in ISOS_DIR.iterdir():
        if p.is_file():
            items.append({'name': p.name, 'size': p.stat().st_size})
    return jsonify(items)


@app.route('/api/status', methods=['GET'])
def status():
    qpid = read_pid(QEMU_PID)
    wspid = read_pid(WS_PID)
    return jsonify({'qemu_pid': qpid, 'websockify_pid': wspid})


@app.route('/api/start', methods=['POST'])
def start_vm():
    ensure_dirs()
    data = request.get_json() or {}
    iso_name = data.get('iso')
    memory = int(data.get('memory', 2048))
    cpus = int(data.get('cpus', 2))

    if not iso_name:
        return jsonify({'error': 'iso is required'}), 400

    iso_path = ISOS_DIR / iso_name
    if not iso_path.exists():
        return jsonify({'error': 'iso not found'}), 404

    # create disk image if missing
    img_name = iso_name.replace('.iso', '.qcow2')
    disk = IMAGES_DIR / img_name
    if not disk.exists():
        size = '20G'
        if 'windows' in iso_name.lower():
            size = '40G'
        subprocess.check_call(['qemu-img', 'create', '-f', 'qcow2', str(disk), size])

    # start websockify if not running
    wspid = read_pid(WS_PID)
    if not wspid:
        # websockify proxy: port 6080 -> vnc 5901
        cmd = f"websockify --web {str(NOVNC_DIR)} --heartbeat 30 0.0.0.0:6080 localhost:5901"
        pid = run_bg(cmd, str(WS_PID))

    # start qemu
    qpid = read_pid(QEMU_PID)
    if qpid:
        return jsonify({'error': 'vm already running', 'qemu_pid': qpid}), 409

    qemu_cmd = (
        'qemu-system-x86_64 '
        f'-enable-kvm -machine accel=kvm -cpu host -m {memory} -smp {cpus} '
        f"-drive if=virtio,file={str(disk)},format=qcow2 "
        f"-cdrom {str(iso_path)} -boot menu=on -vnc 0.0.0.0:1 "
        '-netdev user,id=net0,hostfwd=tcp::2222-:22 -device e1000,netdev=net0 -display none'
    )
    pid = run_bg(qemu_cmd, str(QEMU_PID))
    return jsonify({'qemu_pid': pid})


@app.route('/api/stop', methods=['POST'])
def stop_vm():
    qpid = read_pid(QEMU_PID)
    if qpid:
        kill_pid(qpid)
        try:
            QEMU_PID.unlink()
        except Exception:
            pass
    wspid = read_pid(WS_PID)
    if wspid:
        kill_pid(wspid)
        try:
            WS_PID.unlink()
        except Exception:
            pass
    return jsonify({'stopped': True})


if __name__ == '__main__':
    ensure_dirs()
    # run Flask on 0.0.0.0:8000
    app.run(host='0.0.0.0', port=8000)
