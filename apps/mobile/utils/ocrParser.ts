/**
 * Palestinian Authority plate formats
 * ─────────────────────────────────────
 * Format A — all digits, 1·4·2 pattern   e.g.  6-3559-96  →  6355996
 * Format B — digits + letter, 1·4·1      e.g.  3-9956-D   →  39956D
 *
 * Separators seen in the wild: dash (-), middle-dot (·), period (.), space ( )
 * The bilingual "P/ف" badge lives on the right — ML Kit sometimes reads the P
 * immediately after the plate letter (e.g. "HP"). We strip it in pre-processing.
 * Dealer phone numbers (09/XXXXXXX) appear below the plate — we reject them.
 */

// Separator character class used in plate patterns
const S = '[\\- ·.]*';   // zero-or-more so fused reads also match

// Format A: 1–2 digits · 3–4 digits · 2 digits   →  7-8 total digits
const PA_A = new RegExp(`(\\d{1,2})${S}(\\d{3,4})${S}(\\d{2})(?![\\d])`);

// Format B: 1–2 digits · 3–4 digits · single letter
// (?![A-Z\d]) instead of (?!\w) so the P badge right after the letter doesn't block the match
const PA_B = new RegExp(`(\\d{1,2})${S}(\\d{3,4})${S}([A-HJ-NP-Z])(?![A-Z\\d])`);

// Fused digits fallback (OCR joined separators): 7-8 consecutive digits
const PA_FUSED_A = /(?<![/\d])\d{7,8}(?![/\d])/;

// Fused Format B: 5–6 digits immediately followed by a plate letter
const PA_FUSED_B = /(?<![/\d])(\d{5,6})([A-HJ-NP-Z])(?![A-Z\d])/;

// Partial read: 5-6 consecutive digits (better than nothing)
const PA_PARTIAL = /(?<![/\d])\d{5,6}(?![/\d])/;

// ── Reject patterns ──────────────────────────────────────────────────────────

/**
 * Palestinian phone number patterns — all treated as noise:
 *   Mobile:        059X-XXXXXX  /  056X-XXXXXX
 *   Landline:      02-XXXXXXX   /  04-XXXXXXX  /  08-XXXXXXX  /  09-XXXXXXX
 *   Business:      1700-XXX-XXX /  1800-XXX-XXX
 *   International: +970-XX-XXX-XXXX
 * Separators (space, dash, slash) are optional.
 */
