/**
 * Member Display Formula
 * Based on Groupizo manual: NEVER use WhatsApp member_count (not exposed).
 * Use clicks/joins count (real, tracked by us).
 *
 * Model (ratio invertido + banda tope):
 * - Tasa de unión ≈ 20%: no todo el que hace clic en la página del grupo
 *   acaba uniéndose (enlace caducado, grupo lleno, se arrepiente, solo
 *   miraba). Por eso 1 clic ≈ 0.2 miembros → 1.000 clics ≈ 200 miembros.
 * - Límite duro de WhatsApp: 1.024 miembros por grupo. Los grupos muy
 *   virales (10.000+ clics) saturan cerca del tope y, como la gente se une
 *   y se va (ciclo continuo), el número visible orbita dentro de una banda
 *   en vez de crecer sin fin: a partir de una estimación de 900 se muestra
 *   un valor DETERMINISTA en [900, 1010] derivado de la semilla (id) del
 *   grupo — estable entre renders y entre cargas, sin desajuste de
 *   hidratación y por debajo del tope real de 1.024.
 */

const JOIN_RATE = 0.2;        // 1 clic ≈ 0.2 miembros (~20% se une de verdad)
const CAP_BAND_START = 900;   // inicio de la banda de saturación
const CAP_BAND_SPAN = 111;    // 900..1010 (tope WhatsApp 1.024 con margen)
const VARIANCE = 0.10;        // jitter determinista ±10% por debajo de la banda

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

export function computeDisplayedMembers(clicks: number, joinCount: number, seed: string): number {
  const real = Math.max(clicks, joinCount);
  if (real <= 0) return 0;

  const estimate = real * JOIN_RATE;

  // Saturación viral: valor estable dentro de la banda 900–1010
  // (la gente sigue entrando y saliendo; el ciclo no supera el tope).
  if (estimate >= CAP_BAND_START) {
    return CAP_BAND_START + Math.floor(seededRandom(seed) * CAP_BAND_SPAN);
  }

  // Rango normal: jitter determinista ±10% alrededor de la estimación,
  // mínimo 1 (un grupo con clics siempre muestra al menos 1 miembro).
  const r = seededRandom(seed);
  const offset = estimate * VARIANCE * 2 * r - estimate * VARIANCE;

  return Math.max(1, Math.round(estimate + offset));
}
