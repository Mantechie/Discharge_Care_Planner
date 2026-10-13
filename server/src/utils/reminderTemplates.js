/**
 * Localized copy for the daily care-plan review reminder (not medication scheduling).
 */
export function buildDailyCarePlanReviewTemplate(language, { reviewTime, timezone }) {
  const safeTime = reviewTime || "06:00";
  const safeTimezone = timezone || "Asia/Kolkata";

  if (language === "hi") {
    return {
      language: "hi",
      title: "दैनिक केयर प्लान समीक्षा",
      message: `${safeTime} (${safeTimezone}) पर अपने डिस्चार्ज केयर प्लान की समीक्षा करें।`,
      purpose:
        "यह आपके दस्तावेज़ किए गए देखभाल निर्देशों की समीक्षा के लिए एक सामान्य अनुस्मारक है।",
      notMedicationSchedule: true,
      notMedicationScheduleNote:
        "यह दवा की खुराक या समय का अनुस्मारक नहीं है।",
    };
  }

  return {
    language: "en",
    title: "Daily care plan review",
    message: `At ${safeTime} (${safeTimezone}), review your discharge care plan.`,
    purpose:
      "This is a general reminder to review documented care instructions from your plan.",
    notMedicationSchedule: true,
    notMedicationScheduleNote:
      "This is not a medication dose or dosing-time reminder.",
  };
}

export function buildReminderDeliveryCapabilities() {
  return {
    mode: "in_app",
    backgroundNotificationsAvailable: false,
    pushServiceConfigured: false,
    note:
      "Reminders are delivered in the app while it is open. They are not guaranteed when the browser is closed unless a push notification service is configured.",
    readAloud: {
      providedBy: "client_browser_tts",
      description:
        "Read-aloud is handled by the browser text-to-speech feature on the client.",
    },
  };
}
