"""
ShelfAware — Monthly AI Model Health Checker (Phase 3)

Probes every free-tier AI model the app / central agent depend on, then:
  1. Updates Firebase Remote Config (groq_models, openrouter_models,
     gemini_paid_model) — read directly by the shipped Android app.
  2. Writes Groq / OpenRouter / Gemini / HuggingFace to Firestore
     /config/ai_models — read by the Phase 2 central agent. HuggingFace is
     NEVER written to Remote Config (Android does not use HF).
  3. Sends a Telegram summary via the official Bot API (BotFather token +
     chat_id). CallMeBot WhatsApp remains an optional fallback if Telegram
     is unset or the send fails.

Runs monthly via GitHub Actions (schedule) and supports workflow_dispatch
for manual runs.
"""

import os
import json
import time
import urllib.parse
from pathlib import Path

import requests
import firebase_admin
from firebase_admin import credentials, firestore
import google.auth.transport.requests as google_auth_requests
from google.oauth2 import service_account

REMOTE_CONFIG_SCOPES = [
    "https://www.googleapis.com/auth/firebase.remoteconfig",
    "https://www.googleapis.com/auth/cloud-platform",
]

# Seed lists used when a catalog fetch fails, and as preferred IDs to keep
# if they are still in the live catalog. Auto-replace fills from catalogs.
GROQ_MODELS = [
    "llama-3.1-8b-instant",
    "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile",
    "openai/gpt-oss-120b",
]
OR_MODELS = [
    "openrouter/free",
    "liquid/lfm-2.5-2.6b:free",
    "nvidia/nemotron-nano-9b-v2:free",
    "google/gemma-4-26b-a4b-it:free",
    "openai/gpt-oss-20b:free",
]
# Seed for last-fallback instruct models. Prefer IDs that the Inference
# Providers router actually serves. Do not reuse the old Inference-API IDs
# that all returned dead (Mistral-7B-Instruct-v0.3, Meta-Llama-3-8B-Instruct,
# gemma-2-2b-it, zephyr-7b-beta, Qwen2.5-7B-Instruct).
HF_MODELS = [
    "google/gemma-3-4b-it",
    "google/gemma-3-12b-it",
    "google/gemma-3-27b-it",
    "aisingapore/Gemma-SEA-LION-v4-27B-IT",
    "aisingapore/Qwen-SEA-LION-v4-32B-IT",
]
GEMINI_MODELS = [
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
]

WRITE_CAP = 5
PROBE_CAP = 8
SKIP_ID_SUBSTR = (
    "embed", "whisper", "tts", "audio", "speech", "guard", "moderation",
    "rerank", "image", "vision", "transcri", "orpheus",
)

PROMPT = 'Return ONLY JSON: {"name":"Test Product","brand":"TestBrand","category":"food"}'


# ─────────────────────────────────────────────────────────────────────────
# Probes — one HTTP call per model, true/false alive.
# ─────────────────────────────────────────────────────────────────────────
def probe_groq(model):
    try:
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {os.environ['GROQ_API_KEY']}"},
            json={"model": model, "messages": [{"role": "user", "content": PROMPT}],
                  "max_tokens": 50, "temperature": 0},
            timeout=8,
        )
        return r.status_code == 200
    except requests.RequestException:
        return False


def probe_or(model):
    try:
        r = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}",
                     "HTTP-Referer": "https://shelfaware.app"},
            json={"model": model, "messages": [{"role": "user", "content": PROMPT}],
                  "max_tokens": 50},
            timeout=12,
        )
        if r.status_code != 200:
            err = ""
            try:
                err = (r.json().get("error") or {}).get("message", r.text[:120])
            except ValueError:
                err = r.text[:120]
            print(f"    OR {model}: HTTP {r.status_code} {err}")
        return r.status_code == 200
    except requests.RequestException as e:
        print(f"    OR {model}: network {e}")
        return False


