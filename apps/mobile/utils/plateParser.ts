// Palestinian plate format: 12-345-67 or 1234567 or variants with spaces
// Normalize to digits only for DB storage and comparison
export function normalizePlate(raw: string): string {
  return raw.replace(/[\s\-]/g, '').toUpperCase();
}

// Format normalized plate for display: 12-345-67
export function formatPlate(normalized: string): string {
  const digits = normalized.replace(/\D/g, '');
  if (digits.length === 7) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return normalized;
}

// Returns true if the plate looks valid (5–8 alphanumeric chars after normalization)
export function isValidPlate(raw: string): boolean {
  const normalized = normalizePlate(raw);
  return /^[A-Z0-9]{4,8}$/.test(normalized);
}
