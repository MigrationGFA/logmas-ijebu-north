# LOGMAS Frontend: Environment Variables

This frontend is hosted on **Vercel**. Set these variables in
**Vercel > Project > Settings > Environment Variables** for the Production
(and Preview, if used) environments, then **redeploy**: `NEXT_PUBLIC_`
variables are baked into the build, so a change only takes effect after a
new deployment. `NODE_ENV` is managed by Vercel; do not set it yourself.

This file lists variable NAMES and what they are for only. Never commit real
secret values to this repository.

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | **Required.** Full base URL of this LGA's backend API on cPanel, ending with `/api/v1` (for example `https://<this-lga-api-domain>/api/v1`). Every API call the site makes goes here. |
| `NEXT_PUBLIC_BASE_URL` | This frontend's own public URL (its Vercel/custom domain), used for absolute links and callbacks. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google sign-in client id. Must be the same Google project as the backend's `GOOGLE_CLIENT_ID`. |
| `NEXT_PUBLIC_PAYMENT_PROVIDER` | Which checkout the payment screens lead with: `gpay` or `paystack`. |
