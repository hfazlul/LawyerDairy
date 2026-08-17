# Email setup (Brevo + Resend)

Lawyer Diary BD sends mail through **Brevo** (primary, campaigns/batch) and **Resend** (fallback / transactional). The webapp may later run on a VPS on the same domain — **do not** run Postfix or any mail server on that VPS. Delivery uses provider APIs + DNS (SPF/DKIM) at Brevo and Resend.

## 1. Buy a domain

Example: `lawyerdiarybd.com` (any registrar). You will use it for:

- Web: A/AAAA or CNAME → VPS (later)
- Mail: DNS records from Brevo + Resend (now)

## 2. Create provider accounts

1. [Brevo](https://www.brevo.com/) — create API key (SMTP & API → API keys)
2. [Resend](https://resend.com/) — create API key

## 3. Verify domain DNS (SPF + DKIM)

In each provider’s domain section, add the TXT/CNAME records they show for `lawyerdiarybd.com` (or your domain).

Typical records (exact values come from each dashboard):

- SPF / Brevo send auth
- DKIM CNAMEs (Brevo and Resend each have their own)
- Optional DMARC (`_dmarc`) once SPF/DKIM are solid

Wait until both dashboards show the domain as **verified**. You do **not** point MX at your VPS for outbound app mail.

## 4. Env configuration

Copy `.env.example` → `.env` and set:

```env
MAIL_DOMAIN="lawyerdiarybd.com"
EMAIL_PROVIDER="auto"
EMAIL_PRIMARY="brevo"
EMAIL_FALLBACK="resend"
BREVO_API_KEY="..."
RESEND_API_KEY="..."
MAIL_FROM_DEALS="Lawyer Diary BD <deals@lawyerdiarybd.com>"
MAIL_FROM_NOREPLY="Lawyer Diary BD <noreply@lawyerdiarybd.com>"
MAIL_FROM_SUPPORT="Lawyer Diary BD <support@lawyerdiarybd.com>"
MAIL_DAILY_LIMIT="300"
```

| Variable | Meaning |
|----------|---------|
| `EMAIL_PROVIDER` | `auto` (try primary→fallback), or force `brevo` / `resend` |
| `EMAIL_PRIMARY` | Default `brevo` — used for campaigns |
| `EMAIL_FALLBACK` | Default `resend` — used if primary fails |
| `MAIL_DAILY_LIMIT` | Soft in-memory daily cap (Brevo free-tier awareness) |

## 5. Local dry-run (no keys)

Leave `BREVO_API_KEY` and `RESEND_API_KEY` empty. Admin **Send campaign** still succeeds with `dryRun: true` and logs:

```text
[email:dry-run] { to, subject, from, ... }
```

No external API is called.

## 6. Production send

1. Domain verified on Brevo + Resend
2. Keys set in production env
3. Admin → campaign panel → choose template (subscription / coupons / deals / custom)
4. Confirm response is not `dryRun`

Campaigns use **deals@**. Transactional helpers should pass `from: 'noreply'` or `'support'` via `sendEmail`.

## 7. Code map

- `src/lib/mail/` — provider abstraction
- `POST /api/admin/campaigns/send` — admin-only, zod-validated, rate-limited

## Security notes

- Never expose API keys to the browser
- Campaign route requires `ADMIN` role
- Rate limit: 5 campaign posts / admin / IP / minute
- Soft daily limit refuses oversized live batches; dry-run still works without keys
