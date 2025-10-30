# VM-Launcher
A in browser Vm Launcher 

Minimal browser VM launcher (QEMU + noVNC)
=========================================

Requirements
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

Notes and tips
- The container must be run with /dev/kvm accessible. The compose file uses privileged mode and maps /dev/kvm.
- To switch OS, stop the container, put the other ISO into ./isos (remove the first or rename), then start again.
- This is intentionally minimal — you can expand by adding audio, SPICE, display devices, more CPU/memory, or ISO selection UI.
- Performance is much better with KVM; without it, QEMU will be very slow.

Security
- This is intended for local development. Do not expose ports publicly without securing access.
