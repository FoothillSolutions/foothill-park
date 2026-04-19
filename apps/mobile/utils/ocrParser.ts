// Extracts the most likely licence plate string from raw ML Kit OCR text blocks.
// A valid candidate is 4–8 alphanumeric characters after stripping spaces/dashes.
const PLATE_RE = /^[A-Z0-9]{4,8}$/;

export function extractPlateFromOcr(blocks: string[]): string | null {
  const candidates: string[] = [];

  for (const block of blocks) {
    // Each block may contain multiple lines/words — split and check each token
    const tokens = block.toUpperCase().split(/[\s\n\r\-\/\\|]+/);
    for (const token of tokens) {
      const clean = token.replace(/[^A-Z0-9]/g, '');
      if (PLATE_RE.test(clean)) {
        candidates.push(clean);
      }
    }
  }

  if (!candidates.length) return null;

  // Prefer tokens that look most plate-like:
  // Palestinian plates are typically 7 digits, Israeli/EU formats are 5–8 alphanum.
  // Score: favour length closest to 7, break ties by keeping the first found.
  candidates.sort((a, b) => Math.abs(a.length - 7) - Math.abs(b.length - 7));
  return candidates[0];
}
