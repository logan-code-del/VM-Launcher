#!/bin/bash
set -euo pipefail

# Entry point: start the VM API (Flask). The API manages QEMU and websockify.
echo "Starting VM API..."
exec python3 /opt/vm_api.py