import { z } from "zod";

export const searchInputSchema = z.string().trim().max(120);

export function sanitizeSearch(value: string) {
  const validated = searchInputSchema.parse(value);
  return validated.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}
