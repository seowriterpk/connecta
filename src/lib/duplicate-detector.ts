/**
 * Duplicate Detection (invite-code based)
 * Based on Groupizo VIP Logic SYSTEM 9.
 *
 * Extracts invite code, searches groups + ugc_submissions using LIKE.
 */

import { queryOne, type Row } from "./db";
import { extractInviteCode } from "./whatsapp-validator";

export interface DuplicateResult {
  isDuplicate: boolean;
  duplicateGroupId: string | null;
}

export async function detectDuplicate(inviteUrl: string): Promise<DuplicateResult> {
  const code = extractInviteCode(inviteUrl);
  if (!code) return { isDuplicate: false, duplicateGroupId: null };

  // Check groups table (LIKE %code%)
  const inGroups = (await queryOne<Row>(
    "SELECT `id` FROM `groups` WHERE `joinLink` LIKE ? LIMIT 1",
    [`%${code}%`]
  )) as (Row & { id: string }) | null;
  if (inGroups) {
    return { isDuplicate: true, duplicateGroupId: inGroups.id };
  }

  // Check ugc_submissions table (pending, not rejected)
  const inSubmissions = (await queryOne<Row>(
    "SELECT `publishedGroupId` FROM `ugc_submissions` WHERE `inviteCode` = ? AND `status` NOT IN ('rejected', 'spam', 'deleted') LIMIT 1",
    [code]
  )) as (Row & { publishedGroupId: string | null }) | null;
  if (inSubmissions?.publishedGroupId) {
    return { isDuplicate: true, duplicateGroupId: inSubmissions.publishedGroupId };
  }

  return { isDuplicate: false, duplicateGroupId: null };
}
