/**
 * Content Hunter — Disguised Keyword Detector
 * Based on Groupizo VIP Logic SYSTEM 6.
 *
 * Detects adult/spam content hidden with emoji, mathematical unicode,
 * full-width chars, enclosing circles, separator tricks.
 */

/**
 * Normalize text to plain ASCII for safe scanning.
 * Strips emojis, converts math/circle/fullwidth unicode to ASCII,
 * collapses separator tricks (s.e.x → sex).
 */
export function hunterNormalize(text: string): string {
  if (!text) return "";

  let s = text;

  // Step 1: Strip emojis (high unicode ranges)
  s = s.replace(/[\u{1F000}-\u{1FFFF}]/gu, "");
  s = s.replace(/[\u2600-\u27BF]/gu, "");

  // Step 2: Convert flag emojis to letters (simplified)
  s = s.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, (ch) => {
    const code = ch.codePointAt(0)! - 0x1f1e6;
    return String.fromCharCode(65 + code);
  });

  // Step 3: Convert mathematical unicode letters to ASCII
  s = s.replace(/[\u{1D400}-\u{1D7FF}]/gu, (ch) => {
    const code = ch.codePointAt(0)!;
    // Mathematical Alphanumeric Symbols
    if (code >= 0x1d400 && code <= 0x1d433) return String.fromCharCode(65 + (code - 0x1d400)); // Bold A-Z
    if (code >= 0x1d434 && code <= 0x1d467) return String.fromCharCode(97 + (code - 0x1d434)); // Bold a-z
    if (code >= 0x1d4d0 && code <= 0x1d503) return String.fromCharCode(65 + (code - 0x1d4d0)); // Bold italic A-Z
    if (code >= 0x1d56c && code <= 0x1d59f) return String.fromCharCode(65 + (code - 0x1d56c)); // Sans-serif bold A-Z
    if (code >= 0x1d5d4 && code <= 0x1d607) return String.fromCharCode(65 + (code - 0x1d5d4)); // Sans-serif A-Z
    if (code >= 0x1d6a8 && code <= 0x1d6e1) return String.fromCharCode(65 + (code - 0x1d6a8)); // Italic A-Z
    return ch;
  });

  // Step 4: Convert enclosing circles/squares to ASCII
  // Ⓐ (U+24B6) → A, ⓐ (U+24D0) → a
  s = s.replace(/[\u24B6-\u24CF]/g, (ch) => String.fromCharCode(65 + (ch.charCodeAt(0) - 0x24B6)));
  s = s.replace(/[\u24D0-\u24E9]/g, (ch) => String.fromCharCode(97 + (ch.charCodeAt(0) - 0x24D0)));

  // 🄰 (U+1F130) → A, 🅰 (U+1F170) → A
  s = s.replace(/[\u{1F130}-\u{1F149}]/gu, (ch) => String.fromCharCode(65 + (ch.codePointAt(0)! - 0x1f130)));
  s = s.replace(/[\u{1F170}-\u{1F189}]/gu, (ch) => String.fromCharCode(65 + (ch.codePointAt(0)! - 0x1f170)));

  // 🆂🅴🆇 → SEX (U+1F182-1F189 = 🆂-🆉)
  s = s.replace(/[\u{1F182}-\u{1F189}]/gu, (ch) => String.fromCharCode(83 + (ch.codePointAt(0)! - 0x1f182)));

  // Step 5: Convert full-width Latin to normal
  s = s.replace(/[\uFF21-\uFF3A]/g, (ch) => String.fromCharCode(65 + (ch.charCodeAt(0) - 0xff21)));
  s = s.replace(/[\uFF41-\uFF5A]/g, (ch) => String.fromCharCode(97 + (ch.charCodeAt(0) - 0xff41)));

  // Step 6: Collapse separator tricks (s.e.x → sex)
  // Pattern: single letter + separator + single letter
  s = s.replace(/([a-z])[\.\-_]([a-z])/gi, "$1$2");

  // Step 7: Lowercase
  s = s.toLowerCase();

  return s;
}

// Severe keywords (high-priority blocks)
const SEVERE_KEYWORDS = [
  "sex", "porno", "xxx", "nude", "nudes", "porn", "escort", "prostitute",
  "cp", "child", "pedo", "underage", "minor",
  "weapons", "drugs", "cocaine", "weed sell",
  "scam", "phishing", "carding", "cc sell",
];

// Adult keywords (for mismatch detection)
const ADULT_KEYWORDS = [
  "adult", "18+", "nsfw", "hot", "horny", "dating", "hookup",
  "sugar daddy", "sugar baby", "cam girl", "onlyfans",
  "explicit", "desnudo", "desnuda", "erotica", "erotico",
];

export interface HunterResult {
  hits: number;
  matched: string[];
  severeHits: number;
  severeMatched: string[];
  adultHits: number;
  adultMatched: string[];
}

/**
 * Scan text for disguised keywords.
 */
export function hunterScan(text: string): HunterResult {
  const normalized = hunterNormalize(text);

  const severeMatched: string[] = [];
  const adultMatched: string[] = [];

  for (const kw of SEVERE_KEYWORDS) {
    if (normalized.includes(kw)) {
      severeMatched.push(kw);
    }
  }

  for (const kw of ADULT_KEYWORDS) {
    if (normalized.includes(kw)) {
      adultMatched.push(kw);
    }
  }

  return {
    hits: severeMatched.length + adultMatched.length,
    matched: [...severeMatched, ...adultMatched],
    severeHits: severeMatched.length,
    severeMatched,
    adultHits: adultMatched.length,
    adultMatched,
  };
}
