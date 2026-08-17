# Play Store Data Safety Form — Lawyer Diary BD

## Data collected and why

| Data type         | Collected? | Shared? | Purpose        | Encrypted? |
|-------------------|------------|---------|----------------|------------|
| Name              | Yes        | No      | User profile   | Yes (TLS)  |
| Phone number      | Yes        | No      | Login (OTP)    | Yes (TLS)  |
| Case information  | Yes        | No      | Core function  | Yes (AES)  |
| Client data       | Yes        | No      | Core function  | Yes (AES)  |
| Documents (PDF)   | Yes        | No      | Document vault | Yes (S3 SSE)|
| Device ID         | Yes        | No      | Multi-device   | Yes (TLS)  |
| Crash logs        | No         | —       | —              | —          |
| Ad tracking       | No         | —       | —              | —          |

## Key declarations

- **No data sold to third parties** — ever.
- **No advertising** — the app has no ad SDK.
- **User can delete all data** — Settings → Delete Account → wipes server + local DB.
- **Data can be exported** — Settings → Export My Data → JSON.
- **Data encrypted in transit** — TLS 1.3.
- **Data encrypted at rest** — local SQLite with SQLCipher; server S3 with SSE-S3.

## Permissions declared

| Permission              | Why                                   |
|-------------------------|---------------------------------------|
| INTERNET                | Sync with server                      |
| CAMERA                  | ML Kit document scanner               |
| POST_NOTIFICATIONS      | Daily cause list + deadline alerts    |
| USE_BIOMETRIC           | Optional app lock                     |
| RECEIVE_BOOT_COMPLETED  | Reschedule notifications after reboot |
