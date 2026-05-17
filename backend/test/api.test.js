import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_for_api_tests_only';
process.env.RATE_LIMIT_MAX = '10000';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const shouldRun = Boolean(testDatabaseUrl);

let app;
let server;
let baseUrl;

const request = async (path, options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
            ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : {};

    return { response, body };
};

const registerUser = async (suffix) => {
    const { response, body } = await request('/api/users/register', {
        method: 'POST',
        body: {
            email: `api-${Date.now()}-${suffix}@consisly.test`,
            password: 'password123'
        }
    });

    assert.equal(response.status, 201);
    assert.ok(body.token);

    return body;
};

before(async () => {
    if (!shouldRun) return;

    await mongoose.connect(testDatabaseUrl, {
        serverSelectionTimeoutMS: 5000
    });
    await mongoose.connection.dropDatabase();

    ({ default: app } = await import('../src/app.js'));
    server = app.listen(0);

    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    }

    if (server) {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('habit API keeps user data private and powers analytics', { skip: !shouldRun }, async () => {
    const userA = await registerUser('a');
    const userB = await registerUser('b');

    const ready = await request('/ready');
    assert.equal(ready.response.status, 200);
    assert.equal(ready.body.database, 'connected');

    const created = await request('/api/habits', {
        method: 'POST',
        token: userA.token,
        body: {
            name: 'Read',
            icon: '📖',
            frequency: 'daily'
        }
    });

    assert.equal(created.response.status, 201);
    assert.equal(created.body.habit.name, 'Read');
    assert.equal(created.body.habit.icon, '📖');

    const habitId = created.body.habit._id;

    const hiddenFromOtherUser = await request('/api/habits', {
        token: userB.token
    });

    assert.equal(hiddenFromOtherUser.response.status, 200);
    assert.deepEqual(hiddenFromOtherUser.body, []);

    const paginated = await request('/api/habits?limit=1', {
        token: userA.token
    });

    assert.equal(paginated.response.status, 200);
    assert.equal(paginated.body.items.length, 1);
    assert.equal(paginated.body.pageInfo.hasNextPage, false);

    const forbiddenCheckIn = await request(`/api/habits/${habitId}/checkin`, {
        method: 'POST',
        token: userB.token
    });

    assert.equal(forbiddenCheckIn.response.status, 404);

    const firstCheckIn = await request(`/api/habits/${habitId}/checkin`, {
        method: 'POST',
        token: userA.token
    });

    assert.equal(firstCheckIn.response.status, 200);
    assert.equal(firstCheckIn.body.habit.completedDates.length, 1);

    const duplicateCheckIn = await request(`/api/habits/${habitId}/checkin`, {
        method: 'POST',
        token: userA.token
    });

    assert.equal(duplicateCheckIn.response.status, 200);
    assert.equal(duplicateCheckIn.body.habit.completedDates.length, 1);

    const stats = await request('/api/habits/stats', {
        token: userA.token
    });

    assert.equal(stats.response.status, 200);
    assert.equal(stats.body.totalHabits, 1);
    assert.equal(stats.body.completedToday, 1);

    const analytics = await request('/api/habits/analytics?days=7', {
        token: userA.token
    });

    assert.equal(analytics.response.status, 200);
    assert.equal(analytics.body.days.length, 7);
    assert.equal(analytics.body.days.at(-1).completed, 1);
    assert.equal(analytics.body.days.at(-1).completionRate, 100);

    const deleted = await request(`/api/habits/${habitId}`, {
        method: 'DELETE',
        token: userA.token
    });

    assert.equal(deleted.response.status, 200);

    const analyticsAfterDelete = await request('/api/habits/analytics?days=7', {
        token: userA.token
    });

    assert.equal(analyticsAfterDelete.response.status, 200);
    assert.equal(analyticsAfterDelete.body.summary.totalHabits, 0);
    assert.equal(analyticsAfterDelete.body.days.at(-1).completed, 0);
});
