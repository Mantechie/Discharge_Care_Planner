import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildDailyCarePlanReviewTemplate,
  buildReminderDeliveryCapabilities,
} from "../../src/utils/reminderTemplates.js";

test("daily review template is not a medication schedule reminder", () => {
  const en = buildDailyCarePlanReviewTemplate("en", {
    reviewTime: "06:00",
    timezone: "Asia/Kolkata",
  });

  assert.equal(en.notMedicationSchedule, true);
  assert.match(en.message, /care plan/i);
  assert.doesNotMatch(en.notMedicationScheduleNote, /take all medicines at/i);

  const hi = buildDailyCarePlanReviewTemplate("hi", {
    reviewTime: "06:00",
    timezone: "Asia/Kolkata",
  });

  assert.equal(hi.language, "hi");
  assert.equal(hi.notMedicationSchedule, true);
});

test("delivery capabilities do not claim background push delivery", () => {
  const delivery = buildReminderDeliveryCapabilities();

  assert.equal(delivery.backgroundNotificationsAvailable, false);
  assert.equal(delivery.pushServiceConfigured, false);
  assert.match(delivery.note, /browser is closed/i);
  assert.equal(delivery.readAloud.providedBy, "client_browser_tts");
});