def probe_hf(model):
    # Inference Providers router (replaces the old api-inference.huggingface.co path).
    url = "https://router.huggingface.co/v1/chat/completions"
    headers = {"Authorization": f"Bearer {os.environ['HF_API_TOKEN']}"}
    payload = {"model": model, "messages": [{"role": "user", "content": PROMPT}], "max_tokens": 50}
    try:
        r = requests.post(url, headers=headers, json=payload, timeout=20)
        if r.status_code == 503:
            try:
                eta = r.json().get("estimated_time", 999)
            except ValueError:
                eta = 999
            if eta < 60:
                time.sleep(min(eta + 3, 20))
                r2 = requests.post(url, headers=headers, json=payload, timeout=15)
                return r2.status_code == 200
            return False
        if r.status_code != 200:
            err = ""
            try:
                err = (r.json().get("error") or {})
                if isinstance(err, dict):
                    err = err.get("message", r.text[:120])
                else:
                    err = str(err)[:120]
            except ValueError:
                err = r.text[:120]
            print(f"    HF {model}: HTTP {r.status_code} {err}")
        return r.status_code == 200
    except requests.RequestException as e:
        print(f"    HF {model}: network {e}")
        return False


def probe_gemini(model):
    try:
        r = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            f"?key={os.environ['GEMINI_FREE_API_KEY']}",
            json={"contents": [{"parts": [{"text": PROMPT}]}],
                  "generationConfig": {"maxOutputTokens": 50}},
            timeout=10,
        )
        return r.status_code == 200
    except requests.RequestException:
        return False


def _skip_model_id(mid):
    t = (mid or "").lower()
    return any(s in t for s in SKIP_ID_SUBSTR)


def _chat_preference(mid):
    t = (mid or "").lower()
    score = 0
    if any(x in t for x in ("instruct", "-it", "chat", "versatile", "instant")):
        score -= 10
    return (score, t)


def fetch_groq_catalog():
    try:
        r = requests.get(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {os.environ['GROQ_API_KEY']}"},
            timeout=15,
        )
        r.raise_for_status()
        ids = [m.get("id") for m in r.json().get("data", []) if m.get("id")]
        ids = [i for i in ids if not _skip_model_id(i)]
        ids.sort(key=_chat_preference)
        print(f"Groq catalog: {len(ids)} chat-ish ids")
        return ids
    except Exception as e:  # noqa: BLE001
        print(f"Groq catalog fetch failed ({e}) — using seed list")
        return None


def fetch_or_catalog():
    try:
        r = requests.get(
            "https://openrouter.ai/api/v1/models",
            headers={"Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}",
                     "HTTP-Referer": "https://shelfaware.app"},
            timeout=20,
        )
        r.raise_for_status()
        ids = []
        for m in r.json().get("data", []):
            mid = m.get("id") or ""
            if not (mid.endswith(":free") or mid == "openrouter/free"):
                continue
            if _skip_model_id(mid):
                continue
            ids.append(mid)
        ids.sort(key=_chat_preference)
        print(f"OpenRouter catalog: {len(ids)} :free ids")
        return ids
    except Exception as e:  # noqa: BLE001
        print(f"OpenRouter catalog fetch failed ({e}) — using seed list")
        return None


def fetch_hf_catalog():
    """List chat/instruct models from the Inference Providers router, then Hub API."""
    token = os.environ.get("HF_API_TOKEN", "")
    headers = {"Authorization": f"Bearer {token}"}
    ids = []

    try:
        r = requests.get("https://router.huggingface.co/v1/models", headers=headers, timeout=20)
        r.raise_for_status()
        for m in r.json().get("data", []):
            mid = (m.get("id") or "").split(":")[0]
            if not mid or _skip_model_id(mid) or mid in ids:
                continue
            low = mid.lower()
            if not any(x in low for x in ("instruct", "-it", "chat")):
                continue
            if any(x in low for x in ("70b", "72b", "120b", "405b", "235b", "480b")):
                continue
            ids.append(mid)
        ids.sort(key=_chat_preference)
        print(f"HF catalog (router): {len(ids)} instruct ids")
        if ids:
            return ids
    except Exception as e:  # noqa: BLE001
        print(f"HF router catalog failed ({e})")

    try:
        r = requests.get(
            "https://huggingface.co/api/models",
            headers=headers,
            params={
                "pipeline_tag": "text-generation",
                "inference_provider": "hf-inference",
                "limit": 40,
                "sort": "downloads",
            },
            timeout=20,
        )
        r.raise_for_status()
        payload = r.json()
        for m in payload if isinstance(payload, list) else []:
            mid = m.get("id") or m.get("modelId") or ""
            if not mid or _skip_model_id(mid) or mid in ids:
                continue
            low = mid.lower()
            if not any(x in low for x in ("instruct", "-it", "chat")):
                continue
            ids.append(mid)
        print(f"HF catalog (hub): {len(ids)} instruct ids")
        return ids or None
    except Exception as e:  # noqa: BLE001
        print(f"HF catalog fetch failed ({e}) — using seed list")
        return None


