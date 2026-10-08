/**
 * Country Canonicalizer
 * Based on Groupizo VIP Logic SYSTEM 15.
 *
 * Maps any country variant to canonical name.
 * Only accepts countries that exist in country_bank.
 */

import { queryOne, type Row } from "./db";

const ALIASES: Record<string, string> = {
  // Mexico
  mx: "Mexico", mex: "Mexico", mexico: "Mexico", méxico: "Mexico", meksiko: "Mexico",
  // Spain
  es: "España", esp: "España", espana: "España", españa: "España", spain: "España",
  // Argentina
  ar: "Argentina", arg: "Argentina", argentina: "Argentina",
  // Colombia
  co: "Colombia", col: "Colombia", colombia: "Colombia",
  // Peru
  pe: "Peru", per: "Peru", peru: "Peru", perú: "Peru",
  // Chile
  cl: "Chile", chl: "Chile", chile: "Chile",
  // Venezuela
  ve: "Venezuela", ven: "Venezuela", venezuela: "Venezuela",
  // Ecuador
  ec: "Ecuador", eca: "Ecuador", ecuador: "Ecuador",
  // Guatemala
  gt: "Guatemala", gua: "Guatemala", guatemala: "Guatemala",
  // Cuba
  cu: "Cuba", cub: "Cuba", cuba: "Cuba",
  // Bolivia
  bo: "Bolivia", bol: "Bolivia", bolivia: "Bolivia",
  // Dominican Republic
  do: "Republica Dominicana", dom: "Republica Dominicana", repdom: "Republica Dominicana",
  // Honduras
  hn: "Honduras", hon: "Honduras", honduras: "Honduras",
  // Paraguay
  py: "Paraguay", par: "Paraguay", paraguay: "Paraguay",
  // El Salvador
  sv: "El Salvador", slv: "El Salvador", salvador: "El Salvador",
  // Nicaragua
  ni: "Nicaragua", nic: "Nicaragua", nicaragua: "Nicaragua",
  // Costa Rica
  cr: "Costa Rica", cri: "Costa Rica",
  // Panama
  pa: "Panama", pan: "Panama", panama: "Panama", panamá: "Panama",
  // Uruguay
  uy: "Uruguay", uru: "Uruguay", uruguay: "Uruguay",
  // Puerto Rico
  pr: "Puerto Rico", pur: "Puerto Rico",
  // USA
  us: "United States", usa: "United States", "estados unidos": "United States",
};

function cleanInput(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export async function canonicalizeCountry(input: string): Promise<string | null> {
  if (!input) return null;
  const cleaned = cleanInput(input);

  // 1. Check aliases map
  if (ALIASES[cleaned]) return ALIASES[cleaned];

  // 2. Check country_bank (by name or slug)
  const country = (await queryOne<Row>(
    "SELECT `name` FROM `countries` WHERE `name` = ? OR `nameEs` = ? OR `slug` = ? OR `code` = ? LIMIT 1",
    [cleaned, cleaned, cleaned, cleaned]
  )) as (Row & { name: string }) | null;

  if (country) return country.name;

  return null; // Reject unknown countries
}
