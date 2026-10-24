# ShelfAware Central Agent (Phase 2)

Drains `/agent_queue` every cron cycle, resolves each barcode through a
free-tier-first fallback chain, and writes results back to Firestore so the
already-shipped app picks them up with **zero app-side changes**.

## ⚠️ Read this before deploying — deviations from the original blueprint

**1. Hobby cron is once a day; hourly drain is GitHub Actions.**
Vercel Hobby only runs `vercel.json` crons once per day (`0 3 * * *` here,
kept as a backup). The live drain is `.github/workflows/process-queue.yml`:
it `POST`s `https://shelfaware-central-agent.vercel.app/api/process-queue`
every hour with `Authorization: Bearer $CRON_SECRET`. Set that secret on the
GitHub repo (`gh secret set CRON_SECRET`). Each run is ~1 billed minute, so
a private repo stays under the 2000 min/month free cap. The HTTP route does
not require Vercel Pro.

**2. LLM slots (Gemini/OpenRouter/Groq/HuggingFace) are hint-gated, not blind.**
A barcode is an opaque number — an LLM cannot truly "look up" what product it
maps to without either real memorized knowledge of that exact item or actual
context. Every LLM prompt here (`lib/llm-prompt.js`) includes whatever
`partial_name`/`category` hints exist from `/abandoned_scans`, plus a
GS1-prefix-derived likely country, and explicitly instructs the model to
answer `"unknown"` rather than invent a plausible-sounding product. A
`"unknown"` response is treated as a slot failure and falls through to the
next slot. This means resolution quality is meaningfully better when a user
typed a partial name before abandoning the scan than on a cold barcode with
zero context — which is realistic, not a bug.

**3. `/config/ai_models` in Firestore must exist for slots 2–4 and 6 to use
live model lists** (`lib/load-live-models.js`). This doc is written by the
Phase 3 health checker (see `../model-health-checker`) — until Phase 3 runs
at least once, this agent falls back to small hardcoded default model lists
that should still work but won't reflect newly-released or newly-dead
models.

**4. Added an `attempts` counter to `/agent_queue` docs** (not in the
original schema) so a permanently-unresolvable barcode gets deleted after 5
failed cycles instead of looping forever. This is additive — it doesn't
break the documented schema, just adds a field the app never reads.

**5. Added a wall-clock time budget inside `process-queue.js`.** Vercel
Hobby `maxDuration` is **10s**. The code default for `FUNCTION_TIME_BUDGET_MS`
is **8000** so a missing Vercel env cannot wait 55s and get killed mid-write.
The handler processes small concurrent chunks and stops pulling new work
within ~20% of that budget. OFF is always first (short timeout). Hint-only
barcodes get **one** fast LLM with remaining time — not a two-model race.
A 34s local LLM complete **will not finish** on Hobby; those items stay in
`agent_queue` (`deferred`, attempts not incremented). `llmTried` on the queue
doc is the resume cursor (Groq → Gemini free → OpenRouter, one actual call
per hour). `abandoned_scans` is deleted only after `products` +
`product_templates` both write. Hourly GitHub Actions keeps slicing until
resolve or 5 full passes.

Hobby cron is once daily (`0 3 * * *` in `vercel.json`). GitHub Actions
`.github/workflows/process-queue.yml` hits the same HTTP route every hour.

## Project structure

```
central-agent/
├── .github/workflows/process-queue.yml  ← hourly Hobby drain
├── api/process-queue.js        ← cron/HTTP entry point
├── lib/
│   ├── firestore.js             ← Admin SDK singleton
│   ├── schema.js                ← category/emoji/GS1/JSON-parsing helpers
│   ├── load-live-models.js      ← reads /config/ai_models
│   ├── key-state.js             ← sleep/wake + multi-key rotation
│   ├── budget-gate.js           ← $/day cap for the paid Gemini slot
│   ├── llm-prompt.js            ← shared hint-gated prompt + parser
│   ├── openai-compatible.js     ← shared caller for Groq/OpenRouter/HF
│   ├── open-food-facts.js       ← Slot 1
│   ├── gemini-free.js           ← Slot 2
│   ├── open-router.js           ← Slot 3
│   ├── groq.js                  ← Slot 4
│   ├── google-search.js         ← Slot 5
│   ├── hugging-face.js          ← Slot 6
│   ├── gemini-paid.js           ← Slot 7
│   ├── resolve-product.js       ← orchestrates all 7 slots + the 2/3 race
│   └── write-product.js         ← Firestore write-set + queue draining
├── vercel.json
├── package.json
└── .env.example
```

## Deploy

```bash
npm install
vercel link          # connect to your Vercel project
vercel env pull .env  # or fill .env manually from .env.example
vercel dev            # local test: curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/process-queue
vercel --prod          # deploy
```

Then in the Vercel dashboard, add every variable from `.env.example` under
Project → Settings → Environment Variables (Production).

## Firestore setup checklist

- [ ] Deploy the security rules from the blueprint's "Firestore Security
      Rules — FINAL" section (the Admin SDK bypasses them, but they still
      protect the client-facing paths).
- [ ] Create composite/simple index for `agent_queue` ordered by `createdAt`
      if Firestore prompts you to (single-field ascending is usually
      automatic, but check the first cron run's logs for an index-required
      error link).
- [ ] Set a TTL policy on `abandoned_scans.abandonedAt` (~30 days) and
      `agent_queue.createdAt` as a backup cleanup net, per the blueprint.
- [ ] Run `../model-health-checker` at least once so `/config/ai_models`
      and the app's Remote Config values are populated before relying on
      live model lists.

## Cost/safety notes

- Slot ordering is free-tier-first by design; Slot 7 (paid) is the only one
  that costs money, and it's gated by `budget-gate.js`. Token pricing
  constants in `budget-gate.js` are placeholders — verify current rates at
  https://ai.google.dev/pricing before trusting the budget gate for real
  spend control.
- `GEMINI_PAID_GROUNDING` (off by default) turns on Google Search grounding
  for the paid slot only — it's the one slot capable of a genuine live
  lookup instead of relying on memorized training data, but grounding has
  its own per-call cost not reflected in the token-only estimate. Check
  current pricing before enabling it.