def fetch_gemini_catalog():
    try:
        r = requests.get(
            "https://generativelanguage.googleapis.com/v1beta/models"
            f"?key={os.environ['GEMINI_FREE_API_KEY']}&pageSize=100",
            timeout=15,
        )
        r.raise_for_status()
        ids = []
        for m in r.json().get("models", []):
            name = (m.get("name") or "").replace("models/", "")
            methods = m.get("supportedGenerationMethods") or []
            if "generateContent" not in methods:
                continue
            low = name.lower()
            if "gemini" not in low or "flash" not in low:
                continue
            if any(x in low for x in ("embed", "tts", "image", "exp", "preview", "thinking")):
                continue
            ids.append(name)
        ids.sort(key=lambda n: (0 if "lite" in n.lower() else 1, len(n), n))
        print(f"Gemini catalog: {len(ids)} flash generateContent ids")
        return ids
    except Exception as e:  # noqa: BLE001
        print(f"Gemini catalog fetch failed ({e}) — using seed list")
        return None


def merge_candidates(previous, seed, catalog, cap=PROBE_CAP, keep_unlisted=False):
    """Keep previous + seed IDs that still appear in catalog (or all seed if no catalog), then fill.

    keep_unlisted=True: always probe previous+seed even if the catalog omit them
    (HF Hub/router listings are incomplete). Dead IDs still drop after probe.
    """
    out = []

    def add(mid):
        if mid and mid not in out:
            out.append(mid)

    if catalog is None or keep_unlisted:
        for m in list(previous) + list(seed):
            add(m)
            if len(out) >= cap:
                return out
        if catalog:
            for m in catalog:
                add(m)
                if len(out) >= cap:
                    break
        return out

    catalog_set = set(catalog)
    for m in list(previous) + list(seed):
        if m in catalog_set:
            add(m)
        if len(out) >= cap:
            return out
    for m in catalog:
        add(m)
        if len(out) >= cap:
            break
    return out


def read_previous_lists(db):
    try:
        snap = db.collection("config").document("ai_models").get()
        data = snap.to_dict() if snap.exists else {}
        return {
            "groq": [m for m in (data.get("groq") or []) if isinstance(m, str)],
            "openrouter": [m for m in (data.get("openrouter") or []) if isinstance(m, str)],
            "gemini": [m for m in (data.get("gemini_free") or []) if isinstance(m, str)],
            "hf": [m for m in (data.get("hf") or []) if isinstance(m, str)],
        }
    except Exception as e:  # noqa: BLE001
        print(f"Could not read previous Firestore lists ({e})")
        return {"groq": [], "openrouter": [], "gemini": [], "hf": []}


# ─────────────────────────────────────────────────────────────────────────
# Notification — Telegram Bot API primary, CallMeBot WhatsApp optional fallback
# ─────────────────────────────────────────────────────────────────────────
def send_telegram(message):
    """Official Bot API. Needs TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID from BotFather.

    Returns True on HTTP 200 so the caller can fall back to WhatsApp.
    """
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        print("Telegram not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID missing)")
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        resp = requests.post(
            url,
            json={"chat_id": chat_id, "text": message},
            timeout=10,
        )
        if resp.status_code == 200:
            print("Telegram notification sent")
            return True
        print(f"Telegram send returned HTTP {resp.status_code}: {resp.text[:200]}")
        return False
    except requests.RequestException as e:
        print(f"Telegram send failed: {e}")
        return False


def send_whatsapp(message):
    """Optional unofficial CallMeBot fallback. Skips if not configured."""
    phone = os.environ.get("CALLMEBOT_PHONE", "").strip()
    api_key = os.environ.get("CALLMEBOT_API_KEY", "").strip()
    if not phone or not api_key:
        print("WhatsApp fallback not configured (CALLMEBOT_PHONE / CALLMEBOT_API_KEY missing) — skipping")
        return False
    encoded = urllib.parse.quote(message)
    url = f"https://api.callmebot.com/whatsapp.php?phone={phone}&text={encoded}&apikey={api_key}"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            print("WhatsApp notification sent")
            return True
        print(f"WhatsApp send returned HTTP {resp.status_code}: {resp.text[:200]}")
        return False
    except requests.RequestException as e:
        print(f"WhatsApp send failed: {e}")
        return False


