const FOOD_LABELS = {
  before_food: "Before food",
  after_food: "After food",
  with_food: "With food",
  empty_stomach: "Empty stomach",
  not_specified: "Not specified in the document",
};

export function formatFoodInstruction(value, translate) {
  if (translate) {
    const key =
      !value || value === "not_specified"
        ? "extraction.food.not_specified"
        : `extraction.food.${value}`;
    const translated = translate(key);
    if (translated && !translated.startsWith("[")) {
      return translated;
    }
  }
  if (!value || value === "not_specified") {
    return FOOD_LABELS.not_specified;
  }
  return FOOD_LABELS[value] || value;
}

export function formatDocumentedValue(value, translate) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return translate
      ? translate("extraction.notSpecified")
      : "Not specified in the document";
  }
  return String(value).trim();
}

export function formatReviewStatus(status, translate) {
  if (translate && status) {
    const key = `extraction.review.${status}`;
    const translated = translate(key);
    if (translated && !translated.startsWith("[")) {
      return translated;
    }
  }
  switch (status) {
    case "confirmed_against_source":
      return "Confirmed against source";
    case "needs_clarification":
      return "Needs clarification";
    case "unreviewed":
      return "Not yet reviewed";
    default:
      return status || "Unknown";
  }
}

export function formatReferencePrecision(precision) {
  switch (precision) {
    case "exact_span":
      return "Exact passage";
    case "page_excerpt":
      return "Page excerpt";
    case "page_only":
      return "Page reference only";
    case "unavailable":
      return "Source location unavailable";
    default:
      return precision || "Source location unavailable";
  }
}

export function isCarePlanReadyForContinue(carePlan) {
  if (!carePlan) {
    return false;
  }
  if (carePlan.status === "failed") {
    return false;
  }
  if ((carePlan.openClarificationCount ?? 0) > 0) {
    return false;
  }
  return carePlan.status === "draft" || carePlan.status === "ready";
}
