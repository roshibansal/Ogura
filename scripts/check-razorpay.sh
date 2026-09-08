#!/usr/bin/env bash
# Confirms the deployed create-order function refuses a client-named price.
# Creates no order when the fix is live.
set -euo pipefail
URL="$(grep VITE_SUPABASE_URL .env | cut -d= -f2 | tr -d '"'"'"' ')"
KEY="$(grep VITE_SUPABASE_PUBLISHABLE_KEY .env | cut -d= -f2 | tr -d '"'"'"' ')"

echo "Sending an order that names its own price (amount only, no items)..."
curl -s -X POST "$URL/functions/v1/razorpay-create-order" \
  -H "Content-Type: application/json" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  -d '{"amount":1,"currency":"INR"}'
echo
echo
echo "PASS looks like: {\"success\":false,\"error\":\"Order must contain at least one item\"}"
echo "FAIL looks like: {\"success\":true,\"order_id\":\"order_...\"}  <- price tampering still open"
