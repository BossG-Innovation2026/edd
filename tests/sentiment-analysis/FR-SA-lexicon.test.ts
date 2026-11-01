// FR-SA-03: Sentiment analysis with lexicon-based detection.
import { describe, it, expect } from "vitest";
import { analyzeSentiment, detectLanguage } from "@/modules/sentiment-analysis/lexicon";

describe("FR-SA-03: Sentiment analysis with lexicon", () => {
  it("detects positive sentiment", () => {
    const result = analyzeSentiment("The school is safe and well protected.");
    expect(result.sentiment).toBe("POSITIVE");
    expect(result.matchedWords).toBeGreaterThan(0);
  });

  it("detects negative sentiment", () => {
    const result = analyzeSentiment("The electrical hazard is dangerous and unsafe.");
    expect(result.sentiment).toBe("NEGATIVE");
    expect(result.matchedWords).toBeGreaterThan(0);
  });

  it("detects neutral sentiment", () => {
    const result = analyzeSentiment("The building is ok.");
    expect(result.sentiment).toBe("NEUTRAL");
  });

  it("handles negation (flips polarity)", () => {
    const result = analyzeSentiment("The situation is not safe.");
    expect(result.sentiment).toBe("NEGATIVE");
  });

  it("detects feeling tags", () => {
    const positiveResult = analyzeSentiment("The school feels very safe.");
    expect(positiveResult.feeling).toBeDefined();

    const negativeResult = analyzeSentiment("I am very worried about the hazard.");
    expect(negativeResult.feeling).toBeDefined();
  });
});

describe("FR-SA-04: Language detection", () => {
  it("detects English text", () => {
    expect(detectLanguage("This is a safe place")).toBe("en");
  });

  it("detects Filipino/Tagalog with keywords", () => {
    const result = detectLanguage("Ligtas ang paaralan.");
    expect(["fil", "tl"]).toContain(result);
  });
});
