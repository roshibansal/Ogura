#!/usr/bin/env bash
# Deploys the three Razorpay edge functions.
#
# The versions running in production today are older than this repo. In
# particular the live razorpay-create-order trusts a client-supplied `amount`,
# so a tampered request can name its own price. This deploy replaces it with
# the server-authoritative version that recomputes every charge from the
# catalogue and revalidates discount codes.
#
# Run:  bash scripts/deploy-razorpay.sh
set -euo pipefail

PROJECT_REF="$(grep VITE_SUPABASE_PROJECT_ID .env | cut -d= -f2 | tr -d '"'"'"' ')"
echo "Project: $PROJECT_REF"

npx supabase login          # opens a browser; nothing is typed into this terminal
npx supabase link --project-ref "$PROJECT_REF"

npx supabase functions deploy razorpay-create-order   --project-ref "$PROJECT_REF"
npx supabase functions deploy razorpay-verify-payment --project-ref "$PROJECT_REF"
npx supabase functions deploy razorpay-webhook        --project-ref "$PROJECT_REF"

echo
echo "Deployed. Verify with:  bash scripts/check-razorpay.sh"
