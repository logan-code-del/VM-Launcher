# VM-Launcher
A in browser Vm Launcher 

Minimal browser VM launcher (QEMU + noVNC)
=========================================

- Requirements
- Docker / Docker Compose (on the host)
- KVM available and accessible to the container (recommended for performance)
- Place the ISO(s) you want to run in ./isos:
  - ./isos/linuxmint.iso  (free)
  - ./isos/windows10.iso  (must be obtained/licensed by you)

Usage
1. Build & start:
   docker compose up --build

2. Open the UI in the host browser:
   $BROWSER http://localhost:6080

3. If you used a Linux Mint ISO, install it to the qcow2 disk created at ./images/linuxmint.qcow2.
   For Windows 10, install as usual (license required). SSH to guest is forwarded to host:2222 after guest SSH server is installed.

API & web UI
- The VM control API is exposed on port 8000 of the host. The API can list ISOs, start and stop the VM.
- The simple web UI (served from `simple-web-ui`) can control the VM via the API. It includes buttons to start an ISO and stop the VM.

Typical flow:
1. Copy your ISO(s) into `./isos`, for example:
   mkdir -p isos images
   cp /path/to/linuxmint.iso isos/linuxmint.iso

2. Build and start the VM service (this builds the image with QEMU + Flask API + noVNC):
   docker compose up --build

3. Open the UI and control the VM:
   - Web UI (static) is served by the repo (if you run `simple-web-ui` start script) and can call the API at http://localhost:8000
   - noVNC display is at http://localhost:6080 (after a VM is started)

Notes
- The API will create a qcow2 image under `./images` when you start an ISO if one doesn't exist.
- Running Windows requires a valid license/ISO; this repo does not provide Windows binaries or keys.

Notes and tips
- The container must be run with /dev/kvm accessible. The compose file uses privileged mode and maps /dev/kvm.
- To switch OS, stop the container, put the other ISO into ./isos (remove the first or rename), then start again.
- This is intentionally minimal — you can expand by adding audio, SPICE, display devices, more CPU/memory, or ISO selection UI.
- Performance is much better with KVM; without it, QEMU will be very slow.

Security
- This is intended for local development. Do not expose ports publicly without securing access.
