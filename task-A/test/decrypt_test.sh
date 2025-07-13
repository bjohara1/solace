#!/bin/bash
# Usage: ./decrypt_test.sh <API_URL> <BLOB_KEY>

API_URL="$1"
BLOB_KEY="$2"

if [ -z "$API_URL" ] || [ -z "$BLOB_KEY" ]; then
  echo "Usage: $0 <API_URL> <BLOB_KEY>"
  exit 1
fi

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"blobKey\": \"$BLOB_KEY\"}")

echo "Response: $RESPONSE"