const SEP = '[\\s\\-\\/]?';
const PHONE_PATTERNS = [
  // Mobile: 059X or 056X + 6 digits
  new RegExp(`\\b0[56]\\d${SEP}\\d{3}${SEP}\\d{4}\\b`),
  // Landline: 02 / 04 / 08 / 09 + 7 digits
  new RegExp(`\\b0[2489]${SEP}\\d{3}${SEP}\\d{4}\\b`),
  // Business / toll-free: 1700 or 1800
  new RegExp(`\\b1[78]00${SEP}\\d{3}${SEP}\\d{3}\\b`),
  // International: +970 …
  new RegExp(`\\+970${SEP}\\d{2}${SEP}\\d{3}${SEP}\\d{4}`),
  // Generic fallback: any 9+ consecutive digit run
  /\b\d{9,}\b/,
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripNoise(text: string): string {
  return text
    // Remove Arabic Unicode range
    .replace(/[\u0600-\u06FF]+/g, '')
    // Remove the P/ف bilingual badge in all its forms:
    // "H/P", "HP", "/P", "P/", standalone "P"
    .replace(/[A-Z]\/P\b/g, (m) => m[0])   // "H/P" → "H"
    .replace(/([A-HJ-NP-Z])P(?![A-Z\d])/g, '$1') // "HP" → "H" (P badge stuck to letter)
    .replace(/\/P\b/g, '')
    .replace(/\bP\//g, '')
    .replace(/\bP\b/g, '')
    // Remove the ف character specifically
    .replace(/[ف]/g, '')
    // Remove slashes and other noise
    .replace(/[|\\]/g, '')
    .trim();
}

function isPhoneNumber(text: string): boolean {
  return PHONE_PATTERNS.some(re => re.test(text));
}

function isWord(clean: string): boolean {
  if (/[A-Z]{3,}/.test(clean)) return true; // 3+ consecutive letters = word/brand
  if (/^[A-Z]+$/.test(clean))  return true; // all letters
  return false;
}

function plateScore(clean: string): number {
  const len     = clean.length;
  const digits  = (clean.match(/\d/g)    ?? []).length;
  const letters = (clean.match(/[A-Z]/g) ?? []).length;

  if (len < 4 || len > 10) return -99;
  if (isWord(clean))        return -50;

  let score = 0;

  // High digit ratio = good
  score += (digits / len) * 20;

  // Ideal total length for PA plates
  if (len === 7) score += 8;
  if (len === 6) score += 6;
  if (len >= 5 && len <= 8) score += 4;

  // Pure digits bonus (Format A)
  if (letters === 0) score += 10;

  // Single trailing letter is acceptable (Format B)
  if (letters === 1 && /\d[A-Z]$/.test(clean)) score += 8;

  // Multiple letters penalty
  if (letters >= 2) score -= 10;
  if (letters >= 3) score -= 20;

  return score;
}

// ── Main export ──────────────────────────────────────────────────────────────

export function extractPlateFromOcr(blocks: string[]): string | null {
  // Pre-process: strip noise and filter out phone number blocks
  const cleaned = blocks
    .map(stripNoise)
    .filter(t => t.length > 0 && !isPhoneNumber(t));

  const allText = cleaned.join('\n').toUpperCase();

  // ── Pass 1: Format A with separators — highest confidence ─────────────────
  const matchA = PA_A.exec(allText);
  if (matchA) {
    return `${matchA[1]}${matchA[2]}${matchA[3]}`;
  }

  // ── Pass 2: Format B with separators ─────────────────────────────────────
  const matchB = PA_B.exec(allText);
  if (matchB) {
    return `${matchB[1]}${matchB[2]}${matchB[3]}`;
  }

  // ── Pass 3a: Fused 7-8 digit run (Format A) ───────────────────────────────
  const fusedA = PA_FUSED_A.exec(allText);
  if (fusedA) return fusedA[0];

  // ── Pass 3b: Fused digit+letter run (Format B) ────────────────────────────
  const fusedB = PA_FUSED_B.exec(allText);
  if (fusedB) return fusedB[1] + fusedB[2];

  // ── Pass 4: Join consecutive digit tokens (OCR split the plate) ──────────
  // e.g. OCR returns "3", "5337", "H" as separate tokens
  const digitTokens = allText.match(/\b\d+\b/g) ?? [];
  const letterTokens = allText.match(/\b[A-HJ-NP-Z]\b/g) ?? [];

  // Try digit-only joins first (Format A)
  for (let i = 0; i < digitTokens.length; i++) {
    for (let j = i + 1; j <= Math.min(i + 3, digitTokens.length); j++) {
      const joined = digitTokens.slice(i, j).join('');
      if (joined.length >= 7 && joined.length <= 8) return joined;
    }
  }

  // Try digit join + trailing letter (Format B)
  for (let i = 0; i < digitTokens.length; i++) {
    for (let j = i + 1; j <= Math.min(i + 3, digitTokens.length); j++) {
      const joined = digitTokens.slice(i, j).join('');
      if (joined.length >= 5 && joined.length <= 6 && letterTokens.length > 0) {
        return joined + letterTokens[0];
      }
    }
  }

  // ── Pass 5: Partial digit run (5-6 digits) ────────────────────────────────
  const partial = PA_PARTIAL.exec(allText);
  if (partial) return partial[0];

  // ── Pass 6: Scored fallback for edge cases ────────────────────────────────
  const candidates: { plate: string; score: number }[] = [];
  for (const block of cleaned) {
    const tokens = block.toUpperCase().split(/[\s\n\r,.|:;/\\]+/);
    for (const raw of tokens) {
      const clean = raw.replace(/[^A-Z0-9]/g, '');
      if (clean.length < 4) continue;
      const score = plateScore(clean);
      if (score > 8) candidates.push({ plate: clean, score });
    }
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].plate;
}
