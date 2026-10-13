export const EXTRACTION_FIXTURE_MARKER = "[[DC_TEST_EXTRACTION_FIXTURE]]";

export function loadSyntheticExtractionFixture(language = "en") {
  return {
    summary: "Synthetic discharge summary for automated testing only.",
    language,
    sourceReferences: [
      {
        pageNumber: 1,
        quotedText: "Take one tablet twice daily after food",
        startOffset: null,
        endOffset: null,
        referencePrecision: "page_excerpt",
      },
    ],
    medications: [
      {
        name: "Example Medicine",
        strength: null,
        dose: "one tablet",
        route: null,
        frequency: "twice daily",
        timing: null,
        foodInstruction: "after_food",
        duration: null,
        sourceReferences: [
          {
            pageNumber: 1,
            quotedText: "Take one tablet twice daily after food",
            startOffset: null,
            endOffset: null,
            referencePrecision: "page_excerpt",
          },
        ],
        confidence: 0.8,
        reviewStatus: "unreviewed",
        clarificationReason: null,
      },
    ],
    dailyInstructions: [
      {
        instruction: "Rest and drink fluids as documented.",
        sourceReferences: [
          {
            pageNumber: 1,
            quotedText: "Rest and drink fluids as documented.",
            referencePrecision: "page_excerpt",
          },
        ],
        reviewStatus: "unreviewed",
        clarificationReason: null,
      },
    ],
    warningSigns: [
      {
        description: "Return if fever persists.",
        sourceReferences: [
          {
            pageNumber: 1,
            quotedText: "Return if fever persists.",
            referencePrecision: "page_excerpt",
          },
        ],
        reviewStatus: "unreviewed",
      },
    ],
    followUps: [
      {
        description: "Follow up with physician",
        date: null,
        time: null,
        location: null,
        sourceReferences: [
          {
            pageNumber: 1,
            quotedText: "Follow up with physician",
            referencePrecision: "page_excerpt",
          },
        ],
        reviewStatus: "unreviewed",
      },
    ],
    clarifications: [],
  };
}
