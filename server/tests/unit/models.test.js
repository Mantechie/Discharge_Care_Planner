import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { User } from "../../src/models/User.js";
import { Document } from "../../src/models/Document.js";
import { CarePlan } from "../../src/models/CarePlan.js";
import { ReminderSetting } from "../../src/models/ReminderSetting.js";
import { Task } from "../../src/models/Task.js";
import {
  connectTestDatabase,
  clearDatabase,
  disconnectTestDatabase,
} from "../helpers/testDb.js";

before(async () => {
  await connectTestDatabase();
});

beforeEach(async () => {
  await clearDatabase();
});

after(async () => {
  await disconnectTestDatabase();
});

test("User applies default language and timezone", async () => {
  const user = await User.create({
    name: "Test User",
    email: "defaults@example.com",
    passwordHash: "hashed",
  });

  assert.equal(user.preferredLanguage, "en");
  assert.equal(user.timezone, "Asia/Kolkata");
});

test("User rejects invalid timezone", async () => {
  await assert.rejects(
    () =>
      User.create({
        name: "Invalid TZ",
        email: "invalid-tz@example.com",
        passwordHash: "hashed",
        timezone: "Not/A_Timezone",
      }),
    /Invalid IANA timezone/
  );
});

test("User enforces unique email", async () => {
  await User.create({
    name: "First",
    email: "duplicate@example.com",
    passwordHash: "hashed",
  });

  await assert.rejects(
    () =>
      User.create({
        name: "Second",
        email: "duplicate@example.com",
        passwordHash: "hashed",
      }),
    (error) => error.code === 11000
  );
});

test("Document rejects invalid status values", async () => {
  const userId = new mongoose.Types.ObjectId();

  await assert.rejects(
    () =>
      Document.create({
        userId,
        originalFilename: "summary.pdf",
        mimeType: "application/pdf",
        fileSize: 100,
        storageKey: "private/key",
        status: "invalid_status",
      }),
    /enum/
  );
});

test("ReminderSetting enforces one record per user", async () => {
  const userId = new mongoose.Types.ObjectId();

  await ReminderSetting.create({ userId });
  await assert.rejects(
    () => ReminderSetting.create({ userId }),
    (error) => error.code === 11000
  );
});

test("ReminderSetting defaults review time to 06:00", async () => {
  const setting = await ReminderSetting.create({
    userId: new mongoose.Types.ObjectId(),
  });

  assert.equal(setting.reviewTime, "06:00");
  assert.equal(setting.reminderType, "daily_care_plan_review");
});

test("CarePlan keeps missing food instruction as not_specified", async () => {
  const userId = new mongoose.Types.ObjectId();
  const documentId = new mongoose.Types.ObjectId();

  const carePlan = await CarePlan.create({
    userId,
    documentId,
    medications: [
      {
        name: "Example Medicine",
        frequency: "twice daily",
        sourceReferences: [{ quotedText: "Take twice daily" }],
      },
    ],
  });

  assert.equal(carePlan.medications[0].foodInstruction, "not_specified");
  assert.equal(carePlan.medications[0].timing, null);
  assert.equal(carePlan.medications[0].sourceReferences[0].quotedText, "Take twice daily");
});

test("Task does not auto-fill scheduledTime from frequency", async () => {
  const task = await Task.create({
    userId: new mongoose.Types.ObjectId(),
    carePlanId: new mongoose.Types.ObjectId(),
    documentId: new mongoose.Types.ObjectId(),
    title: "Take medicine",
    category: "medication",
    timezone: "Asia/Kolkata",
  });

  assert.equal(task.scheduledTime, null);
});
