import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function verifyDataLayer() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);

  const db = mongoose.connection.db!;
  const collection = db.collection("insights");

  // 1. Total document count
  const count = await collection.countDocuments();
  console.log(`TOTAL_DOCUMENTS: ${count}`);

  // 2. Check sample document types
  const sample = await collection.findOne({ intensity: { $ne: null } });
  console.log("SAMPLE_DOC:", JSON.stringify(sample, null, 2));
  console.log("TYPE_OF_INTENSITY:", typeof sample?.intensity);
  console.log("TYPE_OF_LIKELIHOOD:", typeof sample?.likelihood);
  console.log("TYPE_OF_RELEVANCE:", typeof sample?.relevance);
  console.log("TYPE_OF_END_YEAR:", typeof sample?.end_year);

  // 3. Confirm all intensity, likelihood, relevance are either number or null (not string)
  const stringNumeric = await collection.countDocuments({
    $or: [
      { intensity: { $type: "string" } },
      { likelihood: { $type: "string" } },
      { relevance: { $type: "string" } },
      { end_year: { $type: "string" } },
    ],
  });
  console.log(`DOCUMENTS_WITH_STRING_NUMERICS: ${stringNumeric}`);

  // 4. Empty string fields vs null convention
  // Check if string fields (sector, topic, region, country, etc.) use "" convention
  const emptyStringSector = await collection.countDocuments({ sector: "" });
  const nullSector = await collection.countDocuments({ sector: null });
  console.log(`EMPTY_STRING_SECTOR: ${emptyStringSector}, NULL_SECTOR: ${nullSector}`);

  const emptyStringCountry = await collection.countDocuments({ country: "" });
  const nullCountry = await collection.countDocuments({ country: null });
  console.log(`EMPTY_STRING_COUNTRY: ${emptyStringCountry}, NULL_COUNTRY: ${nullCountry}`);

  // 5. Check duplicate check (e.g. check duplicate titles/urls or _ids)
  const distinctIds = await collection.distinct("_id");
  console.log(`DISTINCT_IDS_COUNT: ${distinctIds.length}`);

  await mongoose.disconnect();
}

verifyDataLayer().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
