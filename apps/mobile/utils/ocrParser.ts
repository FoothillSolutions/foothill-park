// Palestinian plate format: 1-2 digits, 4 digits, 1 letter  e.g. "1-6879-A" → "16879A"
// The plate also has a "P/ف" bilingual badge that is NOT part of the number.
const PA_PLATE_RE = /^(\d{1,2})[- ]?(\d{4})[- ]?([A-Z])P?$/;

// Generic fallback: 4–8 alphanumeric chars
const GENERIC_RE = /^[A-Z0-9]{4,8}$/;

export function extractPlateFromOcr(blocks: string[]): string | null {
  const paMatches: string[] = [];
  const genericCandidates: string[] = [];

  for (const block of blocks) {
    const tokens = block.toUpperCase().split(/[\s\n\r]+/);
    for (const rawToken of tokens) {
      // Strip dashes/dots but keep structure for PA pattern matching
      const token = rawToken.replace(/[^A-Z0-9\-]/g, '');

      // Try Palestinian plate pattern first (strips trailing P automatically)
      const pa = PA_PLATE_RE.exec(token);
      if (pa) {
        paMatches.push(`${pa[1]}${pa[2]}${pa[3]}`);
        continue;
      }

      // Try joining with the next token if this looks like a split plate
      const clean = token.replace(/[^A-Z0-9]/g, '');
      if (GENERIC_RE.test(clean)) {
        genericCandidates.push(clean);
      }
    }
  }

  // PA matches are highest confidence
  if (paMatches.length) return paMatches[0];

  if (!genericCandidates.length) return null;

  // Prefer length closest to 6 (typical PA plate length after normalisation)
  genericCandidates.sort((a, b) => Math.abs(a.length - 6) - Math.abs(b.length - 6));
  return genericCandidates[0];
}
