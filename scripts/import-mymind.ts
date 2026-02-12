import { db } from "../src/db/client";
import { articles, user } from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import { isValidUrl, fetchMetadata } from "../src/lib/utils";
import { readFileSync } from "fs";

const USER_EMAIL = "rajatvijay5@gmail.com";
const CSV_PATH = "/Users/rajatvijay/Documents/mymind-export/mymind/cards.csv";

// Simple CSV parser that handles quoted fields with commas
function parseCSV(raw: string): Record<string, string>[] {
  const lines = raw.split("\n");
  // Remove BOM if present
  const headerLine = lines[0].replace(/^\uFEFF/, "");
  const headers = parseCSVLine(headerLine);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? "";
    }
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

async function main() {
  // Parse CSV
  const raw = readFileSync(CSV_PATH, "utf-8");
  const rows = parseCSV(raw);
  console.log(`Parsed ${rows.length} rows from CSV`);

  // Filter to rows with valid URLs
  const urlRows = rows.filter((r) => r.url && isValidUrl(r.url));
  console.log(`${urlRows.length} rows have valid URLs (skipping ${rows.length - urlRows.length} without)`);

  // Look up user
  const [foundUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, USER_EMAIL));

  if (!foundUser) {
    console.error(`User not found: ${USER_EMAIL}`);
    process.exit(1);
  }
  console.log(`Found user: ${foundUser.id}\n`);

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < urlRows.length; i++) {
    const row = urlRows[i];
    const url = row.url;
    const num = `[${i + 1}/${urlRows.length}]`;

    try {
      // Check for duplicate
      const [existing] = await db
        .select({ id: articles.id })
        .from(articles)
        .where(and(eq(articles.userId, foundUser.id), eq(articles.url, url)));

      if (existing) {
        console.log(`${num} Skipped (duplicate): ${url}`);
        skipped++;
        continue;
      }

      // Fetch metadata
      const metadata = await fetchMetadata(url);

      // Use CSV title as fallback if metadata title is just the domain
      const title = metadata.title !== metadata.domain
        ? metadata.title
        : row.title || metadata.title;

      // Parse created date from CSV
      const createdAt = row.created ? new Date(row.created) : new Date();

      await db.insert(articles).values({
        userId: foundUser.id,
        url,
        title,
        description: metadata.description,
        ogImage: metadata.ogImage,
        favicon: metadata.favicon,
        domain: metadata.domain,
        createdAt,
      });

      console.log(`${num} Saved: ${url} — "${title}"`);
      inserted++;
    } catch (err) {
      console.error(`${num} FAILED: ${url} — ${err}`);
      failed++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped (duplicate): ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total processed: ${urlRows.length}`);

  process.exit(0);
}

main();
