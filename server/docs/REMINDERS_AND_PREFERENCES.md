# Reminders and user preferences (Phase 7)

## User preferences

`PATCH /api/v1/users/me/preferences`

```json
{
  "preferredLanguage": "en",
  "timezone": "Asia/Kolkata"
}
```

- Languages: `en`, `hi`
- Timezones must be valid IANA names
- Updating the user timezone also updates reminder timezone **only when** the reminder timezone still matched the previous user timezone (custom reminder timezones are preserved)

## Reminder settings

- `GET /api/v1/reminders/settings` — settings, localized template, delivery capabilities
- `GET /api/v1/reminders/template?language=en|hi` — template preview
- `PUT` or `PATCH /api/v1/reminders/settings` — `enabled`, `reviewTime` (`HH:mm`), `timezone`

Default review time: **06:00** in the user's (or reminder) timezone.

`reminderType` is always `daily_care_plan_review` and is **not** a medication schedule.

## Delivery

Responses include `delivery.backgroundNotificationsAvailable: false` unless a real push service is integrated. Read-aloud is client-side browser TTS only.
