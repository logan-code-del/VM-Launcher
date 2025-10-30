#!/bin/bash
set -e

# locations
ISOS_DIR="/isos"
IMAGES_DIR="/images"
NOVNC_DIR="/opt/noVNC"

mkdir -p "$ISOS_DIR" "$IMAGES_DIR"

# find image choices
WIN_ISO="$ISOS_DIR/windows10.iso"
LINUX_ISO="$ISOS_DIR/linuxmint.iso"

# defaults
DISPLAY_NUM=1
VNC_PORT=$((5900 + DISPLAY_NUM))
NOVNC_PORT=6080

# helper to create qcow2 if missing
ensure_disk() {
  target="$1"
  size="$2"
  if [ ! -f "$target" ]; then
    echo "Creating disk $target ($size)"
    qemu-img create -f qcow2 "$target" "$size"
  fi
}

start_novnc() {
  # start websockify via noVNC utils so web UI is available
  echo "Starting noVNC on :$NOVNC_PORT -> vnc:$VNC_PORT"
  # websockify from pip provides 'websockify' cli; noVNC includes a proxy script too
  /usr/local/bin/websockify --web "$NOVNC_DIR" --heartbeat 30 0.0.0.0:$NOVNC_PORT localhost:$VNC_PORT &
  sleep 1
}

start_qemu() {
  local iso="$1"
  local disk="$2"
  local extra="$3"
  echo "Launching QEMU with ISO: $iso disk: $disk"
  qemu-system-x86_64 \
    -enable-kvm \
    -machine accel=kvm \
    -cpu host \
    -m 4096 \
    -smp 2 \
    -drive if=virtio,file="$disk",format=qcow2 \
    -cdrom "$iso" \
    -boot menu=on \
    -vnc 0.0.0.0:$DISPLAY_NUM \
    -netdev user,id=net0,hostfwd=tcp::2222-:22 \
    -device e1000,netdev=net0 \
    -display none \
    $extra
}

# decide which image to run
if [ -f "$WIN_ISO" ]; then
  DISK="$IMAGES_DIR/windows10.qcow2"
  ensure_disk "$DISK" 40G
  start_novnc
  start_qemu "$WIN_ISO" "$DISK"
elif [ -f "$LINUX_ISO" ]; then
  DISK="$IMAGES_DIR/linuxmint.qcow2"
  ensure_disk "$DISK" 20G
  start_novnc
  start_qemu "$LINUX_ISO" "$DISK"
else
  echo "No supported ISO found in $ISOS_DIR"
  echo "Place windows10.iso or linuxmint.iso in the isos/ folder and restart the container."
  echo "Example: mkdir -p isos; curl -L -o isos/linuxmint.iso <url>"
  sleep infinity
fi
// ...existing code...