/**
 * UGC Quality Score Calculator
 * Based on Groupizo VIP Logic SYSTEM 4.
 *
 * Scoring table:
 *   +20 valid invite URL + extracted code
 *   +15 has group name
 *   +15 has category
 *   +10 has country
 *   +8  has city
 *   +10 has 3+ tags
 *   +10 has 3+ keywords
 *   +2  has profile image URL
 *   +5  has language
 *   +5  contributor logged in
 *   -50 duplicate invite code
 *   -30 per severe keyword hit
 *   -20 per adult mismatch hit
 *
 * Final decision:
 *   score >= 70 AND no severe hits AND not duplicate → AUTO-PUBLISH
 *   score >= 40 → REVIEW QUEUE
 *   score < 40 OR severe_hits → AUTO-REJECT
 */

import type { HunterResult } from "./content-hunter";

export interface ScoreInput {
  hasInviteCode: boolean;
  hasGroupName: boolean;
  hasCategory: boolean;
  hasCountry: boolean;
  hasCity: boolean;
  tagsCount: number;
  keywordsCount: number;
  hasImage: boolean;
  hasLanguage: boolean;
  isContributor: boolean;
  isDuplicate: boolean;
  hunterResult: HunterResult;
  isAdultDeclared: boolean;
  submissionTimeSec: number;
}

export interface ScoreBreakdown {
  validInvite: number;
  groupName: number;
  category: number;
  country: number;
  city: number;
  tags: number;
  keywords: number;
  image: number;
  language: number;
  contributor: number;
  duplicatePenalty: number;
  severePenalty: number;
  adultMismatchPenalty: number;
}

export interface ScoreResult {
  score: number;
  label: "Excellent" | "Strong" | "Needs Review" | "Weak" | "Likely Spam" | "Bot/Spam";
  breakdown: ScoreBreakdown;
  flags: string[];
  decision: "auto_publish" | "review" | "auto_reject" | "drop_silently";
  duplicateGroupId: string | null;
}

export function calculateScore(input: ScoreInput): ScoreResult {
  const b: ScoreBreakdown = {
    validInvite: 0, groupName: 0, category: 0, country: 0, city: 0,
    tags: 0, keywords: 0, image: 0, language: 0, contributor: 0,
    duplicatePenalty: 0, severePenalty: 0, adultMismatchPenalty: 0,
  };

  const flags: string[] = [];

  // Positive points
  if (input.hasInviteCode) b.validInvite = 20;
  if (input.hasGroupName) b.groupName = 15;
  if (input.hasCategory) b.category = 15;
  if (input.hasCountry) b.country = 10;
  if (input.hasCity) b.city = 8;
  if (input.tagsCount >= 3) b.tags = 10;
  if (input.keywordsCount >= 3) b.keywords = 10;
  if (input.hasImage) b.image = 2;
  if (input.hasLanguage) b.language = 5;
  if (input.isContributor) b.contributor = 5;

  // Penalties
  if (input.isDuplicate) {
    b.duplicatePenalty = -50;
    flags.push("duplicate");
  }

  if (input.hunterResult.severeHits > 0) {
    b.severePenalty = -30 * input.hunterResult.severeHits;
    flags.push("severe_content");
  }

  // Adult mismatch: adult keywords found but is_adult=0
  if (input.hunterResult.adultHits > 0 && !input.isAdultDeclared) {
    b.adultMismatchPenalty = -20 * input.hunterResult.adultHits;
    flags.push("adult_mismatch");
  }

  // Speed bot detection
  if (input.submissionTimeSec < 3) {
    flags.push("speed_bot");
  }

  const positive =
    b.validInvite + b.groupName + b.category + b.country + b.city +
    b.tags + b.keywords + b.image + b.language + b.contributor;
  const penalties = b.duplicatePenalty + b.severePenalty + b.adultMismatchPenalty;
  const score = Math.max(0, positive + penalties);

  // Label
  let label: ScoreResult["label"];
  if (score >= 90) label = "Excellent";
  else if (score >= 80) label = "Strong";
  else if (score >= 65) label = "Needs Review";
  else if (score >= 40) label = "Weak";
  else if (score >= 1) label = "Likely Spam";
  else label = "Bot/Spam";

  // Decision
  let decision: ScoreResult["decision"];
  if (flags.includes("speed_bot") && score < 40) {
    decision = "drop_silently";
  } else if (score >= 70 && input.hunterResult.severeHits === 0 && !input.isDuplicate) {
    decision = "auto_publish";
  } else if (score >= 40 && input.hunterResult.severeHits < 3) {
    decision = "review";
  } else {
    decision = "auto_reject";
  }

  return {
    score,
    label,
    breakdown: b,
    flags,
    decision,
    duplicateGroupId: null,
  };
}
