FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    qemu-system-x86 qemu-utils qemu-kvm \
    python3 python3-pip git wget ca-certificates socat \
    net-tools iproute2 \
 && rm -rf /var/lib/apt/lists/*

# websockify is needed by noVNC; use pip for simplicity
RUN pip3 install websockify

WORKDIR /opt
# clone a small noVNC snapshot
RUN git clone --depth 1 https://github.com/novnc/noVNC.git /opt/noVNC \
 && git clone --depth 1 https://github.com/novnc/websockify.git /opt/noVNC/utils/websockify

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

VOLUME ["/isos", "/images"]
EXPOSE 6080 2222

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]