def send_alert(message):
    """Telegram first; CallMeBot only if Telegram is unset or fails."""
    if send_telegram(message):
        return
    send_whatsapp(message)


# ─────────────────────────────────────────────────────────────────────────
# Firebase writes
# ─────────────────────────────────────────────────────────────────────────
def update_remote_config(sa_info, live_groq, live_or, live_gemini_paid):
    """
    Updates the Remote Config values the shipped Android app reads directly,
    via the Remote Config REST API.

    CORRECTED vs. the original blueprint script: the blueprint called
    `remote_config.get_template()` / `remote_config.publish_template()` from
    `firebase_admin.remote_config`. As of the current firebase-admin Python
    SDK (verified against v7.5.0), that module only implements *server-side*
    template evaluation (`get_server_template` / `ServerTemplate`, for
    personalization/A-B-testing use cases) — it has no template-authoring
    API. Only the Node.js Admin SDK still exposes getTemplate()/
    publishTemplate(). So this talks to the Remote Config REST API directly
    with a short-lived OAuth2 token, the same way Firebase's own
    quickstart-python sample does: GET the template + ETag, patch the three
    parameters in place, PUT it back with `If-Match: <etag>`.

    Failures are fatal — a silent skip is what left RC drifted from Firestore.
    """
    creds = service_account.Credentials.from_service_account_info(
        sa_info, scopes=REMOTE_CONFIG_SCOPES
    )
    creds.refresh(google_auth_requests.Request())

    project_id = sa_info["project_id"]
    url = f"https://firebaseremoteconfig.googleapis.com/v1/projects/{project_id}/remoteConfig"
    headers = {"Authorization": f"Bearer {creds.token}", "Accept-Encoding": "gzip"}

    get_resp = requests.get(url, headers=headers, timeout=15)
    get_resp.raise_for_status()
    template = get_resp.json()
    # PUT rejects the GET-only `version` / `name` / `etag` fields.
    for drop in ("version", "name", "etag"):
        template.pop(drop, None)

    params = template.setdefault("parameters", {})
    params.setdefault("groq_models", {}).setdefault("defaultValue", {})["value"] = json.dumps(live_groq)
    params.setdefault("openrouter_models", {}).setdefault("defaultValue", {})["value"] = json.dumps(live_or)
    if live_gemini_paid:
        params.setdefault("gemini_paid_model", {}).setdefault("defaultValue", {})["value"] = live_gemini_paid[0]
    # Never publish HuggingFace to RC — Android does not use HF.
    for k in list(params):
        kl = k.lower()
        if kl in ("hf", "hf_models") or kl.startswith("hf_"):
            params.pop(k, None)

    etag = get_resp.headers.get("ETag") or "*"
    put_headers = {**headers, "Content-Type": "application/json; UTF-8", "If-Match": etag}
    put_resp = requests.put(url, headers=put_headers, json=template, timeout=15)
    if put_resp.status_code in (409, 412):
        put_headers["If-Match"] = "*"
        put_resp = requests.put(url, headers=put_headers, json=template, timeout=15)
    if not put_resp.ok:
        raise RuntimeError(
            f"RC PUT failed HTTP {put_resp.status_code}: {put_resp.text[:400]} "
            f"(needs Firebase Remote Config Admin on the service account)"
        )
    print("Firebase Remote Config updated")


def update_firestore_model_config(db, live):
    """
    GAP FIX vs the original blueprint: the central agent's
    lib/load-live-models.js reads Firestore /config/ai_models, but nothing
    in the original script ever wrote that doc — only Remote Config was
    updated, which the Node.js agent never reads. This mirrors the same
    live-model snapshot into Firestore so both consumers (Android app via
    RC, central agent via Firestore) stay in sync from one source of truth.
    """
    db.collection("config").document("ai_models").set(
        {
            "groq": live["groq"],
            "openrouter": live["openrouter"],
            "gemini_free": live["gemini"],
            "gemini_paid": live["gemini"],
            "hf": live["hf"],
            "updated_at": int(time.time() * 1000),
        },
        merge=True,
    )
    print("Firestore /config/ai_models updated (Groq/OR/Gemini + hf; hf not written to RC)")


