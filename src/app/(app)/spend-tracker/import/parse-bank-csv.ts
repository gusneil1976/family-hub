import { parseCsv } from "./parse-csv";

export type BankStatementRow = {
  date: string; // ISO YYYY-MM-DD
  rawDescription: string;
  suggestedVendor: string;
  amount: number; // always positive — this is spend
};

const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

function parseBankDate(raw: string): string | null {
  const match = raw.trim().match(/^(\d{2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (!match) return null;
  const [, day, monAbbr, year] = match;
  const month = MONTHS[monAbbr.toLowerCase()];
  if (!month) return null;
  return `${year}-${month}-${day}`;
}

// e.g. "TIVERTON GB", "NEW YORK US", "OSLO NO" — a location name followed by
// a trailing two-letter country code.
const LOCATION_COUNTRY_RE = /^[A-Z][A-Za-z .'-]*\s[A-Z]{2}$/;
// e.g. "4852 05AUG26 CD", "2850 04AUG26" — a card ref + date, with an
// optional trailing CD/D/C card-present marker.
const REF_DATE_RE = /^\d{3,4}\s+\d{2}[A-Za-z]{3}\d{2}(\s+(CD|D|C))?$/i;
const FX_RE = /^(NOK|EUR|USD|SEK|DKK|CHF|GBP)\s/i;
const VRATE_RE = /^VRATE\b/i;

function titleCase(text: string): string {
  return text.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

// Best-effort cleanup of a raw bank description into a readable vendor name.
// Not guaranteed to be exact for every phrasing — always left editable.
export function cleanVendorGuess(rawDescription: string): string {
  const segments = rawDescription
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const kept = segments.filter((segment) => {
    if (REF_DATE_RE.test(segment)) return false;
    if (FX_RE.test(segment)) return false;
    if (VRATE_RE.test(segment)) return false;
    return true;
  });

  if (kept.length > 1 && LOCATION_COUNTRY_RE.test(kept[kept.length - 1])) {
    kept.pop();
  }

  const joined = kept.join(" ").replace(/\s+/g, " ").trim();
  return titleCase(joined || rawDescription);
}

// Reads a bank statement export (Date, Type, Description, Value, ... columns
// identified by header name so column order doesn't matter) and returns only
// the outgoing-spend rows (negative Value) — incoming money (salary,
// transfers in, refunds) is out of scope for a spend tracker.
export function parseBankStatementCsv(text: string): BankStatementRow[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const dateIdx = header.indexOf("date");
  const descIdx = header.indexOf("description");
  const valueIdx = header.indexOf("value");

  if (dateIdx === -1 || descIdx === -1 || valueIdx === -1) return [];

  const result: BankStatementRow[] = [];
  for (const row of rows.slice(1)) {
    const rawDate = row[dateIdx];
    const rawDescription = row[descIdx] ?? "";
    const rawValue = row[valueIdx];
    if (!rawDate || !rawValue) continue;

    const amount = Number(rawValue);
    if (!Number.isFinite(amount) || amount >= 0) continue;

    const date = parseBankDate(rawDate);
    if (!date) continue;

    result.push({
      date,
      rawDescription,
      suggestedVendor: cleanVendorGuess(rawDescription),
      amount: Math.abs(amount),
    });
  }

  return result;
}
