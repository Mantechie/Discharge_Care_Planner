import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/app.js";
import { ReminderSetting } from "../../src/models/ReminderSetting.js";
import { User } from "../../src/models/User.js";
import { TestClient } from "../helpers/testClient.js";
import { getTestAppConfig } from "../helpers/testConfig.js";
import {
  connectTestDatabase,
  clearDatabase,
  disconnectTestDatabase,
} from "../helpers/testDb.js";

const config = getTestAppConfig();
const app = createApp(config);
const client = new TestClient(app);
let token;

before(async () => {
  await connectTestDatabase();
  await client.start();
});

beforeEach(async () => {
  await clearDatabase();
  client.cookies.clear();
  client.csrfToken = null;

  const register = await client.request("/api/v1/auth/register", {
    method: "POST",
    body: {
      name: "Prefs User",
      email: "prefs@example.com",
      password: "a-strong-demo-password",
      preferredLanguage: "en",
      timezone: "Asia/Kolkata",
    },
  });

  token = register.body.data.accessToken;
});

after(async () => {
  await client.stop();
  await disconnectTestDatabase();
});

test("reminder settings default to 06:00 daily care plan review", async () => {
  const { response, body } = await client.request("/api/v1/reminders/settings", {
    authToken: token,
  });

  assert.equal(response.status, 200);
  assert.equal(body.data.reviewTime, "06:00");
  assert.equal(body.data.reminderType, "daily_care_plan_review");
  assert.equal(body.data.isMedicationSchedule, false);
  assert.equal(body.data.template.notMedicationSchedule, true);
  assert.equal(body.data.delivery.backgroundNotificationsAvailable, false);
});

test("returns localized Hindi reminder template", async () => {
  await client.request("/api/v1/users/me/preferences", {
    method: "PATCH",
    authToken: token,
    body: { preferredLanguage: "hi" },
  });

  const template = await client.request("/api/v1/reminders/template", {
    authToken: token,
  });

  assert.equal(template.response.status, 200);
  assert.equal(template.body.data.language, "hi");
  assert.match(template.body.data.template.title, /समीक्षा/);
});

test("updates user preferences and syncs reminder timezone when unchanged", async () => {
  await client.request("/api/v1/users/me/preferences", {
    method: "PATCH",
    authToken: token,
    body: { timezone: "Europe/London" },
  });

  const user = await User.findOne({ email: "prefs@example.com" });
  const reminder = await ReminderSetting.findOne({ userId: user._id });

  assert.equal(user.timezone, "Europe/London");
  assert.equal(reminder.timezone, "Europe/London");
});

test("preserves custom reminder timezone when user timezone changes", async () => {
  const user = await User.findOne({ email: "prefs@example.com" });
  await ReminderSetting.updateOne(
    { userId: user._id },
    { timezone: "America/New_York" }
  );

  await client.request("/api/v1/users/me/preferences", {
    method: "PATCH",
    authToken: token,
    body: { timezone: "Europe/Paris" },
  });

  const reminder = await ReminderSetting.findOne({ userId: user._id });
  assert.equal(reminder.timezone, "America/New_York");
});

test("rejects invalid IANA timezone on preferences", async () => {
  const { response, body } = await client.request(
    "/api/v1/users/me/preferences",
    {
      method: "PATCH",
      authToken: token,
      body: { timezone: "Not/A_Timezone" },
    }
  );

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "VALIDATION_ERROR");
});

test("patch reminder settings validates review time", async () => {
  const patch = await client.request("/api/v1/reminders/settings", {
    method: "PATCH",
    authToken: token,
    body: { reviewTime: "07:30", enabled: false },
  });

  assert.equal(patch.response.status, 200);
  assert.equal(patch.body.data.reviewTime, "07:30");
  assert.equal(patch.body.data.enabled, false);
  assert.equal(patch.body.data.template.language, "en");
});