def verify_rc_firestore_match(sa_info, db, live):
    """Read back RC + Firestore and print whether the live lists agree."""
    snap = db.collection("config").document("ai_models").get()
    fs = snap.to_dict() if snap.exists else {}
    creds = service_account.Credentials.from_service_account_info(
        sa_info, scopes=REMOTE_CONFIG_SCOPES
    )
    creds.refresh(google_auth_requests.Request())
    project_id = sa_info["project_id"]
    url = f"https://firebaseremoteconfig.googleapis.com/v1/projects/{project_id}/remoteConfig"
    headers = {"Authorization": f"Bearer {creds.token}", "Accept-Encoding": "gzip"}
    rc = requests.get(url, headers=headers, timeout=15)
    rc.raise_for_status()
    params = rc.json().get("parameters", {})

    def rc_val(key):
        return (params.get(key) or {}).get("defaultValue", {}).get("value")

    groq_rc = json.loads(rc_val("groq_models") or "[]")
    or_rc = json.loads(rc_val("openrouter_models") or "[]")
    gemini_rc = rc_val("gemini_paid_model") or ""

    print("verify Firestore groq:", fs.get("groq"))
    print("verify RC groq_models:", groq_rc)
    print("verify Firestore openrouter:", fs.get("openrouter"))
    print("verify RC openrouter_models:", or_rc)
    print("verify Firestore gemini_free:", fs.get("gemini_free"))
    print("verify RC gemini_paid_model:", gemini_rc)
    print("verify Firestore hf:", fs.get("hf"))
    hf_rc_keys = [k for k in params if k.lower() in ("hf", "hf_models") or k.lower().startswith("hf_")]
    if hf_rc_keys:
        raise RuntimeError(f"Remote Config still has HF params (must not): {hf_rc_keys}")
    print("verify RC has no HF params")

    groq_ok = groq_rc == fs.get("groq") == live["groq"]
    or_ok = or_rc == fs.get("openrouter") == live["openrouter"]
    gemini_ok = (not live["gemini"]) or (gemini_rc == live["gemini"][0] and fs.get("gemini_free") == live["gemini"])
    hf_ok = fs.get("hf") == live["hf"]
    if groq_ok and or_ok and gemini_ok and hf_ok:
        print("RC and Firestore MATCH (Groq/OR/Gemini on both; hf Firestore-only)")
    else:
        raise RuntimeError("RC and Firestore still disagree after write")


