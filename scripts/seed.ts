import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load env from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI not set in .env.local");
  process.exit(1);
}

// Define schema inline to avoid import issues with tsx
const InsightSchema = new mongoose.Schema(
  {
    end_year: { type: Number, default: null },
    intensity: { type: Number, default: null },
    sector: { type: String, default: "" },
    topic: { type: String, default: "" },
    insight: { type: String, default: "" },
    url: { type: String, default: "" },
    region: { type: String, default: "" },
    start_year: { type: Number, default: null },
    impact: { type: Number, default: null },
    added: { type: String, default: "" },
    published: { type: String, default: "" },
    country: { type: String, default: "" },
    relevance: { type: Number, default: null },
    pestle: { type: String, default: "" },
    source: { type: String, default: "" },
    title: { type: String, default: "" },
    likelihood: { type: Number, default: null },
  },
  { collection: "insights", timestamps: false }
);

const Insight =
  mongoose.models.Insight || mongoose.model("Insight", InsightSchema);

interface RawInsight {
  end_year: string | number;
  intensity: string | number;
  sector: string;
  topic: string;
  insight: string;
  url: string;
  region: string;
  start_year: string | number;
  impact: string | number;
  added: string;
  published: string;
  country: string;
  relevance: string | number;
  pestle: string;
  source: string;
  title: string;
  likelihood: string | number;
}

function cleanNumeric(value: string | number): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

function cleanRecord(raw: RawInsight) {
  return {
    end_year: cleanNumeric(raw.end_year),
    intensity: cleanNumeric(raw.intensity),
    sector: raw.sector || "",
    topic: raw.topic || "",
    insight: raw.insight || "",
    url: raw.url || "",
    region: raw.region || "",
    start_year: cleanNumeric(raw.start_year),
    impact: cleanNumeric(raw.impact),
    added: raw.added || "",
    published: raw.published || "",
    country: raw.country || "",
    relevance: cleanNumeric(raw.relevance),
    pestle: raw.pestle || "",
    source: raw.source || "",
    title: raw.title || "",
    likelihood: cleanNumeric(raw.likelihood),
  };
}

async function seed() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI!);
  console.log("✅ Connected");

  // Read the JSON data (root folder first, then data/)
  const rootPath = path.resolve(process.cwd(), "jsondata.json");
  const fallbackPath = path.resolve(process.cwd(), "data", "jsondata.json");
  const dataPath = fs.existsSync(rootPath) ? rootPath : fallbackPath;
  if (!fs.existsSync(dataPath)) {
    console.error(`Error: Neither ${rootPath} nor ${fallbackPath} found`);
    process.exit(1);
  }
  console.log(`📁 Using dataset from: ${dataPath}`);

  const rawData: RawInsight[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  console.log(`📊 Read ${rawData.length} records from jsondata.json`);

  // Clean data
  const cleanedData = rawData.map(cleanRecord);

  // Drop existing collection and re-insert
  console.log("🗑️  Dropping existing insights collection...");
  try {
    await mongoose.connection.db!.dropCollection("insights");
  } catch {
    // Collection may not exist yet
  }

  console.log("📥 Inserting records...");
  const result = await Insight.insertMany(cleanedData, { ordered: false });
  console.log(`✅ Inserted ${result.length} records`);

  // Build indexes
  console.log("🔧 Building indexes...");
  await Insight.createIndexes();
  console.log("✅ Indexes created");

  await mongoose.disconnect();
  console.log("🔌 Disconnected. Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
