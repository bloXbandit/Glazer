#!/bin/bash
# Deterministic gate for GlazeApp. Exit 0 = PASS.
# BGC pricing regression: engine output vs the Pricing Document worked examples.
cd "$(dirname "$0")/.." || exit 1
npx tsx scripts/verify-bgc.ts
exit $?
