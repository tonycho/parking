# parking

ParkSmart parking map with Supabase, optional scheduled SMS via RingCentral, and **local or Vercel** `/api` handlers.

## Environment variables

### Vite (client — `.env.local`)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_PROXY_TARGET` (optional) — where Vite should proxy `/api` in dev; default `http://127.0.0.1:3000` (`npm run dev:api`).

Copy **[`.env.example`](.env.example)** to `.env.local` and fill in values. The **service_role** key is only for server-side `/api` routes; it must not ship to the client.

### Server (`.env.local` for local API; same vars on Vercel when you deploy)

- `SUPABASE_URL` — same project URL as above (Vercel server does not read `VITE_*` unless you duplicate it).
- `SUPABASE_ANON_KEY` — anon key (for `auth.getUser` in API routes).
- `SUPABASE_SERVICE_ROLE_KEY` — **secret**; used only in `/api/*` for cron, RingCentral token cache, SMS dispatch, and previews.
- `RINGCENTRAL_CLIENT_ID`, `RINGCENTRAL_CLIENT_SECRET`, `RINGCENTRAL_SERVER_URL` — e.g. `https://platform.ringcentral.com`, from a RingCentral app whose auth mode is **JWT** (see RingCentral section below).
- `RINGCENTRAL_JWT` — the **JWT credential** string from RingCentral Developer Console → your profile → **Credentials** → **Create JWT** (paste the full token, usually starting with `eyJ`). Used server-side only; never expose to the browser. **Aliases:** `RINGCENTRAL_USER_JWT` or `RC_USER_JWT` if you prefer. These must live in **`.env.local`** (or Vercel env) with the other **non-`VITE_`** keys — variables prefixed with `VITE_` are not available to the local API process.
- `RINGCENTRAL_SMS_FROM_NUMBER` — E.164 sender (e.g. `+15551234567`). Required for test SMS, send-reminder, and scheduled notification sends (the app reads it from server env only).
- `CRON_SECRET` — random string; used as `Authorization: Bearer <CRON_SECRET>` for scheduled job calls (`/api/notifications/run`, Vercel cron, etc.).

Twilio is not used.

## Database

Apply new migrations (includes `notification_settings`, `notification_job_logs`, `ringcentral_token`):

```bash
npx supabase db push
# or apply the SQL file in the Supabase SQL editor
```

## Local development (no Vercel account required)

Vite does not run `/api/*` itself. **`vite.config.ts` proxies `/api` → `http://127.0.0.1:3000`**, where this repo’s **local Express server** runs the same files as production Vercel functions.

**Default — API + Vite together:**

```bash
npm run dev
```

This runs the local API on **3000** and Vite (e.g. **5173**) in one process.

**Vite only** (no `/api` — you will see proxy `ECONNREFUSED` if the UI calls APIs):

```bash
npm run dev:vite
```

**API only** (e.g. debugging):

```bash
npm run dev:api
```

