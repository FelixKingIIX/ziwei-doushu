# DeepSeek AI backend deployment (Cloudflare Workers)

GitHub Pages hosts only the chart UI. AI calls go to a separate Worker. The public site never contains your DeepSeek API key.

## Prerequisites
- A Cloudflare account (Workers available).
- A DeepSeek API key with available balance.
- A long random access token for site users; use a separate token, **not** the DeepSeek key.

## Install & publish
1. On your computer, clone this repository and open the project root.
2. Run `npx wrangler login` and then `npx wrangler deploy --config worker/wrangler.toml`.
3. Run:
   ```sh
   npx wrangler secret put DEEPSEEK_API_KEY --config worker/wrangler.toml
   npx wrangler secret put ACCESS_TOKEN --config worker/wrangler.toml
   ```
4. After secrets are set, access `https://<your-worker>.workers.dev/health`. It should return `{"ok":true}`.
5. Reload the GitHub Pages chart. At the first AI interpretation request, enter the Worker HTTPS origin and ACCESS_TOKEN. They are stored only in the current browser tab's session storage.
6. After that, the chart's 命格/感情/事业/财运/健康/性格 views and 合盘 call DeepSeek.

## Security / limitations
- Never put `DEEPSEEK_API_KEY` in GitHub public files, browser prompts, or GitHub Pages variables.
- An access token is **not** a per-user login. Share it only with trusted users. Rotate it if leaked.
- GitHub Pages is public. Consider per-user authentication, rate limits and a spending cap if launching a public service.
- The Worker enforces an Origin check for browser requests, but Origin alone is not authentication.
- Birth details and chart data are sent to the Worker and then DeepSeek for processing. Get consent before entering someone else's data.
- This implementation is a small personal deployment, not a hardened public subscription product.
- The results are traditional cultural interpretations, not scientifically validated predictions or medical/financial advice.

## Troubleshooting
- 401: ACCESS_TOKEN is incorrect. Reload the page or clear session storage token and try again.
- 403: Worker ALLOWED_ORIGIN does not match `https://felixkingiix.github.io`.
- 502: Check DeepSeek key, billing, API connectivity and logs.
- 503: Required Worker secrets are missing.
- Network error: confirm the Worker URL, deployment and browser developer console.

The sample Worker config file is in `worker/wrangler.toml`; code is in `worker/src/index.js`. Do not commit a plaintext key.
