#!/usr/bin/env bash
# Applies the full schema to the NEW Supabase project.
#
# The login is a browser flow, so it has to be you. Everything after is
# automatic. This same login also authorises the razorpay edge-function
# deploy, which is why the CLI route is worth the one extra step.
set -euo pipefail
cd "$(dirname "$0")/.."

REF="qxsyjwfusnzdpnkwqwqs"

echo "==> Logging in to Supabase (opens a browser)"
npx supabase login

echo
echo "==> Linking to $REF"
npx supabase link --project-ref "$REF"

echo
echo "==> Pushing 32 migrations"
npx supabase db push --include-all

echo
echo "==> Deploying the razorpay functions (with the price-tampering fix)"
for fn in razorpay-create-order razorpay-verify-payment razorpay-webhook; do
  npx supabase functions deploy "$fn" --project-ref "$REF"
done

echo
echo "Schema and functions are in. Next: node scripts/migrate-to-new-project.mjs --images"