# ─────────────────────────────────────────────────────────────────────────
# Credentials
# ─────────────────────────────────────────────────────────────────────────
def load_service_account_info():
    """FIREBASE_SERVICE_ACCOUNT_JSON may be raw JSON or a path to a JSON file."""
    raw = (os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON") or "").strip().strip('"').strip("'")
    if not raw:
        raise SystemExit(
            "FIREBASE_SERVICE_ACCOUNT_JSON is missing. "
            "Set it to ./service-account.json (local) or paste the JSON (GitHub secret)."
        )
    if raw.startswith("{"):
        return json.loads(raw)

    path = Path(raw)
    if not path.is_file():
        alt = Path(__file__).resolve().parent.parent / raw
        if alt.is_file():
            path = alt
        else:
            raise SystemExit(f"FIREBASE_SERVICE_ACCOUNT_JSON path not found: {raw}")
    return json.loads(path.read_text(encoding="utf-8"))


# ─────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────
def main():
    print("=== Monthly AI Model Health Check ===")

    sa_info = load_service_account_info()
    if not firebase_admin._apps:
        firebase_admin.initialize_app(credentials.Certificate(sa_info))
    db = firestore.client()
    previous = read_previous_lists(db)

    groq_catalog = fetch_groq_catalog()
    or_catalog = fetch_or_catalog()
    gemini_catalog = fetch_gemini_catalog()
    hf_catalog = fetch_hf_catalog()

    groq_probe = merge_candidates(previous["groq"], GROQ_MODELS, groq_catalog)
    or_probe = merge_candidates(previous["openrouter"], OR_MODELS, or_catalog)
    gemini_probe = merge_candidates(previous["gemini"], GEMINI_MODELS, gemini_catalog)
    hf_probe = merge_candidates(previous["hf"], HF_MODELS, hf_catalog, keep_unlisted=True)
    print(f"probe groq ({len(groq_probe)}): {groq_probe}")
    print(f"probe openrouter ({len(or_probe)}): {or_probe}")
    print(f"probe gemini ({len(gemini_probe)}): {gemini_probe}")
    print(f"probe hf ({len(hf_probe)}): {hf_probe}")

    results = {
        "groq":       {m: probe_groq(m)   for m in groq_probe},
        "openrouter": {m: probe_or(m)     for m in or_probe},
        "hf":         {m: probe_hf(m)     for m in hf_probe},
        "gemini":     {m: probe_gemini(m) for m in gemini_probe},
    }

    live_hf_n = sum(1 for ok in results["hf"].values() if ok)
    extra = 0
    if hf_catalog and live_hf_n < WRITE_CAP:
        for m in hf_catalog:
            if m in results["hf"]:
                continue
            ok = probe_hf(m)
            results["hf"][m] = ok
            extra += 1
            if ok:
                live_hf_n += 1
            if live_hf_n >= WRITE_CAP or extra >= PROBE_CAP:
                break
        if extra:
            print(f"HF catalog top-up probed {extra} extra ids")

    for provider, models in results.items():
        for model, alive in models.items():
            print(f"  [{provider}] {model}: {'alive' if alive else 'dead'}")

    live = {k: [m for m, ok in v.items() if ok][:WRITE_CAP] for k, v in results.items()}

    dropped = {
        "groq": [m for m in previous["groq"] if m not in live["groq"]],
        "openrouter": [m for m in previous["openrouter"] if m not in live["openrouter"]],
        "gemini": [m for m in previous["gemini"] if m not in live["gemini"]],
        "hf": [m for m in previous["hf"] if m not in live["hf"]],
    }
    added = {
        "groq": [m for m in live["groq"] if m not in previous["groq"]],
        "openrouter": [m for m in live["openrouter"] if m not in previous["openrouter"]],
        "gemini": [m for m in live["gemini"] if m not in previous["gemini"]],
        "hf": [m for m in live["hf"] if m not in previous["hf"]],
    }

    update_remote_config(sa_info, live["groq"], live["openrouter"], live["gemini"])
    update_firestore_model_config(db, live)
    verify_rc_firestore_match(sa_info, db, live)

    gemini_paid_model = live["gemini"][0] if live["gemini"] else "gemini-2.0-flash"
    msg = "🤖 ShelfAware Monthly Model Check\n\n"
    msg += f"RC groq_models → {json.dumps(live['groq'])}\n"
    msg += f"RC openrouter_models → {json.dumps(live['openrouter'])}\n"
    msg += f"RC gemini_paid_model → {gemini_paid_model}\n"
    msg += f"Firestore hf → {json.dumps(live['hf'])}\n\n"
    msg += f"✅ Live: Groq={len(live['groq'])}, OR={len(live['openrouter'])}, HF={len(live['hf'])}, Gemini={len(live['gemini'])}\n"

    any_swap = any(dropped[k] or added[k] for k in ("groq", "openrouter", "gemini", "hf"))
    if any_swap:
        msg += "\n🔄 Auto-replaced from provider catalogs:\n"
        for k in ("groq", "openrouter", "gemini", "hf"):
            if dropped[k]:
                msg += f"  − dropped {k}: {', '.join(dropped[k])}\n"
            if added[k]:
                msg += f"  + added {k}: {', '.join(added[k])}\n"
        msg += "RC updated (Groq/OR/Gemini only). Firestore updated (incl. hf).\n"

    if not live["hf"]:
        msg += "⚠️ HuggingFace all dead this run — Firestore hf=[] ; agents use hardcoded fallback.\n"

    if not live["groq"] or not live["openrouter"] or not live["gemini"]:
        empty = [k for k in ("groq", "openrouter", "gemini") if not live[k]]
        msg += f"⚠️ Catalog+probe left empty: {', '.join(empty)}. Check API keys.\n"
    elif not any_swap:
        msg += "🎉 All tracked models healthy. Auto-refresh found nothing to replace."

    if os.environ.get("SKIP_ALERTS", "").strip().lower() in ("1", "true", "yes"):
        print("SKIP_ALERTS set — not sending Telegram")
    else:
        send_alert(msg)

    print(f"\nDone | groq={len(live['groq'])} | OR={len(live['openrouter'])} "
          f"| HF={len(live['hf'])} | gemini={len(live['gemini'])}")
    print("dropped", dropped)
    print("added", added)

    if not live["groq"]:
        print("ALERT: ALL Groq models dead!")
    if len(live["openrouter"]) < 2:
        print("WARNING: < 2 OpenRouter models alive!")
    if not live["gemini"]:
        print("ALERT: ALL Gemini models dead! gemini_paid_model was NOT updated this run.")
    if not live["hf"]:
        print("ALERT: ALL HuggingFace models dead — Firestore hf=[] ; agents use hardcoded fallback")


if __name__ == "__main__":
    main()
