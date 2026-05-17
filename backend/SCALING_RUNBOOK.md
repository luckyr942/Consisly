# Consisly Scaling Runbook

## Already Implemented

- Cursor pagination: `GET /api/habits?limit=20&cursor=...`
- Daily analytics summaries in `dailyuserstats`
- Readiness check: `GET /ready`
- Request IDs on every response: `X-Request-Id`
- Lightweight daily stat rebuild script

## Rate Limiting

The app still includes a small in-memory limiter for single-instance deployments.

For multi-instance production, use a hosting/API gateway limiter instead and disable the app limiter:

```txt
RATE_LIMIT_ENABLED=false
```

Good options:

- Cloudflare WAF/rate limiting
- Render/NGINX gateway limits
- Redis-backed limiter if you later add Redis

Do not rely on the in-memory limiter when running multiple backend instances, because each instance has its own memory.

## MongoDB Atlas Backups And Alerts

Enable these in Atlas before public launch:

- Daily snapshots
- Point-in-time recovery if available on your cluster tier
- Alerts for high connections
- Alerts for high CPU
- Alerts for low disk space
- Alerts for replication lag

Suggested minimum production cluster: Atlas M10 once real users arrive.

## Request Monitoring

The API now returns `X-Request-Id`. When a user reports an issue, log this ID so backend logs can be searched quickly.

Later, add an external monitor:

- Sentry for exceptions
- Better Stack, Datadog, or your host logs for request metrics
- UptimeRobot or Better Stack uptime checks against `/ready`

## Background Maintenance

Rebuild daily analytics summaries without adding a queue package:

```sh
npm run stats:rebuild -- --days=365
```

For one user:

```sh
npm run stats:rebuild -- --user=<mongo_user_id> --days=365
```

When traffic grows, run this as a scheduled job from your host once per day. If it becomes slow, move it to a real queue worker.

## Mobile Pagination

The mobile dashboard and habits screen now fetch limited pages instead of every habit forever.

- Dashboard first page: 10 habits
- Habits tab first page: 20 habits
- Users can load more when `pageInfo.hasNextPage` is true
