const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateFollowUpDraft({ title, appointmentDate, appointmentTime }) {
  const errors = {};

  if (!title?.trim()) {
    errors.title = "A description is required.";
  }

  if (appointmentDate && !DATE_PATTERN.test(appointmentDate)) {
    errors.appointmentDate = "Use YYYY-MM-DD format.";
  }

  if (appointmentTime && !TIME_PATTERN.test(appointmentTime)) {
    errors.appointmentTime = "Use 24-hour HH:MM format.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateClarificationResolution({
  requiresProfessionalConfirmation,
  resolutionNote,
}) {
  if (requiresProfessionalConfirmation && !resolutionNote?.trim()) {
    return {
      valid: false,
      message:
        "Document how a healthcare professional confirmed this — a note is required.",
    };
  }

  if (!resolutionNote?.trim()) {
    return {
      valid: false,
      message: "Add a brief resolution note.",
    };
  }

  return { valid: true, message: null };
}
