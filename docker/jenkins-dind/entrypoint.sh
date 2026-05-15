#!/bin/sh
set -eu

mkdir -p /docker-socket
rm -f /docker-socket/docker.sock

exec dockerd \
  --host=unix:///docker-socket/docker.sock \
  --group=jenkins \
  "$@"
