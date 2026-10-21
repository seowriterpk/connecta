/**
 * Lite DTOs — structural subsets of the full DTOs containing EXACTLY the
 * fields the client components render (GroupCard, GroupsDirectoryTable,
 * CommandPalette, CategoriesSection, CountriesSection).
 *
 * Why: every prop crossing a Server → Client boundary is serialized into the
 * RSC flight payload alongside the rendered HTML (data shipped twice). The
 * full GroupDTO carries inviteLink, tags, keywords, clicks, joinCount,
 * uploader info, status… none of which these components render — dozens of KB
 * of dead weight per page view. Server pages map full DTOs through the
 * `to*Lite` mappers before the boundary.
 *
 * Full DTOs remain structurally assignable to these types (they are
 * supersets), so existing call sites passing GroupDTO/CategoryDTO/CountryDTO
 * keep compiling untouched.
 */

import type { CategoryDTO, CountryDTO, GroupDTO } from "@/lib/types";

export interface CategoryLiteDTO {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  groupCount: number;
  isAdult?: boolean;
}

export interface CountryLiteDTO {
  id: string;
  name: string;
  code: string;
  flag: string;
  region: string;
  groupCount: number;
}

export interface GroupCardDTO {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  members: number;
  views: number;
  city: string | null;
  isAdult: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  lastActiveAt: string | null;
  /** Present when the link checker marked the invite link revoked/expired
   *  ("revoked") — the card renders the red "Expirado" icon/badge. Kept
   *  optional (and `string`-typed so full GroupDTOs stay structurally
   *  assignable) — components compare against "revoked". */
  linkStatus?: string;
  category?: CategoryLiteDTO;
  country?: CountryLiteDTO;
}

export function toCategoryLite(c: CategoryDTO): CategoryLiteDTO {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    color: c.color,
    groupCount: c.groupCount,
    ...(c.isAdult ? { isAdult: true } : {}),
  };
}

export function toCountryLite(c: CountryDTO): CountryLiteDTO {
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    flag: c.flag,
    region: c.region,
    groupCount: c.groupCount,
  };
}

export function toGroupCardDTO(g: GroupDTO): GroupCardDTO {
  return {
    id: g.id,
    title: g.title,
    slug: g.slug,
    description: g.description,
    imageUrl: g.imageUrl,
    members: g.members,
    views: g.views,
    city: g.city,
    isAdult: g.isAdult,
    isVerified: g.isVerified,
    isFeatured: g.isFeatured,
    lastActiveAt: g.lastActiveAt,
    ...(g.linkStatus === "revoked" ? { linkStatus: g.linkStatus } : {}),
    ...(g.category
      ? {
          category: {
            id: g.category.id,
            name: g.category.name,
            slug: g.category.slug,
            icon: g.category.icon,
            color: g.category.color,
            groupCount: g.category.groupCount,
            ...(g.category.isAdult ? { isAdult: true } : {}),
          },
        }
      : {}),
    ...(g.country
      ? {
          country: {
            id: g.country.id,
            name: g.country.name,
            code: g.country.code,
            flag: g.country.flag,
            region: g.country.region,
            groupCount: g.country.groupCount,
          },
        }
      : {}),
  };
}
