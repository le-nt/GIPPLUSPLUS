# GIP++ (Unofficial) counter server

Part of GIP++, an unofficial client mod that is not affiliated with Yapper Media LLC.

Free-tier Cloudflare Worker + D1. Run these in this folder:

1. `npx wrangler login`
2. `npx wrangler d1 create gip-counter` and copy the `database_id` into `wrangler.toml`
3. `npx wrangler d1 execute gip-counter --remote --file=schema.sql`
4. `npx wrangler deploy` (prints `https://gip-counter.<you>.workers.dev`)
5. Put that URL in `package.json` under `"gip": { "counterUrl": "..." }`, then push/update the client.

Endpoints: `POST /ping {"id": "<uuid>"}` registers an install and returns `{total, active}`; `GET /count` returns the same.
`active` = installs seen in the last 30 days. Only a random UUID and timestamps are stored.
