# Consisly Database Design

## Ownership Tree

```txt
User
├── Habits
│   └── HabitCompletions
├── DailyUserStats
├── Badges
└── User profile fields
```

Each private document stores `user: ObjectId`. Controllers never accept a user id from the client. They always use `req.user._id` from the JWT middleware.

## Collections

### users

Stores login identity and user-level score.

```js
{
  _id,
  email,
  password,
  consistencyScore,
  createdAt,
  updatedAt
}
```

### habits

Stores one habit owned by one user.

```js
{
  _id,
  user,
  name,
  description,
  icon,
  color,
  frequency, // daily | weekly
  status,    // active | archived
  createdAt,
  updatedAt
}
```

Privacy query shape:

```js
Habit.findOne({ _id: habitId, user: req.user._id })
```

### habitcompletions

Stores one completion event for one habit on one UTC day.

```js
{
  _id,
  user,
  habit,
  date,
  completedAt,
  source
}
```

Unique privacy and duplicate-protection index:

```js
{ user: 1, habit: 1, date: 1 }, unique: true
```

### badges

Stores badges unlocked by one user.

```js
{
  _id,
  user,
  badgeKey,
  title,
  description,
  unlockedAt,
  createdAt,
  updatedAt
}
```

Duplicate-protection index:

```js
{ user: 1, badgeKey: 1 }, unique: true
```

### dailyuserstats

Stores precomputed daily analytics so the app can load charts without scanning all completion rows forever.

```js
{
  _id,
  user,
  date,
  totalHabits,
  completed,
  completionRate,
  createdAt,
  updatedAt
}
```

Analytics index:

```js
{ user: 1, date: 1 }, unique: true
```

## API Privacy Rules

- `GET /api/habits` returns only habits where `user` is the logged-in user.
- `GET /api/habits?limit=20&cursor=...` returns cursor-paginated habits for large accounts.
- `PUT /api/habits/:id` updates only `{ _id, user }`.
- `DELETE /api/habits/:id` deletes only `{ _id, user }` and that user's completion rows.
- `POST /api/habits/:id/checkin` creates one completion for the logged-in user.
- `DELETE /api/habits/:id/checkin` removes one completion for the logged-in user.
- `GET /api/habits/analytics?days=7` returns real daily completion counts for the logged-in user.
- Stats and badges count only documents with `user: req.user._id`.
- `/ready` returns 200 only when MongoDB is connected.

## Lightweight API Testing

The backend uses Node's built-in test runner, so no extra test framework package is required.

Run against a safe test database only:

```sh
TEST_DATABASE_URL="mongodb://127.0.0.1:27017/consisly_test" npm run test:api
```

The API test starts the Express app on a random local port, creates temporary users/habits, checks privacy, verifies duplicate check-ins, verifies real analytics, and drops the test database after it finishes.

## Scaling Operations

See `SCALING_RUNBOOK.md` for production scaling notes:

- API gateway rate limiting
- Atlas backups and alerts
- request monitoring with `X-Request-Id`
- daily analytics stat rebuilds
- mobile pagination behavior
