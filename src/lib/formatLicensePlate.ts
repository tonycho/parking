/** Display and persist license plates in uppercase (user may type any case). */
export function formatLicensePlate(plate: string): string {
  return plate.trim().toUpperCase();
}