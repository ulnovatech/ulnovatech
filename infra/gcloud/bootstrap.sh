#!/usr/bin/env bash
# Google Compute Engine VM bootstrap — Ubuntu 22.04 / 24.04 (AMD64)
# Idempotent host prep for UlnoVaTech Docker deploy.
#
# Usage (as root):
#   curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/ulnovatech/main/infra/gcloud/bootstrap.sh | sudo bash
#   # or from a git checkout:
#   sudo bash infra/gcloud/bootstrap.sh
#
# Optional env:
#   DEPLOY_USER=deploy   default deploy user name
#   DEPLOY_ROOT=/opt/ulnovatech

set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/ulnovatech}"

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Run as root: sudo $0" >&2
  exit 1
fi

log() { echo "==> $*"; }

# --- Docker Engine + Compose plugin ---
if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker Engine"
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
  fi
  . /etc/os-release
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
else
  log "Docker already installed: $(docker --version)"
fi

if ! docker compose version >/dev/null 2>&1; then
  log "Installing Docker Compose plugin"
  apt-get update -qq
  apt-get install -y -qq docker-compose-plugin
fi

# --- UFW: SSH + HTTP + HTTPS ---
if command -v ufw >/dev/null 2>&1; then
  log "Configuring UFW (22, 80, 443)"
  ufw --force default deny incoming || true
  ufw --force default allow outgoing || true
  ufw allow 22/tcp comment 'SSH' || true
  ufw allow 80/tcp comment 'HTTP' || true
  ufw allow 443/tcp comment 'HTTPS' || true
  ufw --force enable || true
else
  log "UFW not installed — installing and configuring"
  apt-get update -qq
  apt-get install -y -qq ufw
  ufw --force default deny incoming
  ufw --force default allow outgoing
  ufw allow 22/tcp comment 'SSH'
  ufw allow 80/tcp comment 'HTTP'
  ufw allow 443/tcp comment 'HTTPS'
  ufw --force enable
fi

# --- Deploy user ---
if ! id "$DEPLOY_USER" &>/dev/null; then
  log "Creating user ${DEPLOY_USER}"
  useradd -m -s /bin/bash "$DEPLOY_USER"
else
  log "User ${DEPLOY_USER} already exists"
fi

if ! groups "$DEPLOY_USER" | grep -q '\bdocker\b'; then
  log "Adding ${DEPLOY_USER} to docker group"
  usermod -aG docker "$DEPLOY_USER"
fi

# --- Directory layout ---
log "Creating ${DEPLOY_ROOT} layout"
install -d -m 0755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" \
  "${DEPLOY_ROOT}/secrets" \
  "${DEPLOY_ROOT}/env" \
  "${DEPLOY_ROOT}/public_html" \
  "${DEPLOY_ROOT}/repo"

chmod 700 "${DEPLOY_ROOT}/secrets" "${DEPLOY_ROOT}/env"

# --- Hardening hints ---
log "Bootstrap complete"
cat <<EOF

Next steps (as ${DEPLOY_USER}):
  1. Add your SSH public key to ~${DEPLOY_USER}/.ssh/authorized_keys
  2. Clone the repo to ${DEPLOY_ROOT}/repo
  3. Copy env templates to ${DEPLOY_ROOT}/env/ (see infra/env/README.md)
  4. Place service-account.json in ${DEPLOY_ROOT}/secrets/ (optional FCM/GA)
  5. Follow docs/DEPLOY_GCLOUD.md for first deploy

Also open GCE VPC firewall for tcp:22, tcp:80, tcp:443 (tag e.g. ulnovatech-web).

Re-login as ${DEPLOY_USER} if docker group was just added.

EOF
