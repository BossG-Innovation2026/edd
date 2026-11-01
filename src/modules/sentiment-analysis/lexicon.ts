// Module 3.4: Sentiment Analysis. FR-SA-03: bilingual lexicon for English, Filipino, Taglish.
// Simple keyword-based sentiment detection with negation handling.

export interface LexiconWord {
  word: string;
  polarity: number; // positive, negative, or neutral
  feeling?: string; // fear, anger, sadness, trust, neutral
}

// Sentiment lexicon for English, Filipino, and Taglish.
// Polarity: positive (+1), negative (-1), or neutral (0).
export const SENTIMENT_LEXICON: LexiconWord[] = [
  // Positive words
  { word: "safe", polarity: 1, feeling: "trust" },
  { word: "good", polarity: 1, feeling: "trust" },
  { word: "excellent", polarity: 1, feeling: "trust" },
  { word: "great", polarity: 1, feeling: "trust" },
  { word: "well", polarity: 1, feeling: "trust" },
  { word: "protected", polarity: 1, feeling: "trust" },
  { word: "secure", polarity: 1, feeling: "trust" },
  { word: "okay", polarity: 0, feeling: "neutral" },
  { word: "better", polarity: 1, feeling: "trust" },
  { word: "improved", polarity: 1, feeling: "trust" },
  // Filipino/Tagalog positive
  { word: "ligtas", polarity: 1, feeling: "trust" },
  { word: "maganda", polarity: 1, feeling: "trust" },
  { word: "maayos", polarity: 1, feeling: "trust" },
  { word: "ayos", polarity: 1, feeling: "trust" },
  { word: "ok", polarity: 0, feeling: "neutral" },

  // Negative words
  { word: "dangerous", polarity: -1, feeling: "fear" },
  { word: "hazardous", polarity: -1, feeling: "fear" },
  { word: "bad", polarity: -1, feeling: "sadness" },
  { word: "broken", polarity: -1, feeling: "sadness" },
  { word: "unsafe", polarity: -1, feeling: "fear" },
  { word: "damaged", polarity: -1, feeling: "sadness" },
  { word: "risk", polarity: -1, feeling: "fear" },
  { word: "problem", polarity: -1, feeling: "sadness" },
  { word: "issue", polarity: -1, feeling: "sadness" },
  { word: "concern", polarity: -1, feeling: "fear" },
  { word: "worried", polarity: -1, feeling: "fear" },
  { word: "angry", polarity: -1, feeling: "anger" },
  { word: "furious", polarity: -1, feeling: "anger" },
  { word: "upset", polarity: -1, feeling: "anger" },
  // Filipino/Tagalog negative
  { word: "mapanganib", polarity: -1, feeling: "fear" },
  { word: "masama", polarity: -1, feeling: "sadness" },
  { word: "sirang", polarity: -1, feeling: "sadness" },
  { word: "problema", polarity: -1, feeling: "sadness" },
  { word: "alalahanin", polarity: -1, feeling: "fear" },
  { word: "galit", polarity: -1, feeling: "anger" },
];

// Negators that flip the polarity of the next word.
export const NEGATORS = new Set(["not", "no", "never", "hindi", "walang", "di", "huwag"]);

// Detect language (simplified: "en" | "fil" | "tl" | "other").
export function detectLanguage(text: string): string {
  const lower = text.toLowerCase();
  // Simple heuristic: if contains Filipino/Tagalog words, classify accordingly.
  if (lower.includes("ligtas") || lower.includes("mapanganib") || lower.includes("masama")) {
    return lower.includes("tl-keywords") ? "tl" : "fil";
  }
  return "en";
}

// FR-SA-03: analyze text sentiment using lexicon and negation handling.
export function analyzeSentiment(text: string): {
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  feeling?: string;
  score: number;
  matchedWords: number;
} {
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  let feeling = "NEUTRAL";
  let matchedWords = 0;
  const wordMap = new Map(SENTIMENT_LEXICON.map((w) => [w.word, w]));

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^\w]/g, ""); // Remove punctuation.
    const entry = wordMap.get(word);

    if (entry) {
      matchedWords++;
      let polarity = entry.polarity;

      // Check for negation in the previous word.
      if (i > 0) {
        const prevWord = words[i - 1].replace(/[^\w]/g, "");
        if (NEGATORS.has(prevWord)) {
          polarity *= -1;
        }
      }

      score += polarity;
      if (polarity > 0 && entry.feeling) feeling = entry.feeling;
      if (polarity < 0 && entry.feeling) feeling = entry.feeling;
    }
  }

  const sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL" = score > 0 ? "POSITIVE" : score < 0 ? "NEGATIVE" : "NEUTRAL";
  return { sentiment, feeling: sentiment === "NEUTRAL" ? undefined : feeling, score, matchedWords };
}
