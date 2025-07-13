#!/bin/bash
# Script to set up test data for the decryption service
# Usage: ./setup_test_data.sh <API_URL> <S3_BUCKET> <KMS_KEY_ID>

API_URL="$1"
S3_BUCKET="$2"
KMS_KEY_ID="$3"
BLOB_KEY="test-encrypted-blob"

if [ -z "$API_URL" ] || [ -z "$S3_BUCKET" ] || [ -z "$KMS_KEY_ID" ]; then
  echo "Usage: $0 <API_URL> <S3_BUCKET> <KMS_KEY_ID>"
  echo "Get these values from: terraform output"
  exit 1
fi

echo "Setting up test data..."
echo "API URL: $API_URL"
echo "S3 Bucket: $S3_BUCKET"
echo "KMS Key ID: $KMS_KEY_ID"
echo "Blob Key: $BLOB_KEY"

# Create sample plaintext
echo "Creating sample plaintext..."
echo "This is a sample secret message for testing the decryption service." > sample_plaintext.txt

# Encrypt with KMS
echo "Encrypting with KMS..."
aws kms encrypt \
  --key-id "$KMS_KEY_ID" \
  --plaintext fileb://sample_plaintext.txt \
  --output text \
  --query CiphertextBlob | base64 --decode > sample_encrypted_blob

# Upload to S3
echo "Uploading to S3..."
aws s3 cp sample_encrypted_blob "s3://$S3_BUCKET/$BLOB_KEY"

echo "Test data setup complete!"
echo "You can now test with:"
echo "./decrypt_test.sh $API_URL $BLOB_KEY"
