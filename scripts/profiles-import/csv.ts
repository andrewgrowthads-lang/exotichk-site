import { parse } from "csv-parse/sync";
import { OPTIONAL_CSV_COLUMNS, REQUIRED_CSV_COLUMNS } from "./fields";

export type CsvRow = Record<string, string>;

const KNOWN_COLUMNS = new Set<string>([...REQUIRED_CSV_COLUMNS, ...OPTIONAL_CSV_COLUMNS]);

export function parseProfilesCsv(content: string): { rows: CsvRow[]; warnings: string[] } {
  let records: CsvRow[];
  try {
    records = parse(content, {
      columns: (header: string[]) => header.map((column) => column.trim()),
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: false,
    }) as CsvRow[];
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid CSV";
    throw new Error(`CSV parse failed: ${message}`);
  }

  if (records.length === 0) {
    throw new Error("CSV has a header but no data rows.");
  }

  const header = Object.keys(records[0] ?? {});
  const missing = REQUIRED_CSV_COLUMNS.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    throw new Error(`CSV is missing required column(s): ${missing.join(", ")}`);
  }

  const warnings = header.filter((column) => column && !KNOWN_COLUMNS.has(column)).map((column) => `Ignoring unknown CSV column: ${column}`);

  const rows = records.map((record) => {
    const row: CsvRow = {};
    for (const column of header) {
      const value = record[column];
      row[column] = value == null ? "" : String(value);
    }
    return row;
  });

  return { rows, warnings };
}