Put all **server** variables in **`.env.local`** next to the `VITE_*` keys (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RINGCENTRAL_JWT`, `CRON_SECRET`, etc.).

If the API listens on another port, set **`PORT`** when starting the API and **`VITE_API_PROXY_TARGET`** in `.env.local` to the same origin.

### Later: deploy to Vercel

The **`api/`** folder holds **only route entry files** (one Serverless Function per file on Vercel). Shared handler code lives in **`lib/vercel-api/`** so it does not count toward the Hobby plan function limit. When you are ready:

1. Create a Vercel project linked to this repo.
2. Copy the same environment variables from `.env.local` into the Vercel project settings (including `RINGCENTRAL_JWT` and RingCentral client credentials).
3. Deploy; optional: add `vercel.json` cron for `GET /api/notifications/cron-run` if your plan supports it.

You do **not** need `vercel dev` for daily work if you use **`npm run dev`** (starts API + Vite).

## Scheduling (production)

1. **Vercel Cron** (Pro and compatible schedules): add `vercel.json` with a `crons` entry pointing to **`GET /api/notifications/cron-run`**. Vercel sends `Authorization: Bearer $CRON_SECRET` when `CRON_SECRET` is defined in the project.
2. **Vercel Hobby**: cron frequency is limited; prefer an external scheduler (e.g. cron-job.org) hitting **`POST /api/notifications/run`** with header `Authorization: Bearer <CRON_SECRET>` and body `{}` every few minutes (dispatcher checks schedule windows).
3. **Custom cron expressions** in settings use **six fields** (`sec min hour day month weekday`) in **UTC**, per `cron-parser` (e.g. Sunday 10:45 UTC: `0 45 10 * * 0`).

Example external cron (every 5 minutes) calling the same logic as Vercel cron:

```bash
curl -sS -X POST "https://<your-deployment>/api/notifications/run" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Add a `vercel.json` `crons` entry for `GET /api/notifications/cron-run` if your Vercel plan allows the schedule you need; set `CRON_SECRET` in the project so the bearer token is sent.

## Troubleshooting: `{"error":"Unauthorized"}` on `/api/*`

Protected routes (`/api/ringcentral/status`, test SMS, send reminder, etc.) require a **valid Supabase access token** in `Authorization: Bearer …`.

1. **Sign in** on the app first (session drives `apiFetch`).
2. In **`.env.local`**, set **`SUPABASE_URL`** and **`SUPABASE_ANON_KEY`** to the **same project** as `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. If the server uses different keys than the browser, JWT validation fails and you get `Unauthorized`.
3. **Expired session**: refresh the page or sign out and sign in again.
4. Watch the **terminal running `npm run dev`** (API process): lines prefixed with `[auth]` explain the failure (missing header vs `getUser` error).

## RingCentral (JWT)

1. In **[RingCentral Developer Portal](https://developers.ringcentral.com/)** → **Apps** → **Create App** → **REST API App** → under **Authentication** choose **JWT auth flow**. Enable permissions such as **ReadAccounts** and **SMS**.
2. Copy the app’s **Client ID** and **Client Secret** into **`RINGCENTRAL_CLIENT_ID`** / **`RINGCENTRAL_CLIENT_SECRET`**.
3. Under your profile → **Credentials** → **Create JWT**, restrict the credential to this app if prompted, then copy the JWT string into **`RINGCENTRAL_JWT`** (server env only).
4. Restart **`npm run dev`** (or redeploy). Open **Notification Settings** and use **Validate connection** or **Send test SMS**; the API exchanges the JWT for access/refresh tokens and caches them in **`ringcentral_token`** (service role).

If **Validate** or status calls show **Unauthorized**, the browser session must be valid and **`SUPABASE_URL`** + **`SUPABASE_ANON_KEY`** on the server must match the same project as **`VITE_*`**. Restart the API after editing **`.env.local`**.

### ReadAccounts permission error

ParkSmart’s **Validate connection** call uses `GET /restapi/v1.0/account/~/extension/~`, which requires **ReadAccounts** on the RingCentral app (in addition to **SMS** for sending).

1. Open **[RingCentral Developer Portal](https://developers.ringcentral.com/)** → **Apps** → select your **JWT** app (same **Client ID** as in `.env.local`).
2. Under **Settings** (wording varies), open **Application permissions**, **API permissions**, or **Scopes**, and enable at least **ReadAccounts** and **SMS**.
3. **Save** the app, wait a minute if the portal says propagation is needed, restart **`npm run dev`**, then **Validate connection** again.

The JWT credential must be allowed to use this app (when you created the JWT, you may have restricted it to specific apps—ensure this app is listed).

### “Phone number doesn’t belong to extension”

SMS is sent **as** the RingCentral user tied to your JWT. The **from** number in **`RINGCENTRAL_SMS_FROM_NUMBER`** must be a number **assigned to that same user/extension** in RingCentral (SMS-capable company or direct line).

1. RingCentral **Admin Portal** → **Users** → select the user that owns your JWT credential → **Phone numbers** (or **Numbers**).
2. Copy a number that supports **SMS** and appears on that user (E.164 with `+1…`).
3. Put it in **`.env.local`** as **`RINGCENTRAL_SMS_FROM_NUMBER`** (used for test SMS, send-reminder, and scheduled sends). Restart the API after changing env.

Using a main company number that is only on a **different** extension, or a number from another carrier not on the account, triggers this error.

### API shows 200 but the phone never gets the SMS

RingCentral returning **HTTP 200** only means the send request was accepted (often **`messageStatus`: `Queued`**). Delivery to the handset depends on carriers, spam filters, and US **10DLC / A2P** rules for many local numbers.

1. **RingCentral Admin** → **Message Store** (or **Analytics** → message logs): open the outbound SMS and read the final status (**Delivered**, **DeliveryFailed**, **SendingFailed**) and any carrier error text.
2. Confirm **To** is a normal **mobile** SMS number (E.164 `+1…`), not a landline or a line that blocks unknown senders.
3. For production US SMS from local numbers, complete RingCentral’s **SMS / 10DLC brand and campaign** registration if your account requires it.

ParkSmart’s test SMS response includes **`messageStatus`** and **`id`** so you can match rows in Message Store.

## Recipient data

Active parkers are in `vehicle_parking_spot` with `phone_number`. Spots are `parking_spots.label`; the job matches `label LIKE '<prefix>%'`.
