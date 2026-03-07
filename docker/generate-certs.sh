#!/usr/bin/env bash
set -euo pipefail

CERT_DIR="$(dirname "$0")/nginx/certs"
CERT_FILE="$CERT_DIR/local-cert.pem"
KEY_FILE="$CERT_DIR/local-key.pem"

# Idempotent — skip if certs already exist
if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
  echo "Certificates already exist in $CERT_DIR — skipping generation."
  exit 0
fi

mkdir -p "$CERT_DIR"

# Prefer mkcert if available
if command -v mkcert &>/dev/null; then
  echo "Using mkcert to generate locally-trusted certificates..."
  mkcert -cert-file "$CERT_FILE" -key-file "$KEY_FILE" localhost 127.0.0.1 ::1
else
  echo "mkcert not found — falling back to openssl self-signed certificate..."
  openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/C=FR/ST=IDF/L=Paris/O=Transcendence/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1"
fi

echo "Certificates generated:"
echo "  Certificate: $CERT_FILE"
echo "  Private key: $KEY_FILE"
