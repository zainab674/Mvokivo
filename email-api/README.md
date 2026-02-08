# Email API (Vercel)

This is a small serverless email API deployed on **Vercel**. It is used when the main application runs on a host that blocks SMTP/IMAP (e.g. DigitalOcean) so that sending, fetching, and appending emails are handled by this service.

## How it works

- The **main app** (e.g. on DigitalOcean) sends HTTP requests to this API with SMTP/IMAP credentials and payloads.
- This API runs on Vercel and uses **nodemailer** (send, append) and **imap-simple** + **mailparser** (fetch).
- Email page threads and assistant auto-replies all go through this API when `EMAIL_API_URL` is set: the main app calls **check-emails** for sync, **send** for outbound (including assistant replies), and **append-sent** to mirror sent messages into the Sent folder.

## Deploy on Vercel

1. Install dependencies (from repo root or from `email-api`):
   ```bash
   cd email-api && npm install
   ```

2. Deploy:
   - Link the `email-api` folder to a Vercel project, or
   - From the repo root, deploy with Vercel and set the root to `email-api`, or
   - Push to Git and in Vercel dashboard set **Root Directory** to `email-api`.

3. Set environment variable in Vercel (optional but recommended):
   - `EMAIL_API_SECRET` – shared secret. Set the same value as `EMAIL_API_SECRET` on your main app so only your app can call this API.

4. Copy the deployment URL (e.g. `https://your-email-api.vercel.app`) and set it on your main app as `EMAIL_API_URL`. Set `EMAIL_API_SECRET` on the main app to match.

## API

All endpoints accept optional auth: `Authorization: Bearer <EMAIL_API_SECRET>` or `X-API-Key: <EMAIL_API_SECRET>`.

### POST /api/send

Send one email via SMTP.

- **Body:** `smtp`: `{ host, port?, user, pass }`, `from`, `to`, `subject`, `text`, `html?`, `headers?`, `attachments?`: `[{ filename, contentBase64 }]`
- **Response:** `{ success, messageId?, accepted?, rejected?, message? }`

### POST /api/check-emails

Fetch emails via IMAP (INBOX + SENT, last 7 days). Used by the email page sync and the worker that triggers assistant replies.

- **Body:** `imap`: `{ user, password, host?, port? }`
- **Response:** `{ success, emails: [{ folder, from, to, subject, text, html, messageId, inReplyTo, references, date }], message? }`

### POST /api/append-sent

Append a sent message to the IMAP Sent folder (best effort after sending).

- **Body:** `imap`: `{ user, password, host?, port? }`, `from`, `to`, `subject`, `text?`, `html?`, `headers?`
- **Response:** `{ success, message? }`
