/**
 * Palestinian Authority plate formats
 * ─────────────────────────────────────
 * Format A — all digits, 1·4·2 pattern   e.g.  6-3559-96  →  6355996
 * Format B — digits + letter, 1·4·1      e.g.  3-9956-D   →  39956D
 *
 * Separators seen in the wild: dash (-), middle-dot (·), period (.), space ( )
 * The bilingual "P/ف" badge lives in its own OCR block — we ignore it.
 * Dealer phone numbers (09/XXXXXXX) appear below the plate — we reject them.
 */

// Separator character class used in plate patterns
const S = '[\\- ·.]+';

// Format A: 1–2 digits · 3–4 digits · 2 digits   →  7-8 total digits
const PA_A = new RegExp(`(\\d{1,2})${S}(\\d{3,4})${S}(\\d{2})(?![\\d/])`);

// Format B: 1–2 digits · 3–4 digits · single letter (not I/O which look like 1/0)
const PA_B = new RegExp(`(\\d{1,2})${S}(\\d{3,4})${S}([A-HJ-NP-Z])(?!\\w)`);

// Fused digits fallback (OCR joined separators): 7-8 consecutive digits
const PA_FUSED = /(?<![/\d])\d{7,8}(?![/\d])/;

// Partial read: 5-6 consecutive digits (better than nothing)
const PA_PARTIAL = /(?<![/\d])\d{5,6}(?![/\d])/;

// ── Reject patterns ──────────────────────────────────────────────────────────

/** Palestinian phone numbers: 09/XXXXXXX or 059-XXXXXXX etc. */
const PHONE_RE = /\b0[0-9][\/\-]\d{5,}/;

/** Dealer / sticker phone number strip (10+ digit run) */
const LONG_DIGITS_RE = /\b\d{9,}\b/;

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripNoise(text: string): string {
  // Remove the P/ف badge, Arabic text, slashes
  return text
    .replace(/[ف]/g, '')
    .replace(/\bP\b/g, '')
    .replace(/[\u0600-\u06FF]+/g, '') // Arabic Unicode range
    .trim();
}

function isPhoneNumber(text: string): boolean {
  return PHONE_RE.test(text) || LONG_DIGITS_RE.test(text);
}

function isWord(clean: string): boolean {
  if (/[A-Z]{3,}/.test(clean)) return true; // 3+ consecutive letters = word
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

  // Pure digits bonus
  if (letters === 0) score += 10;

  // Single trailing letter is acceptable (Format B)
  if (letters === 1 && /\d[A-Z]$/.test(clean)) score += 5;

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

  // ── Pass 3: Fused 7-8 digit run ───────────────────────────────────────────
  const fused = PA_FUSED.exec(allText);
  if (fused) return fused[0];

  // ── Pass 4: Join consecutive digit tokens (OCR split the plate) ──────────
  // e.g. OCR returns "6", "3559", "96" as separate tokens → join → "6355996"
  const digitTokens = allText.match(/\b\d+\b/g) ?? [];
  for (let i = 0; i < digitTokens.length; i++) {
    for (let j = i + 1; j <= Math.min(i + 3, digitTokens.length); j++) {
      const joined = digitTokens.slice(i, j).join('');
      if (joined.length >= 7 && joined.length <= 8) return joined;
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
