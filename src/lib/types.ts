// ConectaGrupos — tipos compartidos entre cliente y servidor

export type GroupStatus = "ACTIVE" | "PENDING" | "REJECTED";

export interface CountryDTO {
  id: string;
  name: string;
  code: string;
  flag: string;
  region: string;
  dialCode: string | null;
  groupCount: number;
  isActive?: boolean;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: number;
  groupCount: number;
  isAdult?: boolean;
  isActive?: boolean;
}

export interface GroupDTO {
  id: string;
  title: string;
  slug: string;
  description: string;
  inviteLink: string;
  imageUrl: string | null;
  categoryId: string;
  countryId: string;
  members: number;
  isFeatured: boolean;
  isVerified: boolean;
  status: GroupStatus;
  tags: string[];
  keywords: string[];
  views: number;
  shares: number;
  clicks: number;
  joinCount: number;
  contactName: string | null;
  city: string | null;
  language: string;
  isAdult: boolean;
  linkStatus: string;
  uploaderId: string | null;
  uploaderName: string | null;
  uploaderSlug: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  category?: CategoryDTO;
  country?: CountryDTO;
}

export interface StatsDTO {
  groups: number;
  categories: number;
  countries: number;
  members: number;
  featured: number;
}

export interface GroupsQuery {
  search?: string;
  categoryId?: string;
  countryId?: string;
  region?: string;
  tag?: string;
  featured?: boolean;
  sort?: "recientes" | "populares" | "miembros" | "destacados";
  limit?: number;
  offset?: number;
  status?: GroupStatus;
}

export interface SubmitGroupPayload {
  title: string;
  description: string;
  inviteLink: string;
  categoryId: string;
  countryId: string;
  contactName?: string;
  tags?: string[];
}
