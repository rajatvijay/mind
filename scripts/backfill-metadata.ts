import { db } from "../src/db/client";
import { articles } from "../src/db/schema";
import { isNull } from "drizzle-orm";
import { fetchMetadata } from "../src/lib/utils";
import { eq } from "drizzle-orm";

async function backfill() {
  // Find all articles missing OG metadata
  const rows = await db
    .select({ id: articles.id, url: articles.url, title: articles.title })
    .from(articles)
    .where(isNull(articles.domain));

  console.log(`Found ${rows.length} articles to backfill`);

  for (const row of rows) {
    try {
      console.log(`Fetching metadata for: ${row.url}`);
      const metadata = await fetchMetadata(row.url);

      await db
        .update(articles)
        .set({
          title: metadata.title || row.title,
          description: metadata.description,
          ogImage: metadata.ogImage,
          favicon: metadata.favicon,
          domain: metadata.domain,
        })
        .where(eq(articles.id, row.id));

      console.log(`  -> ${metadata.title} (image: ${metadata.ogImage ? "yes" : "no"})`);
    } catch (err) {
      console.error(`  -> FAILED: ${err}`);
    }
  }

  console.log("Done!");
  process.exit(0);
}

backfill();
