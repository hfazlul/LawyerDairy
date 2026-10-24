# ShelfAware Monthly Model Health Checker (Phase 3)

Standalone maintenance tool. Runs on GitHub Actions (free), once a month
(plus on-demand via `workflow_dispatch`). Probes every free-tier model the
app and central agent depend on, updates Firebase, and sends a **Telegram**
summary (official Bot API). CallMeBot WhatsApp is an optional fallback.

## What it does

1. Fetches live catalogs (Groq / OpenRouter `:free` / Gemini flash / HF
   instruct), merges with last Firestore lists, probes, **auto-replaces
   dead IDs**, then writes survivors.
2. Updates **Firebase Remote Config** — `groq_models`, `openrouter_models`,
   `gemini_paid_model` — read directly by the shipped Android app.
   **HuggingFace is never written to Remote Config.**
3. Updates **Firestore `/config/ai_models`** — Groq / OpenRouter / Gemini
   **and `hf`** for the Phase 2 central agent (`lib/load-live-models.js`).
   If all HF probes die, `hf` is written as `[]` and the agent uses its
   hardcoded fallback.
4. Sends a **Telegram message** via Bot API with the live/dead breakdown.
   If Telegram is not configured (or the send fails), it may fall back to
   CallMeBot WhatsApp.

## Gap fixed vs. the original blueprint

The blueprint's central-agent project structure explicitly says
`load-live-models.js` reads model lists from **Firestore `/config/ai_models`**
— but the original Phase 3 script only ever wrote to Remote Config, never to
that Firestore doc. Without step 3 above, the central agent would silently
run on tiny hardcoded fallback model lists forever, since nothing populates
the doc it reads. `update_firestore_model_config()` in
`tools/model_health_check.py` fixes this.

## Setup

### 1. Telegram alerts (BotFather, ~3 minutes, one-time)

Do this on Telegram (phone or desktop). **Never paste the bot token into
this chat or commit it to git.**

1. Open Telegram → search **`@BotFather`** → Start.
2. Send `/newbot`.
3. Pick a display name (e.g. `ShelfAware Health`) then a username ending in
   `bot` (e.g. `shelfaware_health_bot`).
4. BotFather replies with a token that looks like `123456:ABC-DEF...`.
   Copy it. That is `TELEGRAM_BOT_TOKEN`.
5. Open **your new bot** in Telegram and send `/start` (bots cannot message
   you until you do this).
6. Get your `TELEGRAM_CHAT_ID` **on your own machine** (do not send the
   token to anyone). After `/start`, in a browser or PowerShell replace
   `YOUR_TOKEN` locally:

   ```
   https://api.telegram.org/botYOUR_TOKEN/getUpdates
   ```

   In the JSON, find `"chat":{"id": 123456789}` — that number is
   `TELEGRAM_CHAT_ID`. For a group, add the bot to the group, send a
   message, then read `chat.id` (often negative).

7. Put the values:
   - **Local:** `model-health-checker/.env` (copy from `.env.example`)
   - **GitHub Actions:** repo → Settings → Secrets →
     `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`

Firebase/Firestore updates still run if Telegram is missing — you just
will not get a chat ping.

### 2. GitHub secrets
Repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Notes |
|---|---|
| `GROQ_API_KEY_CHECKER` | Can reuse an existing Groq key |
| `OPENROUTER_API_KEY_CHECKER` | Can reuse an existing OpenRouter key |
| `GEMINI_FREE_API_KEY` | Free key from aistudio.google.com |
| `HF_API_TOKEN` | HuggingFace access token |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | GitHub Actions: paste the **full JSON text**. Local: `./service-account.json` |
| `TELEGRAM_BOT_TOKEN` | From @BotFather |
| `TELEGRAM_CHAT_ID` | Your user or group chat id |
| `CALLMEBOT_PHONE` | Optional WhatsApp fallback |
| `CALLMEBOT_API_KEY` | Optional WhatsApp fallback |

The service account needs **Firebase Remote Config Admin** and **Cloud
Datastore User** (or broader Firebase Admin) IAM roles on the project.

### 3. First run
Actions tab → "Monthly AI Model Health Check" → **Run workflow** (manual
`workflow_dispatch`) to verify everything's wired up before waiting for the
1st-of-the-month schedule.

## Local testing

```powershell
cd model-health-checker
copy .env.example .env
# fill GROQ / OpenRouter / Gemini / HF + TELEGRAM_* in .env
# put service-account.json next to run-local.ps1
.\run-local.ps1
```

Or without the helper:

```bash
pip install -r requirements.txt
export GROQ_API_KEY=... OPENROUTER_API_KEY=... GEMINI_FREE_API_KEY=... HF_API_TOKEN=...
export FIREBASE_SERVICE_ACCOUNT_JSON="$(cat service-account.json)"
export TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=...
python tools/model_health_check.py
```

A successful Telegram send prints `Telegram notification sent`. If token /
chat_id are empty, the script still updates Firebase and skips the ping.

## Notes

- Groq / OpenRouter / Gemini / HuggingFace: fetch provider catalogs, keep
  still-alive previous IDs, drop dead ones, fill from the catalog (seed
  lists are fallback if a catalog fetch fails). HuggingFace is written to
  **Firestore `hf` only**, never to Remote Config.
- Remote Config PUT failures are fatal so RC cannot silently drift from
  Firestore. Alerts are non-fatal. Missing Telegram does not fail the run.
